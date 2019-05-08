import {
    ENDDirective, JSNode, Expression, ENDGetterPrefix, Identifier, ExpressionStatement,
    ArrowFunctionExpression, ENDCaller, ThisExpression, MemberExpression, ENDAttributeValue,
    CallExpression, IdentifierContext
} from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import baseVisitors from '../visitors/expression';
import { sn, nameToJS, isExpression, isIdentifier, isLiteral, qStr } from '../lib/utils';
import { ENDCompileError } from '../lib/error';
import { ExpressionVisitorMap } from '../types';

export default class EventEntity extends Entity {
    constructor(readonly node: ENDDirective, readonly state: CompileState) {
        super(node.name.split(':')[0], state);

        const eventType = this.rawName;
        const { element } = state;
        const handler = createEventHandler(node, state);

        if (!element.node || element.dynamicEvents.has(eventType) || element.hasPartials) {
            this.setShared(() => state.runtime('addEvent', [element.injector, qStr(eventType), handler, state.host, state.scope]));
        } else {
            // Add as static event
            this.setMount(() => state.runtime('addStaticEvent', [element.getSymbol(), qStr(eventType), handler, state.host, state.scope]));
            this.setUnmount(() => this.unmount('removeStaticEvent'));
        }
    }
}

function createEventHandler(node: ENDDirective, state: CompileState) {
    const [eventName, ...modifiers] = node.name.split(':');
    const handlerName = state.globalSymbol(`on${nameToJS(eventName, true)}`);
    let handler = getHandler(node.value);

    if (!modifiers.length && !handler) {
        throw new ENDCompileError(`Event handler must be expression`, node.value);
    }

    const prefix = `\n${state.indent}`;
    const eventArg = getEventArgName(handler);
    const needEventArg = modifiers.length > 0 || handlerUsesEvent(handler);
    const handlerFn = sn(`function ${handlerName}(${needEventArg ? eventArg : ''}) {`, node);

    // Handle event modifiers
    modifiers.forEach(m => {
        if (m === 'stop') {
            handlerFn.add(`${prefix}${eventArg}.stopPropagation();`);
        } else if (m === 'prevent') {
            handlerFn.add(`${prefix}${eventArg}.preventDefault();`);
        }
    });

    const visitors = createVisitors(eventArg);

    if (handler) {
        if (isArrowFunction(handler)) {
            if (handler.body.type === 'BlockStatement') {
                handler.body.body.forEach(expr => {
                    handlerFn.add([prefix, generateExpression(expr, state, visitors)]);
                    if (expr.type === 'ExpressionStatement') {
                        handlerFn.add(';');
                    }
                });
            } else {
                handlerFn.add([prefix, generateExpression(handler.body, state, visitors), ';']);
            }
        } else {
            if (isIdentifier(handler)) {
                handler = constructCall(handler, eventArg);
            }
            handlerFn.add([prefix, generateExpression(handler, state, visitors), ';']);
        }
    }

    handlerFn.add('\n}\n');

    state.pushOutput(handlerFn);
    return handlerName;
}

function getHandler(node: ENDAttributeValue | null): Expression {
    if (node && isExpression(node) && node.body.length) {
        return (node.body[0] as ExpressionStatement).expression;
    }
}

function isCallExpression(node: JSNode): node is CallExpression {
    return node.type === 'CallExpression';
}

function isArrowFunction(node: JSNode): node is ArrowFunctionExpression {
    return node.type === 'ArrowFunctionExpression';
}

function isPrefix(node: JSNode): node is ENDGetterPrefix {
    return node.type === 'ENDGetterPrefix';
}

function getEventArgName(handler: Expression | void): string {
    if (handler && isArrowFunction(handler) && handler.params.length && isIdentifier(handler.params[0])) {
        return (handler.params[0] as Identifier).name;
    }

    return 'evt';
}

/**
 * Constructs handler caller AST node from given shorthand identifier
 */
function constructCall(node: Identifier, eventArg: string): CallExpression {
    const host = thisExpr();
    const evt = identifier(eventArg);
    const target = member(evt, identifier('currentTarget'));

    return {
        type: 'CallExpression',
        callee: { ...node, context: 'definition' },
        arguments: [host, evt, target],
        loc: node.loc
    } as CallExpression;
}

function thisExpr(): ThisExpression {
    return { type: 'ThisExpression' };
}

function identifier(name: string, context?: IdentifierContext): Identifier {
    return { type: 'Identifier', name, context };
}

function member(object: Expression, property: Expression): MemberExpression {
    return { type: 'MemberExpression', object, property };
}

function handlerUsesEvent(handler: Expression | void): boolean {
    if (!handler) {
        return false;
    }

    if (isArrowFunction(handler)) {
        return handler.params.length > 0;
    }

    if (isCallExpression(handler)) {
        return !isIdentifier(handler.callee) || handler.callee.context !== 'helper';
    }

    return true;
}

function createVisitors(eventArg: string): ExpressionVisitorMap {
    const host = thisExpr();
    const evt = identifier(eventArg);
    const target = identifier('this.target');

    return {
        ENDCaller(node: ENDCaller, state, next) {
            if (isPrefix(node.object) && isLiteral(node.property)) {
                // Convert caller back to call expression to throw errors if
                // callee doesn’t exists
                const context: IdentifierContext = node.object.context === 'property'
                    ? 'definition' : node.object.context;
                return this.CallExpression({
                    type: 'CallExpression',
                    callee: identifier(node.property.value as string, context),
                    arguments: node.arguments,
                    loc: node.loc
                } as CallExpression, state, next);
            }

            return baseVisitors.ENDCaller(node, state, next);
        },
        CallExpression(node: CallExpression, state, next) {
            if (!isIdentifier(node.callee) || node.callee.context !== 'helper') {
                node = {
                    ...node,
                    arguments: [...node.arguments, host, evt, target]
                } as CallExpression;
            }

            return baseVisitors.CallExpression(node, state, next);
        },
        ENDGetterPrefix(node: ENDGetterPrefix, state) {
            if (node.context !== 'helper') {
                return sn(`this.${state.prefix(node.context)}`);
            }

            return sn();
        },
        ThisExpression() {
            return sn('this.host');
        }
    };
}
