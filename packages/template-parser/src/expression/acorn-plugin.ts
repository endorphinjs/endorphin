// @ts-ignore
import { Parser, isIdentifierStart, isIdentifierChar, tokTypes, keywordTypes } from 'acorn';

/**
 * Acorn plugin for parsing Endorphin expressions
 */
export default function endorphinJS(P: typeof Parser): typeof Parser {
    return class EndorphinParser extends P {
        input: string;
        pos: number;
        keywords: RegExp;

        readToken(code: number) {
            if (isIdentifierStart(code) || code === 35 /* # */ || code === 64 /* @ */) {
                return this.end_readWord();
            }
            //@ts-ignore
            super.readToken(code);
        }

        /**
         * Reads Endorphin identifier. Unlike JS identifier, this one may start from
         * `#` or `@` and contain dash in name. Also assumes that first character was
         * already checked by `isIdentifierStart` in readToken.
         */
        end_readWord() {
            let ch: number;
            const start = this.pos;
            do {
                ch = this.input.charCodeAt(++this.pos);
            } while (isIdentifierChar(ch) || ch === 45); // '-'

            const value = this.input.slice(start, this.pos);
            const isKeyword = this.keywords.test(value);
            const type = isKeyword ? keywordTypes[value] : tokTypes.name;

            //@ts-ignore
            return this.finishToken(type, value);
        }
    };
}
