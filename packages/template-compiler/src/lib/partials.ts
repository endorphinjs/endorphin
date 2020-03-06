import { SourceNode } from 'source-map';
import { ENDProgram, ENDPartial, walk, Identifier, ENDElement } from '@endorphinjs/template-parser';
import CompileState from './CompileState';
import { objectExpr, property } from './ast-constructor';
import generateExpression from '../expression';

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
    const partials = elem.directives
        .filter(dir => dir.prefix === 'partial')
        .map(dir => {
            if (dir.value && dir.value.type === 'Literal') {
                return dir.value.value as string;
            }

            return null;
        })
        .filter(name => name != null && state.partialDeps.has(name));

    // Collect dependencies which should invoke component re-render
    // when changed
    if (partials.length) {
        const deps = objectExpr();
        partials.forEach(name => {
            deps.properties.push(property(name, {
                type: 'ArrayExpression',
                elements: state.partialDeps.get(name)
            }));
        });

        return generateExpression(deps, state);
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
