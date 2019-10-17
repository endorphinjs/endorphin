import {
    ENDDirective, Expression, ENDGetterPrefix, Identifier, ExpressionStatement,
    ENDCaller, ENDAttributeValue, CallExpression, IdentifierContext, ThisExpression,
    ENDGetter, MemberExpression, JSNode
} from '@endorphinjs/template-parser';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import baseVisitors from '../visitors/expression';
import {
    sn, nameToJS, isExpression, isIdentifier, isLiteral, qStr, isArrowFunction,
    isCallExpression, isPrefix, isPropKey
} from '../lib/utils';
import { ENDCompileError } from '../lib/error';
import { ExpressionVisitorMap } from '../types';
import { thisExpr, identifier, callExpr } from '../lib/ast-constructor';
import Entity from '../entities/Entity';

const enum UsedArgs {
    Host = 1 << 0,
    Event = 1 << 1,
    Target = 1 << 2,
    Scope = 1 << 3,
}

interface UsedArgsState {
    args: UsedArgs;
}

const hostContext: IdentifierContext[] = ['definition', 'property', 'state', 'store', 'store-host'];
const scopeContext: IdentifierContext[] = ['variable'];
const argNames: { [type in UsedArgs]: string } = {
    [UsedArgs.Event]: 'event',
    [UsedArgs.Host]: 'host',
    [UsedArgs.Target]: 'target',
    [UsedArgs.Scope]: 'scope',
};

export default function mountEvent(node: ENDDirective, eventReceiver: Entity, state: CompileState) {
    const eventType = node.name.split(':')[0];
    const handler = createEventHandler(node, state);
    const { receiver } = state;
    if (!receiver || receiver.isPendingEvent(eventType)) {
        // Mount as pending event
        return state.entity(eventType, {
            shared: () => state.runtime('setPendingEvent', [eventReceiver.getSymbol(), qStr(eventType), handler, state.scope])
        });
    }

    return state.entity(eventType, {
        mount: () => state.runtime('addEvent', [receiver.getSymbol(), qStr(eventType), handler, state.host, state.scope]),
        unmount: (ent: Entity) => sn([ent.scopeName, ' = ', state.runtime('removeEvent', [qStr(eventType), ent.getSymbol()])])
    });
}

function createEventHandler(node: ENDDirective, state: CompileState): string {
    const [eventName, ...modifiers] = node.name.split(':');
    const handlerName = state.globalSymbol(`on${nameToJS(eventName, true)}`);
    let handler = getHandler(node.value);

    if (!modifiers.length) {
        if (!handler) {
            throw new ENDCompileError(`Event handler must be expression`, node.value);
        }

        if (isIdentifier(handler) && (handler.context === 'definition' || handler.context === 'property')) {
            state.usedDefinition.add(handler.name);
            return handler.name;
        }
    }

    const prefix = `\n${state.indent}`;
    const eventArg = getEventArgName(handler);
    const handlerFn = sn('', node);

    // Handle event modifiers
    modifiers.forEach(m => {
        if (m === 'stop') {
            handlerFn.add(`${prefix}${eventArg}.stopPropagation();`);
        } else if (m === 'prevent') {
            handlerFn.add(`${prefix}${eventArg}.preventDefault();`);
        }
    });

    const argState: UsedArgsState = { args: 0 };
    const visitors = createVisitors(eventArg, argState);

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
                handler = constructCall(handler);
            }
            handlerFn.add([prefix, generateExpression(handler, state, visitors), ';']);
        }
    }

    if (modifiers.length > 0 || handlerUsesEvent(handler)) {
        argState.args |= UsedArgs.Event;
    }
    const args = [UsedArgs.Host, UsedArgs.Event, UsedArgs.Target, UsedArgs.Scope].map(type => {
        if (type <= argState.args) {
            return type === UsedArgs.Event ? eventArg : argNames[type];
        }
    }).filter(Boolean);

    handlerFn.prepend(`function ${handlerName}(${args.join(', ')}) {`);
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
function constructCall(node: Identifier): CallExpression {
    return callExpr({ ...node, context: 'definition' }, [], node);
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

function createVisitors(eventArg: string, argsState: UsedArgsState): ExpressionVisitorMap {
    const host = thisExpr();
    const evt = identifier(eventArg);
    const target = identifier(argNames[UsedArgs.Target]);

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
                argsState.args |= UsedArgs.Host | UsedArgs.Event | UsedArgs.Target;
            }

            return baseVisitors.CallExpression(node, state, next);
        },
        Identifier(node: Identifier, state, next) {
            handleContext(node.context, argsState);
            return baseVisitors.Identifier(node, state, next);
        },
        ENDGetter(node: ENDGetter, state, next) {
            // console.log('getter', node);

            if (node.path.length === 2) {
                // For simple cases like accessing properties of event handler,
                // use object notation instead of getter
                const [object] = node.path;
                let [, property] = node.path;
                if (isEventArgument(object, eventArg) && (isIdentifier(property) || isLiteral(property))) {
                    if (isLiteral(property) && typeof property.value === 'string' && isPropKey(property.value)) {
                        property = {
                            type: 'Identifier',
                            name: property.value
                        } as Identifier;
                    }

                    return baseVisitors.MemberExpression({
                        type: 'MemberExpression',
                        object,
                        property,
                        computed: false
                    } as MemberExpression, state, next);
                }
            }

            return baseVisitors.ENDGetter(node, state, next);
        },
        ENDGetterPrefix(node: ENDGetterPrefix, state, next) {
            handleContext(node.context, argsState);
            return baseVisitors.ENDGetterPrefix(node, state, next);
        },
        ThisExpression(node: ThisExpression, state, next) {
            argsState.args |= UsedArgs.Host;
            return baseVisitors.ThisExpression(node, state, next);
        }
    };
}

function handleContext(ctx: IdentifierContext, state: UsedArgsState) {
    if (hostContext.includes(ctx)) {
        state.args |= UsedArgs.Host;
    } else if (scopeContext.includes(ctx)) {
        state.args |= UsedArgs.Scope;
    }
}

function isEventArgument(node: JSNode, name: string): node is Identifier {
    return isIdentifier(node) && node.context === 'argument' && node.name === name;
}
