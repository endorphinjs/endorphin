import {
    Node, ENDAttribute, ENDDirective, ENDElement, ENDTemplate, Identifier,
    ENDStatement, ENDChooseCase, ENDAddClassStatement
} from '@endorphinjs/template-parser';

type VisitorCallback = (node: ENDStatement, content: ENDStatement[] | void, conditional: boolean) => any;

interface Ref<T = Node> {
    node: T;
    /**
     * Indicates that current ref is applied under some condition, e.g. inside
     * `<e:if>` or `<e:for-each>`
     */
    conditional?: boolean;
}

interface AttributeStats {
    name: string;
    refs: Ref<ENDAttribute>[];
}

interface DirectiveStats {
    prefix: string;
    name: string;
    refs: Ref<ENDDirective>[];
}

export default class ElementStats {
    /** Whether element contains partials */
    hasPartials: boolean;

    /** Whether element contents is static */
    isStaticContent: boolean = true;

    attributes: AttributeStats[] = [];
    directives: DirectiveStats[] = [];
    classNames: Ref<ENDDirective | ENDAddClassStatement>[] = [];

    constructor(readonly node: ENDElement | ENDTemplate) {
        if (isElement(node)) {
            this.attributesStats(node.attributes);
            this.directiveStats(node.directives);
        }

        walk(node, (child, content, conditional) => {
            if (conditional && this.isStaticContent && content && content.some(contentNode)) {
                // Check if there’s content under condition
                this.isStaticContent = false;
            }

            if (child.type === 'ENDPartialStatement') {
                this.hasPartials = true;
                this.isStaticContent = false;
            } else if (child.type === 'ENDAddClassStatement') {
                this.classNames.push({ node: child, conditional });
            } else if (child.type === 'ENDAttributeStatement') {
                this.attributesStats(child.attributes, conditional);
                this.directiveStats(child.directives, conditional);
            }
        });
    }

    /**
     * Returns names of all available element attributes
     */
    attributeNames(): string[] {
        return unique(this.attributes.map(attr => attr.name));
    }

    /**
     * Check if context element has dynamic attributes, e.g. attributes which
     * change value under some condition
     */
    hasDynamicAttributes(): boolean {
        return this.attributes.some(attr => attr.refs.some(isConditionalRef));
    }

    /**
     * Check if context element has dynamic events, e.g. events which
     * change value under some condition
     */
    hasDynamicEvents(): boolean {
        return this.directives.some(dir => dir.prefix === 'on' && dir.refs.some(isConditionalRef));
    }

    /**
     * Check if context element has dynamic class names, e.g. classes which will
     * be added or removed under some top level condition
     */
    hasDynamicClass(): boolean {
        return this.isDynamicAttribute('class')
            || this.classNames.some(isDynamicClass);
    }

    /**
     * Check if given attribute is dynamic
     */
    isDynamicAttribute(name: string): boolean {
        const attr = this.attributes.find(item => item.name === name);
        return attr && attr.refs.some(isConditionalRef);
    }

    /**
     * Check if given attribute is conditional, e.g. all values are set under condition
     */
    isConditionalAttribute(name: string): boolean {
        const attr = this.attributes.find(item => item.name === name);
        return attr && attr.refs.every(isConditionalRef);
    }

    /**
     * Check if given directive is dynamic
     */
    isDynamicDirective(prefix: string, name: string): boolean {
        const dir = this.directives.find(item => item.prefix === prefix && item.name === name);
        return dir && dir.refs.some(isConditionalRef);
    }

    /**
     * Collects stats about attributes
     */
    private attributesStats(attributes: ENDAttribute[], conditional: boolean = false) {
        attributes.forEach(attr => {
            if (isIdentifier(attr.name)) {
                const name = attr.name.name;
                const attrRef = this.attributes.find(item => item.name === name);
                const ref: Ref<ENDAttribute> = { node: attr, conditional };

                if (attrRef) {
                    attrRef.refs.push(ref);
                } else {
                    this.attributes.push({ name, refs: [ref] });
                }
            } else {
                throw new StatsError('Dynamic names in attributes are not supported', attr);
            }
        });
    }

    /**
     * Collect stats about directives
     */
    private directiveStats(directives: ENDDirective[], conditional: boolean = false) {
        directives.forEach(directive => {
            const { prefix, name } = directive;
            const ref: Ref<ENDDirective> = { node: directive, conditional };

            if (prefix === 'class') {
                this.classNames.push(ref);
            } else {
                const dirRef = this.directives.find(item => item.prefix === prefix && item.name === name);
                if (dirRef) {
                    dirRef.refs.push(ref);
                } else {
                    this.directives.push({ prefix, name, refs: [ref] });
                }
            }

        });
    }
}

export class StatsError extends Error {
    constructor(message: string, readonly node: Node) {
        super(message);
    }
}

/**
 * Check if given node is identifier
 */
function isIdentifier(node: Node): node is Identifier {
    return node.type === 'Identifier';
}

/**
 * Check if given AST node is element
 */
function isElement(node: Node): node is ENDElement {
    return node.type === 'ENDElement';
}

/**
 * Walks over contents of given element and invokes `callback` for each body item.
 * Content visitor is restricted to element bounds
 */
function walk(elem: ENDElement | ENDTemplate, callback: VisitorCallback): void {
    let conditional = 0;

    const visit = (node: ENDStatement) => {
        // Reached element bound
        if (!isElement(node)) {
            const content = conditionalContent(node);
            callback(node, content, Boolean(content) || conditional > 0);

            if (content) {
                conditional++;
                content.forEach(visit);
                conditional--;
            }
        }
    };

    elem.body.forEach(visit);
}

function conditionalContent(node: ENDStatement): ENDStatement[] | void {
    if (node.type === 'ENDIfStatement') {
        return node.consequent;
    }

    if (node.type === 'ENDChooseStatement') {
        return node.cases.reduce((out: ENDStatement[], chooseCase: ENDChooseCase) =>
            out.concat(chooseCase.consequent), []);
    }

    if (node.type === 'ENDForEachStatement') {
        return node.body;
    }
}

function contentNode(node: Node): boolean {
    return isElement(node) || node.type === 'Literal' || node.type === 'Program';
}

function isConditionalRef(ref: Ref): boolean {
    return ref.conditional;
}

function isDynamicClass(ref: Ref): boolean {
    return ref.node.type === 'ENDAddClassStatement' || isConditionalRef(ref);
}

function unique<T>(items: T[]): T[] {
    return Array.from(new Set(items));
}
