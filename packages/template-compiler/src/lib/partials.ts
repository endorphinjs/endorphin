import { SourceNode } from 'source-map';
import { ENDProgram, ENDPartial, walk, Identifier, ENDElement, ArrayExpression } from '@endorphinjs/template-parser';
import CompileState from './CompileState';
import generateExpression from '../expression';
import { isLiteral } from './utils';

export type PartialDeps = Map<string, Identifier[]>;

/**
 * Collects all external dependencies (props, state, store) for given partials
 */
export function collectPartialDeps(ast: ENDProgram): PartialDeps {
    const result: PartialDeps = new Map();
    ast.body.forEach(node => {
        if (node.type === 'ENDPartial') {
            const deps = getPartialDeps(node);
            if (deps.length) {
                result.set(node.id, deps);
            } else {
                result.delete(node.id);
            }
        }
    });

    return result;
}

/**
 * Constructs AST node with partial dependencies for given element, if applicable
 */
export function constructPartialDeps(elem: ENDElement, state: CompileState): SourceNode | undefined {
    const used = new Set<string>();
    const elements: Identifier[] = [];
    elem.directives
        .map(dir => {
            if (dir.prefix === 'partial' && dir.value && isLiteral(dir.value)) {
                return dir.value.value as string;
            }

            return null;
        })
        .forEach(name => {
            const deps = state.partialDeps.get(name);
            if (deps) {
                deps.forEach(id => {
                    const key = `${id.context}:${id.name}`;
                    if (!used.has(key)) {
                        elements.push(id);
                    }
                });
            }
        });

    // Collect dependencies which should invoke component re-render
    // when changed
    if (elements.length) {
        return generateExpression({
            type: 'ArrayExpression',
            elements
        } as ArrayExpression, state);
    }
}

function getPartialDeps(partial: ENDPartial): Identifier[] {
    const result: Identifier[] = [];
    const propsLookup = new Set<string>();
    const stateLookup = new Set<string>();
    const storeLookup = new Set<string>();

    walk(partial, {
        Identifier(node: Identifier) {
            switch (node.context) {
                case 'property':
                    push(node, result, propsLookup); break;
                case 'state':
                    push(node, result, stateLookup); break;
                case 'store':
                    push(node, result, storeLookup); break;
            }
        }
    });

    return result;
}

function push(id: Identifier, dest: Identifier[], lookup: Set<string>) {
    if (!lookup.has(id.name)) {
        lookup.add(id.name);
        dest.push(id);
    }
}
