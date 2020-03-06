import * as acornWalk from 'acorn-walk';
import * as Ast from './ast';

export type AstWalker<T> = (node: Ast.Node, state: T, c: AstWalkerContinuation<T>) => void;
export type AstWalkerContinuation<T> = (node: Ast.Node, state: T, type?: string) => void;
export type AstVisitor<T, U> = (node: Ast.Node, state: T, addon: U) => void;
export type AstVisitorCallback<T> = (node: Ast.Node, state: T, type: string) => void;
export type AstAncestorVisitorCallback<T> = (node: Ast.Node, state: T, ancestors: Ast.Node[], type: string) => void;
export type AstTestFn = (type: string) => boolean;

export interface AstVisitors<T> {
    [nodeType: string]: AstWalker<T>;
}

export interface AstVisitorMap<T, U> {
    [nodeType: string]: AstVisitor<T, U>;
}

// tslint:disable-next-line:no-empty
const ignore: AstWalker<object> = () => {};

/**
 * A simple walk is one where you simply specify callbacks to be
 * called on specific nodes. The last two arguments are optional. A
 * simple use would be
 *
 * ```js
 * walk(myTree, {
 *     Expression(node) { ... }
 * });
 * ```
 *
 * to do something with all expressions. All Parser API node types
 * can be used to identify node types, as well as Expression and
 * Statement, which denote categories of nodes.
 *
 * The base argument can be used to pass a custom (recursive)
 * walker, and state can be used to give this walked an initial
 * state.
 */
export function walk<T>(node: Ast.Node, visitors: AstVisitorMap<T, void>, baseVisitor = base, state?: T, override?: string): void {
    acornWalk.simple(node, visitors, baseVisitor, state, override);
}

/**
 * An ancestor walk keeps an array of ancestor nodes (including the
 * current node) and passes them to the callback as third parameter
 * (and also as state parameter when no other state is present).
 */
export function walkAncestor<T>(node: Ast.Node, visitors: AstVisitorMap<T, Ast.Expression[]>, baseVisitor = base, state?: T): void {
    acornWalk.ancestor(node, visitors, baseVisitor, state);
}

/**
 * A recursive walk is one where your functions override the default
 * walkers. They can modify and replace the state parameter that's
 * threaded through the walk, and can opt how and whether to walk
 * their child nodes (by calling their third argument on these
 * nodes).
 */
export function walkRecursive<T>(node: Ast.Node, state?: T, funcs?: AstVisitors<T>, baseVisitor = base, override?: string): void {
    acornWalk.recursive(node, state, funcs, baseVisitor, override);
}

/**
 *  A full walk triggers the callback on each node
 */
export function walkFull<T>(node: Ast.Node, callback: AstVisitorCallback<T>, baseVisitor = base, state?: T, override?: string): void {
    acornWalk.full(node, callback, baseVisitor, state, override);
}

/**
 * An fullAncestor walk is like an ancestor walk, but triggers
 * the callback on each node
 */
export function walkFullAncestor<T>(node: Ast.Node, callback: AstAncestorVisitorCallback<T>, baseVisitor = base, state?: T): void {
    acornWalk.fullAncestor(node, callback, baseVisitor, state);
}

/**
 * Find a node with a given start, end, and type (all are optional,
 * null can be used as wildcard). Returns a `{node, state}` object, or
 * `undefined` when it doesn't find a matching node.
 */
export function findNodeAt<T>(node: Ast.Node,
                              start?: number | null,
                              end?: number | null,
                              test?: string | AstTestFn | null,
                              baseVisitor = base, state?: T):
                              { node: Node, state: T } {
    return acornWalk.findNodeAt(node, start, end, test, baseVisitor, state);
}

/**
 * Find the innermost node of a given type that contains the given
 * position. Interface similar to `findNodeAt`.
 */
export function findNodeAround<T>(node: Ast.Node,
                                  pos: number,
                                  test: string | AstTestFn | null,
                                  baseVisitor = base,
                                  state?: T):
                                  { node: Node, state: T } {
    return acornWalk.findNodeAround(node, pos, test, baseVisitor, state);
}

/**
 * Find the outermost matching node after a given position.
 */
export function findNodeAfter<T>(node: Ast.Node,
                                 pos: number,
                                 test: string | AstTestFn | null,
                                 baseVisitor = base, state?: T): { node: Node, state: T } {
    return acornWalk.findNodeAfter(node, pos, test, baseVisitor, state);
}

/**
 * Find the outermost matching node before a given position.
 */
export function findNodeBefore<T>(node: Ast.Node,
                                  pos: number,
                                  test: string | AstTestFn | null,
                                  baseVisitor = base,
                                  state?: T):
                                  { node: Node, state: T } {
    return acornWalk.findNodeAfter(node, pos, test, baseVisitor, state);
}

export const base: AstVisitors<object> = acornWalk.make({
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
} as AstVisitors<object>);

function walkArray<T>(nodes: Ast.Node[], state: T, c: AstWalkerContinuation<T>) {
    nodes.forEach(node => c(node, state));
}
