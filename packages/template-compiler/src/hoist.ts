import {
    ENDVariableStatement, ENDElement, ENDTemplate, ENDProgram, ENDVariable,
    ENDStatement, Program, Identifier, ENDForEachStatement, Expression, ExpressionStatement, ENDChooseCase, ENDIfStatement
} from '@endorphinjs/template-parser';
import { isElement } from './lib/utils';
import createSymbolGenerator, { SymbolGenerator } from './lib/SymbolGenerator';

type WalkNext = (node: WalkNode) => void;
type WalkNode = ENDStatement | ENDChooseCase;

interface HoistState {
    parent: ENDTemplate | ENDForEachStatement;
    elem?: ENDElement;
    vars?: ENDVariableStatement;
    conditions: Identifier[];
    getSymbol: SymbolGenerator;
}

/**
 * Hoists internal variables and expressions in given template to reduce nesting
 * of element attributes
 */
export default function hoist(program: ENDProgram): ENDProgram {
    const template = program.body.find(node => node.type === 'ENDTemplate') as ENDTemplate;
    if (!template) {
        // No template, nothing to rewrite
        return program;
    }

    const state: HoistState = {
        parent: template,
        vars: null,
        conditions: [],
        getSymbol: createSymbolGenerator('__')
    };

    const next: WalkNext = (node: ENDStatement) => walk(node, state, next);
    template.body.forEach(next);
    return program;
}

function walk(node: WalkNode, state: HoistState, next: WalkNext) {
    if (isElement(node)) {
        // Entering element bound
        const { elem } = state;
        node.body.forEach(next);
        state.elem = elem;
    } else if (node.type === 'ENDVariableStatement') {
        node.variables.forEach(v => hoistVar(state, v));
        node.variables.length = 0;
    } else if (isConditional(node)) {
        if (shouldHoistConditionTest(node)) {
            // Hoist condition as local variable
            const lv = localVar(state.getSymbol('if'));
            let expr = node.test;
            const prevCondition = last(state.conditions);
            if (prevCondition) {
                // Current condition is nested in another condition.
                // We should evaluate its expression only if parent condition is truthy
                const nextCondition = expr.body[0]! as ExpressionStatement;
                expr = createExprProgram({
                    type: 'LogicalExpression',
                    operator: '&&',
                    left: prevCondition,
                    right: nextCondition.expression
                });
            }
            hoistVar(state, createVariable(lv.name, expr));
            node.test = createExprProgram(lv);
            state.conditions.push(lv);
            node.consequent.forEach(next);
            state.conditions.pop();
        } else {
            node.consequent.forEach(next);
        }
    } else if (node.type === 'ENDChooseStatement') {
        node.cases.forEach(next);
    }
}

/**
 * Pushes given variable into hoisted state
 */
function hoistVar(state: HoistState, v: ENDVariable) {
    if (!state.vars) {
        const { parent } = state;
        state.vars = { type: 'ENDVariableStatement', variables: [] };
        parent.body = parent.body.slice();
        parent.body.unshift(state.vars);
    }

    state.vars!.variables.push(v);
}

function createVariable(name: string, value: Program): ENDVariable {
    return { type: 'ENDVariable', name, value };
}

function createExprProgram(expression: Expression): Program {
    return {
        type: 'Program',
        body: [{
            type: 'ExpressionStatement',
            expression
        }],
        raw: ''
    };
}

/**
 * Check if condition test in given node should be promoted to hoisted variable
 */
function shouldHoistConditionTest(node: ENDIfStatement | ENDChooseCase): boolean {
    return node.consequent.some(child => {
        if (child.type === 'ENDAddClassStatement' || child.type === 'ENDAttributeStatement') {
            return true;
        }

        if (isConditional(child)) {
            return shouldHoistConditionTest(child);
        }

        return false;
    });
}

function isConditional(node: WalkNode): node is ENDIfStatement | ENDChooseCase {
    return node.type === 'ENDIfStatement' || node.type === 'ENDChooseCase';
}

/**
 * Creates local variable identifier with given name
 */
function localVar(name: string): Identifier {
    return {
        type: 'Identifier',
        name,
        context: 'variable'
    };
}

function last<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}
