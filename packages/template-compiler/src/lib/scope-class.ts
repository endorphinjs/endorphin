import type { ENDAttribute, ENDDirective, ENDProgram, ENDAddClassStatement, Node, ENDPlainStatement } from '@endorphinjs/template-parser';
import { walk } from '@endorphinjs/template-parser';
import { isIdentifier, isInterpolatedLiteral, isLiteral } from './utils';

type WalkNode = ENDDirective | ENDAttribute | ENDAddClassStatement;

export interface ClassScopeOptions {
    /** Scope prefix to add to class names */
    prefix?: string;

    /** Scope suffix to add to class names */
    suffix?: string;

    /** Apply scoping to class names that match given regexp */
    include?: RegExp;

    /** Do not apply scoping to class names that match given regexp */
    exclude?: RegExp;

    /**
     * If `prefix` or `suffix` is given, create all possible combinations of selector.
     * Note that the amount of produced selectors is about N², where N is the amount
     * of class names in selector.
     * _used in CSS rewrite only_
     * */
     full?: boolean;
}

export default function scopeClass(prog: ENDProgram, options: ClassScopeOptions): ENDProgram {
    if (!options.suffix && !options.prefix) {
        return;
    }

    walk<Node, WalkNode>(prog, {
        ENDAttribute(node: ENDAttribute) {
            if (isIdentifier(node.name) && node.name.name === 'class') {
                const { value } = node;
                if (isLiteral(value)) {
                    if (typeof value.value === 'string') {
                        value.value = scopeClassName(value.value, options);
                    }
                } else if (isInterpolatedLiteral(value)) {
                    scopeInterpolatedClassName(value.elements, options);
                }
            }
        },
        ENDDirective(node: ENDDirective) {
            if (node.prefix === 'class') {
                node.name = scopeClassName(node.name, options);
            }
        },
        ENDAddClassStatement(node: ENDAddClassStatement) {
            scopeInterpolatedClassName(node.tokens, options);
        }
    });

    return prog;
}

function scopeInterpolatedClassName(tokens: ENDPlainStatement[], options: ClassScopeOptions) {
    tokens.forEach((token, i) => {
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
            if (tokens[i - 1]) {
                const m = value.match(/^\S+/);
                if (m) {
                    sliceStart = m[0].length;
                }
            }

            if (tokens[i + 1]) {
                const m = value.match(/\S+$/);
                if (m) {
                    sliceEnd -= m[0].length;
                }
            }

            token.value = value.slice(0, sliceStart)
                + scopeClassName(value.slice(sliceStart, sliceEnd), options)
                + value.slice(sliceEnd);
        }
    });
}

/**
 * Scopes given class name, if required
 */
function scopeClassName(className: string, options: ClassScopeOptions): string {
    const { suffix = '', prefix = '', include, exclude } = options;
    return className
        .split(/\s+/)
        .map(chunk => {
            if (chunk && !exclude?.test(chunk) && (!include || include.test(chunk))) {
                return `${prefix}${chunk}${suffix}`;
            }
            return chunk;
        })
        .join(' ');
}
