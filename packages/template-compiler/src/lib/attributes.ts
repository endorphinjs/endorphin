import { ENDElement, Identifier, ENDAttribute, ENDAttributeValue, ENDAttributeStatement } from '@endorphinjs/template-parser';
import CompileState from './CompileState';
import { isLiteral, nameToJS, sn, qStr, propGetter, isExpression, isInterpolatedLiteral } from './utils';
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
    expression?: Entity;
    /** Entity that contains current pending attributes */
    pendingCur?: Entity;
    /** Entity that contains previous pending attributes */
    pendingPrev?: Entity;

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

    node.attributes.forEach(attr => {
        const name = (attr.name as Identifier).name;
        if (stats.pendingAttributes.has(name)) {
            pendingAttrs[name] = attr.value;
        } else {
            if (!attr.value || isLiteral(attr.value)) {
                staticAttrs.push(attr);
            } else {
                expressionAttrs.push(attr);
            }
        }
    });

    const result: AttributesState = {
        hasExpressionAttrs: expressionAttrs.length > 0,
        hasStaticAttrs: staticAttrs.length > 0,
        hasPendingAttrs: stats.pendingAttributes.size > 0
    };

    // Create object to accumulate actual attribute values
    let attrSet: Entity | null = null;
    if (expressionAttrs.length || (elem.isComponent && staticAttrs.length)) {
        result.expression = attrSet = createObj('attrSet', state);
        elem.add(attrSet);
    }

    if (staticAttrs.length) {
        if (elem.isComponent) {
            mountStaticProps(elem, attrSet, staticAttrs, state);
        } else {
            mountStaticAttributes(elem, staticAttrs, state);
        }
    }

    if (expressionAttrs.length) {
        mountExpressionAttributes(elem, attrSet, expressionAttrs, state);
    }

    if (stats.pendingAttributes.size) {
        const { cur, prev } =  preparePendingAttributes(elem, stats, pendingAttrs, state);
        result.pendingCur = cur;
        result.pendingPrev = prev;
    }

    return result;
}

/**
 * Mounts pending attributes from `<e:attr>` statement and returns entity for invoking it
 */
export function pendingAttributes(node: ENDAttributeStatement, attrs: Entity, state: CompileState): Entity {
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
            const chunk: Chunk = ns
                ? state.runtime('setPendingAttributeNS', [accum, ns.ns, qStr(ns.name), value])
                : sn([`${accum + propGetter(name)} = `, value]);

            entities.push(entity(state, chunk));
        });

        node.directives.forEach(dir => {
            if (dir.prefix === 'class') {
                const value = compileAttributeValue(dir.value, state, 'component');
                entities.push(entity(state, state.runtime('addPendingClassIf', [accum, qStr(dir.name), value])));
            }
        });
        return entities;
    });

    return state.entity({
        shared: () => {
            const args = addHostScope([attrs.getSymbol()], b, state);
            return createFnCall(b.name, args);
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
function mountStaticProps(elem: ElementEntity, attrSet: Entity, attrs: ENDAttribute[], state: CompileState) {
    state.mount(() => {
        attrs.forEach(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);
            elem.add(
                entity(state, sn([attrSet.getSymbol(), propGetter(name), ' = ', value]))
            );
        });
    });
}

/**
 * Mount given attributes as expressions: their attributes may change in runtime
 */
function mountExpressionAttributes(elem: ElementEntity, attrSet: Entity, attrs: ENDAttribute[], state: CompileState) {
    const blockName = nameToJS(`${elem.rawName}Attrs`);
    const b = state.runBlock(blockName, block => {
        block.mountArgs.push('elem', 'prev');
        return attrs.map(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);
            const ns = !elem.isComponent ? getAttributeNS(name, state) : null;
            return ns
                ? entity(state, state.runtime('updateAttributeNS', ['elem', 'prev', ns.ns, qStr(ns.name), value]))
                : entity(state, state.runtime('updateAttribute', ['elem', 'prev', qStr(name), value]));
        });
    });

    // Create entity which will invoke generated block
    elem.add(state.entity({
        shared() {
            const args = addHostScope([elem.getSymbol(), attrSet.getSymbol()], b, state);
            return createFnCall(b.name, args);
        }
    }));
}

/**
 * Generates code that prepares pending props
 */
function preparePendingAttributes(elem: ElementEntity, stats: ElementStats, attributes: AttributeLookup, state: CompileState) {
    const cur = createObj('curPending', state);
    const prev = createObj('prevPending', state);
    elem.add(cur);
    elem.add(prev);

    const blockName = nameToJS(`${elem.name}PreparePending`);
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
            const args = addHostScope([cur.getSymbol()], b, state);
            return createFnCall(blockName, args);
        }
    });
    elem.add(ent);

    return { cur, prev };
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
