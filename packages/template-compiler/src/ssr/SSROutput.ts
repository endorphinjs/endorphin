import {
    AssignmentExpression, BlockStatement, FunctionDeclaration, Expression, Literal,
    BinaryExpression, ReturnStatement, Statement, Pattern, Identifier
} from '@endorphinjs/template-parser';
import { identifier, literal, varDeclaration } from '../lib/ast-constructor';

export default class SSROutput {
    private root: FunctionDeclaration;
    private block: BlockStatement;
    private node: AssignmentExpression | null = null;
    private outVar = identifier('out');
    private scopeMounted = false;

    constructor(name: string, params: Pattern[]) {
        // Create function AST node
        this.block = {
            type: 'BlockStatement',
            body: [varDeclaration(this.outVar, literal(''), 'let')]
        };

        this.root = {
            type: 'FunctionDeclaration',
            id: identifier(name),
            params,
            body: this.block
        };
    }

    /**
     * Adds given statement into output block
     */
    add<T extends Statement>(statement: T): T {
        this.block.body.push(statement);
        this.node = null;
        return statement;
    }

    /**
     * Runs given `callback` in context of `block`. All output content will be added
     * into accumulator inside `block`
     */
    run(block: BlockStatement, callback: () => void) {
        const prevBlock = this.block;
        this.block = block;
        this.node = null;
        callback();
        this.node = null;
        this.block = prevBlock;
    }

    /**
     * Pushes given value into output
     */
    out(value: string | Expression) {
        const node = typeof value === 'string' ? literal(value) : value;

        if (!this.node) {
            // No output node yet, create it
            this.node = {
                type: 'AssignmentExpression',
                left: this.outVar,
                operator: '+=',
                right: node
            };
            this.block.body.push({
                type: 'ExpressionStatement',
                expression: this.node
            });
        } else {
            this.node.right = concatExpressions(this.node.right, node);
        }
    }

    /**
     * Mounts scope variable, if required. Scope is used to store internal template data
     * and can be either created inside function (template entry) or passed as argument
     */
    mountScope(scope: Identifier) {
        if (!this.scopeMounted) {
            if (!this.root.params.includes(scope)) {
                const v = varDeclaration(scope, {
                    type: 'ObjectExpression',
                    properties: []
                }, 'const');
                (this.root.body as BlockStatement).body.unshift(v);
            }
            this.scopeMounted = true;
        }
    }

    finalize() {
        (this.root.body as BlockStatement).body.push({
            type: 'ReturnStatement',
            argument: this.outVar
        } as ReturnStatement);
        return this.root;
    }
}

export function concatExpressions(left: Expression, right: Expression): Expression {
    // Modify expression and add given value to it
    let target: Literal | null = null;
    if (isString(right)) {
        if (isString(left)) {
            target = left;
        } else if (left.type === 'BinaryExpression' && isString(left.right)) {
            target = left.right;
        }
    }

    if (target) {
        // We can merge two strings into a single token
        appendLiteral(target, right as Literal);
        return left;
    }

    return {
        type: 'BinaryExpression',
        operator: '+',
        left,
        right
    } as BinaryExpression;
}

function isString(node: Expression): node is Literal {
    return node.type === 'Literal' && typeof node.value === 'string';
}

function appendLiteral(left: Literal, right: Literal) {
    left.value += right.value as string;
    left.raw = JSON.stringify(left.value);
}
