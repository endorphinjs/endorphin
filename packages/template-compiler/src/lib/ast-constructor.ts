import {
    IdentifierContext, Identifier, Property, ObjectExpression, CallExpression,
    Expression, ArgumentListElement, ThisExpression, MemberExpression, Node, SourceLocation,
    LiteralValue, Literal
} from '@endorphinjs/template-parser';

/**
 * @description
 * Factory methods for constructing commonly used AST nodes
 */

interface SourceDataAlike {
    start?: number;
    end?: number;
    loc?: SourceLocation;
    [name: string]: any;
}

export function identifier(name: string, context?: IdentifierContext, source?: SourceDataAlike): Identifier {
    return addSource({ type: 'Identifier', name, context }, source);
}

export function literal(value: LiteralValue, source?: SourceDataAlike): Literal {
    return addSource({ type: 'Literal', value, raw: JSON.stringify(value) }, source);
}

export function objectExpr(properties: Property[] = [], source?: SourceDataAlike): ObjectExpression {
    return addSource({ type: 'ObjectExpression', properties }, source);
}

export function callExpr(callee: string | Expression, args: ArgumentListElement[] = [], source?: SourceDataAlike): CallExpression {
    if (typeof callee === 'string') {
        callee = identifier(callee);
    }

    return addSource({ type: 'CallExpression', callee, arguments: args }, source);
}

export function property(key: string | Identifier, value: Expression, kind: 'init' | 'get' | 'set' = 'init', source?: SourceDataAlike): Property {
    if (typeof key === 'string') {
        key = identifier(key);
    }

    return addSource({ type: 'Property', kind,  key, value }, source);
}

export function thisExpr(source?: SourceDataAlike): ThisExpression {
    return addSource({ type: 'ThisExpression' }, source);
}

export function member(object: Expression, prop: Expression | string, source?: SourceDataAlike): MemberExpression {
    if (typeof prop === 'string') {
        prop = identifier(prop);
    }

    return addSource({ type: 'MemberExpression', object, property: prop }, source);
}

function addSource<T extends Node>(node: T, source?: SourceDataAlike): T {
    if (source && source.loc) {
        node.loc = source.loc;
    }

    return node;
}
