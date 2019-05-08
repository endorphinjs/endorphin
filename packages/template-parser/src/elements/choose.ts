import Scanner from '../scanner';
import { openTag, closesTag, tagBody } from '../tag';
import { ENDChooseStatement, Program, ParsedTag, ENDAttribute } from '../ast';
import { ignored, getControlName, InnerStatement, prefix, expectAttributeExpression, tagName } from './utils';

/**
 * Consumes <choose> statement
 * @param scanner
 * @param open
 */
export default function chooseStatement(scanner: Scanner, open: ParsedTag, next: InnerStatement): ENDChooseStatement {
    if (open.selfClosing) {
        return;
    }

    const choose: ENDChooseStatement = {
        type: 'ENDChooseStatement',
        cases: [],
        start: open.start
    };
    let finished = false;
    let tagEntry: ParsedTag;

    while (!scanner.eof() && !closesTag(scanner, open)) {
        // Accept <when> and <otherwise> statements only
        if (tagEntry = openTag(scanner)) {
            const name = getControlName(tagName(tagEntry));
            if (name !== 'when' && name !== 'otherwise') {
                throw scanner.error(`Unexpected <${tagName(tagEntry)}> tag, expecting <${prefix}:when> or <${prefix}:otherwise>`, tagEntry);
            }

            if (finished) {
                throw scanner.error(`Unexpected <${tagName(tagEntry)}> after <${prefix}:otherwise>`, tagEntry);
            }

            let test: ENDAttribute;
            if (name === 'when') {
                test = expectAttributeExpression(scanner, tagEntry, 'test');
            } else if (name === 'otherwise') {
                finished = true;
            }

            choose.cases.push({
                type: 'ENDChooseCase',
                test: test && (test.value as Program),
                consequent: tagBody(scanner, tagEntry, next),
                ...scanner.loc(tagEntry.start)
            });
        } else if (!ignored(scanner, true)) {
            throw scanner.error('Unexpected token');
        }
    }

    choose.end = scanner.pos;

    return scanner.ast(choose);
}
