import { ENDElement, Identifier, ENDAttribute, ENDAttributeValue, ENDAttributeStatement } from '@endorphinjs/template-parser';
import CompileState from './CompileState';
import { isLiteral, nameToJS, sn, qStr, propGetter } from './utils';
import ElementEntity from '../entities/ElementEntity';
import { compileAttributeValue } from '../entities/AttributeEntity';
import { ChunkList, Chunk } from '../types';
import { AttributeStats } from './attributeStats';
import Entity from '../entities/Entity';
import BlockContext from './BlockContext';

interface AttributeLookup {
    [name: string]: ENDAttributeValue;
}

/**
 * Generates code for mounting own element’s attributes
 */
export function ownAttributes(elem: ElementEntity, stats: AttributeStats, state: CompileState) {
    const node = elem.node as ENDElement;
    const staticAttrs: ENDAttribute[] = [];
    const expressionAttrs: ENDAttribute[] = [];
    const pendingAttrs: AttributeLookup = {};

    node.attributes.forEach(attr => {
        const name = (attr.name as Identifier).name;
        if (stats.attributes.has(name)) {
            pendingAttrs[name] = attr.value;
        } else {
            if (isLiteral(attr.value)) {
                staticAttrs.push(attr);
            } else {
                expressionAttrs.push(attr);
            }
        }
    });

    if (staticAttrs.length) {
        mountStaticAttributes(elem, staticAttrs, state);
    }

    if (expressionAttrs.length) {
        mountExpressionAttributes(elem, expressionAttrs, state);
    }

    if (stats.attributes.size) {
        return preparePendingAttributes(elem, stats, pendingAttrs, state);
    }
}

/**
 * Mounts pending attributes from `<e:attr>` statement and returns entity for invoking it
 */
export function pendingAttributes(node: ENDAttributeStatement, attrs: Entity, state: CompileState): Entity {
    const blockName = nameToJS(`setPendingAttrs`);
    const accum = 'pending';
    const b = state.runBlock(blockName, block => {
        block.mountArgs.push(accum);
        const entities: Entity[] = [];

        node.attributes.forEach(attr => {
            const ident = `${accum}${propGetter((attr.name as Identifier).name)}`;
            const value = compileAttributeValue(attr.value, state);
            entities.push(entity(state, sn([`${ident} = `, value])));
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

/**
 * Mounts given attributes as static: their values are not changed in runtime
 */
function mountStaticAttributes(elem: ElementEntity, attrs: ENDAttribute[], state: CompileState) {
    state.mount(() => {
        attrs.forEach(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);
            elem.add(entity(state, state.runtime('setAttribute', [elem.getSymbol(), qStr(name), value])));
        });
    });
}

/**
 * Mount given attributes as expressions: their attributes may change in runtime
 */
function mountExpressionAttributes(elem: ElementEntity, attrs: ENDAttribute[], state: CompileState) {
    const blockName = nameToJS(`${elem.rawName}Attrs`);
    const b = state.runBlock(blockName, block => {
        block.mountArgs.push('elem', 'prev');
        return attrs.map(attr => {
            const name = (attr.name as Identifier).name;
            const value = compileAttributeValue(attr.value, state);
            return entity(state, state.runtime('updateAttribute', ['elem', 'prev', qStr(name), value]));
        });
    });

    // Create object to accumulate actual attribute values
    const attrSet = createObj('attrSet', state);
    elem.add(attrSet);

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
function preparePendingAttributes(elem: ElementEntity, stats: AttributeStats,
                                  attributes: AttributeLookup, state: CompileState) {
    const cur = createObj('curPending', state);
    const prev = createObj('prevPending', state);
    elem.add(cur);
    elem.add(prev);

    const blockName = nameToJS(`${elem.name}PreparePending`);
    const b = state.runBlock(blockName, block => {
        block.mountArgs.push('pending');
        const toNull: string[] = [];
        const entities: Entity[] = [];

        stats.attributes.forEach(attrName => {
            const ident = `pending${propGetter(attrName)}`;
            if (attributes[attrName] == null) {
                toNull.push(ident);
            } else {
                const value = compileAttributeValue(attributes[attrName], state);
                entities.push(entity(state, sn([`${ident} = `, value])));
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
    // obj.code.mount = mount;
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
