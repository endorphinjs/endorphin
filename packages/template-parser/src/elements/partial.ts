import Scanner from '../scanner';
import { ENDPartialStatement, ParsedTag } from '../ast';
import { getAttributes, tagName } from './utils';
import { tagBody } from '../tag';

const prefix = 'partial:';

/**
 * Consumes <partial> statement
 * @param scanner
 * @param openTag
 */
export default function partialStatement(scanner: Scanner, openTag: ParsedTag): ENDPartialStatement {
    // Ignore partial content, if any
    tagBody(scanner, openTag);

    return {
        type: 'ENDPartialStatement',
        id: tagName(openTag).slice(prefix.length),
        params: getAttributes(openTag),
        ...scanner.loc(openTag.start)
    };
}
