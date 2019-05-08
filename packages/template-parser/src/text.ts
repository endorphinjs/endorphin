import Scanner from './scanner';
import { Literal } from './ast';
import { EXPRESSION_START } from './expression';
import { TAG_START, TAG_CLOSE, nameStartChar } from './utils';

/**
 * Consumes text token from given stream
 */
export default function text(scanner: Scanner): Literal {
    const start = scanner.pos;
    while (!scanner.eof() && !isTextBound(scanner)) {
        scanner.next();
    }

    if (start !== scanner.pos) {
        scanner.start = start;
        return {
            type: 'Literal',
            value: scanner.current(),
            ...scanner.loc()
        };
    }
}

/**
 * Check if given stream is at tag start
 */
function isTextBound(scanner: Scanner): boolean {
    const ch = scanner.peek();

    if (ch === EXPRESSION_START) {
        return true;
    }

    // At tag start or just a lone `<` character?
    if (ch === TAG_START) {
        const ch2 = scanner.peekAhead(1);
        return nameStartChar(ch2)
            || ch2 === TAG_CLOSE
            || ch2 === 33 /* ! */
            || ch2 === 63; /* ? */
    }

    return false;
}
