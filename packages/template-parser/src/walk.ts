import type { Node } from 'acorn';
import type { FullAncestorWalkerCallback, RecursiveWalkerFn, WalkerCallback } from 'acorn-walk';
import { simple, fullAncestor, make } from 'acorn-walk';
import type * as Ast from './ast';

type TState = Record<string, unknown>;

type AstSimpleVisitors<N extends Node> = {
    [type: string]: AstSimpleWalkerFn<N>
};

type AstSimpleWalkerFn<N extends Node> = (
    node: N,
    state: TState
) => void;

const ignore: RecursiveWalkerFn<TState> = () => {
    // empty
};

export function walk<S extends Node, N extends Node>(node: S, visitors: AstSimpleVisitors<N>, baseVisitor = base, state?: TState): void {
    simple(node, visitors, baseVisitor, state);
}

/**
 * An fullAncestor walk is like an ancestor walk, but triggers
 * the callback on each node
 */
export function walkFullAncestor<N extends Node>(node: N, callback: FullAncestorWalkerCallback<TState>, baseVisitor = base, state?: TState): void {
    fullAncestor<TState>(node, callback, baseVisitor, state);
}

export const base = make<TState>({
    ENDProgram(node: Ast.ENDProgram, state, c) {
        walkArray(node.body, state, c);
        walkArray(node.stylesheets, state, c);
        walkArray(node.scripts, state, c);
    },
    ENDTemplate(node: Ast.ENDTemplate, state, c) {
        walkArray(node.body, state, c);
    },
    ENDPartial(node: Ast.ENDPartial, state, c) {
        walkArray(node.params, state, c);
        walkArray(node.body, state, c);
    },
    ENDElement(node: Ast.ENDElement, state, c) {
        c(node.name, state);
        walkArray(node.attributes, state, c);
        walkArray(node.directives, state, c);
        walkArray(node.body, state, c);
    },
    ENDAttribute(node: Ast.ENDAttribute, state, c) {
        c(node.name, state);
        if (node.value) {
            c(node.value, state);
        }
    },
    ENDDirective(node: Ast.ENDDirective, state, c) {
        c(node.value, state);
    },
    ENDAttributeValueExpression(node: Ast.ENDAttributeValueExpression, state, c) {
        walkArray(node.elements, state, c);
    },
    ENDVariable(node: Ast.ENDVariable, state, c) {
        c(node.value, state);
    },
    ENDIfStatement(node: Ast.ENDIfStatement, state, c) {
        c(node.test, state);
        walkArray(node.consequent, state, c);
    },
    ENDChooseStatement(node: Ast.ENDChooseStatement, state, c) {
        walkArray(node.cases, state, c);
    },
    ENDChooseCase(node: Ast.ENDChooseCase, state, c) {
        if (node.test) {
            c(node.test, state);
        }
        walkArray(node.consequent, state, c);
    },
    ENDForEachStatement(node: Ast.ENDForEachStatement, state, c) {
        c(node.select, state);
        if (node.key) {
            c(node.key, state);
        }
        walkArray(node.body, state, c);
    },
    ENDPartialStatement(node: Ast.ENDPartialStatement, state, c) {
        walkArray(node.params, state, c);
    },
    ENDVariableStatement(node: Ast.ENDVariableStatement, state, c) {
        walkArray(node.variables, state, c);
    },
    ENDAttributeStatement(node: Ast.ENDAttributeStatement, state, c) {
        walkArray(node.attributes, state, c);
        walkArray(node.directives, state, c);
    },
    ENDAddClassStatement(node: Ast.ENDAddClassStatement, state, c) {
        walkArray(node.tokens, state, c);
    },
    ENDInnerHTML(node: Ast.ENDInnerHTML, state, c) {
        c(node.value, state);
    },
    ENDGetter(node: Ast.ENDGetter, state, c) {
        walkArray(node.path, state, c);
    },
    ENDCaller(node: Ast.ENDCaller, state, c) {
        c(node.object, state);
        c(node.property, state);
        walkArray(node.arguments, state, c);
    },
    ENDFilter(node: Ast.ENDFilter, state, c) {
        c(node.object, state);
        c(node.expression, state);
    },
    ENDImport: ignore,
    ENDStylesheet: ignore,
    ENDScript: ignore,
    ENDGetterPrefix: ignore
});

function walkArray<N extends Node, T>(nodes: N[], state: T, c: WalkerCallback<T>) {
    nodes.forEach(node => c(node, state));
}
