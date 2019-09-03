import {
    ENDVariableStatement, ENDProgram, ENDVariable, ENDAttribute, ENDDirective,
    ENDStatement, Program, Identifier, Expression, ExpressionStatement,
    ENDChooseCase, ENDIfStatement, ENDProgramStatement, ENDAttributeValue,
    LogicalExpression, Literal, ConditionalExpression, walk as walkExpr
} from '@endorphinjs/template-parser';
import { isElement, isLiteral } from './lib/utils';
import { identifier } from './lib/ast-constructor';
import createSymbolGenerator, { SymbolGenerator } from './lib/SymbolGenerator';

type WalkNode = ENDProgramStatement | ENDStatement | ENDChooseCase;
type WalkNext = (node: WalkNode) => WalkNode | null;

interface VariableInfo {
    /** Reference to another variable name to be used instead of current one */
    ref?: string;

    /** Actual variable value */
    value: ENDAttributeValue;

    /** Indicates given was accessed for reading */
    used: boolean;
}

interface HoistState {
    vars: Map<string, VariableInfo>;
    attrs: Map<string, ENDAttributeValue>;
    classNames: Map<string, Program>;
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
        attrs: new Map(),
        classNames: new Map(),
        conditions: [],
        getSymbol: createSymbolGenerator('__')
    };

    const next: WalkNext = node => walk(node, state, next);
    program.body.forEach(next);
    return program;
}

function transform<T extends ENDStatement>(items: T[], next: WalkNext): T[] {
    return items.map(next).filter(Boolean) as T[];
}

function walk(node: WalkNode, state: HoistState, next: WalkNext): WalkNode | null {
    if (node.type === 'ENDVariableStatement') {
        node.variables.forEach(v => hoistVar(state, v.name, v.value));
        return null;
    }

    if (node.type === 'ENDAttributeStatement') {
        processAttributes(node.attributes, node.directives, state);
        return null;
    }

    if (node.type === 'ENDTemplate') {
        const { vars } = state;
        state.vars = new Map();
        node.body = transform(node.body, next);
        node.body.unshift(finalizeVars(state.vars!));
        state.vars = vars;
    } else if (isElement(node)) {
        // Entering element bound
        const { attrs, classNames, conditions } = state;
        state.attrs = new Map();
        state.classNames = new Map();
        state.conditions = [];

        processAttributes(node.attributes, node.directives, state);
        node.body = transform(node.body, next);

        node.attributes = finalizeAttributes(state.attrs);
        node.directives = finalizeDirectives(node.directives, state);
        state.attrs = attrs;
        state.classNames = classNames;
        state.conditions = conditions;
    } else if (isConditional(node)) {
        rewrite(node.test, state);
        if (shouldHoistConditionTest(node)) {
            // Hoist condition as local variable
            const lv = localVar(state.getSymbol('if'));
            let expr = node.test;
            const condition = last(state.conditions);

            if (condition) {
                // Current condition is nested in another condition.
                // We should evaluate its expression only if parent condition is truthy
                expr = createProgram(binaryExpr(condition, castValue(expr)));
            }

            state.vars.set(lv.name, varInfo(expr));
            node.test = createProgram(lv);
            state.conditions.push(lv);
            node.consequent = transform(node.consequent, next);
            state.conditions.pop();
        } else {
            node.consequent = transform(node.consequent, next);
        }

        return node.consequent.length ? node : null;
    } else if (node.type === 'ENDChooseStatement') {
        // TODO should respect previous choose statements as condition
        node.cases.forEach(next);
    } else if (node.type === 'Program') {
        rewrite(node, state);
    }

    return node;
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

    vars.set(name, varInfo(newValue));
    return name;
}

/**
 * Hoists given element attribute
 */
function hoistAttribute(attr: ENDAttribute, state: HoistState) {
    const { name } = attr.name as Identifier;
    let { value } = attr;
    const condition = last(state.conditions);

    if (condition) {
        const prev = state.attrs.get(name);
        // TODO merge conditions if they result the same value, e.g.
        // <e:attr a=2 e:if={foo1}/> <e:attr a=2 e:if={foo2}/>
        // should produce `a={foo1 || foo2 ? 2 : null}` instead of `a={foo2 ? 2 : foo1 ? 2 : null}`
        value = createProgram(conditionalExpr(condition, castValue(value), castValue(prev)));
    }

    state.attrs.set(name, value);
}

function hoistClassName(dir: ENDDirective, state: HoistState) {
    const { name, value } = dir;
    const { classNames } = state;
    const condition = last(state.conditions);
    let expr: Expression | null = null;

    if (condition && value) {
        expr = binaryExpr(condition, castValue(value));
    } else if (condition) {
        expr = condition;
    } else if (value) {
        expr = castValue(value);
    }

    if (expr) {
        const prev = classNames.get(name);
        if (prev) {
            expr = binaryExpr(castValue(prev), expr, '||');
        } else if (classNames.has(name)) {
            // If class name was already defined without explicit value then
            // it should never be affected by any condition
            expr = null;
        }
    }

    state.classNames.set(dir.name, expr ? createProgram(expr) : null);
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

function finalizeAttributes(attrs: Map<string, ENDAttributeValue>): ENDAttribute[] {
    const result: ENDAttribute[] = [];
    attrs.forEach((value, name) => {
        result.push({
            type: 'ENDAttribute',
            name: identifier(name),
            value
        });
    });
    return result;
}

function finalizeDirectives(prev: ENDDirective[], state: HoistState): ENDDirective[] {
    // Replace class name directives with new ones
    const result = prev.filter(dir => !isClassName(dir));
    state.classNames.forEach((expr, name) => {
        result.push({
            type: 'ENDDirective',
            prefix: 'class',
            name,
            value: expr
        });
    });

    return result;
}

function processAttributes(attributes: ENDAttribute[], directives: ENDDirective[], state: HoistState) {
    attributes.forEach(attr => {
        rewrite(attr.value, state);
        hoistAttribute(attr, state);
    });
    directives.forEach(dir => {
        rewrite(dir.value, state);
        if (isClassName(dir)) {
            hoistClassName(dir, state);
        }
    });
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

function rewrite(value: ENDAttributeValue | null, state: HoistState) {
    if (value) {
        if (value.type === 'Program') {
            rewriteVarAccessors(value, state);
        } else if (value.type === 'ENDAttributeValueExpression') {
            value.elements.forEach(elem => rewrite(elem, state));
        }
    }

    return value;
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

function varInfo(value: ENDAttributeValue): VariableInfo {
    return { ref: null, value, used: false };
}

function isClassName(dir: ENDDirective): boolean {
    return dir.prefix === 'class';
}

function last<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}