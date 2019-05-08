import Scanner from '../scanner';
import { ENDIfStatement, ParsedTag, Program } from '../ast';
import { InnerStatement, expectAttributeExpression } from './utils';
import { tagBody } from '../tag';

/**
 * Consumes <if> statement
 * @param scanner
 * @param openTag
 */
export default function ifStatement(scanner: Scanner, openTag: ParsedTag, next: InnerStatement): ENDIfStatement {
    const test = expectAttributeExpression(scanner, openTag, 'test');

    return {
        type: 'ENDIfStatement',
        test: test.value as Program,
        consequent: tagBody(scanner, openTag, next),
        ...scanner.loc(openTag.start)
    };
}
