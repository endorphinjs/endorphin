import type { ENDAttribute, ENDDirective, ENDProgram, ENDAddClassStatement, Node } from '@endorphinjs/template-parser';
import { walk } from '@endorphinjs/template-parser';
import { isIdentifier, isLiteral } from './utils';

type WalkNode = ENDDirective | ENDAttribute | ENDAddClassStatement;

export interface ScopeClassOptions {
    /** Scope suffix to add to class names */
    scope: string;

    /** Ignore class name scoping if it matches given regexp */
    ignore?: RegExp;
}

export default function scopeClass(prog: ENDProgram, options: ScopeClassOptions): ENDProgram {
    walk<Node, WalkNode>(prog, {
        ENDAttribute(node: ENDAttribute) {
            if (isIdentifier(node.name) && node.name.name === 'class') {
                const { value } = node;
                if (isLiteral(value) && typeof value.value === 'string') {
                    value.value = scopeClassName(value.value, options.scope, options.ignore);
                }
            }

        },
        ENDDirective(node: ENDDirective) {
            if (node.prefix === 'class') {
                node.name = scopeClassName(node.name, options.scope, options.ignore);
            }
        },
        ENDAddClassStatement(node: ENDAddClassStatement) {
            node.tokens.forEach((token, i) => {
                if (isLiteral(token) && typeof token.value === 'string') {
                    // In case if token is surrounded by expression, we should
                    // skip class name rewrite that sticks to token edge.
                    // E.g. in the following example:
                    // `{expr1}foo bar bam baz{expr2}`
                    // we should skip rewrite of `foo` and `baz` since we don’t
                    // know the actual class name
                    const { value } = token;
                    let sliceStart = 0;
                    let sliceEnd = value.length;
                    // We assume that given token list comes from parser and it
                    // may not contain multiple literals in a row, e.g. the next/previous
                    // token is always non-Literal
                    if (node.tokens[i - 1]) {
                        const m = value.match(/^\S+/);
                        if (m) {
                            sliceStart = m[0].length;
                        }
                    }

                    if (node.tokens[i + 1]) {
                        const m = value.match(/\S+$/);
                        if (m) {
                            sliceEnd -= m[0].length;
                        }
                    }

                    token.value = value.slice(0, sliceStart)
                        + scopeClassName(value.slice(sliceStart, sliceEnd), options.scope, options.ignore)
                        + value.slice(sliceEnd);
                }
            });
        }
    });

    return prog;
}

/**
 * Scopes given class name, if required
 */
function scopeClassName(className: string, cssScope: string, ignore?: RegExp): string {
    return className
        .split(/\s+/)
        .map(chunk => chunk && !ignore?.test(chunk) ? `${chunk}_${cssScope}` : chunk)
        .join(' ');
}
