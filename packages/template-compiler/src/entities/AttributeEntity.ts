import { ENDAttribute, ENDAttributeName, ENDAttributeValue, Literal, Program } from '@endorphinjs/template-parser';
import Entity from './Entity';
import compileExpression from '../expression';
import { Chunk, ChunkList, RenderChunk } from '../types';
import CompileState from '../lib/CompileState';
import { isIdentifier, isExpression, sn, qStr, isLiteral, propGetter, isInterpolatedLiteral } from '../lib/utils';

interface NSData {
    name: string;
    ns: string;
}

export default class AttributeEntity extends Entity {
    constructor(readonly node: ENDAttribute, readonly state: CompileState) {
        super(isIdentifier(node.name) ? `${node.name.name}Attr` : 'exprAttr', state);
        const { receiver } = state;

        if (isIdentifier(node.name) && receiver.stats) {
            const name = node.name.name;
            const { value } = node;
            const isDynamic = name === 'class'
                ? receiver.stats.hasDynamicClass()
                : receiver.stats.isDynamicAttribute(name);

            if (receiver.isComponent) {
                // For component, we should always use pending attributes
                const render: RenderChunk = () =>
                    sn([receiver.pendingAttributes.getSymbol(), propGetter(name), ' = ', compileAttributeValue(value, state)]);

                this.setMount(render);
                if (isDynamic || isExpression(value)) {
                    this.setUpdate(render);
                }
            } else if (isDynamic) {
                // Dynamic attributes must be collected into temp object
                // and finalized later
                this.setShared(() => {
                    const ns = getAttributeNS(node, state);
                    const args = createArguments(name, value, state, true, ns);

                    return ns
                        ? state.runtime('setPendingAttributeNS', args)
                        : state.runtime('setPendingAttribute', args);
                });
            } else if (isLiteral(value)) {
                // Static value, mount once
                this.setMount(() => {
                    const ns = getAttributeNS(node, state);
                    const args = createArguments(name, value, state, false, ns);
                    return ns
                        ? state.runtime('setAttributeNS', args)
                        : state.runtime('setAttribute', args);
                });
            } else if (isExpression(value) || isInterpolatedLiteral(value)) {
                // Expression attribute, must be updated in runtime
                const ns = getAttributeNS(node, state);
                this.setMount(() => {
                    const args = createArguments(name, value, state, false, ns);
                    return ns
                        ? state.runtime('setAttributeExpressionNS', args)
                        : state.runtime('setAttributeExpression', args);
                });
                this.setUpdate(() => {
                    const args = createArguments(name, value, state, false, ns);
                    args.push(this.getSymbol());

                    const chunk = ns
                        ? state.runtime('updateAttributeExpressionNS', args)
                        : state.runtime('updateAttributeExpression', args);

                    return sn([this.scopeName, ' = ', chunk]);
                });
            }
        }
    }
}

export function compileAttributeName(name: ENDAttributeName | string, state: CompileState): Chunk {
    if (typeof name === 'string') {
        return qStr(name);
    }

    return isExpression(name) ? compileExpression(name, state) : qStr(name.name);
}

export function compileAttributeValue(value: ENDAttributeValue, state: CompileState, context?: 'component' | 'params'): Chunk {
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
        // List of static and dynamic tokens, must be compiled to function
        let fnName: string = state.getCache(value, 'attrValue');
        if (!fnName) {
            fnName = createConcatFunction('attrValue', state, value.elements);
            state.putCache(value, 'attrValue', fnName);
        }
        return `${fnName}(${state.host}, ${state.scope})`;
    }
}

export function createConcatFunction(prefix: string, state: CompileState, tokens: Array<string | Literal | Program>): string {
    return state.runBlock(prefix, () => {
        return state.entity({
            mount() {
                const body = sn('return ');
                tokens.forEach((token, i) => {
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
                body.add(';');
                return body;
            }
        });
    }).mountSymbol;
}

/**
 * Returns namespace URI for given attribute, if available
 */
export function getAttributeNS(attr: ENDAttribute, state: CompileState): NSData | undefined {
    if (isIdentifier(attr.name)) {
        const parts = String(attr.name.name).split(':');
        if (parts.length > 1 && parts[0] !== 'xmlns') {
            // It’s a namespaced attribute, find it’s URI
            const ns = state.namespace(parts.shift());

            if (ns) {
                return { ns, name: parts.join(':') };
            }
        }
    }
}

function createArguments(name: string, value: ENDAttributeValue, state: CompileState, pending: boolean, ns?: NSData): ChunkList {
    const { receiver } = state;
    const result: ChunkList = [pending ? receiver.pendingAttributes.getSymbol() : receiver.getSymbol()];
    if (ns) {
        result.push(ns.ns);
    }

    result.push(qStr(ns ? ns.name : name), compileAttributeValue(value, state));

    return result;
}
