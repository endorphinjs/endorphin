import { Parser, Position } from 'acorn';
import endorphinParser from './acorn-plugin';
import { Program, Identifier, Expression, Node, JSNode, Statement } from '../ast';
import Scanner from '../scanner';
import { walkFullAncestor as walk } from '../walk';
import { eatPair, isIdentifier, isFunction } from '../utils';
import { ENDSyntaxError } from '../syntax-error';
import { convert } from './getter';
import { ParserOptions } from '../parse';

export const jsGlobals = new Set(['Math', 'String', 'Boolean', 'Object']);

export interface JSParserOptions extends ParserOptions {
    offset?: Position;
    url?: string;
}

// @ts-ignore
const JSParser = Parser.extend(endorphinParser);

export const EXPRESSION_START = 123; // {
export const EXPRESSION_END = 125; // }

const prefixes = {
    '@': 'variable',
    '#': 'state',
    '$': 'store'
};

/**
 * Consumes expression from current stream location
 */
export default function expression(scanner: Scanner): Program {
    if (eatPair(scanner, EXPRESSION_START, EXPRESSION_END)) {
        scanner.start++;
        const begin = scanner.start;
        const end = scanner.pos - 1;

        return parseJS(scanner.substring(begin, end), {
            ...scanner.options,
            url: scanner.url,
            offset: scanner.sourceLocation(begin)
        });
    }
}

/**
 * Parses given JS code into AST and prepares it for Endorphin expression evaluation
 * @param code Code to parse
 * @param scanner Code location inside parsed template
 * @param sourceFile Source file URL from which expression is parsed
 */
export function parseJS(code: string, options: JSParserOptions = {}): Program {
    let ast: Program;
    try {
        ast = JSParser.parse(code, {
            sourceType: 'module',
            sourceFile: options.url,
            locations: true
        }) as Program;
    } catch (err) {
        const message = err.message.replace(/\s*\(\d+:\d+\)$/, '');
        const loc = { ...err.loc } as Position;
        if (options.offset) {
            offsetPos(loc, options.offset);
        }
        throw new ENDSyntaxError(message, options.url, loc, code);
    }

    // Walk over AST and validate & upgrade nodes
    walk(ast, (node: Node, state, ancestors: Expression[]) => {
        // Upgrade token locations
        if (options.offset) {
            node.start += options.offset.offset;
            node.end += options.offset.offset;
            if (node.loc) {
                offsetPos(node.loc.start, options.offset);
                offsetPos(node.loc.end, options.offset);
            }
        }

        if (isIdentifier(node)) {
            if (jsGlobals.has(node.name) || isReserved(node, ancestors)) {
                return;
            }

            const prefix = node.name[0];
            if (prefix in prefixes) {
                node.context = prefixes[prefix];
                node.raw = node.name;
                node.name = node.name.slice(prefix.length);
            } else if (ancestors.some(expr => isFunctionArgument(node, expr))) {
                node.context = 'argument';
            } else {
                node.context = options.helpers && options.helpers.includes(node.name)
                    ? 'helper' : 'property';
            }
        } else if (!options.disableGetters) {
            upgradeContent(node as Expression);
        }
    });

    return ast;
}

/**
 * Check if given identifier is reserved by outer scope
 */
function isReserved(id: Identifier, ancestors: Expression[]): boolean {
    const last = ancestors[ancestors.length - 1];

    if (last) {
        return isProperty(id, last) || isAssignment(id, last);
    }

    return false;
}

/**
 * Upgrades contents of given node, if possible: converts `MemberExpression` and
 * `CallExpression` children with getters and callers
 */
function upgradeContent(node: Expression | Statement): void {
    switch (node.type) {
        case 'AssignmentPattern':
            node.right = convert(node.right);
            break;
        case 'AssignmentExpression':
        case 'BinaryExpression':
        case 'LogicalExpression':
            node.left = convert(node.left);
            node.right = convert(node.right);
            break;
        case 'SpreadElement':
        case 'UpdateExpression':
        case 'UnaryExpression':
            node.argument = convert(node.argument);
            break;
        case 'ObjectExpression':
            node.properties.forEach(prop => prop.value = convert(prop.value));
            break;
        case 'ConditionalExpression':
            node.test = convert(node.test);
            node.consequent = convert(node.consequent);
            node.alternate = convert(node.alternate);
            break;
        case 'SequenceExpression':
            node.expressions = node.expressions.map(convert);
            break;
        case 'ExpressionStatement':
            node.expression = convert(node.expression);
            break;
        case 'ReturnStatement':
            if (node.argument) {
                node.argument = convert(node.argument);
            }
            break;
        case 'ArrowFunctionExpression':
            if (node.expression) {
                node.body = convert(node.body as Expression);
            }
            break;
        case 'CallExpression':
            node.arguments = node.arguments.map(convert);
            break;
    }
}

function offsetPos(pos: Position, offset: Position): Position {
    if (pos.line === 1) {
        pos.column += offset.column;
    }
    pos.line += offset.line - 1;
    if (typeof pos.offset === 'number') {
        pos.offset += offset.offset;
    }
    return pos;
}

/**
 * Check if given identifier is a function argument
 */
function isFunctionArgument(id: Identifier, expr: Expression): boolean {
    return isFunction(expr) && expr.params.some(param => {
        if (param.type === 'ObjectPattern') {
            return param.properties.some(({ value }) => isSameIdentifier(id, value));
        }

        if (param.type === 'ArrayPattern') {
            return param.elements.some(elem => isSameIdentifier(id, elem));
        }

        return isSameIdentifier(id, param);
    });
}

function isSameIdentifier(id: Identifier, node: JSNode): boolean {
    return isIdentifier(node) && node.name === id.name;
}

/**
 * Check if given identifier is an object property
 */
function isProperty(id: Identifier, expr: Expression): boolean {
    return expr.type === 'MemberExpression' && expr.property === id;
}

/**
 * Check if given identifier is a left part of assignment expression
 */
function isAssignment(id: Identifier, expr: Expression): boolean {
    return 'left' in expr && expr.left === id;
}
