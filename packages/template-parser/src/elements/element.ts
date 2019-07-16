import Scanner from '../scanner';
import { ENDElement, ParsedTag, ENDStatement } from '../ast';
import { InnerStatement, assertExpression } from './utils';
import { tagBody } from '../tag';

/**
 * Consumes regular output element
 * @param scanner
 * @param openTag
 */
export default function elementStatement(scanner: Scanner, openTag: ParsedTag, next: InnerStatement): ENDStatement {
    // Consume as regular tag
    const elem: ENDElement = {
        type: 'ENDElement',
        name: openTag.name,
        component: openTag.name.name.includes('-'),
        ref: openTag.ref,
        attributes: openTag.attributes,
        directives: openTag.directives,
        body: tagBody(scanner, openTag, next),
        ...scanner.loc(openTag.start)
    };

    // Expand directives in parsed element: replaces some known directives with AST nodes
    const ctx: ENDStatement = elem;

    for (let i = elem.directives.length - 1; i >= 0; i--) {
        const dir = elem.directives[i];

        if (dir.prefix === 'class' && dir.value !== null) {
            assertExpression(scanner, dir);
        }
    }

    return ctx;
}
