import Scanner from '../scanner';
import { ParsedTag, ENDScript } from '../ast';
import { getAttrValueIfLiteral } from './utils';
import { tagText } from '../tag';

const defaultMIME = 'text/javascript';

export default function scriptStatement(scanner: Scanner, openTag: ParsedTag): ENDScript {
    const src = getAttrValueIfLiteral(openTag, 'src');
    const mime = getAttrValueIfLiteral(openTag, 'type');
    const text = tagText(scanner, openTag);
    const hasText = text && text.value && !/^\s+$/.test(String(text.value));

    if (src || hasText) {
        return {
            type: 'ENDScript',
            mime: mime ? String(mime) : defaultMIME,
            content: hasText ? String(text.value) : null,
            url: src ? String(src) : scanner.url,
            ...scanner.loc(openTag.start)
        };
    }
}
