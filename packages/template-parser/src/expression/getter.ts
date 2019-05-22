import { isIdentifier, isFunction, literal } from '../utils';
import {
    ENDGetterPathFragment, Expression, MemberExpression, ENDGetter, CallExpression,
    ENDCaller, ENDFilter, JSNode, ArrowFunctionExpression, ArrayExpression, ENDGetterPrefix, IdentifierContext, Identifier, Literal
} from '../ast';
import { JSParserOptions } from '.';

/**
 * Tries to convert some JS nodes like `MemberExpression` or `CallExpression` into
 * special Endorphin-specific nodes for safe data access
 */
export function convert(node: Expression, options: JSParserOptions = {}): ENDGetterPathFragment {
    if (isMemberExpression(node)) {
        if (isFilter(node)) {
            return createFilter(node);
        }

        if (!options.disableGetters) {
            return createGetter(node);
        }
    } else if (isCallExpression(node) && !options.disableCallers) {
        return createCaller(node);
    }

    return node;
}

/**
 * Collects plain path for value getter, if possible
 */
export function createGetter(expr: MemberExpression): ENDGetter | MemberExpression {
    const result: ENDGetter = {
        type: 'ENDGetter',
        path: []
    };

    let ctx: Expression = expr;
    while (ctx) {
        if (isMemberExpression(ctx)) {
            if (isFilter(ctx)) {
                result.path.unshift(createFilter(ctx));
                break;
            }

            if (isIdentifier(ctx.property) && !ctx.computed) {
                result.path.unshift(idToLiteral(ctx.property));
            } else {
                result.path.unshift(convert(ctx.property));
            }

            ctx = ctx.object;
        } else {
            if (isIdentifier(ctx) && !ctx.context) {
                // Accessing global object, no need to rewrite
                return expr;
            }
            result.path.unshift(convert(ctx));
            ctx = null;
        }
    }

    return result;
}

function idToLiteral(id: Identifier): Literal {
    return literal(id.name, null, {
        start: id.start,
        end: id.end,
        loc: id.loc
    });
}

export function createCaller(expr: CallExpression): ENDCaller | CallExpression {
    const { callee } = expr;
    if (isIdentifier(callee) && callee.context) {
        // Fast path: calling top-level function, which is likely to be state
        // or prop. Decompose identifier into prefix and name
        if (callee.context === 'helper') {
            // Calling helper: keep function as is but add current component
            // as first argument
            return {
                ...expr,
                arguments: [{ type: 'ThisExpression' }, ...expr.arguments]
            };
        }

        if (callee.context !== 'store') {
            return {
                type: 'ENDCaller',
                object: getterPrefix(callee.context),
                property: idToLiteral(callee),
                arguments: expr.arguments
            };
        }
    }

    if (isMemberExpression(callee)) {
        if (isIdentifier(callee.object) && !callee.object.context) {
            // Fast path: calling known global property method like `Math.round()`
            return expr;
        }

        return {
            type: 'ENDCaller',
            object: convert(callee.object),
            property: isIdentifier(callee.property)
                ? idToLiteral(callee.property)
                : callee.property,
            arguments: expr.arguments
        };
    }

    return expr;
}

function createFilter(expr: MemberExpression): ENDFilter {
    const { property, object } = expr;
    const filter = (isArray(property) ? property.elements[0] : property) as ArrowFunctionExpression;

    return {
        type: 'ENDFilter',
        object: convert(object),
        expression: filter,
        multiple: isArray(property)
    };
}

function isFilter(expr: MemberExpression): boolean {
    return isFunction(expr.property)
        || isArray(expr.property) && expr.property.elements.length
        && isFunction(expr.property.elements[0]);
}

function isMemberExpression(node: JSNode): node is MemberExpression {
    return node.type === 'MemberExpression';
}

function isCallExpression(node: JSNode): node is CallExpression {
    return node.type === 'CallExpression';
}

function isArray(node: JSNode): node is ArrayExpression {
    return node.type === 'ArrayExpression';
}

function getterPrefix(context: IdentifierContext): ENDGetterPrefix {
    return { type: 'ENDGetterPrefix', context };
}
