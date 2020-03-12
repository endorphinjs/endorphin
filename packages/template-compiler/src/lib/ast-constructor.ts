import {
    IdentifierContext, Identifier, Property, ObjectExpression, CallExpression,
    Expression, ArgumentListElement, ThisExpression, MemberExpression, Node, SourceLocation,
    LiteralValue, Literal, ENDAttributeValue, ENDVariable, Program, LogicalExpression,
    ConditionalExpression, ENDAttributeValueExpression, ENDBaseAttributeValue
} from '@endorphinjs/template-parser';
import { isPropKey } from './utils';

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

export function variable(name: string, value: ENDAttributeValue): ENDVariable {
    return { type: 'ENDVariable', name, value };
}

export function binaryExpr(left: Expression, right: Expression, operator = '&&'): LogicalExpression {
    return { type: 'LogicalExpression', operator, left, right };
}

export function conditionalExpr(test: Expression, consequent: Expression, alternate: Expression): ConditionalExpression {
    return { type: 'ConditionalExpression', test, consequent, alternate };
}

export function attributeExpression(elements: ENDBaseAttributeValue[]): ENDAttributeValueExpression {
    return { type: 'ENDAttributeValueExpression', elements };
}

export function program(expression: Expression): Program {
    return {
        type: 'Program',
        body: [{
            type: 'ExpressionStatement',
            expression
        }],
        raw: ''
    };
}

export function callExpr(callee: string | Expression, args: ArgumentListElement[] = [], source?: SourceDataAlike): CallExpression {
    if (typeof callee === 'string') {
        callee = identifier(callee);
    }

    return addSource({ type: 'CallExpression', callee, arguments: args }, source);
}

type PropertyKind = 'init' | 'get' | 'set';
export function property(key: string | Identifier | Literal, value: Expression, kind: PropertyKind = 'init', source?: SourceDataAlike): Property {
    if (typeof key === 'string') {
        key = isPropKey(key) ? identifier(key) : literal(key);
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
