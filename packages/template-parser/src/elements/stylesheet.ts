import Scanner from '../scanner';
import { ParsedTag, ENDStylesheet, Literal } from '../ast';
import { expectAttributeLiteral, getAttrValueIfLiteral, tagName } from './utils';
import { emptyBody, tagText } from '../tag';

const defaultMIME = 'text/css';

export default function stylesheetStatement(scanner: Scanner, openTag: ParsedTag): ENDStylesheet {
    if (tagName(openTag) === 'link') {
        // Process <link rel="stylesheet" />
        const href = expectAttributeLiteral(scanner, openTag, 'href').value as Literal;
        emptyBody(scanner, openTag);

        return {
            type: 'ENDStylesheet',
            mime: getMIME(openTag),
            url: String(href.value).trim(),
            ...scanner.loc(openTag.start)
        };
    }

    // Process <style> tag
    const text = tagText(scanner, openTag);
    if (text && text.value && !/^\s+$/.test(String(text.value))) {
        return {
            type: 'ENDStylesheet',
            mime: getMIME(openTag),
            content: String(text.value),
            url: scanner.url,
            ...scanner.loc(openTag.start)
        };
    }
}

function getMIME(tag: ParsedTag): string {
    const mime = getAttrValueIfLiteral(tag, 'type');
    return mime ? String(mime).trim() : defaultMIME;
}
