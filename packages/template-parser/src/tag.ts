import expression, { EXPRESSION_START, JSParserOptions } from './expression';
import {
    Identifier, Literal, Program, LiteralValue, ENDAttribute,
    ENDAttributeValue, ParsedTag, ENDAttributeName, ENDAttributeValueExpression,
    ENDBaseAttributeValue, ENDDirective, Node, ENDStatement
} from './ast';
import {
    isWhiteSpace, isQuote, eatQuoted, isSpace, identifier, literal, isIdentifier,
    isLiteral, TAG_START, TAG_CLOSE, TAG_END, nameStartChar, nameChar, ATTR_DELIMITER
} from './utils';
import { prefix, ignored, InnerStatement, tagName } from './elements/utils';
import Scanner from './scanner';
import innerHTML from './elements/inner-html';
import text from './text';

const exprStart = String.fromCharCode(EXPRESSION_START);
const directives = [prefix, 'on', 'ref', 'class', 'partial', 'animate'];
const attributeCast = {
    'true': true,
    'false': false,
    'null': null,
    'undefined': undefined
};

/**
 * Consumes tag from current stream location, if possible
 */
export default function parseTag(scanner: Scanner): ParsedTag {
    return openTag(scanner) || closeTag(scanner);
}

/**
 * Consumes open tag from given stream
 */
export function openTag(scanner: Scanner): ParsedTag {
    const pos = scanner.pos;
    if (scanner.eat(TAG_START)) {
        const name = ident(scanner);
        if (name) {
            const attributes = consumeAttributes(scanner);
            const selfClosing = scanner.eat(TAG_CLOSE);

            if (!scanner.eat(TAG_END)) {
                throw scanner.error('Expected tag closing brace');
            }

            scanner.start = pos;
            const tag = createTag(scanner, name, 'open', selfClosing);
            attributes.forEach(attr => {
                const ref = getRef(attr, scanner);
                if (ref != null) {
                    return tag.ref = ref;
                }

                const directive = getDirective(attr);
                if (directive) {
                    validateDirective(directive, scanner);
                    return tag.directives.push(directive);
                }

                // Validate some edge cases:
                // * Currently, we do not support dynamic names in slots.
                //   Make sure all slot names are literals
                const attrName = isIdentifier(attr.name) ? attr.name.name : null;
                const shouldValidateSlot = attrName === (name.name === 'slot' ? 'name' : 'slot');

                if (shouldValidateSlot && attr.value && !isLiteral(attr.value)) {
                    // tslint:disable-next-line:max-line-length
                    throw scanner.error(`Slot name must be a string literal, expressions are not supported`, attr.value);
                }

                tag.attributes.push(attr);
            });

            return tag;
        }
    }

    scanner.pos = pos;
}

/**
 * Consumes close tag from given stream
 */
export function closeTag(scanner: Scanner): ParsedTag {
    const pos = scanner.pos;
    if (scanner.eat(TAG_START) && scanner.eat(TAG_CLOSE)) {
        const name = ident(scanner);
        if (name) {
            if (!scanner.eat(TAG_END)) {
                throw scanner.error('Expected tag closing brace');
            }

            return createTag(scanner, name, 'close');
        }

        throw scanner.error('Unexpected character');
    }

    scanner.pos = pos;
}

/**
 * Returns `true` if valid XML identifier was consumed. If succeeded, sets stream
 * range to consumed data
 */
function ident(scanner: Scanner): Identifier {
    const start = scanner.pos;
    if (scanner.eat(nameStartChar)) {
        scanner.start = start;
        scanner.eatWhile(nameChar);

        return identifier(scanner.current(), scanner.loc());
    }
}

/**
 * Consumes attributes from current stream start
 */
function consumeAttributes(scanner: Scanner): ENDAttribute[] {
    const attributes: ENDAttribute[] = [];
    let attr: ENDAttribute;
    while (!scanner.eof()) {
        scanner.eatWhile(isSpace);

        if (attr = attribute(scanner)) {
            attributes.push(attr);
        } else if (!scanner.eof() && !isTerminator(scanner.peek())) {
            throw scanner.error('Unexpected attribute name');
        } else {
            break;
        }
    }

    return attributes;
}

/**
 * Consumes attribute from current stream location
 */
function attribute(scanner: Scanner): ENDAttribute {
    const name: ENDAttributeName = ident(scanner) || expression(scanner);
    const start = scanner.pos;
    if (name) {
        let value: ENDAttributeValue = null;

        if (scanner.eat(ATTR_DELIMITER)) {
            const opt: JSParserOptions = {};
            // Allow assignments in event handlers
            if (isIdentifier(name) && name.name.startsWith('on:')) {
                opt.assignment = true;
            }

            value = scanner.expect(() => attributeValue(scanner, opt), 'Expecting attribute value');
        }

        return {
            type: 'ENDAttribute',
            name,
            value,
            ...scanner.loc(start)
        };
    }
}

/**
 * Consumes attribute value from current stream location
 * @param {StreamReader} scanner
 * @return {Token}
 */
function attributeValue(scanner: Scanner, options?: JSParserOptions): ENDAttributeValue {
    const expr = expression(scanner, options);
    if (expr) {
        return expandExpression(expr);
    }

    const start = scanner.pos;

    if (eatQuoted(scanner)) {
        // Check if it’s interpolated value, e.g. "foo {bar}"
        const raw = scanner.current();
        if (raw.includes(exprStart)) {
            const attrExpression = attributeValueExpression(scanner.limit(scanner.start + 1, scanner.pos - 1), options);
            if (attrExpression.elements.length === 1) {
                return attrExpression.elements[0];
            }

            return {
                ...attrExpression,
                ...scanner.loc(start)
            };
        }

        return literal(raw.slice(1, -1), raw, scanner.loc(start));
    }

    if (scanner.eatWhile(isUnquoted)) {
        scanner.start = start;
        const value = scanner.current();
        return literal(castAttributeValue(value), value, scanner.loc(start));
    }
}

/**
 * Parses interpolated attribute value from current scanner context
 */
function attributeValueExpression(scanner: Scanner, options?: JSParserOptions): ENDAttributeValueExpression {
    let start = scanner.start;
    let pos = scanner.start;
    let expr: Program;
    const elements: ENDBaseAttributeValue[] = [];

    while (!scanner.eof()) {
        pos = scanner.pos;
        if (expr = expression(scanner, options)) {
            if (pos !== start) {
                const txt = scanner.substring(start, pos);
                elements.push(literal(txt, txt, scanner.loc(start)));
            }
            elements.push(expr);
            start = scanner.pos;
        } else {
            scanner.pos++;
        }
    }

    if (start !== scanner.pos) {
        const txt = scanner.substring(start, scanner.pos);
        elements.push(literal(txt, txt, scanner.loc(start)));
    }

    return {
        type: 'ENDAttributeValueExpression',
        elements,
        ...scanner.loc()
    } as ENDAttributeValueExpression;
}

/**
 * Check if given code is tag terminator
 */
function isTerminator(code: number): boolean {
    return code === TAG_END || code === TAG_CLOSE;
}

/**
 * Check if given character code is valid unquoted value
 */
function isUnquoted(code: number): boolean {
    return !isNaN(code) && !isQuote(code) && !isWhiteSpace(code)
        && !isTerminator(code) && code !== ATTR_DELIMITER && code !== EXPRESSION_START;
}

/**
 * If given attribute is a ref pointer, returns its name
 */
function getRef(attr: ENDAttribute, scanner: Scanner): string | Program {
    if (isIdentifier(attr.name)) {
        const { name } = attr.name;
        if (name === 'ref') {
            // Parse `ref="..."` attribute
            if (attr.value) {
                if (isLiteral(attr.value)) {
                    return attr.value.value as string;
                } else if (attr.value.type === 'Program') {
                    return attr.value;
                } else {
                    throw scanner.error(`Unexpected value type "${attr.value.type}": ref value must be a string or expression`, attr);
                }
            }

            throw scanner.error('Ref attribute should not be empty', attr);
        } else {
            const m = name.match(/^ref:(.+)$/);
            if (m) {
                if (attr.value) {
                    throw scanner.error('Shorthand ref should not have value', attr.value);
                }

                return m[1];
            }
        }
    }
}

/**
 * If given attribute is a directive (has one of known prefixes), converts it to
 * directive token, returns `null` otherwise
 */
function getDirective(attr: ENDAttribute): ENDDirective {
    if (isIdentifier(attr.name)) {
        const m = attr.name.name.match(/^([\w-]+):/);

        if (m && directives.includes(m[1])) {
            const pfx = m[1];
            const { name, loc } = attr.name;
            const directiveId = identifier(name.slice(m[0].length), {
                start: attr.name.start + m[0].length,
                end: attr.name.end,
                loc: {
                    ...loc,
                    start: {
                        ...loc.start,
                        column: loc.start.column + m[0].length
                    }
                }
            });

            return {
                type: 'ENDDirective',
                prefix: pfx,
                name: directiveId.name,
                value: attr.value,
                loc: attr.name.loc
            };
        }
    }
}

/**
 * Detects if given expression is a single literal and returns it
 */
function expandExpression(expr: Program): Program | Literal {
    const inner = expr.body && expr.body.length === 1 && expr.body[0];
    if (inner && inner.type === 'ExpressionStatement' && inner.expression.type === 'Literal') {
        return inner.expression;
    }

    return expr;
}

function castAttributeValue(value: string): LiteralValue {
    // Cast primitive values
    const num = Number(value);
    if (!isNaN(num)) {
        return num;
    }

    return value in attributeCast ? attributeCast[value] : value;
}

function createTag(scanner: Scanner,
                   name: Identifier,
                   tagType: 'open' | 'close',
                   selfClosing: boolean = false): ParsedTag {
    return {
        type: 'ParsedTag',
        name,
        tagType,
        selfClosing,
        attributes: [],
        directives: [],
        ...scanner.loc()
    };
}

function validateDirective(dir: ENDDirective, scanner: Scanner): void {
    // Make sure event is expression
    if (dir.prefix === 'on' && dir.value && dir.value.type !== 'Program') {
        throw scanner.error(`Event handler must be expression`, dir.value);
    }
}

/**
 * Consumes tag content from given scanner into `body` argument
 */
export function tagBody(scanner: Scanner, open: ParsedTag, consumeTag?: InnerStatement, body: ENDStatement[] = []): ENDStatement[] {
    if (open.selfClosing) {
        // Nothing to consume in self-closing tag
        return [];
    }

    const tagStack: ParsedTag[] = [open];
    const items: ENDStatement[] = [];
    let tagEntry: ParsedTag;
    let token: ENDStatement;

    while (!scanner.eof()) {
        if (closesTag(scanner, tagStack[tagStack.length - 1])) {
            tagStack.pop();
            if (!tagStack.length) {
                break;
            }
        } else if (tagEntry = openTag(scanner)) {
            if (consumeTag) {
                const inner = consumeTag(scanner, tagEntry);
                if (inner) {
                    items.push(inner);
                }
            } else {
                tagStack.push(tagEntry);
            }
        } else if (token = innerHTML(scanner) || expression(scanner)) {
            items.push(token);
        } else if (token = text(scanner)) {
            // Skip formatting tokens: a whitespace-only text token with new lines
            const value = String(token.value);
            if (!/^\s+$/.test(value) || !/[\r\n]/.test(value)) {
                items.push(token);
            }
        } else if (!ignored(scanner)) {
            throw scanner.error(`Unexpected token`);
        }
    }

    // If we reached here then most likely we have unclosed tags
    if (tagStack.length) {
        throw scanner.error(`Expecting </${tagName(tagStack.pop())}>`);
    }

    finalizeTagBody(body, items);
    return body;
}

/**
 * Consumes contents of given tag as text, e.g. parses it until it reaches closing
 * tag that matches `open`.
 */
export function tagText(scanner: Scanner, open: ParsedTag): Literal {
    if (open.selfClosing) {
        // Nothing to consume in self-closing tag
        return;
    }

    const start = scanner.pos;
    let end: number;
    let close: ParsedTag;

    while (!scanner.eof()) {
        end = scanner.pos;
        if (close = closeTag(scanner)) {
            if (tagName(close) === tagName(open)) {
                return literal(scanner.substring(start, end), null, scanner.loc(start, end));
            }
        } else {
            scanner.pos++;
        }
    }

    // If we reached here then most likely we have unclosed tags
    throw scanner.error(`Expecting </${tagName(open)}>`);
}

/**
 * Check if next token in current scanner state is a closing tag for given `open` one
 */
export function closesTag(scanner: Scanner, open: ParsedTag): boolean {
    const pos = scanner.pos;
    const close = closeTag(scanner);
    if (close) {
        if (tagName(close) === tagName(open)) {
            return true;
        }

        throw scanner.error(`Unexpected closing tag </${tagName(close)}>, expecting </${tagName(open)}>`, pos);
    }

    return false;
}

/**
 * Consumes tag content and ensures it’s empty, e.g. no meaningful data in it,
 * or throw exception
 * @param scanner
 * @param open
 */
export function emptyBody(scanner: Scanner, open: ParsedTag): void {
    if (open.selfClosing) {
        // Nothing to consume in self-closing tag
        return;
    }

    while (!scanner.eof() && !closesTag(scanner, open)) {
        if (!ignored(scanner)) {
            throw scanner.error(`Unexpected token, tag <${tagName(open)}> must be empty`);
        }
    }
}

/**
 * Finalizes parsed body content
 */
function finalizeTagBody(parent: ENDStatement[], parsed: ENDStatement[]): void {
    removeFormatting(parsed).forEach(item => parent.push(item));
}

/**
 * Removes text formatting from given list of statements
 */
function removeFormatting(statements: ENDStatement[]): ENDStatement[] {
    return statements.filter((node, i) => {
        if (isLiteral(node) && /[\r\n]/.test(String(node.value)) && /^\s+$/.test(String(node.value))) {
            // Looks like insignificant white-space character, check if we can
            // remove it
            return isContentNode(statements[i - 1]) || isContentNode(statements[i + 1]);
        }

        return true;
    });
}

function isContentNode(node: Node): boolean {
    return isLiteral(node) || node.type === 'Program';
}
