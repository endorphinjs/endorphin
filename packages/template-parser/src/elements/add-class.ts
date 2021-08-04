import Scanner from '../scanner';
import { ENDAddClassStatement, ENDPlainStatement, ParsedTag } from '../ast';
import { ignored, tagName } from './utils';
import expression from '../expression';
import text from '../text';
import { closesTag } from '../tag';

export default function addClassStatement(scanner: Scanner, openTag: ParsedTag): ENDAddClassStatement {
    if (openTag.selfClosing) {
        return;
    }

    const node: ENDAddClassStatement = {
        type: 'ENDAddClassStatement',
        start: openTag.start,
        end: openTag.end,
        tokens: [],
        loc: openTag.loc
    };

    // Consume plain statements only
    let token: ENDPlainStatement;
    while (!scanner.eof() && !closesTag(scanner, openTag)) {
        if (token = expression(scanner) || text(scanner)) {
            node.tokens.push(token);
        } else if (!ignored(scanner)) {
            throw scanner.error(`Unexpected token, <${tagName(openTag)}> must contain text or expressions`);
        }
    }

    return node;
}
