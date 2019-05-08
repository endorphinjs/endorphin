import { ENDAttribute, ENDAttributeName, ENDAttributeValue, Literal, Program } from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import Entity from './Entity';
import compileExpression from '../expression';
import CompileState from '../lib/CompileState';
import { Chunk, RenderChunk } from '../types';
import { isIdentifier, isExpression, sn, qStr, isLiteral } from '../lib/utils';

export default class AttributeEntity extends Entity {
    constructor(readonly node: ENDAttribute, readonly state: CompileState) {
        super(isIdentifier(node.name) ? `${node.name.name}Attr` : 'exprAttr', state);
        const { element } = state;

        if (!element.node) {
            // Set attribute in child block
            this.setMount(mountDynamicAttribute);
        } else if (element.isComponent || element.isDynamicAttribute(node)) {
            // Attribute must be updates in runtime
            this.setShared(mountDynamicAttribute);
        } else {
            // Attribute with literal value: set only once, no need to update
            this.setMount(mountStaticAttribute);
        }
    }
}

export const mountStaticAttribute: RenderChunk = (attr: AttributeEntity) => {
    const { node, state } = attr;
    const elem = state.element.getSymbol();
    const ns = getAttributeNS(node, state);

    return ns
        ? sn([elem, `.setAttributeNS(${ns.ns}, `, attrName(node, state), ', ', attrValue(node, state), `)`], node)
        : sn([elem, `.setAttribute(`, attrName(node, state), ', ', attrValue(node, state), `)`], node);
};

export const mountDynamicAttribute: RenderChunk = (attr: AttributeEntity) => {
    const { node, state } = attr;
    const { injector } = state.element;
    const ns = getAttributeNS(node, state);

    return ns
        ? state.runtime('setAttributeNS', [injector, ns.ns, attrName(node, state), attrValue(node, state)])
        : state.runtime('setAttribute', [injector, attrName(node, state), attrValue(node, state)]);
};

function attrName(attr: ENDAttribute, state: CompileState): Chunk {
    const ns = getAttributeNS(attr, state);
    return compileAttributeName(ns ? ns.name : attr.name, state);
}

function attrValue(attr: ENDAttribute, state: CompileState): Chunk {
    const inComponent = state.element && state.element.isComponent;
    return compileAttributeValue(attr.value, state, inComponent ? 'component' : null);
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

    if (value.type === 'ENDAttributeValueExpression') {
        // List of static and dynamic tokens, must be compiled to function
        const fnName = createConcatFunction('attrValue', state, value.elements);
        return `${fnName}(${state.host}, ${state.scope})`;
    }
}

export function createConcatFunction(prefix: string, state: CompileState, tokens: Array<string | Literal | Program>): string {
    return state.runBlock(prefix, () => {
        return new Entity('concat', state)
            .setMount(() => {
                const body = new SourceNode();

                body.add('return ');
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
            });
    });
}

/**
 * Returns namespace URI for given attribute, if available
 */
export function getAttributeNS(attr: ENDAttribute, state: CompileState): { name: string, ns: string } | void {
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
