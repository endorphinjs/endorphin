import { Parser, Position } from 'acorn';
import endorphinParser from './acorn-plugin';
import { Program, Identifier, Expression, Node, JSNode, Statement, AssignmentExpression, UpdateExpression, CallExpression } from '../ast';
import Scanner from '../scanner';
import { walkFullAncestor as walk } from '../walk';
import { eatPair, isIdentifier, isFunction } from '../utils';
import { ENDSyntaxError, ENDCompileError } from '../syntax-error';
import { convert } from './getter';
import { ParserOptions } from '../parse';

export const jsGlobals = new Set(['Math', 'String', 'Number', 'Boolean', 'Object', 'Date']);

export interface JSParserOptions extends ParserOptions {
    offset?: Position;
    url?: string;
    assignment?: boolean;
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
export default function expression(scanner: Scanner, options: JSParserOptions = {}): Program {
    if (eatPair(scanner, EXPRESSION_START, EXPRESSION_END)) {
        scanner.start++;
        const begin = scanner.start;
        const end = scanner.pos - 1;

        return parseJS(scanner.substring(begin, end), {
            ...scanner.options,
            url: scanner.url,
            offset: scanner.sourceLocation(begin),
            ...options
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
            ecmaVersion: 6,
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

        if (isAssignment(node) || isUpdate(node)) {
            if (!options.assignment) {
                throw new ENDCompileError(`Assignment expressions are not allowed in current expression`, node);
            }

            const operand = isAssignment(node) ? node.left : node.argument;

            // Assignment is allowed for state and store identifiers
            if (isIdentifier(operand)) {
                if (!operand.context) {
                    updateIdContext(operand, ancestors, options);
                }

                if (operand.context === 'state' || operand.context === 'store') {
                    return;
                }
            }
            throw new ENDCompileError(`Assignment is allowed for state and store variables only`, node);
        } else if (isIdentifier(node)) {
            if (!node.context && !jsGlobals.has(node.name) && !isReserved(node, ancestors)) {
                updateIdContext(node, ancestors, options);
            }
        } else {
            upgradeContent(node as Expression, options);
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
        return isProperty(id, last) || isLeftAssignment(id, last);
    }

    return false;
}

/**
 * Upgrades contents of given node, if possible: converts `MemberExpression` and
 * `CallExpression` children with getters and callers
 */
function upgradeContent(node: Expression | Statement, options: JSParserOptions = {}): void {
    switch (node.type) {
        case 'AssignmentPattern':
            node.right = convert(node.right, options);
            break;
        case 'AssignmentExpression':
        case 'BinaryExpression':
        case 'LogicalExpression':
            node.left = convert(node.left, options);
            node.right = convert(node.right, options);
            break;
        case 'SpreadElement':
        case 'UpdateExpression':
        case 'UnaryExpression':
            node.argument = convert(node.argument, options);
            break;
        case 'ObjectExpression':
            node.properties.forEach(prop => prop.value = convert(prop.value, options));
            break;
        case 'ConditionalExpression':
            node.test = convert(node.test, options);
            node.consequent = convert(node.consequent, options);
            node.alternate = convert(node.alternate, options);
            break;
        case 'SequenceExpression':
            node.expressions = node.expressions.map(n => convert(n, options));
            break;
        case 'ExpressionStatement':
            node.expression = convert(node.expression, options);
            break;
        case 'ReturnStatement':
            if (node.argument) {
                node.argument = convert(node.argument, options);
            }
            break;
        case 'ArrowFunctionExpression':
            if (node.expression) {
                node.body = convert(node.body as Expression, options);
            }
            break;
        case 'CallExpression':
            node.arguments = node.arguments.map(n => convert(n, options));
            break;
        case 'TemplateLiteral':
            node.expressions = node.expressions.map(n => convert(n, options));
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
function isLeftAssignment(id: Identifier, expr: Expression): boolean {
    return 'left' in expr && expr.left === id;
}

function isAssignment(node: JSNode): node is AssignmentExpression {
    return node.type === 'AssignmentExpression';
}

function isUpdate(node: JSNode): node is UpdateExpression {
    return node.type === 'UpdateExpression';
}

function updateIdContext(node: Identifier, ancestors: Expression[], options: JSParserOptions) {
    const prefix = node.name[0];
    if (prefix in prefixes) {
        node.context = prefixes[prefix];
        node.raw = node.name;
        node.name = node.name.slice(prefix.length);
        if (node.context === 'store' && !node.name) {
            node.context = 'store-host';
        }
    } else if (ancestors.some(expr => isFunctionArgument(node, expr))) {
        node.context = 'argument';
    } else {
        if (options.helpers) {
            // Check if given identifier is a helper function call
            let call: CallExpression;
            for (let i = ancestors.length - 1; i >= 0; i--) {
                if (ancestors[i].type === 'CallExpression') {
                    call = ancestors[i] as CallExpression;
                    break;
                }
            }

            if (call && call.callee === node && options.helpers.includes(node.name)) {
                node.context = 'helper';
                return;
            }
        }

        node.context = 'property';
    }
}
