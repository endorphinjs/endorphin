import {
    Program, Identifier, Literal, ConditionalExpression, ArrayExpression,
    BinaryExpression, LogicalExpression, ExpressionStatement, ObjectExpression,
    Property, RegExpLiteral, SequenceExpression, UnaryExpression, CallExpression,
    EmptyStatement, ThisExpression, MemberExpression, ReturnStatement,
    ArrowFunctionExpression, BlockStatement, ObjectPattern, TemplateLiteral,
    TaggedTemplateExpression, ENDCaller, ENDGetter, ENDGetterPrefix, ENDFilter, ArrayPattern, AssignmentExpression, UpdateExpression
} from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import { Chunk, ChunkList, AstVisitorMap, ExpressionOutput, AstVisitorContinue } from '../types';
import { sn, propGetter, qStr, isIdentifier, propSetter, commaChunks } from '../lib/utils';

export default {
    Program(node: Program, state, next) {
        return sn(node.body.map(next), node);
    },
    Identifier(node: Identifier, state, next) {
        if (node.context === 'helper') {
            return state.helper(node.name);
        }

        if (node.context === 'variable') {
            return state.localVar(node.name);
        }

        if (node.context && node.context !== 'argument' && node.context !== 'definition') {
            const prefix = next({
                type: 'ENDGetterPrefix',
                context: node.context
            } as ENDGetterPrefix);

            if (node.context === 'store') {
                // Mark store data source as used
                state.store(node.name);
            }

            return sn([prefix, propGetter(node.name)], node, node.raw);
        }

        if (node.context === 'definition') {
            state.usedDefinition.add(node.name);
        }

        return sn(node.name, node, node.name);
    },
    Literal(node: Literal) {
        return sn(typeof node.value === 'string' ? qStr(node.value) : String(node.value), node);
    },
    ConditionalExpression(node: ConditionalExpression, state, next) {
        // TODO check if parentheses are required here
        return sn(['(', next(node.test), ' ? ', next(node.consequent), ' : ', next(node.alternate), ')'], node);
    },
    ArrayExpression(node: ArrayExpression, state, next) {
        return sn(commaChunks(node.elements.map(next), '[', ']'), node);
    },
    ArrayPattern(node: ArrayPattern, state, next) {
        return sn(commaChunks(node.elements.map(elem => next(elem)), '[ ', ' ]'), node);
    },
    BinaryExpression(node: BinaryExpression, state, next) {
        // TODO check if parentheses are required here
        return sn(['(', next(node.left), ` ${node.operator} `, next(node.right), ')'], node);
    },
    LogicalExpression(node: LogicalExpression, state, next) {
        // TODO check if parentheses are required here
        return sn(['(', next(node.left), ` ${node.operator} `, next(node.right), ')'], node);
    },
    ExpressionStatement(node: ExpressionStatement, state, next) {
        return next(node.expression);
    },
    ObjectExpression(node: ObjectExpression, state, next) {
        return sn(commaChunks(node.properties.map(prop => property(prop, false, next)), '{ ', ' }'), node);
    },
    ObjectPattern(node: ObjectPattern, state, next) {
        return sn(commaChunks(node.properties.map(prop => property(prop, true, next)), '{ ', ' }'), node);
    },
    Property(node: Property, state, next) {
        return property(node, false, next);
    },
    RegExpLiteral(node: RegExpLiteral) {
        return sn(`${node.regex.pattern}/${node.regex.flags}`, node);
    },
    SequenceExpression(node: SequenceExpression, state, next) {
        return sn(commaChunks(node.expressions.map(next)), node);
    },
    UnaryExpression(node: UnaryExpression, state, next) {
        return sn([node.operator, node.operator.length > 2 ? ' ' : '', next(node.argument)], node);
    },
    MemberExpression(node: MemberExpression, state, next) {
        return isIdentifier(node.property) && !node.property.context
            ? sn([next(node.object), '.', next(node.property)])
            : sn([next(node.object), '[', next(node.property), ']']);
    },
    CallExpression(node: CallExpression, state, next) {
        return sn([next(node.callee), ...commaChunks(node.arguments.map(next), '(', ')')]);
    },
    EmptyStatement(node: EmptyStatement) {
        return sn('', node);
    },
    ThisExpression(node: ThisExpression, state) {
        return sn(state.host, node);
    },
    AssignmentExpression(node: AssignmentExpression, state, next) {
        // Assignments are allowed for state and store variables only
        const dest = node.left as Identifier;
        const prefix = dest.context === 'state'
            ? `.setState`
            : `.store.set`;

        const { operator } = node;
        const expr = next(node.right);
        if (operator !== '=') {
            expr.prepend([next(dest), ` ${operator.slice(0, -1)} `]);
        }

        return sn([next({ type: 'ThisExpression' }), `${prefix}({ ${propSetter(dest.name)}: `, expr, ' })']);
    },
    UpdateExpression(node: UpdateExpression, state, next) {
        return next({
            type: 'AssignmentExpression',
            left: node.argument,
            operator: node.operator[0] + '=',
            right: {
                type: 'Literal',
                value: 1,
                raw: '1'
            }
        } as AssignmentExpression);
    },
    ArrowFunctionExpression(node: ArrowFunctionExpression, state, next) {
        const params = node.params.length === 1 && isIdentifier(node.params[0])
            ? next(node.params[0])
            : sn(commaChunks(node.params.map(next), '(', ')'));
        return sn([params, ' => ', next(node.body)]);
    },
    BlockStatement(node: BlockStatement, state, next) {
        return sn(['{', ...node.body.map(next), '}']);
    },
    ReturnStatement(node: ReturnStatement, state, next) {
        return node.argument
            ? sn(['return ', next(node.argument)], node)
            : sn('return', node);
    },
    TemplateLiteral(node: TemplateLiteral, state, next) {
        const { quasis, expressions } = node;
        const chunks: ChunkList = ['`'];

        expressions.forEach((expr, i) => {
            chunks.push(quasis[i].value.raw, '${', next(expr), '}');
        });
        chunks.push(quasis[quasis.length - 1].value.raw, '`');

        return sn(chunks, node);
    },
    TaggedTemplateExpression(node: TaggedTemplateExpression, state, next) {
        return sn([next(node.tag), next(node.quasi)], node);
    },

    // Endorphin addons
    ENDGetterPrefix(node: ENDGetterPrefix, state) {
        return sn(state.prefix(node.context));
    },

    ENDGetter(node: ENDGetter, state, next) {
        const chunks = node.path.map(fragment =>
            isIdentifier(fragment) && !fragment.context
                ? qStr(fragment.name)
                : next(fragment)
        );
        return state.runtime('get', chunks);
    },

    ENDCaller(node: ENDCaller, state, next) {
        const chunks: ChunkList = [
            next(node.object),
            isIdentifier(node.property) && !node.property.context
                ? qStr(node.property.name)
                : next(node.property)
        ];

        if (node.arguments && node.arguments.length) {
            const args = sn(node.arguments.map(next)).join(', ');
            chunks.push(args.prepend('[').add(']'));
        }

        return state.runtime('call', chunks);
    },

    ENDFilter(node: ENDFilter, state, next) {
        return state.runtime(node.multiple ? 'filter' : 'find', [next(node.object), next(node.expression)]);
    }
} as AstVisitorMap<ExpressionOutput>;

function property(node: Property, isPattern: boolean, next: AstVisitorContinue<ExpressionOutput>): SourceNode {
    if (node.computed) {
        return sn(['[', next(node.key), ']: ', next(node.value)], node);
    }

    const key: Chunk = isIdentifier(node.key) ? node.key.name : next(node.key);
    if (node.shorthand) {
        return isPattern
            ? sn(key, node)
            : sn([key, ': ', next(node.value)], node);
    }

    return sn([key, ': ', next(node.value)], node);
}
