import {
    Node, ENDStatement, ENDElement, Identifier, Literal, ENDTemplate, ENDPartial,
    ENDIfStatement, BlockStatement, IfStatement
} from '@endorphinjs/template-parser';
import SSRState from './SSRState';
import { isLiteral, qStr } from '../lib/utils';

export type VisitorNode = ENDStatement | ENDTemplate | ENDPartial;
export type VisitorContinue = (node: VisitorNode) => void;
export type Visitor<N extends Node> = (node: N, state: SSRState, next: VisitorContinue) => void;

export interface VisitorMap {
    [name: string]: Visitor<VisitorNode>;
}

export const visitors: VisitorMap = {
    ENDTemplate(node: ENDTemplate, state, next) {
        state.enter('render', () => node.body.forEach(next));
    },
    ENDElement(node: ENDElement, state, next) {
        const elemName = node.name.name;
        state.out(`<${elemName}`);
        // TODO collect class attribute and class directive into single payload
        node.attributes.forEach(attr => {
            const attrName = (attr.name as Identifier).name;
            if (isLiteral(attr.value)) {
                state.out(` ${attrName}=${qStr(String(attr.value.value))}`);
            } else {
                // TODO handle attribute expressions
            }
        });

        if (!node.body.length && state.options.empty.includes(elemName)) {
            state.out(' />');
        } else {
            state.out('>');
            node.body.forEach(next);
            state.out(`</${elemName}>`);
        }
    },
    Literal(node: Literal, state) {
        state.out(escape(String(node.value)));
    },
    ENDIfStatement(node: ENDIfStatement, state, next) {
        const block: BlockStatement = {
            type: 'BlockStatement',
            body: []
        };
        const statement: IfStatement
    }
};

const escapeMap = {
    '<': '&lt;',
    '>': '&gt',
    '&': '&amp;'
};

function escape(str: string): string {
    return str.replace(/[<>&]/g, s => escapeMap[s] || s);
}
