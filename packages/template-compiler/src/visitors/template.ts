import {
    ENDTemplate, ENDElement, ENDAttributeStatement, ENDAttribute, ENDDirective,
    ENDAddClassStatement, Literal, Program, ENDIfStatement, ENDChooseStatement,
    ENDForEachStatement, ENDInnerHTML, ENDVariableStatement, ENDPartial, ENDPartialStatement,
    ENDStatement, Identifier
} from '@endorphinjs/template-parser';
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
import {
    sn, qStr, isLiteral, toObjectLiteral, nameToJS, propGetter,
    propSetter, isExpression, isIdentifier
} from '../lib/utils';
import ElementEntity from '../entities/ElementEntity';

export default {
    ENDTemplate(node: ENDTemplate, state, next) {
        state.runBlock('template', block => {
            block.exports = 'default';

            return state.runElement(node, element => {
                element.setMount(() => `${state.host}.componentView`);
                element.setContent(node.body, next);

                if (state.slotSymbols.length) {
                    // Add entity to reset slot update symbols for each update
                    element.prepend(state.entity({
                        update: () => `${state.slotSymbols.map(s => `${state.scope}.${s}`).join(' = ')} = 0`
                    }));
                }

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

    ENDElement(node: ENDElement, state, next) {
        return state.runElement(node, element => {
            const isSlot = node.name.name === 'slot';

            // Edge case: element with single text child
            const singleTextContent = !element.isComponent && !isSlot && node.body.length === 1 && isLiteral(node.body[0])
                ? node.body[0] as Literal
                : null;

            // Create element instance
            element.create(singleTextContent);

            if (node.ref) {
                element.setRef(node.ref);
            }

            element.setContent(getContentAttributes(element), next);
            element.setContent(node.directives, next);

            if (isSlot) {
                element.add(mountSlot(element, state, next));
            } else if (!singleTextContent) {
                element.setContent(node.body, next);
            }

            if (element.isComponent) {
                element.markSlotUpdate();
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

    ENDAttributeStatement(node: ENDAttributeStatement, state, next) {
        return entity('block', state)
            .setContent(node.attributes, next)
            .setContent(node.directives, next);
    },

    ENDAttribute(attr: ENDAttribute, state) {
        return new AttributeEntity(attr, state);
    },

    ENDDirective(dir: ENDDirective, state) {
        if (dir.prefix === 'on') {
            return new EventEntity(dir, state);
        }
    },

    ENDAddClassStatement(node: ENDAddClassStatement, state, next) {
        return entity('block', state)
            .setShared(() => mountAddClass(node, state));
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
        return new IteratorEntity(node, state)
            .setContent(node.body, next);
    },

    ENDInnerHTML(node: ENDInnerHTML, state) {
        return new InnerHTMLEntity(node, state);
    },

    ENDVariableStatement(node: ENDVariableStatement, state) {
        return new VariableEntity(node, state);
    },

    ENDPartial(node: ENDPartial, state, next) {
        const block = state.runChildBlock(`partial${nameToJS(node.id, true)}`, (b, elem) => {
            elem.setContent(node.body, next);
        });

        state.partialsMap.set(node.id, {
            name: block.name,
            defaults: generateObject(node.params, state, 2)
        });
    },

    ENDPartialStatement(node: ENDPartialStatement, state) {
        const getter = `${state.prefix('property')}['partial:${node.id}'] || ${state.partials}${propGetter(node.id)}`;

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

function isSimpleConditionContent(node: ENDStatement): boolean {
    if (node.type === 'ENDAttributeStatement') {
        return node.directives.filter(dir => dir.prefix === 'on').length === 0;
    }

    return node.type === 'ENDAddClassStatement';
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

function mountAddClass(node: ENDAddClassStatement, state: CompileState): SourceNode {
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
function generateObject(params: ENDAttribute[], state: CompileState, level: number = 0): SourceNode {
    const map: Map<Chunk, Chunk> = new Map();
    params.forEach(param => {
        map.set(objectKey(param.name, state), compileAttributeValue(param.value, state, 'params'));
    });

    return toObjectLiteral(map, state.indent, level);
}

function objectKey(node: Identifier | Program, state: CompileState) {
    return propSetter(isExpression(node) ? generateExpression(node, state) : node.name);
}

/**
 * Returns list of attributes to be added as a content of given element entity
 */
function getContentAttributes(element: ElementEntity): ENDAttribute[] {
    const node = element.node as ENDElement;
    if (element.isComponent) {
        // In component, static attributes/props (e.g. ones which won’t change
        // in runtime) must be added during component mount. Thus, we should
        // process dynamic attributes only
        return node.attributes.filter(attr => element.isDynamicAttribute(attr));
    }

    if (node.name.name === 'slot') {
        // Do not return `name` attribute of slot: it will be added by runtime
        return node.attributes.filter(attr => !isIdentifier(attr.name) || attr.name.name !== 'name');
    }

    return node.attributes;
}
