import Scanner from '../scanner';
import { ENDElement, ParsedTag, ENDStatement, ENDAddClassStatement, ENDIfStatement, Program } from '../ast';
import { InnerStatement, assertExpression } from './utils';
import { literal } from '../utils';
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

        if (dir.prefix === 'class') {
            // Expand `class:name={expr} directives
            const className = literal(dir.name);
            className.loc = dir.loc;
            const classStatement: ENDAddClassStatement = {
                type: 'ENDAddClassStatement',
                tokens: [className],
                ...scanner.loc(dir.start, dir.end)
            };

            if (dir.value !== null) {
                assertExpression(scanner, dir);
                elem.body.unshift({
                    type: 'ENDIfStatement',
                    test: dir.value as Program,
                    consequent: [classStatement],
                    ...scanner.loc(dir.start, dir.end)
                } as ENDIfStatement);
            } else {
                elem.body.unshift(classStatement);
            }
            elem.directives.splice(i, 1);
        }
    }

    return ctx;
}
