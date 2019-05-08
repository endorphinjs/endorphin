import Scanner from '../scanner';
import { ENDAttributeStatement, ParsedTag } from '../ast';
import { InnerStatement } from './utils';
import { emptyBody } from '../tag';

/**
 * Consumes <attribute> statement
 * @param scanner
 * @param openTag
 */
export default function attributeStatement(scanner: Scanner, openTag: ParsedTag, next?: InnerStatement): ENDAttributeStatement {
    // TODO extract class directives
    emptyBody(scanner, openTag);
    return {
        type: 'ENDAttributeStatement',
        attributes: openTag.attributes,
        directives: openTag.directives,
        loc: openTag.loc
    };
}
