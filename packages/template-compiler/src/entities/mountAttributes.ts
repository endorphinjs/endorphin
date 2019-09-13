import { ENDElement, ENDAttributeStatement, ENDAttribute, ENDDirective, ENDAttributeName, ENDAttributeValue } from '@endorphinjs/template-parser';
import Entity, { entity } from './Entity';
import CompileState from '../lib/CompileState';
import { isIdentifier, isLiteral, qStr, createFunction, sn } from '../lib/utils';
import { Chunk, ChunkList } from '../types';
import { getAttributeNS, NSData, compileAttributeValue } from './AttributeEntity';
import { SourceNode } from 'source-map';

type ContentAttribute = ENDAttribute | ENDDirective;

export default function mountAttributes(node: ENDElement | ENDAttributeStatement, state: CompileState, output: Entity) {
    const { receiver } = state;
    const staticAttrs: ContentAttribute[] = [];
    const dynamicAttrs: ContentAttribute[] = [];

    getContentAttributes(node).forEach(attr => {
        if (isDynamic(attr, state)) {
            dynamicAttrs.push(attr);
        } else {
            staticAttrs.push(attr);
        }
    });

    if (!receiver || receiver.isComponent) {
        // For components and partials (empty receiver), we should always
        // use pending attributes

    } else {
        // Set attributes for DOM element

    }
}

function createStaticAttribute(attr: ContentAttribute, state: CompileState): Entity {
    const { receiver } = state;
    if (isAttribute(attr)) {

        return state.entity({
            mount() {
                const ns = getAttributeNS(attr, state);
                const value = compileAttributeValue(attr.value, state);
                const dest = receiver.getSymbol();

                if (name === 'class' && !receiver.namespace()) {
                    return state.runtime('setClass', [dest, value]);
                }

                if (ns) {
                    return state.runtime('setAttributeNS', [dest, ns.ns, qStr(ns.name), value]);
                }

                return state.runtime('setAttribute', [dest, qStr(name), value]);
            }
        });
    }
}

/**
 * Mount attributes fro given DOM element
 */
function mountDOMAttributes(node: ENDElement, state: CompileState, output: Entity) {
    const { receiver } = state;
    const [staticAttrs, dynamicAttrs] = splitAttributes(getContentAttributes(node), state);
    staticAttrs.forEach(attr => {
        if (attr.type === 'ENDAttribute') {
            output.add(state.entity({
                mount() {
                    const name = attrName(attr.name);
                    const value = compileAttributeValue(attr.value, state);
                    return state.runtime('setAttribute', [receiver.getSymbol(), name, value]);
                }
            }));
        } else {
            // TODO support directives
        }
    });

    if (dynamicAttrs.length) {
        // For dynamic attributes, we should create a separate function
        // which will be used to mount and update
        const attrsSymbol = state.scopeSymbol('$a');
        const fn = generateAttrFn('setAttrs', ['elem', 'lookup'], state, () => {
            return dynamicAttrs.map(attr => {
                if (attr.type === 'ENDAttribute') {
                    const name = attrName(attr.name);
                    const value = compileAttributeValue(attr.value, state);
                    return state.runtime('setAttributeExpression', ['elem', 'lookup', name, value]);
                }
            });
        });

        output.add(state.entity({
            mount() {
                return sn([`${fn}(`, sn([receiver.getSymbol(), ``]).join(', '), ')']);
            },
            update() {
                return '';
            }
        }));
    }
}

interface GeneratedFn {
    name: string;
    usesHost: boolean;
    usesScope: boolean;
}

function generateAttrFn(name: string, args: string[], state: CompileState, factory: () => ChunkList): GeneratedFn {
    const { scopeUsage, hostUsage } = state.blockContext;
    const scopeCount = scopeUsage.mount;
    const hostCount = hostUsage.mount;
    const chunks = factory();

    const usesScope = scopeCount !== scopeUsage.mount;
    const usesHost = hostCount !== hostUsage.mount;

    const fnName = state.globalSymbol(name);
    const fn = createFunction(fnName, args.concat(argsAddon(state, usesHost, usesScope)), chunks, state.indent);
    state.pushOutput(fn);
    return { name: fnName, usesHost, usesScope };
}

function argsAddon(state: CompileState, usesHost: boolean, usesScope: boolean): string[] {
    const result: string[] = [];

    if (usesHost || usesScope) {
        result.push(state.host);
    }

    if (usesScope) {
        result.push(state.options.scope);
    }

    return result;
}

/**
 * Returns list of attributes and directives from given element that affect DOM
 * attributes
 */
function getContentAttributes(node: ENDElement | ENDAttributeStatement): ContentAttribute[] {
    const isSlot = node.type === 'ENDElement' && node.name.name === 'slot';

    const attributes = node.attributes
        .filter(attr => !isSlot || attrName(attr.name) !== 'name') as ContentAttribute[];

    const directives = node.directives
        .filter(dir => dir.prefix === 'class') as ContentAttribute[];

    return attributes.concat(directives);
}

function isDynamic(attr: ContentAttribute, state: CompileState): boolean {
    if (!state.receiver) {
        // No receiver: we’re inside partial top-level content
        return true;
    }

    return isAttribute(attr)
        ? state.receiver.isDynamicAttribute(attr)
        : !!attr.value;
}

function attrName(name: ENDAttributeName): string {
    return isIdentifier(name) ? name.name : '';
}

function isAttribute(node: ContentAttribute): node is ENDAttribute {
    return node.type === 'ENDAttribute';
}

/**
 * Splits given attribute list into static (first returned element) and dynamic
 * (second returned element)
 */
function splitAttributes(attrs: ContentAttribute[], state: CompileState): [ContentAttribute[], ContentAttribute[]] {
    const staticAttrs: ContentAttribute[] = [];
    const dynamicAttrs: ContentAttribute[] = [];

    attrs.forEach(attr => {
        if (isDynamic(attr, state)) {
            dynamicAttrs.push(attr);
        } else {
            staticAttrs.push(attr);
        }
    });

    return [staticAttrs, dynamicAttrs];
}

function createArguments(name: string, value: ENDAttributeValue, state: CompileState, pending: boolean, ns?: NSData): ChunkList {
    const { receiver } = state;
    const result: ChunkList = [pending ? pendingAttributes(state) : receiver.getSymbol()];
    if (ns) {
        result.push(ns.ns);
    }

    result.push(qStr(ns ? ns.name : name), compileAttributeValue(value, state));

    return result;
}
