import Scanner from '../scanner';
import { ENDTemplate, ParsedTag, ENDPartial } from '../ast';
import { InnerStatement, getDirective } from './utils';
import { tagBody } from '../tag';

/**
 * Consumes top-level <template> statement
 */
export default function templateStatement(scanner: Scanner, openTag: ParsedTag, next: InnerStatement): ENDTemplate | ENDPartial {
    const body = tagBody(scanner, openTag, next);
    const partial = getDirective(openTag, 'partial');

    if (partial) {
        return {
            type: 'ENDPartial',
            id: partial.name,
            params: openTag.attributes,
            body,
            ...scanner.loc(openTag.start)
        } as ENDPartial;
    }

    return {
        type: 'ENDTemplate',
        body,
        ...scanner.loc(openTag.start)
    } as ENDTemplate;
}
