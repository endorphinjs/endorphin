import { ENDElement, ENDAttributeStatement, ENDAttribute, ENDDirective, ENDAttributeName } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import { isIdentifier } from '../lib/utils';

type ContentAttributes = ENDAttribute | ENDDirective;

export default class SetAttributesEntity extends Entity {
    constructor(readonly node: ENDElement | ENDAttributeStatement, readonly state: CompileState) {
        super('attrs', state);
    }
}

/**
 * Returns list of attributes and directives from given element that affect DOM
 * attributes
 */
function getContentAttributes(node: ENDElement | ENDAttributeStatement): ContentAttributes[] {
    const isSlot = node.type === 'ENDElement' && node.name.name === 'slot';

    const attributes = node.attributes
        .filter(attr => !isSlot || attrName(attr.name) !== 'name') as ContentAttributes[];

    const directives = node.directives
        .filter(dir => dir.prefix === 'class') as ContentAttributes[];

    return attributes.concat(directives);
}

function attrName(name: ENDAttributeName): string {
    return isIdentifier(name) ? name.name : '';
}
