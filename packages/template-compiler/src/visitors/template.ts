import {
    ENDTemplate, ENDElement, ENDAttributeStatement, ENDAttribute,
    Literal, Program, ENDIfStatement, ENDChooseStatement,
    ENDForEachStatement, ENDInnerHTML, ENDVariableStatement, ENDPartial, ENDPartialStatement,
    ENDStatement, Identifier, ENDAddClassStatement
} from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import { Chunk, AstVisitorMap, TemplateOutput, AstVisitorContinue } from '../types';
import generateExpression from '../expression';
import Entity, { entity } from '../entities/Entity';
import TextEntity from '../entities/TextEntity';
import ConditionEntity from '../entities/ConditionEntity';
import IteratorEntity from '../entities/IteratorEntity';
import InnerHTMLEntity from '../entities/InnerHTMLEntity';
import VariableEntity from '../entities/VariableEntity';
import ElementEntity from '../entities/ElementEntity';
import CompileState from '../lib/CompileState';
import { compileAttributeValue, pendingAttributes, mountAddClass, mountPartialOverride } from '../lib/attributes';
import mountEvent from '../lib/events';
import refStats from '../lib/RefStats';
import { hasAnimationOut, animateOut, animateIn } from '../lib/animations';
import { qStr, isLiteral, toObjectLiteral, nameToJS, isExpression, sn, propGetter, isEvent } from '../lib/utils';

const partialAttrsReceiver = ':a';
const partialEventReceiver = ':e';

export default {
    ENDTemplate(node: ENDTemplate, state, next) {
        state.runBlock('template', block => {
            block.exports = 'default';
            return state.runElement(node, element => {
                element.setMount(() => `${state.host}.componentView`);

                const refs = state.refStats = refStats(node);
                if (refs.hasDynamicRefs()) {
                    state.pendingRefs = state.entity('refs', {
                        mount: () => state.runtime('obj', [])
                    });
                    element.add(state.pendingRefs);
                }

                element.setContent(node.body, next);

                if (state.slotSymbols.length) {
                    // Add entity to reset slot update symbols for each update
                    const enter = 'enterSlots()';
                    const exit = 'exitSlots()';
                    element.prepend(state.entity({
                        // NB: it’s possible that the same component can be invoked recursively,
                        // so we have to maintain proper slots stacks for nested calls
                        shared: () => enter,
                        unmount: () => enter,
                    }));
                    element.add(state.entity({
                        shared: () => exit,
                        unmount: () => exit,
                    }));
                }

                if (state.usedStore.size) {
                    element.add(subscribeStore(state));
                }

                if (refs.hasDynamicRefs()) {
                    // Template sets refs or contains partials which may set
                    // refs as well
                    element.add(entity('refs', state, {
                        shared: () => state.runtime('finalizePendingRefs', [state.host, state.pendingRefs.getSymbol()])
                    }));
                }
            });
        });
    },

    ENDElement(node: ENDElement, state, next) {
        if (hasAnimationOut(node, state)) {
            let animatedElem: ElementEntity;
            let slotName: string | null = null;
            const block = state.runChildBlock(`animated${nameToJS(node.name.name, true)}`, (b, elem) => {
                b.unlinked = true;
                elem.add(state.runElement(node, element => {
                    slotName = state.slot;
                    animatedElem = handleElement(element, state, next);

                    if (animatedElem.code.unmount) {
                        // NB: block generator will create local variable reference
                        // to element so it can be properly unmounted
                        animatedElem.add(state.entity({
                            unmount: () => state.runtime('domRemove', [animatedElem.getSymbol()])
                        }));
                    } else {
                        animatedElem.setUnmount(() => animatedElem.unmount('domRemove'));
                    }
                }));
            });

            return animateOut(animatedElem, block, slotName, state);
        }

        return state.runElement(node, element => {
            handleElement(element, state, next);
            if (element.animateIn) {
                animateIn(element, state);
            }
        });
    },

    ENDAttributeStatement(node: ENDAttributeStatement, state) {
        // No receiver means we are running inside partial
        const { receiver } = state;
        const result = state.entity();

        let _attrReceiver: Entity | null = null;
        let _eventReceiver: Entity | null = null;

        const attributeReceiver = () => {
            if (!_attrReceiver) {
                _attrReceiver = receiver
                    ? receiver.pendingAttributes
                    : new PartialReceiver(partialAttrsReceiver, state);
            }

            return _attrReceiver;
        };

        const eventReceiver = () => {
            if (!_eventReceiver) {
                _eventReceiver = receiver
                    ? receiver.pendingEvents
                    : new PartialReceiver(partialEventReceiver, state);
            }

            return _eventReceiver;
        };

        if (node.attributes.length) {
            result.add(pendingAttributes(node, attributeReceiver(), state));
        }

        node.directives.forEach(dir => {
            if (isEvent(dir)) {
                result.add(mountEvent(dir, eventReceiver(), state));
            } else if (dir.prefix === 'partial' && receiver && receiver.isComponent) {
                result.add(mountPartialOverride(dir, attributeReceiver(), state));
            }
        });

        return result;
    },

    ENDAddClassStatement(node: ENDAddClassStatement, state) {
        const { receiver }  = state;
        // No receiver means we are running inside partial
        const attrReceiver = receiver
            ? receiver.pendingAttributes
            : new PartialReceiver(partialAttrsReceiver, state);
        return mountAddClass(node, attrReceiver, state);
    },

    Literal(node: Literal, state) {
        if (node.value != null) {
            return new TextEntity(node, state);
        }
    },

    // NB `Program` is used as expression for text node
    Program(node: Program, state) {
        return new TextEntity(node, state);
    },

    ENDIfStatement(node: ENDIfStatement, state, next) {
        const ent = new ConditionEntity(node, state);
        if (node.consequent.every(isSimpleConditionContent)) {
            ent.setSimple(node.test, node.consequent, next);
        } else {
            ent.setContent([node], next);
        }
        return ent;
    },

    ENDChooseStatement(node: ENDChooseStatement, state, next) {
        return new ConditionEntity(node, state)
            .setContent(node.cases, next);
    },

    ENDForEachStatement(node: ENDForEachStatement, state, next) {
        // Mark iterator vars as scope-bound
        const vars = [node.indexName, node.keyName, node.valueName];
        state.markScoped(...vars);
        const ent = new IteratorEntity(node, state).setContent(node.body, next);
        state.unmarkScoped(...vars);
        return ent;
    },

    ENDInnerHTML(node: ENDInnerHTML, state) {
        return new InnerHTMLEntity(node, state);
    },

    ENDVariableStatement(node: ENDVariableStatement, state) {
        if (node.variables.length) {
            return new VariableEntity(node, state);
        }
    },

    ENDPartial(node: ENDPartial, state, next) {
        const localVars = node.params.map(p => (p.name as Identifier).name);
        state.markScoped(...localVars);
        const block = state.runChildBlock(`partial${nameToJS(node.id, true)}`, (b, elem) => {
            elem.setContent(node.body, next);
        });

        state.partialsMap.set(node.id, {
            name: block.name,
            defaults: generateObject(node.params, state, 2)
        });
        state.unmarkScoped(...localVars);
    },

    ENDPartialStatement(node: ENDPartialStatement, state) {
        const getter = state.runtime('getPartial', [state.host, qStr(node.id), state.partials]);
        const { receiver } = state;

        const attrReceiver = receiver
            ? receiver.pendingAttributes
            : new PartialReceiver(partialAttrsReceiver, state);

        const eventReceiver = receiver
            ? receiver.pendingEvents
            : new PartialReceiver(partialEventReceiver, state);

        return state.entity('partial', {
            mount: () => {
                const params = attributeMap(node.params, state);
                params.set(partialAttrsReceiver, attrReceiver.getSymbol());
                params.set(partialEventReceiver, eventReceiver.getSymbol());

                return state.runtime('mountPartial', [
                    state.host,
                    state.injector,
                    getter,
                    toObjectLiteral(params, state.indent, 1)
                ]);
            },
            update: ent => {
                const params = attributeMap(node.params, state);
                params.set(partialAttrsReceiver, attrReceiver.getSymbol());
                params.set(partialEventReceiver, eventReceiver.getSymbol());
                return state.runtime('updatePartial', [ent.getSymbol(), getter, toObjectLiteral(params, state.indent, 1)]);
            },
            unmount: ent => ent.unmount(state.isTopLevel() ? 'clearPartial' : 'unmountPartial')
        });
    }
} as AstVisitorMap<TemplateOutput>;

/**
 * Returns code for subscribing to store updates
 */
function subscribeStore(state: CompileState): Entity {
    // Without partials, we can safely assume that we know about
    // all used store keys
    const storeKeysArg = !state.hasPartials
        ? `[${Array.from(state.usedStore).map(qStr).join(', ')}]`
        : '';

    return state.entity({
        mount: () => state.runtime('subscribeStore', [state.host, storeKeysArg])
    });
}

function isSimpleConditionContent(node: ENDStatement): boolean {
    return node.type === 'ENDAddClassStatement' || node.type === 'ENDAttributeStatement';
}

/**
 * Generates entity with default slot content
 */
function mountSlot(elem: ElementEntity, state: CompileState, next: AstVisitorContinue<TemplateOutput>): Entity {
    const node = elem.node as ENDElement;

    // Generates function with default content of given slot
    const contentArg = node.body.length
        ? state.runChildBlock(`defaultSlot${nameToJS(state.slot, true)}`,
            (child, ent) => ent.setContent(node.body, next))
        : null;

    return state.entity('slot', {
        mount: () => state.runtime('mountSlot', [state.host, qStr(state.slot), contentArg && contentArg.mountSymbol]),
        update: ent => contentArg ? state.runtime('updateDefaultSlot', [ent.getSymbol()]) : null,
        unmount: ent => ent.unmount('unmountSlot'),
    });
}

/**
 * Generates object literal from given attributes
 */
function generateObject(params: ENDAttribute[], state: CompileState, level = 0): SourceNode {
    return toObjectLiteral(attributeMap(params, state), state.indent, level);
}

function attributeMap(params: ENDAttribute[], state: CompileState): Map<Chunk, Chunk> {
    const map: Map<Chunk, Chunk> = new Map();
    params.forEach(param => {
        map.set(objectKey(param.name, state), compileAttributeValue(param.value, state, 'params'));
    });
    return map;
}

function objectKey(node: Identifier | Program, state: CompileState) {
    return isExpression(node) ? generateExpression(node, state) : node.name;
}

function handleElement(element: ElementEntity, state: CompileState, next: AstVisitorContinue<TemplateOutput>): ElementEntity {
    const node = element.node as ENDElement;
    const isSlot = node.name.name === 'slot';

    // Edge case: element with single text child
    const singleTextContent = !element.isComponent && !isSlot && node.body.length === 1 && isLiteral(node.body[0])
        ? node.body[0] as Literal
        : null;

    // Create element instance
    // TODO refactor, no need to pass argument, should detect single text content
    // right in `create()` method
    element.create(singleTextContent);

    if (node.ref) {
        element.setRef(node.ref);
    }

    element.mountAttributes();
    element.mountDirectives();

    if (isSlot) {
        element.add(mountSlot(element, state, next));
    } else if (!singleTextContent) {
        element.setContent(node.body, next);
    }

    element.finalizeEvents();

    if (element.isComponent) {
        element.markSlotUpdate();
        element.mountComponent();
    } else {
        element.finalizeAttributes();
    }

    return element;
}

class PartialReceiver extends Entity {
    getSymbol() {
        return sn([this.state.scope, propGetter(this.rawName)]);
    }
}
