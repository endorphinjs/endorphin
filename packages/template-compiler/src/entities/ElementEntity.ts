import {
    ENDElement, ENDTemplate, ENDStatement, ENDAttribute, Literal, ENDAttributeValue,
    ENDDirective, Identifier, Program
} from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import Entity from './Entity';
import { compileAttributeValue } from './AttributeEntity';
import ComponentMountEntity from './ComponentMountEntity';
import InjectorEntity from './InjectorEntity';
import TextEntity from './TextEntity';
import UsageStats from '../lib/UsageStats';
import CompileState from '../lib/CompileState';
import { isElement, isExpression, isLiteral, sn, isIdentifier, qStr, getControlName, getAttrValue, propSetter } from '../lib/utils';
import { ENDCompileError } from '../lib/error';
import ElementStats from '../lib/ElementStats';
import { Chunk, ChunkList } from '../types';
import generateExpression from '../expression';

const dynamicContent = new Set(['ENDIfStatement', 'ENDChooseStatement', 'ENDForEachStatement']);

export default class ElementEntity extends Entity {
    injectorEntity: InjectorEntity;
    readonly injectorUsage = new UsageStats();
    readonly stats?: ElementStats;

    /** Indicates current entity is a *registered* DOM component */
    isComponent: boolean = false;

    /** Whether element contains partials */
    hasPartials: boolean;

    /** Whether element contents is static */
    isStaticContent: boolean = true;

    /**
     * List of element’s attribute names whose values are expressions,
     * e.g. `attr={foo}` or `attr="foo {bar}"`
     */
    dynamicAttributes: Set<string> = new Set();

    /** List of element’s events which can be updated in runtime */
    dynamicEvents: Set<string> = new Set();

    /** Whether element contains attribute expressions, e.g. `{foo}="bar"` */
    attributeExpressions: boolean;

    animateIn?: ENDAttributeValue;
    animateOut?: ENDAttributeValue;

    private slotMarks: { [slotName: string]: string } = {};
    private dynAttrs?: Entity;
    private dynEvents?: Entity;

    constructor(readonly node: ENDElement | ENDTemplate | null, readonly state: CompileState) {
        super(node && isElement(node) ? node.name.name : 'target', state);
        if (node) {
            this.stats = new ElementStats(node);
            this.isStaticContent = true;
            this.collectStats();
            if (this.stats.hasPartials) {
                this.mountPendingAttributes();
                this.mountPendingEvents();
            }
            if (isElement(node)) {
                this.isComponent = state.isComponent(node)
                    || getControlName(node.name.name) === 'self';
            }
        } else {
            // Empty node means we’re in element defined in outer block
            // (for example, in conditional content block). In this case,
            // we should always use injector to fill contents, which shall be
            // passed as argument to block function
            this.isStaticContent = false;
            this.injectorEntity = new InjectorEntity('injector', state, true);
        }
    }

    /** Symbol for referencing element’s injector */
    get injector(): SourceNode {
        const { state } = this;
        this.injectorUsage.use(state.renderContext);

        if (!this.injectorEntity) {
            // First time injector usage. Create entity which will mount it
            this.injectorEntity = new InjectorEntity('inj', state)
                .setMount(() => this.isComponent
                    // For components, contents must be redirected into inner input injector
                    ? sn([this.getSymbol(), '.componentModel.input'])
                    : state.runtime('createInjector', [this.getSymbol()]));
            this.children.unshift(this.injectorEntity);
        }

        // In case of child block, we should keep symbol as standalone, e.g. create
        // no local references since injector is an argument
        return this.injectorEntity.getSymbol();
    }

    /** Indicates that element context should use injector to operate */
    get usesInjector(): boolean {
        return this.injectorEntity != null;
    }

    /** Entity for receiving pending attributes */
    get pendingAttributes(): Entity {
        if (!this.dynAttrs) {
            this.mountPendingAttributes();
        }

        return this.dynAttrs;
    }

    /** Entity for receiving pending events */
    get pendingEvents(): Entity {
        if (!this.dynEvents) {
            this.mountPendingEvents();
        }

        return this.dynEvents;
    }

    get hasPendingAttributes(): boolean {
        return !!this.dynAttrs;
    }

    get hasPendingEvents(): boolean {
        return !!this.dynEvents;
    }

    /**
     * Returns slot update symbol for given name
     */
    slotMark(slot: string): string {
        if (!(slot in this.slotMarks)) {
            this.slotMarks[slot] = this.state.slotSymbol();
        }

        return `${this.state.scope}.${this.slotMarks[slot]}`;
    }

    /**
     * Check if given attribute name is dynamic, e.g. can be changed by nested
     * statements
     */
    isDynamicAttribute(attr: ENDAttribute): boolean {
        const { stats } = this;

        if (stats.hasPartials) {
            return true;
        }

        if (isIdentifier(attr.name)) {
            const name = attr.name.name;
            return name === 'class'
                ? this.hasDynamicClass()
                : stats.isDynamicAttribute(attr.name.name);
        }

        return false;
    }

    /**
     * Check if given directive is dynamic
     */
    isDynamicDirective(prefix: string, name: string): boolean {
        return this.stats.isDynamicDirective(prefix, name);
    }

    /**
     * Check if current element contains dynamic class names
     */
    hasDynamicClass(): boolean {
        return this.stats.hasDynamicClass();
    }

    add(item: Entity) {
        if ((item instanceof ElementEntity || item instanceof TextEntity) && item.code.mount) {
            item.setMount(() =>
                this.isStaticContent && !this.isComponent ? this.addDOM(item) : this.addInjector(item));
        }

        super.add(item);
    }

    /**
     * Sets mount code that creates current element
     * @param text If given, uses shortcut function for creating element with
     * given text value
     */
    create(text?: Literal) {
        const { state, node } = this;
        if (isElement(node)) {
            this.setMount(() => {
                const elemName = node.name.name;
                const cssScope = state.cssScope;

                if (getControlName(elemName) === 'self') {
                    // Create component which points to itself
                    return state.runtime('createComponent', [`${state.host}.nodeName`, `${state.host}.componentModel.definition`, state.host], node);
                }

                if (this.isComponent) {
                    // Create component
                    return state.runtime('createComponent', [qStr(elemName), state.getComponent(node), state.host], node);
                }

                if (elemName === 'slot') {
                    // Create slot
                    const slotName = (getAttrValue(node, 'name') as string) || '';
                    return state.runtime('createSlot', [state.host, qStr(slotName), cssScope], node);
                }

                // Create plain DOM element
                const nodeName = getNodeName(elemName);
                const nsSymbol = state.namespace(nodeName.ns);

                if (text) {
                    const textValue = qStr(text.value as string);
                    return nsSymbol
                        ? state.runtime('elemNSWithText', [qStr(nodeName.name), textValue, nsSymbol, cssScope], node)
                        : state.runtime('elemWithText', [qStr(elemName), textValue, cssScope], node);
                }

                return nsSymbol
                    ? state.runtime('elemNS', [qStr(nodeName.name), nsSymbol, cssScope], node)
                    : state.runtime('elem', [qStr(elemName), cssScope], node);
            });
        }
    }

    /**
     * Adds entity to mount, update and unmount component
     * Since component should be mounted and updated *after* it’s
     * content was rendered, we should add mount and update code
     * as a separate entity after element content
     */
    mountComponent() {
        this.add(new ComponentMountEntity(this, this.state));

        // Add empty source node to skip automatic symbol nulling
        // in unmount function
        this.setUnmount(() => sn());
    }

    /**
     * Adds entity to update incoming slot data
     */
    markSlotUpdate() {
        const { state, slotMarks } = this;
        Object.keys(slotMarks).forEach(slot => {
            this.add(state.entity({
                update: () => sn([state.runtime('updateIncomingSlot', [this.getSymbol(), qStr(slot), this.slotMark(slot)])])
            }));
        });
    }

    /**
     * Adds entity to finalize attributes of current element
     */
    finalizeAttributes() {
        if (this.hasPendingAttributes) {
            // There are pending dynamic attributes
            const { state } = this;
            let noNS = this.stats.hasDynamicClass();
            let withNS = false;

            if (this.stats.hasPartials) {
                noNS = withNS = true;
            } else {
                this.stats.attributeNames().forEach(attrName => {
                    const m = attrName.match(/^([\w\-]+):/);
                    if (m && m[1] !== 'xmlns') {
                        withNS = true;
                    } else {
                        noNS = true;
                    }
                });
            }

            // Check which types of attributes we have to finalize
            const ent = state.entity({
                shared: () => {
                    const output = sn();
                    if (noNS) {
                        output.add(state.runtime('finalizeAttributes', [this.dynAttrs.getSymbol()]));
                    }

                    if (withNS) {
                        output.add(state.runtime('finalizeAttributesNS', [this.dynAttrs.getSymbol()]));
                    }

                    return output.join(' | ');
                }
            });

            this.add(state.markSlot(ent));
        }
    }

    /**
     * Adds entity to finalize attributes of current element
     */
    finalizeEvents() {
        if (this.hasPendingEvents) {
            const { state } = this;
            this.add(state.entity({
                shared: () => state.runtime('finalizePendingEvents', [this.dynEvents.getSymbol()]),
            }));
        }
    }

    /**
     * Adds entity to set named ref to current element
     */
    setRef(refName: string | Program) {
        const { state } = this;
        const { refStats } = state;

        if (refStats.isDynamic || (typeof refName === 'string' && refStats.refs[refName].multiple)) {
            // There are dynamic refs in current template or current ref is used
            // for multiple element: must be added as pending
            this.add(state.entity({
                shared: () => {
                    const ref: Chunk = typeof refName === 'string'
                        ? qStr(refName)
                        : generateExpression(refName, state);
                    return state.runtime('setPendingRef', [state.pendingRefs.getSymbol(), ref, this.getSymbol()]);
                }
            }));
        } else if (typeof refName === 'string') {
            // NB if `refName` is a program, it will be rendered via dynamic branch
            const nameArg = qStr(refName);
            const ent = state.entity({
                mount: () => state.runtime('setRef', [state.host, nameArg, this.getSymbol()])
            });
            if (refStats.refs[refName].conditional) {
                ent.setUnmount(() => state.runtime('removeRef', [state.host, nameArg]));
            }

            this.add(ent);
        }
    }

    /**
     * Returns map of static props of current element
     */
    getStaticProps(): Map<Chunk, Chunk> {
        const props: Map<Chunk, Chunk> = new Map();

        if (isElement(this.node)) {
            const { attributes, directives } = this.node;
            const { state } = this;

            attributes.forEach(attr => {
                if (!this.isDynamicAttribute(attr)) {
                    props.set(objectKey(attr.name, this.state), compileAttributeValue(attr.value, state, 'component'));
                }
            });

            directives.forEach(dir => {
                if (dir.prefix === 'partial') {
                    const value = compileAttributeValue(dir.value, state, 'component');
                    props.set(
                        propSetter(`${dir.prefix}:${dir.name}`),
                        state.runtime('assign', [`{ ${state.host} }`, sn([`${state.partials}[`, value, ']'])])
                    );
                }
            });
        }

        return props;
    }

    /**
     * Attaches given DOM entity to current element via DOM
     */
    private addDOM(entity: Entity): SourceNode {
        return this.state.runtime('appendChild', [this.getSymbol(), entity.code.mount]);
    }

    /**
     * Attaches given DOM entity to current element via injector
     */
    private addInjector(entity: Entity): SourceNode {
        const args: ChunkList = [this.injector, entity.code.mount];
        const slotName = this.getSlotContext(entity);

        if (slotName != null) {
            args.push(qStr(slotName));
        }

        return this.state.runtime('insert', args);
    }

    /**
     * Detects and returns name of current context slot.
     * Returns `null` if there’s no slot context
     */
    private getSlotContext(entity: Entity): string | null {
        // Get actual context element
        const { receiver } = this.state;

        if (receiver && isElement(receiver.node)) {
            if (receiver.isComponent && entity instanceof ElementEntity && entity.node && isElement(entity.node)) {
                // Injecting entity as top-level item of component
                return getAttrValue(entity.node, 'slot') as string || '';
            }

            if (receiver.node.name.name === 'slot') {
                // Injecting entity as top-level item of `<slot>` element
                return getAttrValue(receiver.node, 'name') as string || '';
            }

        }

        return null;
    }

    private collectStats() {
        // Collect stats about given element
        const { node } = this;

        if (isElement(node)) {
            this.attributesStats(node.attributes, true);
            this.directiveStats(node.directives, true);
        }

        walk(node, child => {
            if (child.type === 'ENDPartialStatement') {
                this.hasPartials = true;
                this.isStaticContent = false;
            } else if (child.type === 'ENDAddClassStatement') {
                this.dynamicAttributes.add('class');
            } else if (child.type === 'ENDAttributeStatement') {
                // Attribute statements in top-level element context are basically
                // the same as immediate attributes of element
                this.attributesStats(child.attributes);
                this.directiveStats(child.directives);
            }

            if (dynamicContent.has(child.type)) {
                this.isStaticContent = false;
                return true;
            }
        });
    }

    private attributesStats(attributes: ENDAttribute[], isElem?: boolean) {
        attributes.forEach(attr => {
            if (isExpression(attr.name)) {
                this.attributeExpressions = true;
            } else if (!isElem || (attr.value && !isLiteral(attr.value))) {
                this.dynamicAttributes.add(attr.name.name);
            }
        });
    }

    private directiveStats(directives: ENDDirective[], isElem?: boolean) {
        directives.forEach(directive => {
            if (directive.prefix === 'on' && !isElem) {
                this.dynamicEvents.add(directive.name);
            } else if (directive.prefix === 'class') {
                this.dynamicAttributes.add('class');
            } else if (directive.prefix === 'animate') {
                // Currently, we allow animations in element only
                if (isElem) {
                    if (directive.name === 'in') {
                        this.animateIn = directive.value;
                    } else if (directive.name === 'out') {
                        this.animateOut = directive.value;
                    } else {
                        throw new ENDCompileError(`Unknown "${directive.name}" animation directive`, directive);
                    }
                } else {
                    throw new ENDCompileError(`Animations are allowed in element only`, directive);
                }
            }
        });
    }

    private mountPendingAttributes() {
        this.dynAttrs = this.state.entity('attrSet', {
            mount: () => this.state.runtime(this.isComponent ? 'pendingProps' : 'attributeSet', [this.getSymbol()]),
        });

        this.add(this.dynAttrs);
    }

    private mountPendingEvents() {
        const { state } = this;
        this.dynEvents = state.entity('events', {
            mount: () => state.runtime('pendingEvents', [this.state.host, this.getSymbol()]),
            unmount: ent => ent.unmount('detachPendingEvents')
        });

        this.add(this.dynEvents);
    }
}

/**
 * Walks over contents of given element and invokes `callback` for each body item.
 * A `callback` must return `true` if walker should visit contents of context node,
 * otherwise it will continue to next node
 */
function walk(elem: ENDStatement | ENDTemplate, callback: (node: ENDStatement) => boolean): void {
    const visit = (node: ENDStatement): void => {
        if (callback(node) === true) {
            walk(node, callback);
        }
    };

    if (elem.type === 'ENDElement' || elem.type === 'ENDTemplate') {
        elem.body.forEach(visit);
    } else if (elem.type === 'ENDIfStatement') {
        elem.consequent.forEach(visit);
    } else if (elem.type === 'ENDChooseStatement') {
        elem.cases.forEach(branch => branch.consequent.forEach(visit));
    } else if (elem.type === 'ENDForEachStatement') {
        elem.body.forEach(visit);
    }
}

export function getNodeName(localName: string): { ns?: string, name: string } {
    const parts = localName.split(':');
    let ns: string;
    let name: string;
    if (parts.length > 1) {
        ns = parts.shift();
        name = parts.join(':');
    } else {
        name = localName;
    }

    return { ns, name };
}

function objectKey(node: Identifier | Program, state: CompileState) {
    return propSetter(isExpression(node) ? generateExpression(node, state) : node.name);
}
