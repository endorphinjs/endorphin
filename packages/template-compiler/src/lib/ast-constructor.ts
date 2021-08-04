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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [name: string]: any;
}

export function identifier(name: string, context?: IdentifierContext, source?: SourceDataAlike): Identifier {
    return addSource({ type: 'Identifier', start: 0, end: 0, name, context }, source);
}

export function literal(value: LiteralValue, source?: SourceDataAlike): Literal {
    return addSource({ type: 'Literal', start: 0, end: 0, value, raw: JSON.stringify(value) }, source);
}

export function objectExpr(properties: Property[] = [], source?: SourceDataAlike): ObjectExpression {
    return addSource({ type: 'ObjectExpression', start: 0, end: 0, properties }, source);
}

export function variable(name: string, value: ENDAttributeValue): ENDVariable {
    return { type: 'ENDVariable', start: 0, end: 0, name, value };
}

export function binaryExpr(left: Expression, right: Expression, operator = '&&'): LogicalExpression {
    return { type: 'LogicalExpression', start: 0, end: 0, operator, left, right };
}

export function conditionalExpr(test: Expression, consequent: Expression, alternate: Expression): ConditionalExpression {
    return { type: 'ConditionalExpression', start: 0, end: 0, test, consequent, alternate };
}

export function attributeExpression(elements: ENDBaseAttributeValue[]): ENDAttributeValueExpression {
    return { type: 'ENDAttributeValueExpression', start: 0, end: 0, elements };
}

export function program(expression: Expression): Program {
    return {
        type: 'Program',
        start: expression.start,
        end: expression.end,
        body: [{
            type: 'ExpressionStatement',
            start: expression.start,
            end: expression.end,
            expression
        }],
        raw: ''
    };
}

export function callExpr(callee: string | Expression, args: ArgumentListElement[] = [], source?: SourceDataAlike): CallExpression {
    if (typeof callee === 'string') {
        callee = identifier(callee);
    }

    return addSource({ type: 'CallExpression', start: 0, end: 0, callee, arguments: args }, source);
}

type PropertyKind = 'init' | 'get' | 'set';
export function property(key: string | Identifier | Literal, value: Expression, kind: PropertyKind = 'init', source?: SourceDataAlike): Property {
    if (typeof key === 'string') {
        key = isPropKey(key) ? identifier(key) : literal(key);
    }

    return addSource({ type: 'Property', start: 0, end: 0, kind,  key, value }, source);
}

export function thisExpr(source?: SourceDataAlike): ThisExpression {
    return addSource({ type: 'ThisExpression', start: 0, end: 0 }, source);
}

export function member(object: Expression, prop: Expression | string, source?: SourceDataAlike): MemberExpression {
    if (typeof prop === 'string') {
        prop = identifier(prop);
    }

    return addSource({ type: 'MemberExpression', start: object.start, end: object.end, object, property: prop }, source);
}

function addSource<T extends Node>(node: T, source?: SourceDataAlike): T {
    if (source && source.loc) {
        node.loc = source.loc;
    }

    return node;
}
