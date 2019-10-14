import { ENDElement, ENDStatement, ENDAttributeStatement } from '@endorphinjs/template-parser';
import { isElement, isIdentifier } from './utils';

export interface AttributeStats {
    attributes: Set<string>;
    events: Set<string>;
}

type VisitorCallback = (node: ENDStatement) => any;

/**
 * Collects attribute stats about given element: attributes, directives, dynamic attributes etc.
 * It assumes that template contents was already optimized with expression hoisting
 */
export default function attributeStats(node: ENDElement): AttributeStats {
    const staticItems: AttributeStats = {
        attributes: new Set(),
        events: new Set()
    };

    const dynamicItems: AttributeStats = {
        attributes: new Set(),
        events: new Set(),
    };

    let hasPartials = false;

    collectStats(node, staticItems);
    walk(node, child => {
        if (child.type === 'ENDPartialStatement') {
            hasPartials = true;
        } else if (child.type === 'ENDAttributeStatement') {
            collectStats(child, dynamicItems);
        } else if (child.type === 'ENDAddClassStatement') {
            dynamicItems.attributes.add('class');
        }
    });

    if (hasPartials) {
        // If we have partials inside current element, we should mark all
        // items as dynamic
        mergeSet(dynamicItems.attributes, staticItems.attributes);
        mergeSet(dynamicItems.events, staticItems.events);
    }

    return dynamicItems;
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
function walk(elem: ENDElement, callback: VisitorCallback): void {
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
