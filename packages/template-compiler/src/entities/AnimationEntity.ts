import {
    CallExpression, Expression, MemberExpression, ArrowFunctionExpression,
    ENDAttributeValue, ObjectExpression
} from '@endorphinjs/template-parser';
import { compileAttributeValue } from './AttributeEntity';
import ElementEntity from './ElementEntity';
import Entity from './Entity';
import generateExpression from '../expression';
import { Chunk, ChunkList } from '../types';
import { isIdentifier, isExpression, isCallExpression, createFunction, sn, isValidChunk } from '../lib/utils';
import CompileState from '../lib/CompileState';
import { identifier, callExpr } from '../lib/ast-constructor';
import InjectorEntity from './InjectorEntity';

export default class AnimationEntity extends Entity {
    constructor(elem: ElementEntity, state: CompileState, inValue?: ENDAttributeValue, outValue?: ENDAttributeValue) {
        super('anim', state);

        if (inValue) {
            this.setMount(() => animateIn(elem, inValue, state));
        }

        if (outValue) {
            this.setUnmount(() => animateOut(elem, outValue, state));
        }
    }
}

export function animateIn(elem: ElementEntity, value: ENDAttributeValue, state: CompileState): Chunk {
    return state.runtime('animate', [elem.getSymbol(), createAnimation(elem, value, state)]);
}

export function animateOut(elem: ElementEntity, value: ENDAttributeValue, state: CompileState): Chunk {
    const callback = animateOutCallback(elem);
    return state.runtime('animate', [elem.getSymbol(), createAnimation(elem, value, state), callback]);
}

/**
 * Generates animation out callback
 */
function animateOutCallback(elem: ElementEntity): Chunk | null {
    // NB: use empty source node to skip auto-null check in block unmount
    const empty = sn();
    const { state } = elem;
    const callback = state.globalSymbol('animateOut');
    const code: ChunkList = [];
    const toNull: Entity[] = [];

    const transfer = (item: Entity) => {
        item.children.forEach(transfer);

        if (item instanceof InjectorEntity && item.symbolUsage.update) {
            // We should explicitly null injector entities inside animation callback
            toNull.push(item);
            item.code.unmount = empty;
        } else if (isValidChunk(item.code.unmount)) {
            code.push(item.code.unmount);
            item.code.unmount = empty;
        }
    };

    transfer(elem);

    // We have to detach animated element. If it’s a component, we have to store
    // element reference first since it will be removed by `unmountComponent()` call
    if (elem.isComponent) {
        code.unshift(sn(['const _ref = ', elem.getSymbol()]));
        code.push(state.runtime('domRemove', ['_ref']));
    } else {
        code.push(sn([
            elem.getSymbol(), ' = ', state.runtime('domRemove', [elem.getSymbol()])
        ]));
    }

    if (toNull.length) {
        const scope = state.options.scope;
        code.push(sn(toNull.map(entity => `${scope}.${entity.name} = `).join('') + 'null'));
    }

    state.pushOutput(createFunction(callback, [state.scope], code));

    return generateExpression({
        type: 'ArrowFunctionExpression',
        expression: true,
        params: [],
        body: callExpr(callback, [identifier(state.scope), identifier(state.host)])
    } as ArrowFunctionExpression, state);
}

/**
 * Rewrites identifier with `property` context to `definition`
 */
function rewriteToDefinition<T extends Expression>(node: T): T {
    if (isIdentifier(node) && node.context === 'property') {
        return { ...node, context: 'definition' };
    }

    if (node.type === 'ObjectExpression') {
        return {
            ...node,
            properties: (node as ObjectExpression).properties.map(prop => ({
                ...prop,
                value: rewriteToDefinition(prop.value)
            }))
        };
    }

    if (node.type === 'MemberExpression') {
        return {
            ...node,
            object: rewriteToDefinition((node as MemberExpression).object)
        };
    }

    return node;
}

function createCSSAnimation(value: ENDAttributeValue, state: CompileState): Chunk {
    const anim = compileAttributeValue(value, state);
    return state.cssScope
        ? state.runtime('createAnimation', [anim, state.cssScope])
        : anim;
}

function createAnimation(elem: ElementEntity, handler: ENDAttributeValue, state: CompileState, next?: ArrowFunctionExpression): Chunk | null {
    if (isExpression(handler) && handler.body.length === 1) {
        const expr = handler.body[0];
        if (expr.type === 'ExpressionStatement') {
            let call: Expression = expr.expression;

            if (isIdentifier(call) && (!call.context || call.context === 'property')) {
                // Tween handler is passed as function pointer:
                // `animate:in={handler}`
                // Rewrite it to function call with empty options argument
                call = callExpr(call);
            }

            if (isCallExpression(call)) {
                // Tween passed as function call.
                // Upgrade node for proper function pointer and arguments

                // Mark symbol as used to create scope reference
                elem.getSymbol();

                return generateExpression({
                    ...call,
                    callee: rewriteToDefinition(call.callee),
                    arguments: [
                        identifier(state.renderContext === 'mount' ? elem.name : `${state.scope}.${elem.name}`),
                        ...call.arguments.map(rewriteToDefinition)
                    ]
                } as CallExpression, state);
            }
        }
    }

    return createCSSAnimation(handler, state);
}
