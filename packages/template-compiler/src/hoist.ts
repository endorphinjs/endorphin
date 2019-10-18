import {
    ENDNode, ENDElement, ENDVariableStatement, ENDProgram, ENDAttribute, ENDDirective,
    ENDStatement, Program, Identifier, Expression, ExpressionStatement,
    ENDChooseCase, ENDIfStatement, ENDProgramStatement, ENDAttributeValue,
    ENDAddClassStatement, ENDAttributeValueExpression, ENDBaseAttributeValue,
    Literal, ENDAttributeStatement, ENDChooseStatement, ENDForEachStatement,
    ENDPlainStatement, ENDPartial, ENDPartialStatement, ENDInnerHTML, ENDTemplate,
    walk as walkExpr
} from '@endorphinjs/template-parser';
import { isLiteral, isIdentifier } from './lib/utils';
import { identifier, literal, variable, program, conditionalExpr, binaryExpr, attributeExpression } from './lib/ast-constructor';
import astEqual from './lib/ast-equal';
import createSymbolGenerator, { SymbolGenerator } from './lib/SymbolGenerator';

type WalkNode = ENDProgramStatement | ENDStatement;
type WalkNext = (node: WalkNode) => WalkNode | void;

interface WalkVisitorMap {
    [name: string]: (node: WalkNode, state: HoistState, next: WalkNext) => WalkNode | void;
}

interface VariableInfo {
    /** Reference to another variable name to be used instead of current one */
    ref?: string;

    /** Actual variable value */
    value: ENDAttributeValue;

    /** Indicates given was accessed for reading */
    used: boolean;
}

interface HoistState {
    // XXX need better name for `globalScope`: actually, it indicated element scope
    /** Indicates current variable scope is global for template */
    globalScope: boolean;
    vars: Map<string, VariableInfo>;
    varsScope: Map<string, VariableInfo>[];
    attrs: Map<string, ENDAttributeValue>;
    events: Map<string, ENDDirective>;
    classNames: Map<string, Program>;
    conditions: Identifier[];
    getSymbol: SymbolGenerator;
    path: ENDNode[];
    pendingClass?: ENDAttributeValue;
}

const emptyVal = literal(undefined);
const conditionalType = ['ENDIfStatement', 'ENDChooseStatement', 'ENDForEachStatement'];

/**
 * Hoists internal variables and expressions in given template to reduce nesting
 * of element attributes
 */
export default function hoist(prog: ENDProgram): ENDProgram {
    const state: HoistState = {
        globalScope: true,
        vars: new Map(),
        varsScope: [],
        attrs: new Map(),
        events: new Map(),
        classNames: new Map(),
        conditions: [],
        path: [],
        getSymbol: createSymbolGenerator('__')
    };

    const next: WalkNext = node => {
        state.path.push(node);
        const result = walk(node, state, next);
        state.path.pop();
        return result;
    };
    prog.body.forEach(next);
    return prog;
}

const visitors: WalkVisitorMap = {
    ENDTemplate(node: ENDTemplate, state, next) {
        const { vars, globalScope } = state;
        state.globalScope = true;
        state.vars = new Map();
        node.body = transform(node.body, next);
        if (state.vars.size) {
            node.body.unshift(finalizeVars(state.vars));
        }
        state.globalScope = globalScope;
        state.vars = vars;
        return node;
    },
    ENDElement(node: ENDElement, state, next) {
        const { attrs, events, classNames, conditions, globalScope } = state;
        state.globalScope = true;
        state.attrs = new Map();
        state.events = new Map();
        state.classNames = new Map();
        state.conditions = [];

        processAttributes(node.attributes, node.directives, state);

        // Copy event directives
        node.directives.forEach(dir => {
            if (isEvent(dir)) {
                state.events.set(dir.name, dir);
            }
        });

        node.body = transform(node.body, next);

        // Move class names into "class" attribute
        if (state.classNames.size) {
            let classVal = state.attrs.get('class');
            state.classNames.forEach((condition, name) => {
                classVal = addClass([literal(name)], condition ? getExpression(condition) : null, classVal);
            });
            state.attrs.set('class', classVal);
        }

        state.globalScope = globalScope;
        node.attributes = finalizeAttributes(state.attrs);
        node.directives = finalizeDirectives(node.directives, state);
        state.attrs = attrs;
        state.events = events;
        state.classNames = classNames;
        state.conditions = conditions;
        return node;
    },
    ENDVariableStatement(node: ENDVariableStatement, state) {
        // Move variables up to parent scope
        node.variables.forEach(v => hoistVar(state, v.name, v.value));
        return null;
    },
    ENDAttributeStatement(node: ENDAttributeStatement, state) {
        // Hoist <e:attr>: move attributes and `class:` directives to parent
        // element, keep node if it contains unhandled directives like event listeners
        processAttributes(node.attributes, node.directives, state);
        const hasCondition = state.path.some(n => conditionalType.includes(n.type));
        node.attributes = [];
        node.directives = node.directives.filter(dir => {
            if (isEvent(dir) && !hasCondition) {
                // Event handler is not under condition, move it to parent scope
                state.events.set(dir.name, dir);
                return false;
            }

            return !isClassName(dir);
        });
        return node.directives.length ? node : null;
    },
    ENDAddClassStatement(node: ENDAddClassStatement, state) {
        if (state.globalScope) {
            const classVal = addClass(node.tokens, last(state.conditions), state.attrs.get('class'));
            state.attrs.set('class', classVal);
        } else {
            // For block context, we should accumulate all class names as separate
            // expression and it as single `<e:add-class>` statement
            state.pendingClass = addClass(node.tokens, last(state.conditions), state.pendingClass);
        }
    },
    ENDIfStatement(node: ENDIfStatement, state, next) {
        // Handle <e:if>: if there are immediate attribute or variable statement
        // children, hoist their contents to parent scope. In case if test expression
        // is not simple (not a simple literal or identifier), replace it with variable
        // reference
        rewrite(node.test, state);
        if (shouldHoistConditionTest(node)) {
            // Hoist condition as local variable. In the end, `node.test` will
            // contain a simple expression, either literal or identifier
            node.test = createCondition(node.test, state);
            state.conditions.push(getExpression(node.test) as Identifier);
            node.consequent = transform(node.consequent, next);
            state.conditions.pop();
        } else {
            node.consequent = transform(node.consequent, next);
        }

        return node.consequent.length ? node : null;
    },
    ENDChooseStatement(node: ENDChooseStatement, state, next) {
        // Handle <e:choose>: basically, it’s an if/else if/else statement which
        // means that a <e:case> statement can be handler only if previous test
        // case fails.
        node.cases.forEach(c => rewrite(c.test, state));
        if (node.cases.some(shouldHoistConditionTest)) {
            // Create expression which will pick a single case from choose statement
            let expr: Expression;
            const empty = literal(0);

            for (let i = node.cases.length - 1; i >= 0; i--) {
                const c = node.cases[i];
                if (c.test) {
                    expr = conditionalExpr(castValue(c.test), literal(i + 1), expr || empty);
                } else {
                    expr = literal(i + 1);
                }
            }

            const condition = last(state.conditions);
            if (condition) {
                expr = conditionalExpr(condition, expr || emptyVal, empty);
            }

            const parentExpr = localVar(state.getSymbol('choose'));
            state.vars.set(parentExpr.name, varInfo(program(expr), true));

            node.cases = node.cases.filter((c, i) => {
                // Hoist condition as local variable
                const lv = localVar(state.getSymbol('case'));
                const test = program(binaryExpr(parentExpr, literal(i + 1), '==='));

                state.vars.set(lv.name, varInfo(test, true));
                c.test = program(lv);
                state.conditions.push(lv);
                c.consequent = transform(c.consequent, next);
                state.conditions.pop();
                return c.consequent.length;
            });
        } else {
            node.cases = node.cases.filter(c => {
                c.consequent = transform(c.consequent, next);
                return c.consequent.length;
            });
        }

        return node.cases.length ? node : null;
    },
    ENDForEachStatement: blockScopeStatement,
    ENDPartial: blockScopeStatement,
    ENDPartialStatement(node: ENDPartialStatement, state) {
        node.params.forEach(p => rewrite(p.value, state));
        return node;
    },
    ENDInnerHTML(node: ENDInnerHTML, state) {
        rewrite(node.value, state);
        return node;
    },
    Program(node: Program, state) {
        return rewrite(node, state) as Program;
    }
};

function blockScopeStatement(node: ENDForEachStatement | ENDPartial, state: HoistState, next: WalkNext) {
    // Every <e:for-each> statement creates new variables scope.
    // Moreover, all immediate attribute statements must be kept as statements
    // because we can’t determine value until we iterate all items
    const { vars, attrs, classNames, conditions, globalScope } = state;
    state.globalScope = false;
    state.varsScope.push(vars);
    state.vars = new Map();
    state.attrs = new Map();
    state.classNames = new Map();
    state.conditions = [];

    node.body = transform(node.body, next);

    if (state.classNames) {
        state.classNames.forEach((condition, name) => {
            state.pendingClass = addClass([literal(name)], condition ? getExpression(condition) : null, state.pendingClass);
        });
    }

    if (state.pendingClass) {
        node.body.unshift({
            type: 'ENDAddClassStatement',
            tokens: [state.pendingClass],
        } as ENDAddClassStatement);
    }

    if (state.attrs.size) {
        node.body.unshift({
            type: 'ENDAttributeStatement',
            attributes: finalizeAttributes(state.attrs),
            directives: [],
        } as ENDAttributeStatement);
    }

    if (state.vars.size) {
        node.body.unshift(finalizeVars(state.vars));
    }

    state.globalScope = globalScope;
    state.varsScope.pop();
    state.vars = vars;
    state.attrs = attrs;
    state.classNames = classNames;
    state.conditions = conditions;
    return node;
}

function walk(node: WalkNode, state: HoistState, next: WalkNext): WalkNode | void {
    const visitor = visitors[node.type];
    return visitor ? visitor(node, state, next) : node;
}

function transform<T extends ENDStatement>(items: T[], next: WalkNext): T[] {
    return items.map(next).filter(Boolean) as T[];
}

/**
 * Pushes given variable into hoisted state
 * @returns Actual variable name for referencing in case if it was remapped
 */
function hoistVar(state: HoistState, name: string, value: ENDAttributeValue): string {
    const { vars } = state;
    const info = vars.get(name);
    const condition = last(state.conditions);

    // For local scopes, we should fallback to previous variable value, if any
    const fallback = state.globalScope ? emptyVal : localVar(name);
    const newValue = condition
        ? program(conditionalExpr(condition, castValue(value), fallback))
        : value;

    if (fallback !== emptyVal && !info) {
        markUsed(name, state);
    }

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
        value = program(conditionalExpr(condition, castValue(value), castValue(prev)));
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

    state.classNames.set(name, expr ? program(expr) : null);
}

/**
 * Concatenates two attribute values
 */
function concatAttrValues(left: ENDAttributeValue, right: ENDAttributeValue): ENDAttributeValue {
    if (left && right) {
        if (isLiteral(left) && isLiteral(right)) {
            return concatLiterals(left, right);
        }

        if (isAttrExpression(left) && isAttrExpression(right)) {
            const leftElements = left.elements.slice();
            const rightElements = right.elements.slice();
            const leftToken = last(leftElements)!;
            const rightToken = rightElements[0];
            if (isLiteral(leftToken) && isLiteral(rightToken)) {
                leftElements.pop();
                leftElements.push(concatLiterals(leftToken, rightToken));
                rightElements.shift();
            }

            return attributeExpression(leftElements.concat(rightElements));
        }

        if (isAttrExpression(left)) {
            const elements = left.elements.slice();
            const leftToken = last(elements)!;
            if (isLiteral(leftToken) && isLiteral(right)) {
                elements.pop();
                elements.push(concatLiterals(leftToken, right));
            } else {
                elements.push(right as Program);
            }

            return attributeExpression(elements);
        }

        if (isAttrExpression(right)) {
            const elements = right.elements.slice();
            const rightToken = elements[0]!;
            if (isLiteral(left) && isLiteral(rightToken)) {
                elements.shift();
                elements.unshift(concatLiterals(left, rightToken));
            } else {
                elements.unshift(left as Program);
            }

            return attributeExpression(elements);
        }

        return attributeExpression([left, right]);
    }

    return left || right;
}

function concatLiterals(left: Literal, right: Literal): Literal {
    return literal(String(left.value) + String(right.value));
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
        if (info.used) {
            result.variables.push(variable(name, info.value));
        }
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
    // Skip class directives: they should be moved into "class" attribute
    return prev.filter(dir => !isClassName(dir) && !isEvent(dir))
        .concat(Array.from(state.events.values()));
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
        if (child.type === 'ENDIfStatement') {
            return shouldHoistConditionTest(child);
        }

        if (child.type === 'ENDChooseStatement') {
            return child.cases.some(shouldHoistConditionTest);
        }

        if (child.type === 'ENDAttributeStatement') {
            return child.attributes.length || child.directives.filter(isClassName).length;
        }

        return child.type === 'ENDAddClassStatement'
            || child.type === 'ENDVariableStatement';
    });
}

function rewrite(value: ENDAttributeValue, state: HoistState) {
    if (value) {
        if (isProgram(value)) {
            rewriteVarAccessors(value, state);
        } else if (isAttrExpression(value)) {
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
                const info = getVar(node.name, state);
                if (info && info.ref) {
                    node.name = info.ref;
                }

                markUsed(node.name, state);
            }
        }
    });
}

/**
 * Adds given class name (defined as a set of tokens) to given `class` attribute value
 */
function addClass(tokens: ENDPlainStatement[], condition: Expression | null, prevValue?: ENDAttributeValue): ENDAttributeValue {
    tokens = tokens.slice();

    if (prevValue) {
        const firstToken = tokens[0];

        // Add space before new class name
        if (isLiteral(firstToken)) {
            tokens[0] = literal(' ' + firstToken.value);
        } else {
            tokens.unshift(literal(' '));
        }
    }

    const value = concatToJS(tokens);
    const expr = condition
        ? conditionalExpr(condition, value, literal(''))
        : value;

    return concatAttrValues(prevValue!, isLiteral(expr) ? expr : program(expr));
}

/**
 * Marks given variable name as used
 */
function markUsed(name: string, state: HoistState) {
    const info = getVar(name, state);
    if (info) {
        info.used = true;
    }
}

/**
 * Casts given attribute value to expression
 */
function castValue(value?: ENDAttributeValue): Expression {
    if (value) {
        if (isLiteral(value)) {
            return value;
        }

        if (isProgram(value)) {
            const node = value.body[0] as ExpressionStatement;
            if (node) {
                return node.expression;
            }
        }

        // Convert attribute expression to JS expression
        if (isAttrExpression(value)) {
            return concatToJS(value.elements);
        }
    }

    return emptyVal;
}

/**
 * Converts tokens of concat expression (like interpolated attribute value or
 * `<e:add-class>` statement contents) to JS expression
 */
function concatToJS(tokens: ENDBaseAttributeValue[]): Expression {
    if (!tokens.length) {
        return null;
    }

    if (tokens.length === 1) {
        return castValue(tokens[0]);
    }

    let i = 0;
    let result = binaryExpr(castValue(tokens[i++]), castValue(tokens[i++]), '+');

    while (i < tokens.length) {
        result = binaryExpr(result, castValue(tokens[i++]), '+');
    }

    return result;
}

function createCondition(expr: Program, state: HoistState) {
    const condition = last(state.conditions);

    if (condition) {
        // Current condition is nested in another condition.
        // We should evaluate its expression only if parent condition is truthy
        expr = program(binaryExpr(condition, castValue(expr)));
    }

    if (isSimple(expr)) {
        return expr;
    }

    // Check if we already have variable with the same expression
    let varName: string | null = null;
    for (const [k, v] of state.vars) {
        if (sameValue(expr, v.value)) {
            varName = k;
            break;
        }
    }

    const lv = localVar(varName || state.getSymbol('if'));
    if (!varName) {
        state.vars.set(lv.name, varInfo(expr, true));
    }
    return program(lv);
}

/**
 * Check if two given attribute values has the same value
 */
function sameValue(n1: ENDAttributeValue, n2: ENDAttributeValue): boolean {
    if (n1 === n2) {
        return true;
    }

    if (n1 && n2 && n1.type === n2.type) {
        if (isProgram(n1)) {
            return astEqual(n1.body[0], (n2 as Program).body[0]);
        }

        if (isLiteral(n1)) {
            return astEqual(n1, n2 as Literal);
        }
    }

    return false;
}

/**
 * Check if given expression is simple, e.g. doesn’t require extra effort to build value
 */
function isSimple(expr: ENDAttributeValue | Expression) {
    if (isProgram(expr)) {
        return expr.body.every((e: ExpressionStatement) => isSimple(e.expression));
    }

    return isLiteral(expr) || isIdentifier(expr);
}

function getExpression(expr: Program | Expression): Expression {
    if (isProgram(expr)) {
        return (expr.body[0] as ExpressionStatement).expression;
    }

    return expr;
}

function isProgram(node: ENDNode): node is Program {
    return node.type === 'Program';
}

function isAttrExpression(value: ENDAttributeValue): value is ENDAttributeValueExpression {
    return value.type === 'ENDAttributeValueExpression';
}

function localVar(name: string): Identifier {
    return identifier(name, 'variable');
}

function varInfo(value: ENDAttributeValue, used = false): VariableInfo {
    return { ref: null, value, used };
}

function isClassName(dir: ENDDirective): boolean {
    return dir.prefix === 'class';
}

function isEvent(dir: ENDDirective): boolean {
    return dir.prefix === 'on';
}

function getVar(name: string, state: HoistState) {
    if (state.vars.has(name)) {
        return state.vars.get(name);
    }

    for (const vars of state.varsScope) {
        if (vars.has(name)) {
            return vars.get(name);
        }
    }
}

function last<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}
