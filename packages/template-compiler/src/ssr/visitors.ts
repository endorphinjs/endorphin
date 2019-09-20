import {
    Node, ENDStatement, ENDElement, Identifier, Literal, ENDTemplate, ENDPartial,
    ENDIfStatement, BlockStatement, IfStatement, ExpressionStatement, ENDChooseStatement,
    Expression, Program, ENDAttributeValue, ENDVariableStatement, AssignmentExpression, ENDInnerHTML
} from '@endorphinjs/template-parser';
import SSRState from './SSRState';
import { isLiteral, qStr, isPropKey } from '../lib/utils';
import { ENDCompileError } from '../lib/error';
import { literal, callExpr, conditionalExpr, member, identifier } from '../lib/ast-constructor';
import { concatExpressions } from './SSROutput';

export type VisitorNode = ENDStatement | ENDTemplate | ENDPartial;
export type VisitorContinue = (node: VisitorNode) => void;
export type Visitor<N extends Node> = (node: N, state: SSRState, next: VisitorContinue) => void;

export interface VisitorMap {
    [name: string]: Visitor<VisitorNode>;
}

export const visitors: VisitorMap = {
    ENDTemplate(node: ENDTemplate, state, next) {
        const name = identifier('name');
        const props = identifier('props');
        state.enter('render', [name, props], () => {
            // TODO mount props and state
            // Render component itself
            state.out('<', name, callExpr(state.use('renderProps'), [props]), '>');
            node.body.forEach(next);
            state.out('</', name, '>');
        }, true);
    },
    ENDElement(node: ENDElement, state, next) {
        const elemName = node.name.name;
        let className = classNameExpr(node);

        state.out(`<${elemName}`);
        node.attributes.forEach(attr => {
            const attrName = (attr.name as Identifier).name;
            let attrValue = valueExpr(attr.value);

            if (attrName === 'class') {
                attrValue = className;
                className = null;
            }

            pushAttribute(attrName, attrValue, state);
        });

        if (className) {
            pushAttribute('class', className, state);
        }

        if (!node.body.length && state.options.empty.includes(elemName)) {
            state.out(' />');
        } else {
            state.out('>');
            node.body.forEach(next);
            state.out(`</${elemName}>`);
        }
    },
    Literal(node: Literal, state) {
        state.out(escape(String(node.value)));
    },
    Program(node: Program, state) {
        state.out(callExpr(state.use('escape'), [getExpression(node)]));
    },
    ENDInnerHTML(node: ENDInnerHTML, state) {
        state.out(getExpression(node.value));
    },
    ENDIfStatement(node: ENDIfStatement, state, next) {
        const block = createBlock();
        state.add({
            type: 'IfStatement',
            test: getExpression(node.test),
            consequent: block,
            alternate: null
        });

        state.run(block, () => node.consequent.forEach(next));
    },
    ENDChooseStatement(node: ENDChooseStatement, state, next) {
        let prevStatement: IfStatement | null = null;
        node.cases.forEach(c => {
            const block = createBlock();
            if (c.test) {
                // <e:when test={...}>
                const statement: IfStatement = {
                    type: 'IfStatement',
                    test: getExpression(c.test),
                    consequent: block,
                    alternate: null
                };

                if (prevStatement) {
                    prevStatement.alternate = statement;
                } else {
                    state.add(statement);
                }

                state.run(block, () => c.consequent.forEach(next));
                prevStatement = statement;
            } else {
                // <e:otherwise>
                if (prevStatement) {
                    prevStatement.alternate = block;
                    state.run(block, () => c.consequent.forEach(next));
                } else {
                    throw new ENDCompileError('Unable to add `<otherwise>` statement: no previous conditions', node);
                }
            }
        });
    },
    ENDVariableStatement(node: ENDVariableStatement, state) {
        node.variables.forEach(v => {
            const expression: AssignmentExpression = {
                type: 'AssignmentExpression',
                operator: '=',
                left: member(state.scope, isPropKey(v.name) ? identifier(v.name) : literal(v.name)),
                right: valueExpr(v.value)
            };
            state.add({ type: 'ExpressionStatement', expression });
        });
    }
};

/**
 * Pushes given attribute into output
 */
function pushAttribute(name: string, value: Expression | null, state: SSRState) {
    if (!value) {
        // No value: boolean attribute
        state.out(` ${name}=""`);
    } else if (isLiteral(value)) {
        // Static value
        state.out(` ${name}=${qStr(String(value.value))}`);
    } else {
        state.out(callExpr(state.use('attr'), [literal(name), value]));
    }
}

const escapeMap = {
    '<': '&lt;',
    '>': '&gt',
    '&': '&amp;'
};

function escape(str: string): string {
    return str.replace(/[<>&]/g, s => escapeMap[s] || s);
}

function getExpression(program: Program): Expression {
    return (program.body[0] as ExpressionStatement).expression;
}

function createBlock(): BlockStatement {
    return {
        type: 'BlockStatement',
        body: []
    };
}

function valueExpr(value: ENDAttributeValue): Expression | null {
    if (!value) {
        return null;
    }

    if (isLiteral(value)) {
        return value;
    }

    if (value.type === 'Program') {
        return getExpression(value);
    }

    let expr: Expression | null = null;
    value.elements.forEach(elem => {
        const v = isLiteral(elem) ? elem : getExpression(elem);
        expr = expr ? concatExpressions(expr, v) : v;
    });

    return expr;
}

/**
 * Collects class name payload for given element
 */
function classNameExpr(elem: ENDElement): Expression | null {
    let result: Expression | null = null;
    const empty = literal('');
    const classAttr = elem.attributes.find(attr => (attr.name as Identifier).name === 'class');

    if (classAttr) {
        result = valueExpr(classAttr.value);
    }

    elem.directives.forEach(dir => {
        if (dir.prefix === 'class') {
            const value = valueExpr(dir.value);
            const name = literal(` ${dir.name}`);
            const expr = value
                ? conditionalExpr(value, name, empty)
                : name;
            result = result ? concatExpressions(result, expr) : expr;
        }
    });

    return result;
}
