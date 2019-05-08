import * as Ast from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import { ChunkList, Chunk, AstVisitorMap, TemplateOutput, AstVisitorContinue } from '../types';
import generateExpression from '../expression';
import CompileState from '../lib/CompileState';
import Entity, { entity } from '../entities/Entity';
import AttributeEntity, { compileAttributeValue } from '../entities/AttributeEntity';
import TextEntity from '../entities/TextEntity';
import ConditionEntity from '../entities/ConditionEntity';
import IteratorEntity from '../entities/IteratorEntity';
import InnerHTMLEntity from '../entities/InnerHTMLEntity';
import VariableEntity from '../entities/VariableEntity';
import EventEntity from '../entities/EventEntity';
import { sn, qStr, isLiteral, toObjectLiteral, getAttrValue, nameToJS, propGetter, propSetter, isExpression } from '../lib/utils';

export default {
    ENDTemplate(node: Ast.ENDTemplate, state, next) {
        state.runBlock('template', block => {
            block.exports = 'default';

            return state.runElement(node, element => {
                element.setMount(() => `${state.host}.componentView`);
                element.setContent(node.body, next);

                if (state.usedStore.size) {
                    element.add(subscribeStore(state));
                }

                if (state.usedRuntime.has('setRef') || state.usedRuntime.has('mountPartial')) {
                    // Template sets refs or contains partials which may set
                    // refs as well
                    element.add(entity('refs', state, {
                        shared: () => state.runtime('finalizeRefs', [state.host])
                    }));
                }
            });
        });
    },

    ENDElement(node: Ast.ENDElement, state, next) {
        return state.runElement(node, element => {
            if (node.ref) {
                element.setRef(node.ref);
            }

            let attrs = node.attributes;
            if (element.isComponent) {
                // In component, static attributes/props (e.g. ones which won’t change
                // in runtime) must be added during component mount. Thus, we should
                // process dynamic attributes only
                attrs = attrs.filter(attr => element.isDynamicAttribute(attr));
            }

            element.setContent(attrs, next);
            element.setContent(node.directives, next);

            const isSlot = node.name.name === 'slot';
            const firstChild = node.body[0];

            if (!element.isComponent && !isSlot && node.body.length === 1 && isLiteral(firstChild)) {
                // Edge case: element with single text child
                element.create(firstChild);
            } else {
                element.create();
                if (isSlot) {
                    // Default slot content must be generated as child block
                    // to mount it only if there’s no incoming slot content
                    const slotName = String(getAttrValue(node, 'name') || '');
                    const contentArg = defaultSlot(node, state, next);
                    element.add(state.entity('slot', {
                        mount: () => state.runtime('mountSlot', [state.host, qStr(slotName), element.getSymbol(), contentArg]),
                        unmount: slot => slot.unmount('unmountSlot')
                    }));
                } else {
                    element.setContent(node.body, next);
                }
            }

            if (element.isComponent) {
                element.markSlots();
                element.mountComponent();
            } else {
                if (element.dynamicAttributes.size || element.hasPartials) {
                    element.finalizeAttributes();
                }

                if (element.dynamicEvents.size || element.hasPartials) {
                    element.finalizeEvents();
                }
            }

            element.animate();
        });
    },

    ENDAttributeStatement(node: Ast.ENDAttributeStatement, state, next) {
        return entity('block', state)
            .setContent(node.attributes, next)
            .setContent(node.directives, next);
    },

    ENDAttribute(attr: Ast.ENDAttribute, state) {
        return new AttributeEntity(attr, state);
    },

    ENDDirective(dir: Ast.ENDDirective, state) {
        if (dir.prefix === 'on') {
            return new EventEntity(dir, state);
        }
    },

    ENDAddClassStatement(node: Ast.ENDAddClassStatement, state, next) {
        const block = entity('block', state);

        block.setMount(() => mountAddClass(node, state));
        if (state.element && state.element.node) {
            // Running inside element
            block.setUpdate(() => mountAddClass(node, state));
        }

        return block;
    },

    Literal(node: Ast.Literal, state) {
        if (node.value != null) {
            return new TextEntity(node, state);
        }
    },

    // NB `Program` is used as expression for text node
    Program(node: Ast.Program, state) {
        return new TextEntity(node, state);
    },

    ENDIfStatement(node: Ast.ENDIfStatement, state, next) {
        const ent = new ConditionEntity(node, state);
        if (node.consequent.every(isSimpleConditionContent)) {
            ent.setSimple(node.test, node.consequent, next);
        } else {
            ent.setContent([node], next);
        }
        return ent;
    },

    ENDChooseStatement(node: Ast.ENDChooseStatement, state, next) {
        return new ConditionEntity(node, state)
            .setContent(node.cases, next);
    },

    ENDForEachStatement(node: Ast.ENDForEachStatement, state, next) {
        return new IteratorEntity(node, state)
            .setContent(node.body, next);
    },

    ENDInnerHTML(node: Ast.ENDInnerHTML, state) {
        return new InnerHTMLEntity(node, state);
    },

    ENDVariableStatement(node: Ast.ENDVariableStatement, state) {
        return new VariableEntity(node, state);
    },

    ENDPartial(node: Ast.ENDPartial, state, next) {
        const name = state.runChildBlock(`partial${nameToJS(node.id, true)}`, (block, elem) => {
            elem.setContent(node.body, next);
        });

        state.partialsMap.set(node.id, {
            name,
            defaults: generateObject(node.params, state, 2)
        });
    },

    ENDPartialStatement(node: Ast.ENDPartialStatement, state) {
        const getter = `${state.host}.props['partial:${node.id}'] || ${state.partials}${propGetter(node.id)}`;

        return entity('partial', state, {
            mount: () => state.runtime('mountPartial', [state.host, state.injector, getter, generateObject(node.params, state, 1)]),
            update: ent => state.runtime('updatePartial', [ent.getSymbol(), getter, generateObject(node.params, state, 1)]),
            unmount: ent => ent.unmount('unmountPartial')
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

function isSimpleConditionContent(node: Ast.ENDStatement): boolean {
    if (node.type === 'ENDAttributeStatement') {
        return node.directives.filter(dir => dir.prefix === 'on').length === 0;
    }

    return node.type === 'ENDAddClassStatement';
}

/**
 * Generates function with default content of given slot. If slot is empty,
 * no function is generated
 */
function defaultSlot(node: Ast.ENDElement, state: CompileState, next: AstVisitorContinue<TemplateOutput>): string | null {
    const slotName = String(getAttrValue(node, 'name') || '');
    return node.body.length
        ? state.runChildBlock(`defaultSlot${nameToJS(slotName, true)}`,
            (child, slot) => slot.setContent(node.body, next))
        : null;
}

function mountAddClass(node: Ast.ENDAddClassStatement, state: CompileState): SourceNode {
    const chunks: ChunkList = node.tokens.map(token => {
        return isLiteral(token)
            ? qStr(token.value as string)
            : generateExpression(token, state);
    });
    return state.runtime('addClass', [state.injector, sn(chunks).join(' + ')]);
}

/**
 * Generates object literal from given attributes
 */
function generateObject(params: Ast.ENDAttribute[], state: CompileState, level: number = 0): SourceNode {
    const map: Map<Chunk, Chunk> = new Map();
    params.forEach(param => {
        map.set(objectKey(param.name, state), compileAttributeValue(param.value, state, 'params'));
    });

    return toObjectLiteral(map, state.indent, level);
}

function objectKey(node: Ast.Identifier | Ast.Program, state: CompileState) {
    return propSetter(isExpression(node) ? generateExpression(node, state) : node.name);
}
