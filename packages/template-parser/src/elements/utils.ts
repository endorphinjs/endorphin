import Scanner from '../scanner';
import { toCharCodes, eatSection, isSpace, isLiteral, isIdentifier } from '../utils';
import { LiteralValue, ENDStatement, ENDAttribute, ParsedTag, ENDElement, ENDAttributeStatement, ENDDirective } from '../ast';
import { ENDCompileError } from '../syntax-error';

const cdataOpen = toCharCodes('<![CDATA[');
const cdataClose = toCharCodes(']]>');
const commentOpen = toCharCodes('<!--');
const commentClose = toCharCodes('-->');
const piOpen = toCharCodes('<?');
const piClose = toCharCodes('?>');

/**
 * A prefix for Endorphin element and attribute names
 */
export const prefix = 'e';
const nsPrefix = prefix + ':';

export type InnerStatement = (scanner: Scanner, openTag: ParsedTag, next?: InnerStatement) => ENDStatement;

/**
 * Consumes XML sections that can be safely ignored by Endorphin
 */
export function ignored(scanner: Scanner, space?: boolean): boolean {
    return eatSection(scanner, cdataOpen, cdataClose)
        || eatSection(scanner, piOpen, piClose)
        || eatSection(scanner, commentOpen, commentClose, true)
        || (space && scanner.eatWhile(isSpace));
}

/**
 * Returns control statement name from given tag name if possible
 * @param name Tag name
 */
export function getControlName(name: string): string {
    if (name.startsWith(nsPrefix)) {
        return name.slice(nsPrefix.length);
    }

    if (name.startsWith('partial:')) {
        return 'partial';
    }

    return null;
}

/**
 * Returns name of given parsed tag
 */
export function tagName(tag: ParsedTag): string {
    return tag.name.name;
}

/**
 * Returns attribute with given name from tag name definition, if any
 */
export function getAttr(elem: ParsedTag | ENDElement | ENDAttributeStatement, name: string): ENDAttribute {
    return elem.attributes.find(attr => isIdentifier(attr.name) && attr.name.name === name);
}

/**
 * Returns value of attribute with given name from tag name definition, if any
 */
export function getAttrValue(tag: ParsedTag | ENDElement | ENDAttributeStatement, name: string): LiteralValue {
    const attr = getAttr(tag, name);
    if (attr && isLiteral(attr.value)) {
        return attr.value.value;
    }
}

/**
 * Returns value of attribute with given name from tag name definition, if any
 */
export function getAttrValueIfLiteral(tag: ParsedTag, name: string): LiteralValue {
    const attr = getAttr(tag, name);
    if (attr) {
        if (isLiteral(attr.value)) {
            return attr.value.value;
        }

        throw new ENDCompileError(`Expecting literal value of ${name} attribute in <${tagName(tag)}> tag`, attr.value);
    }
}

/**
 * Returns directive with given prefix and name from tag name definition, if any
 */
export function getDirective(tag: ParsedTag, dirPrefix: string, name?: string): ENDDirective {
    return tag.directives.find(dir => dir.prefix === dirPrefix && (!name || dir.name === name));
}

/**
 * Returns list of all valid attributes from given tag, e.g. all attributes
 * except ones that have special meaning to Endorphin compiler
 */
export function getAttributes(tag: ParsedTag): ENDAttribute[] {
    return tag.attributes.filter(attr => isIdentifier(attr.name) ? !attr.name.name.startsWith(nsPrefix) : true);
}

/**
 * Check if `tag` element contains attribute with given name and returns it. If not,
 * throws exception
 */
export function expectAttribute(scanner: Scanner, tag: ParsedTag, name: string): ENDAttribute {
    const attr = getAttr(tag, name);
    if (!attr) {
        throw scanner.error(`Expecting "${name}" attribute in <${tagName(tag)}> element`, tag);
    }

    return attr;
}

export function expectAttributeExpression(scanner: Scanner, tag: ParsedTag, name: string): ENDAttribute {
    const attr = expectAttribute(scanner, tag, name);
    assertExpression(scanner, attr);
    return attr;
}

export function expectAttributeLiteral(scanner: Scanner, tag: ParsedTag, name: string): ENDAttribute {
    const attr = expectAttribute(scanner, tag, name);
    assertLiteral(scanner, attr);
    return attr;
}

/**
 * Check if value of given attribute is an expression. If not, throws exception
 */
export function assertExpression(scanner: Scanner, attr: ENDAttribute | ENDDirective): void {
    if (attr.value.type !== 'Program') {
        let attrName: string;
        if (attr.type === 'ENDDirective') {
            attrName = `${attr.prefix}:${attr.name}`;
        } else if (isIdentifier(attr.name)) {
            attrName = attr.name.name;
        }

        throw scanner.error(`Expecting expression as${attrName ? ` "${attrName}"` : ''} attribute value`, attr);
    }
}

/**
 * Check if value of given attribute is a literal. If not, throws exception
 */
export function assertLiteral(scanner: Scanner, attr: ENDAttribute): void {
    if (!isLiteral(attr.value)) {
        const attrName: string = isIdentifier(attr.name) ? attr.name.name : null;
        throw scanner.error(`Expecting string literal as${attrName ? ` "${attrName}"` : ''} attribute value`, attr);
    }
}
