import Scanner from '../scanner';
import { ENDForEachStatement, ParsedTag, Program } from '../ast';
import { getAttr, InnerStatement, expectAttributeExpression, assertExpression } from './utils';
import { tagBody } from '../tag';

/**
 * Consumes <for-each> statement
 * @param scanner
 * @param openTag
 */
export default function forEachStatement(scanner: Scanner, openTag: ParsedTag, next: InnerStatement): ENDForEachStatement {
    const select = expectAttributeExpression(scanner, openTag, 'select');
    const key = getAttr(openTag, 'key');
    if (key) {
        assertExpression(scanner, key);
    }

    // TODO parse attributes for internal variables
    return {
        type: 'ENDForEachStatement',
        select: select.value as Program,
        key: key ? key.value as Program : null,
        body: tagBody(scanner, openTag, next),
        ...scanner.loc(openTag.start)
    };
}
