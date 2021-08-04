import { Expression, MemberExpression, ENDAttributeValue, ObjectExpression, ENDElement } from '@endorphinjs/template-parser';
import { compileAttributeValue } from '../lib/attributes';
import Entity from '../entities/Entity';
import generateExpression from '../expression';
import { Chunk } from '../types';
import { isIdentifier, isExpression, isCallExpression, sn, qStr } from '../lib/utils';
import CompileState from '../lib/CompileState';
import { callExpr, identifier } from '../lib/ast-constructor';
import ElementEntity from '../entities/ElementEntity';
import BlockContext from './BlockContext';

export function hasAnimationOut(node: ENDElement, state: CompileState): boolean {
    const out = node.directives
        .find(dir => dir.prefix === 'animate' && dir.name === 'out');

    if (out && state.element.node) {
        const { loc } = out;
        state.warn(`Usage of animate:out without explicit condition makes no sense, skipping`, loc && loc.start.offset);
        return false;
    }
    return !!out;
}

export function animateIn(element: ElementEntity, state: CompileState): void {
    element.add(state.entity({
        mount: () => state.runtime('animate', [element.getSymbol(), createAnimation(element, element.animateIn, state)]),
    }));
    if (element.code.unmount) {
        element.prepend(state.entity({
            unmount: () => state.runtime('stopAnimation', [element.getSymbol(), 'true'])
        }));
    } else {
        element.setUnmount(() => element.unmount('stopAnimation'));
    }
}

export function animateOut(element: ElementEntity, block: BlockContext, slotName: string | null, state: CompileState): Entity {
    const { injectorEntity } = state.element;
    const injector = injectorEntity ? injectorEntity.name : 'null';

    const anim = state.entity(element, {
        mount(ent) {
            const mount = `${block.mountSymbol}(${state.host}, ${injector}, ${state.scope})`;
            const update = block.updateSymbol ? `${block.updateSymbol}(${state.host}, ${state.scope})` : null;
            const chunk = sn(update
                ? [ent.getSymbol(), ` ? ${update} : ${mount};`]
                : ['!', ent.getSymbol(), ` && ${mount};`]
            );
            chunk.add(`\n${state.indent}`);

            if (element.animateIn) {
                chunk.add(state.runtime('animate', [ent.getSymbol(), createAnimation(ent, element.animateIn, state)]));
            } else {
                chunk.add(state.runtime('stopAnimation', [ent.getSymbol(), 'true']));
            }

            return chunk;
        }
    });

    if (block.updateSymbol) {
        anim.setUpdate(() => `${block.updateSymbol}(${state.host}, ${state.scope})`);
    }

    anim.setUnmount(ent => {
        // In case if element is animated in context of component slot,
        // we should properly notify component about slot updates
        const receiver = state.component;
        let callback: Chunk;
        if (slotName != null && receiver) {
            callback = sn([
                '() => {',
                'enterSlots();',
                `${block.unmountSymbol}(${state.scope}, ${state.host});`,
                state.runtime('updateIncomingSlot', [receiver.getSymbol(), qStr(slotName), receiver.slotMark(slotName)]),
                ';exitSlots();',
                '}'
            ]);
        } else {
            callback = `() => ${block.unmountSymbol}(${state.scope}, ${state.host})`;
        }

        return state.runtime('animate', [
            ent.getSymbol(),
            createAnimation(ent, element.animateOut, state),
            callback
        ]);
    });

    return anim;
}

export function createAnimation(elem: Entity, handler: ENDAttributeValue, state: CompileState): Chunk | null {
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
                const compile = (node: Expression) => generateExpression(rewriteToDefinition(node), state);

                const args = sn(elem.getSymbol());
                call.arguments.forEach(arg => args.add(compile(arg)));

                return sn([compile(call.callee), '(', args.join(', '), ')']);
            }
        }
    }

    return createCSSAnimation(handler, state);
}

function createCSSAnimation(value: ENDAttributeValue, state: CompileState): Chunk {
    const anim = compileAttributeValue(value, state);
    return state.cssScope
        ? state.runtime('createAnimation', [anim, state.cssScope])
        : anim;
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
            properties: (node as ObjectExpression).properties.map(prop => {
                let { key } = prop;
                const { value } = prop;

                if (prop.shorthand && isIdentifier(value)) {
                    if (value.context === 'state' || value.context === 'store' || value.context === 'variable') {
                        key = identifier(value.name, null, value);
                    }
                }

                return {
                    ...prop,
                    key,
                    value: rewriteToDefinition(prop.value)
                };
            })
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
