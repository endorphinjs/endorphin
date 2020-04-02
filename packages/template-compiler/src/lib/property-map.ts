interface AttrLookup {
    [attrName: string]: AttrLookupValue;
}

interface AttrLookupValue {
    /** Property name that should be used for given attribute name */
    property_name?: string;
    /** List of elements for which current property can be applied */
    applies_to?: string[];
}

/**
 * Attribute-to-property lookup. Borrowed from Svelte:
 * https://github.com/sveltejs/svelte/blob/b6d80f485af9b2e383044efe3466e684c99620af/src/compiler/compile/render_dom/wrappers/Element/Attribute.ts#L262
 */
const attributeLookup: AttrLookup = {
    allowfullscreen: { property_name: 'allowFullscreen', applies_to: ['iframe'] },
    allowpaymentrequest: { property_name: 'allowPaymentRequest', applies_to: ['iframe'] },
    async: { applies_to: ['script'] },
    autofocus: { applies_to: ['button', 'input', 'keygen', 'select', 'textarea'] },
    autoplay: { applies_to: ['audio', 'video'] },
    checked: { applies_to: ['input'] },
    controls: { applies_to: ['audio', 'video'] },
    default: { applies_to: ['track'] },
    defer: { applies_to: ['script'] },
    disabled: {
        applies_to: [
            'button',
            'fieldset',
            'input',
            'keygen',
            'optgroup',
            'option',
            'select',
            'textarea',
        ],
    },
    formnovalidate: { property_name: 'formNoValidate', applies_to: ['button', 'input'] },
    hidden: {},
    indeterminate: { applies_to: ['input'] },
    ismap: { property_name: 'isMap', applies_to: ['img'] },
    loop: { applies_to: ['audio', 'bgsound', 'video'] },
    multiple: { applies_to: ['input', 'select'] },
    muted: { applies_to: ['audio', 'video'] },
    nomodule: { property_name: 'noModule', applies_to: ['script'] },
    novalidate: { property_name: 'noValidate', applies_to: ['form'] },
    open: { applies_to: ['details', 'dialog'] },
    playsinline: { property_name: 'playsInline', applies_to: ['video'] },
    readonly: { property_name: 'readOnly', applies_to: ['input', 'textarea'] },
    required: { applies_to: ['input', 'select', 'textarea'] },
    reversed: { applies_to: ['ol'] },
    selected: { applies_to: ['option'] },
    value: {
        applies_to: [
            'button',
            'option',
            'input',
            'li',
            'meter',
            'progress',
            'param',
            'select',
            'textarea',
        ],
    },
    srcobject: { property_name: 'srcObject', applies_to: ['audio', 'video'] }
};

/**
 * Returns property name that should be used instead of given element
 */
export default function getProperty(elemName: string, attrName: string): string | null {
    attrName = attrName.toLowerCase();

    const mapping = attributeLookup[attrName];
    if (mapping && (!mapping.applies_to || mapping.applies_to.includes(elemName))) {
        return mapping.property_name || attrName;
    }

    return null;
}
