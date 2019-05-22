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
import { identifier, objectExpr, property, callExpr } from '../lib/ast-constructor';

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
    return createTween(elem, value, state)
        || state.runtime('animate', [elem.getSymbol(), createCSSAnimation(value, state)]);
}

export function animateOut(elem: ElementEntity, value: ENDAttributeValue, state: CompileState): Chunk {
    const callback = animateOutCallback(elem);
    const tween = createTween(elem, value, state, callback);

    if (tween) {
        // Use tween to animate element removal
        return tween;
    }

    // Use CSS Animation to animate element removal
    const args: ChunkList = [elem.getSymbol(), createCSSAnimation(value, state)];

    if (callback) {
        args.push(generateExpression(callback, state));
    }

    return state.runtime('animate', args);
}

/**
 * Generates animation out callback
 */
function animateOutCallback(elem: Entity): ArrowFunctionExpression | null {
    const empty = sn();
    const { state } = elem;
    const callback = state.globalSymbol('animateOut');

    // Always remove element from DOM in first place to skip inner animations
    const code: ChunkList = [state.runtime('domRemove', [elem.getSymbol()])];

    const transfer = (item: Entity) => {
        item.children.forEach(transfer);
        if (isValidChunk(item.code.unmount)) {
            code.push(item.code.unmount);
            // NB: use empty source node to skip auto-null check
            // in block unmount
            item.code.unmount = empty;
        }
    };

    transfer(elem);

    if (code.length) {
        state.pushOutput(createFunction(callback, [state.scope], code));

        return {
            type: 'ArrowFunctionExpression',
            expression: true,
            params: [],
            body: callExpr(callback, [identifier(state.scope), identifier(state.host)])
        };
    }

    return null;
}

/**
 * Creates tween handler (animation performed by JS) from given attribute, if possible
 */
function createTween(elem: ElementEntity, handler: ENDAttributeValue, state: CompileState, next?: ArrowFunctionExpression): Chunk | null {
    if (isExpression(handler) && handler.body.length === 1) {
        const expr = handler.body[0];
        if (expr.type === 'ExpressionStatement') {
            let call: Expression = expr.expression;

            if (isIdentifier(call)) {
                // Tween handler is passed as function pointer:
                // `animate:in={handler}`
                // Rewrite it to function call with empty options argument
                call = callExpr(call);
            }

            if (isCallExpression(call)) {
                // Tween passed as function call.
                // Upgrade node for proper function pointer and arguments
                const callArgs = call.arguments.slice();

                if (next) {
                    // We have to add continuation callback to options
                    callArgs[0] = upgradeOptions(callArgs[0] || objectExpr(), next, state);
                }

                callArgs.unshift(identifier(state.renderContext === 'mount' ? elem.name : `${state.scope}.${elem.name}`));

                // Mark symbol as used to create scope reference
                elem.getSymbol();

                return generateExpression({
                    ...call,
                    callee: rewriteToDefinition(call.callee),
                    arguments: callArgs
                } as CallExpression, state);
            }
        }
    }
}

function createCSSAnimation(value: ENDAttributeValue, state: CompileState): Chunk {
    let anim = compileAttributeValue(value, state);
    if (state.cssScope) {
        // Handle CSS isolation in animation
        anim = state.runtime('createAnimation', [anim, state.cssScope]);
    }

    return anim;
}

/**
 * Upgrades given expression with `next$` callback
 */
function upgradeOptions(node: Expression, next: ArrowFunctionExpression, state: CompileState): ObjectExpression | CallExpression {
    const prop = property('next$', next);

    if (node.type === 'ObjectExpression') {
        // Add new property to existing object
        return {
            ...node,
            properties: node.properties.concat(prop)
        } as ObjectExpression;
    }

    // Extend expression result with new property
    return callExpr(state.runtime('assign'), [node, objectExpr([prop])]);
}

/**
 * Rewrites identifier with `property` context to `definition`
 */
function rewriteToDefinition<T extends Expression>(node: T): T {
    if (isIdentifier(node) && node.context === 'property') {
        return { ...node, context: 'definition' };
    }

    if (node.type === 'MemberExpression') {
        return {
            ...node,
            object: rewriteToDefinition((node as MemberExpression).object)
        };
    }

    return node;
}
