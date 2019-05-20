import Scanner, { MatchFunction, SourceData } from './scanner';
import { Identifier, LiteralValue, Literal, Node, Expression, FunctionDeclaration, ArrowFunctionExpression } from './ast';

export const SINGLE_QUOTE = 39; // '
export const DOUBLE_QUOTE = 34; // "
export const ESCAPE = 92; // \
export const UNDERSCORE = 95; // _
export const NAMESPACE_DELIMITER = 58; // :
export const DASH = 45; // -
export const TAG_START = 60; // <
export const TAG_END = 62; // >
export const TAG_CLOSE = 47; // /
export const ATTR_DELIMITER = 61; // =
export const DOT = 46; // .

type SourceDataAlike = { [P in keyof SourceData]?: SourceData[P] } & { [name: string]: any };

/**
 * Check if given character can be used as a start of tag name or attribute
 */
export function nameStartChar(ch: number): boolean {
    return isAlpha(ch) || ch === UNDERSCORE || ch === NAMESPACE_DELIMITER;
}

/**
 * Check if given character can be used as a tag name
 */
export function nameChar(ch: number): boolean {
    return nameStartChar(ch) || isNumber(ch) || ch === DASH || ch === DOT;
}

/**
 * Factory function for creating `Identifier` AST node
 */
export function identifier(name: string, loc: SourceDataAlike): Identifier {
    return { type: 'Identifier', name, ...toSourceData(loc) };
}

/**
 * Factory function for creating `Literal` AST node
 */
export function literal(value: LiteralValue, raw?: string, loc?: SourceDataAlike): Literal {
    return { type: 'Literal', value, raw, ...toSourceData(loc) };
}

/**
 * Check if given node is `Identifier`
 */
export function isIdentifier(node?: Node): node is Identifier {
    return node && node.type === 'Identifier';
}

/**
 * Check if given node is `Literal`
 */
export function isLiteral(node?: Node): node is Literal {
    return node && node.type === 'Literal';
}

/**
 * Check if given node is a function
 */
export function isFunction(node: Expression): node is FunctionDeclaration | ArrowFunctionExpression {
    return node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression';
}

export function toSourceData(node: SourceDataAlike): SourceData {
    return {
        start: node.start,
        end: node.end,
        loc: node.loc
    };
}

/**
 * Tries to consume content from given stream that matches `fn` test. If consumed,
 * moves `.start` property of stream to the beginning of consumed token
 */
export function consume(scanner: Scanner, fn: MatchFunction): boolean {
    const pos = scanner.pos;
    if (scanner.eatWhile(fn)) {
        scanner.start = pos;
        return true;
    }

    scanner.pos = pos;
    return false;
}

/**
 * Eats array of character codes from given stream
 * @param scanner
 * @param codes  Array of character codes to consume
 */
export function eatArray(scanner: Scanner, codes: number[]): boolean {
    const start = scanner.pos;

    for (let i = 0; i < codes.length; i++) {
        if (!scanner.eat(codes[i])) {
            scanner.pos = start;
            return false;
        }
    }

    scanner.start = start;
    return true;
}

/**
 * Consumes section from given string which starts with `open` character codes
 * and ends with `close` character codes
 * @param allowUnclosed Allow omitted `close` part in text stream
 */
export function eatSection(scanner: Scanner, open: number[], close: number[], allowUnclosed: boolean = false): boolean {
    const start = scanner.pos;

    if (eatArray(scanner, open)) {
        scanner.start = start;

        // Read next until we find ending part or reach the end of input
        while (!scanner.eof()) {
            if (eatArray(scanner, close)) {
                return true;
            }

            scanner.next();
        }

        if (allowUnclosed) {
            // unclosed section is allowed
            return true;
        } else {
            throw scanner.error(`Expected ${close.map(ch => String.fromCharCode(ch)).join('')}`);
        }
    }

    return false;
}

/**
 * Converts given string into array of character codes
 */
export function toCharCodes(str: string): number[] {
    return str.split('').map(ch => ch.charCodeAt(0));
}

/**
 * Consumes 'single' or "double"-quoted string from given string, if possible
 */
export function eatQuoted(scanner: Scanner): boolean {
    const start = scanner.pos;
    const quote = scanner.peek();

    if (scanner.eat(isQuote)) {
        while (!scanner.eof()) {
            switch (scanner.next()) {
                case quote:
                    scanner.start = start;
                    return true;

                case ESCAPE:
                    scanner.next();
                    break;
            }
        }

        throw scanner.error('Missing closing quote for string', start);
    }

    return false;
}

/**
 * Eats paired characters substring, for example `(foo)` or `[bar]`
 * @param scanner
 * @param open Character code of pair opening
 * @param close Character code of pair closing
 */
export function eatPair(scanner: Scanner, open: number, close: number): boolean {
    const start = scanner.pos;

    if (scanner.eat(open)) {
        let stack = 1;
        let ch: number;

        while (!scanner.eof()) {
            if (eatQuoted(scanner)) {
                continue;
            }

            ch = scanner.next();
            if (ch === open) {
                stack++;
            } else if (ch === close) {
                stack--;
                if (!stack) {
                    scanner.start = start;
                    return true;
                }
            } else if (ch === ESCAPE) {
                scanner.next();
            }
        }

        throw scanner.error(`Unable to find matching pair for ${String.fromCharCode(open)}`);
    }

    return false;
}

/**
 * Check if given character code is a quote
 */
export function isQuote(code: number): boolean {
    return code === SINGLE_QUOTE || code === DOUBLE_QUOTE;
}

/**
 * Check if given code is a number
 */
export function isNumber(code: number): boolean {
    return code > 47 && code < 58;
}

/**
 * Check if given character code is alpha code (letter through A to Z)
 */
export function isAlpha(code: number, from: number = 65, to: number = 90): boolean {
    code &= ~32; // quick hack to convert any char code to uppercase char code
    return code >= from && code <= to;
}

/**
 * Check if given character code is alpha-numeric (letter through A to Z or number)
 */
export function isAlphaNumeric(code: number): boolean {
    return isNumber(code) || isAlpha(code);
}

/**
 * Check if given character code is a whitespace character
 */
export function isWhiteSpace(code: number): boolean {
    return code === 32   /* space */
        || code === 9    /* tab */
        || code === 160; /* non-breaking space */
}

/**
 * Check if given character code is a space character
 */
export function isSpace(code: number): boolean {
    return isWhiteSpace(code)
        || code === 10  /* LF */
        || code === 13; /* CR */
}
