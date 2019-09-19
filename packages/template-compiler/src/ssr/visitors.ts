import {
    Node, ENDStatement, ENDElement, Identifier, Literal, ENDTemplate, ENDPartial,
    ENDIfStatement, BlockStatement, IfStatement, ExpressionStatement, ENDChooseStatement, Expression, Program
} from '@endorphinjs/template-parser';
import SSRState from './SSRState';
import { isLiteral, qStr } from '../lib/utils';
import { ENDCompileError } from '../lib/error';
import { literal, callExpr } from '../lib/ast-constructor';
import { concatExpressions } from './SSROutput';

export type VisitorNode = ENDStatement | ENDTemplate | ENDPartial;
export type VisitorContinue = (node: VisitorNode) => void;
export type Visitor<N extends Node> = (node: N, state: SSRState, next: VisitorContinue) => void;

export interface VisitorMap {
    [name: string]: Visitor<VisitorNode>;
}

export const visitors: VisitorMap = {
    ENDTemplate(node: ENDTemplate, state, next) {
        state.enter('render', () => node.body.forEach(next), true);
    },
    ENDElement(node: ENDElement, state, next) {
        const elemName = node.name.name;
        state.out(`<${elemName}`);
        // TODO collect class attribute and class directive into single payload
        node.attributes.forEach(attr => {
            const attrName = (attr.name as Identifier).name;
            if (!attr.value) {
                // No value: boolean attribute
                state.out(` ${attrName}=""`);
            } else if (isLiteral(attr.value)) {
                state.out(` ${attrName}=${qStr(String(attr.value.value))}`);
            } else {
                let expr: Expression | null = null;
                if (attr.value.type === 'Program') {
                    expr = getExpression(attr.value);
                } else {
                    attr.value.elements.forEach(elem => {
                        const value = isLiteral(elem) ? elem : getExpression(elem);
                        expr = expr ? concatExpressions(expr, value) : value;
                    });
                }

                if (expr) {
                    // Use helper to produce non-empty attribute
                    state.out(callExpr(state.use('attr'), [literal(attrName), expr]));
                }
            }
        });

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
        state.out(getExpression(node));
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
    }
};

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
