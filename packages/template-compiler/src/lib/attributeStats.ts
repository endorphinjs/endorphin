import { ENDElement, ENDStatement, ENDAttributeStatement, ENDTemplate } from '@endorphinjs/template-parser';
import { isElement, isIdentifier } from './utils';

export interface AttributeStats {
    attributes: Set<string>;
    events: Set<string>;
}

export interface ElementStats {
    /** Whether element contains partials */
    partials: boolean;

    /** Whether element’s content is static, e.g. has not conditional contents inside */
    staticContent: boolean;

    /** List of attributes which values can be changed by inner blocks */
    pendingAttributes: Set<string>;

    /** List of events which listeners can be changed by inner blocks */
    pendingEvents: Set<string>;
}

type VisitorCallback = (node: ENDStatement) => any;

/**
 * Collects attribute stats about given element: attributes, directives, dynamic attributes etc.
 * It assumes that template contents was already optimized with expression hoisting
 */
export default function attributeStats(node: ENDElement | ENDTemplate): ElementStats {
    const staticItems: AttributeStats = {
        attributes: new Set(),
        events: new Set()
    };

    const pendingItems: AttributeStats = {
        attributes: new Set(),
        events: new Set(),
    };

    let partials = false;
    let staticContent = true;

    if (isElement(node)) {
        collectStats(node, staticItems);
    }
    walk(node, child => {
        if (child.type === 'ENDPartialStatement') {
            partials = true;
            staticContent = false;
        } else if (child.type === 'ENDAttributeStatement') {
            collectStats(child, pendingItems);
        } else if (child.type === 'ENDAddClassStatement') {
            pendingItems.attributes.add('class');
        } else if (child.type === 'ENDIfStatement' || child.type === 'ENDChooseStatement' || child.type === 'ENDForEachStatement') {
            staticContent = false;
        }
    });

    if (partials) {
        // If we have partials inside current element, we should mark all
        // items as pending
        mergeSet(pendingItems.attributes, staticItems.attributes);
        mergeSet(pendingItems.events, staticItems.events);
    }

    return {
        pendingAttributes: pendingItems.attributes,
        pendingEvents: pendingItems.events,
        partials,
        staticContent
    };
}

function collectStats(node: ENDElement | ENDAttributeStatement, stats: AttributeStats) {
    node.attributes.forEach(attr => {
        if (isIdentifier(attr.name)) {
            stats.attributes.add(attr.name.name);
        }
    });

    node.directives.forEach(dir => {
        if (dir.prefix === 'on') {
            stats.events.add(dir.name);
        }
    });
}

/**
 * Walks over contents of given element and invokes `callback` for each body item.
 * Content visitor is restricted to element bounds
 */
function walk(elem: ENDElement | ENDTemplate, callback: VisitorCallback): void {
    const visit = (node: ENDStatement) => {
        // Walk down until element bound
        if (!isElement(node)) {
            callback(node);

            const content = nextContent(node);
            if (content) {
                content.forEach(visit);
            }
        }
    };

    elem.body.forEach(visit);
}

function nextContent(node: ENDStatement): ENDStatement[] | void {
    if (node.type === 'ENDIfStatement') {
        return node.consequent;
    }

    if (node.type === 'ENDChooseStatement') {
        return node.cases.reduce((out, chooseCase) =>
            out.concat(chooseCase.consequent), [] as ENDStatement[]);
    }

    if (node.type === 'ENDForEachStatement') {
        return node.body;
    }
}

function mergeSet<T>(left: Set<T>, right: Set<T>): Set<T> {
    right.forEach(item => left.add(item));
    return left;
}
