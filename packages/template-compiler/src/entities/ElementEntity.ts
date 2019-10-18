import { ENDElement, ENDTemplate, Literal, ENDAttributeValue, Program } from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import Entity from './Entity';
import InjectorEntity from './InjectorEntity';
import TextEntity from './TextEntity';
import UsageStats from '../lib/UsageStats';
import CompileState from '../lib/CompileState';
import { isElement, sn, qStr, getControlName, getAttrValue, isEvent } from '../lib/utils';
import attributeStats, { ElementStats } from '../lib/attributeStats';
import { Chunk, ChunkList } from '../types';
import generateExpression from '../expression';
import { ENDCompileError } from '../lib/error';
import { ownAttributes, AttributesState, mountPartialOverride } from '../lib/attributes';
import mountEvent from '../lib/events';

export default class ElementEntity extends Entity {
    injectorEntity: InjectorEntity;
    readonly injectorUsage = new UsageStats();
    readonly stats?: ElementStats;

    /** Indicates current entity is a *registered* DOM component */
    isComponent: boolean = false;

    animateIn?: ENDAttributeValue;
    animateOut?: ENDAttributeValue;

    private slotMarks: { [slotName: string]: string } = {};
    private attrState: AttributesState;

    constructor(readonly node: ENDElement | ENDTemplate | null, readonly state: CompileState) {
        super(node && isElement(node) ? node.name.name : 'target', state);
        if (node) {
            this.stats = attributeStats(node);
            if (isElement(node)) {
                this.isComponent = state.isComponent(node)
                    || getControlName(node.name.name) === 'self';

                node.directives.forEach(directive => {
                    if (directive.prefix === 'animate') {
                        // Currently, we allow animations in element only
                        if (directive.name === 'in') {
                            this.animateIn = directive.value;
                        } else if (directive.name === 'out') {
                            this.animateOut = directive.value;
                        } else {
                            throw new ENDCompileError(`Unknown "${directive.name}" animation directive`, directive);
                        }
                    }
                });
            }
        } else {
            // Empty node means we’re in element defined in outer block
            // (for example, in conditional content block). In this case,
            // we should always use injector to fill contents, which shall be
            // passed as argument to block function
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

    /**
     * Receiver for pending attributes, if available
     */
    get pendingAttributes(): Entity | null {
        return this.attrState && this.attrState.receiver;
    }

    /** Entity for receiving pending events */
    get pendingEvents(): Entity | null {
        return this.attrState && this.attrState.eventsReceiver;
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
     * Check if given event is pending, e.g. will be changed in runtime
     */
    isPendingEvent(name: string) {
        return this.stats && this.stats.pendingEvents.has(name);
    }

    add(item: Entity) {
        if ((item instanceof ElementEntity || item instanceof TextEntity) && item.code.mount) {
            item.setMount(() =>
                !this.isComponent && this.stats && this.stats.staticContent
                    ? this.addDOM(item)
                    : this.addInjector(item));
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

    mountAttributes() {
        if (isElement(this.node)) {
            this.attrState = ownAttributes(this, this.stats, this.state);
        }
    }

    mountDirectives() {
        if (isElement(this.node)) {
            const { state } = this;
            this.node.directives.forEach(dir => {
                if (isEvent(dir)) {
                    this.add(mountEvent(dir, this.pendingEvents, this.state));
                } else if (dir.prefix === 'partial' && this.isComponent) {
                    // For components and partials (empty receiver), we should always
                    // use pending attributes
                    this.add(mountPartialOverride(dir, this.pendingAttributes, state));
                }
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
        const props = this.attrState && this.attrState.receiver;
        const { state } = this;

        if (props && (this.attrState.hasExpressionAttrs || this.attrState.hasPendingAttrs)) {
            // There are pending props for current component
            this.add(state.entity({
                mount: () => state.runtime('mountComponent', [this.getSymbol(), props.getSymbol()]),
                update: () => state.runtime('updateComponent', [this.getSymbol(), props.getSymbol()]),
                unmount: () => this.unmount('unmountComponent')
            }));
        } else {
            this.add(state.entity({
                mount: () => {
                    const args: ChunkList = [this.getSymbol()];
                    if (props) {
                        // Shortcut: we can pass static props directly to component
                        // instead of storing it as variable
                        const ix = this.children.indexOf(props);
                        if (ix !== -1) {
                            this.children.splice(ix, 1);
                            args.push(props.code.mount);
                        } else {
                            args.push(props.getSymbol());
                        }
                    }
                    return state.runtime('mountComponent', args);
                },
                unmount: () => this.unmount('unmountComponent')
            }));
        }

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
        if (this.stats.partials || this.attrState.hasPendingAttrs) {
            // There are pending dynamic attributes
            const { state } = this;
            const { receiver, prevReceiver } = this.attrState;

            const ent = state.entity({
                shared: () => {
                    return state.runtime('finalizeAttributes', [
                        this.getSymbol(),
                        receiver.getSymbol(),
                        prevReceiver.getSymbol()
                    ]);
                }
            });

            this.add(state.markSlot(ent));
        }
    }

    /**
     * Adds entity to finalize attributes of current element
     */
    finalizeEvents() {
        if (this.pendingEvents) {
            const { state } = this;
            this.add(state.entity({
                shared: () => state.runtime('finalizePendingEvents', [this.pendingEvents.getSymbol()]),
            }));
        }
    }

    /**
     * Adds entity to set named ref to current element
     */
    setRef(refName: string | Program) {
        const { state } = this;
        const { refStats } = state;
        const refStat = typeof refName === 'string'
            ? refStats.refs[refName]
            : void 0;

        if (refStats.isDynamic || (refStat && (refStat.multiple || refStat.conditional))) {
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
     * If current element is created under namespace, returns it’s namespace URI symbol
     */
    namespace(): string | undefined {
        const { node, state } = this;
        if (isElement(node)) {
            const elemName = node.name.name;
            const nodeName = getNodeName(elemName);
            return state.namespace(nodeName.ns);
        }
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
