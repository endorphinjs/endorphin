import Scanner from '../scanner';
import { openTag, closesTag, tagBody } from '../tag';
import { ENDChooseStatement, Program, ParsedTag, ENDAttribute } from '../ast';
import { ignored, getControlName, InnerStatement, prefix, expectAttributeExpression, tagName } from './utils';

export default function chooseStatement(conditionTag: string, fallbackTag: string) {
    return (scanner: Scanner, open: ParsedTag, next: InnerStatement) =>
        parse(scanner, open, conditionTag, fallbackTag, next);
}

function parse(scanner: Scanner, open: ParsedTag, conditionTag: string, fallbackTag: string, next: InnerStatement): ENDChooseStatement {
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
            if (name !== conditionTag && name !== fallbackTag) {
                const tag1 = `<${prefix}:${conditionTag}>`;
                const tag2 = `<${prefix}:${fallbackTag}>`;
                throw scanner.error(`Unexpected <${tagName(tagEntry)}> tag, expecting ${tag1} or ${tag2}`, tagEntry);
            }

            if (finished) {
                throw scanner.error(`Unexpected <${tagName(tagEntry)}> after <${prefix}:${fallbackTag}>`, tagEntry);
            }

            let test: ENDAttribute;
            if (name === conditionTag) {
                test = expectAttributeExpression(scanner, tagEntry, 'test');
            } else if (name === fallbackTag) {
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
