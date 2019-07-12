import {
    ENDDirective, Expression, ENDGetterPrefix, Identifier, ExpressionStatement,
    ENDCaller, ENDAttributeValue,
    CallExpression, IdentifierContext
} from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import baseVisitors from '../visitors/expression';
import { sn, nameToJS, isExpression, isIdentifier, isLiteral, qStr, isArrowFunction, isCallExpression, isPrefix, pendingEvents } from '../lib/utils';
import { ENDCompileError } from '../lib/error';
import { ExpressionVisitorMap } from '../types';
import { thisExpr, identifier, member, callExpr } from '../lib/ast-constructor';

export default class EventEntity extends Entity {
    constructor(readonly node: ENDDirective, readonly state: CompileState) {
        super(node.name.split(':')[0], state);

        const eventType = this.rawName;
        const { element, receiver } = state;
        const handler = createEventHandler(node, state);

        if (!receiver || receiver.isDynamicDirective(node.prefix, node.name)) {
            // Event is dynamic, e.g. can be changed with condition
            this.setShared(() =>
                state.runtime('setPendingEvent', [pendingEvents(state), qStr(eventType), handler, state.scope]));
        } else {
            this.setMount(() => state.runtime('addEvent', [element.getSymbol(), qStr(eventType), handler, state.host, state.scope]));
            this.setUnmount(() => sn([this.scopeName, ' = ', this.state.runtime('removeEvent', [qStr(eventType), this.getSymbol()])]));
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
    const target = member(evt, 'currentTarget');

    return callExpr({ ...node, context: 'definition' }, [host, evt, target], node);
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

                const callee = identifier(node.property.value as string, context);
                return this.CallExpression(callExpr(callee, node.arguments, node), state, next);
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
            if (node.context !== 'helper' && node.context !== 'argument') {
                return sn(`this.${state.prefix(node.context)}`);
            }

            return sn();
        },
        ThisExpression() {
            return sn('this.host');
        }
    };
}
