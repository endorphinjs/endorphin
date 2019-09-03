import {
    ENDVariableStatement, ENDElement, ENDProgram, ENDVariable,
    ENDStatement, Program, Identifier, Expression, ExpressionStatement,
    ENDChooseCase, ENDIfStatement, ENDProgramStatement, ENDAttributeValue,
    LogicalExpression, Literal, ConditionalExpression, walk as walkExpr
} from '@endorphinjs/template-parser';
import { isElement, isLiteral } from './lib/utils';
import createSymbolGenerator, { SymbolGenerator } from './lib/SymbolGenerator';

type WalkNext = (node: WalkNode) => void;
type WalkNode = ENDProgramStatement | ENDChooseCase;

interface VariableInfo {
    /** Reference to another variable name to be used instead of current one */
    ref?: string;

    /** Actual variable value */
    value: ENDAttributeValue;

    /** Indicates given was accessed for reading */
    used: boolean;
}

interface HoistState {
    elem?: ENDElement;
    vars: Map<string, VariableInfo>;
    conditions: Identifier[];
    getSymbol: SymbolGenerator;
}

const nullVal: Literal = { type: 'Literal', value: null, raw: 'null' };

/**
 * Hoists internal variables and expressions in given template to reduce nesting
 * of element attributes
 */
export default function hoist(program: ENDProgram): ENDProgram {
    const state: HoistState = {
        vars: new Map(),
        conditions: [],
        getSymbol: createSymbolGenerator('__')
    };

    const next: WalkNext = (node: ENDStatement) => walk(node, state, next);
    program.body.forEach(next);
    return program;
}

function walk(node: WalkNode, state: HoistState, next: WalkNext) {
    if (node.type === 'ENDTemplate') {
        const {  vars } = state;
        state.vars = new Map();
        node.body.forEach(next);
        node.body.unshift(finalizeVars(state.vars!));
        state.vars = vars;
    } else if (isElement(node)) {
        // Entering element bound
        const { elem } = state;
        node.attributes.forEach(attr => rewrite(state, attr.value));
        node.directives.forEach(dir => rewrite(state, dir.value));
        node.body.forEach(next);
        state.elem = elem;
    } else if (node.type === 'ENDVariableStatement') {
        node.variables.forEach(v => hoistVar(state, v.name, v.value));
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
                expr = createProgram(binaryExpr(prevCondition, castValue(expr)));
            }

            hoistVar(state, lv.name, expr);
            node.test = createProgram(lv);
            state.conditions.push(lv);
            node.consequent.forEach(next);
            state.conditions.pop();
        } else {
            node.consequent.forEach(next);
        }
    } else if (node.type === 'ENDChooseStatement') {
        node.cases.forEach(next);
    } else if (node.type === 'Program') {
        rewrite(state, node);
    }
}

/**
 * Pushes given variable into hoisted state
 * @returns Actual variable name for referencing in case if it was remapped
 */
function hoistVar(state: HoistState, name: string, value: ENDAttributeValue): string {
    const { vars } = state;
    const info = vars.get(name);
    const condition = last(state.conditions);
    const newValue = condition && !isSimple(value)
        ? createProgram(conditionalExpr(condition, castValue(value)))
        : value;

    if (info) {
        // Variable is already defined. If it’s not used, simply update value,
        // otherwise we should map it to new variable
        if (!info.used) {
            info.value = newValue;
            return name;
        }

        if (!info.ref) {
            // Generate new variable name
            const m = name.match(/__(\d+)$/);
            const num = m ? Number(m[1]) + 1 : 0;
            return info.ref = hoistVar(state, `${name}__${num}`, value);
        }

        return info.ref = hoistVar(state, info.ref, value);
    }

    vars.set(name, { ref: null, value: newValue, used: false });
    return name;
}

/**
 * Creates variable statement from given scope
 */
function finalizeVars(vars: Map<string, VariableInfo>): ENDVariableStatement {
    const result: ENDVariableStatement = {
        type: 'ENDVariableStatement',
        variables: []
    };

    vars.forEach((info, name) => {
        result.variables.push(createVariable(name, info.value));
    });

    return result;
}

function createVariable(name: string, value: ENDAttributeValue): ENDVariable {
    return { type: 'ENDVariable', name, value };
}

function createProgram(expression: Expression): Program {
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
        if (isConditional(child)) {
            return shouldHoistConditionTest(child);
        }

        return child.type === 'ENDAddClassStatement'
            || child.type === 'ENDAttributeStatement'
            || child.type === 'ENDVariableStatement';
    });
}

function isConditional(node: WalkNode): node is ENDIfStatement | ENDChooseCase {
    return node.type === 'ENDIfStatement' || node.type === 'ENDChooseCase';
}

function rewrite(state: HoistState, value?: ENDAttributeValue) {
    if (value) {
        if (value.type === 'Program') {
            rewriteVarAccessors(value, state);
        } else if (value.type === 'ENDAttributeValueExpression') {
            value.elements.forEach(elem => rewrite(state, elem));
        }
    }
}

/**
 * Rewrites local variable accessors in given expression, if required, and marks
 * variable as used
 */
function rewriteVarAccessors(expr: Program, state: HoistState) {
    walkExpr(expr, {
        Identifier(node: Identifier) {
            if (node.context === 'variable') {
                const info = state.vars.get(node.name);
                if (info && info.ref) {
                    node.name = info.ref;
                }

                markUsed(node.name, state);
            }
        }
    });
}

/**
 * Marks given variable name as used
 */
function markUsed(name: string, state: HoistState) {
    const info = state.vars.get(name);
    if (info) {
        info.used = true;
    }
}

/**
 * Casts given attribute value to expression
 */
function castValue(value?: ENDAttributeValue): Expression {
    if (value) {
        if (value.type === 'Literal') {
            return value;
        }

        if (value.type === 'Program') {
            const node = value.body[0] as ExpressionStatement;
            if (node) {
                return node.expression;
            }
        }

        // Convert attribute expression to JS expression
        if (value.type === 'ENDAttributeValueExpression') {
            const { elements } = value;
            let i = 0;
            // NB: expression contains at least 2 elements
            let result = binaryExpr(castValue(elements[i++]), castValue(elements[i++]), '+');

            while (i < elements.length) {
                result = binaryExpr(result, castValue(elements[i++]), '+');
            }

            return result;
        }
    }

    return nullVal;
}

/**
 * Check if given expression is simple, e.g. doesn’t require extra effort to build value
 */
function isSimple(expr: ENDAttributeValue) {
    if (expr.type === 'Program') {
        return expr.body.every((e: ExpressionStatement) => isLiteral(e.expression));
    }

    return expr.type === 'Literal';
}

/**
 * Creates local variable identifier with given name
 */
function localVar(name: string): Identifier {
    return { type: 'Identifier', name, context: 'variable' };
}

function binaryExpr(left: Expression, right: Expression, operator = '&&'): LogicalExpression {
    return { type: 'LogicalExpression', operator, left, right };
}

function conditionalExpr(test: Expression, consequent: Expression, alternate: Expression = nullVal): ConditionalExpression {
    return { type: 'ConditionalExpression', test, consequent, alternate };
}

function last<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}
