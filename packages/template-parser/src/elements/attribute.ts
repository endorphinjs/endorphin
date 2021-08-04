import Scanner from '../scanner';
import { ENDAttributeStatement, ParsedTag } from '../ast';
import { emptyBody } from '../tag';

/**
 * Consumes <attribute> statement
 * @param scanner
 * @param openTag
 */
export default function attributeStatement(scanner: Scanner, openTag: ParsedTag): ENDAttributeStatement {
    // TODO extract class directives
    emptyBody(scanner, openTag);
    return {
        type: 'ENDAttributeStatement',
        start: openTag.start,
        end: openTag.end,
        attributes: openTag.attributes,
        directives: openTag.directives,
        loc: openTag.loc
    };
}
