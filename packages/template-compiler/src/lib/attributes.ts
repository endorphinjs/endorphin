import {
    ENDElement, Identifier, ENDAttribute, ENDAttributeValue, ENDAttributeStatement,
    ENDAddClassStatement, ENDDirective
} from '@endorphinjs/template-parser';
import CompileState from './CompileState';
import { isLiteral, nameToJS, sn, qStr, propGetter, isExpression, isInterpolatedLiteral, propSetter } from './utils';
import ElementEntity from '../entities/ElementEntity';
import { ChunkList, Chunk } from '../types';
import { ElementStats } from './attributeStats';
import Entity from '../entities/Entity';
import BlockContext from './BlockContext';
import compileExpression from '../expression';

interface AttributeLookup {
    [name: string]: ENDAttributeValue;
}

interface NSData {
    name: string;
    ns: string;
}

export interface AttributesState {
    /** Entity that accumulates expression attributes or props */
    receiver?: Entity;

    /** Entity that accumulates pending events */
    eventsReceiver?: Entity;

    /** Entity that contains previous pending attributes */
    prevReceiver?: Entity;

    hasStaticAttrs: boolean;
    hasExpressionAttrs: boolean;
    hasPendingAttrs: boolean;
}

type AttributeType = 'component' | 'params' | void;

/**
 * Generates code for mounting own element’s attributes
 */
export function ownAttributes(elem: ElementEntity, stats: ElementStats, state: CompileState): AttributesState {
    const node = elem.node as ENDElement;
    const staticAttrs: ENDAttribute[] = [];
    const expressionAttrs: ENDAttribute[] = [];
    const pendingAttrs: AttributeLookup = {};
    const isSlot = node.name.name === 'slot';

    node.attributes.forEach(attr => {
        const name = (attr.name as Identifier).name;
        if (stats.pendingAttributes.has(name)) {
            pendingAttrs[name] = attr.value;
        } else if (!isSlot || name !== 'name') {
            // Do not add name attribute for slot, it will be added automatically by `mountSlot()`
            if (!attr.value || isLiteral(attr.value)) {
                staticAttrs.push(attr);
            } else {
                expressionAttrs.push(attr);
            }
        }
    });

    const result: AttributesState = {
        hasStaticAttrs: staticAttrs.length > 0,
        hasExpressionAttrs: expressionAttrs.length > 0,
        hasPendingAttrs: stats.pendingAttributes.size > 0
    };

    if (stats.partials || stats.pendingEvents.size) {
        result.eventsReceiver = state.entity('eventSet', {
            mount: () => state.runtime('pendingEvents', [state.host, elem.getSymbol()]),
            unmount: (ent: Entity) => ent.unmount('detachPendingEvents')
        });
        elem.add(result.eventsReceiver);
    }

    if (elem.isComponent) {
        // Mount attributes as props
        if (result.hasStaticAttrs || result.hasExpressionAttrs || result.hasPendingAttrs) {
            result.receiver = mountStaticProps(elem, staticAttrs, state);
            elem.add(result.receiver);
        }

        if (result.hasExpressionAttrs) {
            mountExpressionAttributes(elem, result.receiver, expressionAttrs, state);
        }

        if (result.hasPendingAttrs) {
            preparePendingAttributes(elem, result.receiver, stats, pendingAttrs, state);
        }
    } else {
        // NB keep object init closer to `receiver` for better minification
        if (result.hasExpressionAttrs || result.hasPendingAttrs || stats.partials) {
            // Create object to accumulate actual attribute values
            elem.add(result.receiver = createObj('attrSet', state));
        }

        if (result.hasPendingAttrs || stats.partials) {
            result.prevReceiver = createObj('prevPending', state);
            elem.add(result.prevReceiver);
        }

        if (result.hasStaticAttrs) {
            mountStaticAttributes(elem, staticAttrs, state);
        }

        if (result.hasExpressionAttrs) {
            mountExpressionAttributes(elem, result.receiver, expressionAttrs, state);
        }

        if (result.hasPendingAttrs) {
            preparePendingAttributes(elem, result.receiver, stats, pendingAttrs, state);
        }
    }

    return result;
}

/**
 * Mounts pending attributes from `<e:attr>` statement and returns entity for invoking it
 */
export function pendingAttributes(node: ENDAttributeStatement, attrsReceiver: Entity, state: CompileState): Entity {
    const { receiver } = state;
    const blockName = nameToJS(receiver ? `${receiver.rawName}PendingAttrs` : `setPendingAttrs`);
    const accum = 'pending';
    const isComponent = receiver && receiver.isComponent;
    const b = state.runBlock(blockName, block => {
        block.mountArgs.push(accum);
        const entities: Entity[] = [];

        node.attributes.forEach(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);
            const ns = !isComponent ? getAttributeNS(name, state) : null;
            let chunk: Chunk;
            if (!state.receiver) {
                // We are inside partial, we should update pending attributes
                // instead of overwriting
                chunk = ns
                    ? state.runtime('updatePendingAttributeNS', [accum, ns.ns, qStr(ns.name), value])
                    : state.runtime('updatePendingAttribute', [accum, qStr(name), value]);
            } else {
                chunk = ns
                    ? state.runtime('setPendingAttributeNS', [accum, ns.ns, qStr(ns.name), value])
                    : sn([`${accum + propGetter(name)} = `, value]);
            }

            entities.push(entity(state, chunk));
        });

        node.directives.forEach(dir => {
            if (dir.prefix === 'class') {
                if (dir.value != null) {
                    const value = compileAttributeValue(dir.value, state, 'component');
                    entities.push(entity(state, state.runtime('addPendingClassIf', [accum, qStr(dir.name), value])));
                } else {
                    entities.push(entity(state, state.runtime('addPendingClass', [accum, qStr(dir.name)])));
                }
            }
        });
        return entities;
    });

    return state.entity({
        shared: () => {
            const args = addHostScope([attrsReceiver.getSymbol()], b, state);
            return createFnCall(b.name, args);
        }
    });
}

export function mountAddClass(node: ENDAddClassStatement, receiver: Entity, state: CompileState): Entity {
    const accum = 'pending';
    const b = state.runBlock('addPendingClass', block => {
        block.mountArgs.push(accum);
        const chunks: ChunkList = node.tokens.map(token => {
            return isLiteral(token)
                ? qStr(token.value as string)
                : compileAttributeValue(token, state);
        });

        return state.entity({
            mount: () => state.runtime('addPendingClass', [accum, sn(chunks).join(' + ')])
        });
    });

    return state.entity({
        shared: () => createFnCall(b.name, addHostScope([receiver.getSymbol()], b, state))
    });
}

/**
 * Mounts prop for overriding component partial
 */
export function mountPartialOverride(node: ENDDirective, receiver: Entity, state: CompileState): Entity {
    return state.entity({
        mount: () => {
            const value = compileAttributeValue(node.value, state, 'component');
            return sn([
                receiver.getSymbol(),
                propGetter(`${node.prefix}:${node.name}`),
                ' = ',
                state.runtime('assign', [`{ ${state.host} }`, sn([`${state.partials}[`, value, ']'])])
            ]);
        }
    });
}

export function compileAttributeValue(value: ENDAttributeValue, state: CompileState, context?: AttributeType): Chunk {
    if (value === null) {
        // Attribute without value, decide how to output
        if (context === 'component') {
            return 'true';
        }

        if (context === 'params') {
            return 'null';
        }

        return qStr('');
    }

    if (isLiteral(value)) {
        // Static string attribute
        if (context && typeof value.value !== 'string') {
            return String(value.value);
        }

        return qStr(String(value.value != null ? value.value : ''));
    }

    if (isExpression(value)) {
        // Dynamic expression, must be compiled to function
        return compileExpression(value, state);
    }

    if (isInterpolatedLiteral(value)) {
        // List of static and dynamic tokens, create concatenated expression
        const body = sn('');
        value.elements.forEach((token, i) => {
            if (i !== 0) {
                body.add(' + ');
            }

            if (typeof token === 'string') {
                body.add(qStr(token));
            } else if (isLiteral(token)) {
                body.add(qStr(token.value as string));
            } else {
                body.add(['(', compileExpression(token, state), ')']);
            }
        });
        return body;
    }
}

/**
 * Mounts given attributes as static: their values are not changed in runtime
 */
function mountStaticAttributes(elem: ElementEntity, attrs: ENDAttribute[], state: CompileState) {
    state.mount(() => {
        const { receiver } = state;
        attrs.forEach(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);
            const ns = getAttributeNS(name, state);
            if (name === 'class' && !receiver.namespace()) {
                elem.add(
                    entity(state, state.runtime('setClass', [elem.getSymbol(), value]))
                );
            } else if (ns) {
                elem.add(
                    entity(state, state.runtime('setAttributeNS', [elem.getSymbol(), ns.ns, qStr(ns.name), value]))
                );
            } else {
                elem.add(
                    entity(state, state.runtime('setAttribute', [elem.getSymbol(), qStr(name), value]))
                );
            }
        });
    });
}

/**
 * Mounts given attributes as static props: their values are not changed in runtime
 */
function mountStaticProps(elem: ElementEntity, attrs: ENDAttribute[], state: CompileState) {
    return state.entity('propSet', {
        mount: () => {
            const args: ChunkList = [elem.getSymbol()];
            if (attrs.length) {
                const initial = sn('{');
                attrs.forEach((attr, i) => {
                    const name = (attr.name as Identifier).name;
                    const value = compileAttributeValue(attr.value, state, 'component');
                    if (i > 0) {
                        initial.add(', ');
                    }
                    initial.add([propSetter(name), ': ', value]);
                });
                initial.add('}');
                args.push(initial);
            }
            return state.runtime('propsSet', args);
        }
    });
}

/**
 * Mount given attributes as expressions: their attributes may change in runtime
 */
function mountExpressionAttributes(elem: ElementEntity, receiver: Entity, attrs: ENDAttribute[], state: CompileState) {
    const blockName = nameToJS(`${elem.rawName}Attrs`);
    const b = state.runBlock(blockName, block => {
        block.mountArgs.push('elem', 'prev');
        return attrs.map(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);

            if (elem.isComponent) {
                // For components, we should only update pending attributes and
                // let `mountComponent()`/`updateComponent()` do the rest
                return entity(state, sn([`prev${propGetter(name)} = `, value]));
            }

            const ns = getAttributeNS(name, state);
            if (name === 'class') {
                return entity(state, state.runtime('updateClass', ['elem', 'prev', value]));
            }

            return ns
                ? entity(state, state.runtime('updateAttributeNS', ['elem', 'prev', ns.ns, qStr(ns.name), value]))
                : entity(state, state.runtime('updateAttribute', ['elem', 'prev', qStr(name), value]));
        });
    });

    // Create entity which will invoke generated block
    elem.add(state.entity({
        shared() {
            const args = addHostScope([elem.getSymbol(), receiver.getSymbol()], b, state);
            return createFnCall(b.name, args);
        }
    }));
}

/**
 * Generates code that prepares pending props
 */
function preparePendingAttributes(elem: ElementEntity, receiver: Entity, stats: ElementStats, attributes: AttributeLookup, state: CompileState) {
    const blockName = nameToJS(`${elem.rawName}PreparePending`);
    const b = state.runBlock(blockName, block => {
        const accum = 'pending';
        block.mountArgs.push(accum);
        const toNull: string[] = [];
        const entities: Entity[] = [];

        stats.pendingAttributes.forEach(attrName => {
            const ns = getAttributeNS(attrName, state);
            if (ns) {
                const value = attributes[attrName]
                    ? compileAttributeValue(attributes[attrName], state)
                    : 'null';
                const code = state.runtime('setPendingAttributeNS', [accum, ns.ns, qStr(ns.name), value]);
                entities.push(entity(state, code));
            } else {
                const ident = accum + propGetter(attrName);
                if (attributes[attrName] == null) {
                    toNull.push(ident);
                } else {
                    const value = compileAttributeValue(attributes[attrName], state);
                    entities.push(entity(state, sn([`${ident} = `, value])));
                }
            }
        });

        if (toNull.length) {
            entities.push(entity(state, sn([toNull.join(' = '), ' = null'])));
        }

        return entities;
    });

    const ent = state.entity({
        shared: () => {
            const args = addHostScope([receiver.getSymbol()], b, state);
            return createFnCall(b.name, args);
        }
    });
    elem.add(ent);
}

function createObj(name: string, state: CompileState) {
    return entity(state, name, state.runtime('obj', []));
}

function entity(state: CompileState, mount: Chunk): Entity;
function entity(state: CompileState, name: string, mount: Chunk): Entity;
function entity(state: CompileState, name: Chunk, mount?: Chunk): Entity {
    if (mount == null) {
        mount = name;
        name = undefined;
    }

    const obj = state.entity(name as string | undefined);
    obj.setMount(() => mount);
    return obj;
}

function addHostScope(args: ChunkList, block: BlockContext, state: CompileState): ChunkList {
    if (block.hostUsage.mount || block.scopeUsage.mount) {
        args.push(state.host);
    }
    if (block.scopeUsage.mount) {
        args.push(state.scope);
    }

    return args;
}

function createFnCall(name: string, args: ChunkList) {
    return sn([`${name}(`, sn(args).join(', '), ')']);
}

/**
 * Returns namespace URI for given attribute, if available
 */
function getAttributeNS(attr: ENDAttribute | string, state: CompileState): NSData | undefined {
    const attrName = typeof attr === 'string'
        ? attr
        : (attr.name as Identifier).name;

    const parts = attrName.split(':');
    if (parts.length > 1 && parts[0] !== 'xmlns') {
        // It’s a namespaced attribute, find it’s URI
        const ns = state.namespace(parts.shift());

        if (ns) {
            return { ns, name: parts.join(':') };
        }
    }
}
