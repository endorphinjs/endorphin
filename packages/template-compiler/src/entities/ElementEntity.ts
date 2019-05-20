import {
    ENDElement, ENDTemplate, ENDStatement, ENDAttribute, Literal, ENDAttributeValue,
    ENDDirective, Identifier, Program, IdentifierContext, Expression, ArrowFunctionExpression
} from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import Entity from './Entity';
import { compileAttributeValue } from './AttributeEntity';
import ComponentMountEntity from './ComponentMountEntity';
import ConditionEntity from './ConditionEntity';
import InjectorEntity from './InjectorEntity';
import InnerHTMLEntity from './InnerHTMLEntity';
import IteratorEntity from './IteratorEntity';
import TextEntity from './TextEntity';
import UsageStats from '../lib/UsageStats';
import CompileState from '../lib/CompileState';
import {
    isElement, isExpression, isLiteral, sn, isIdentifier, qStr, getControlName,
    getAttrValue, propSetter, isValidChunk, createFunction
} from '../lib/utils';
import { Chunk, ChunkList } from '../types';
import { ENDCompileError } from '../lib/error';
import generateExpression from '../expression';

const dynamicContent = new Set(['ENDIfStatement', 'ENDChooseStatement', 'ENDForEachStatement']);

export default class ElementEntity extends Entity {
    injectorEntity: InjectorEntity;
    readonly injectorUsage = new UsageStats();

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
    slotUpdate: { [slotName: string]: string } = {};

    constructor(readonly node: ENDElement | ENDTemplate | null, readonly state: CompileState) {
        super(node && isElement(node) ? node.name.name : 'target', state);
        if (node) {
            this.isStaticContent = true;
            this.collectStats();
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

    /**
     * Check if given attribute name is dynamic, e.g. can be changed by nested
     * statements
     */
    isDynamicAttribute(attr: ENDAttribute): boolean {
        if (this.hasPartials || this.attributeExpressions) {
            return true;
        }

        if (isIdentifier(attr.name)) {
            return this.dynamicAttributes.has(attr.name.name);
        }

        return attr.value
            ? isExpression(attr.value) || attr.value.type === 'ENDAttributeValueExpression'
            : false;
    }

    add(item: Entity) {
        if ((item instanceof ElementEntity || item instanceof TextEntity) && item.code.mount) {
            item.setMount(() =>
                this.isStaticContent && !this.isComponent ? this.addDOM(item) : this.addInjector(item));
        }

        super.add(item);

        if (this.state.component && item.name) {
            // Adding content entity into component: we should collect
            // slot update stats
            this.markSlotUpdate(item);
        }
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

                if (getControlName(elemName) === 'self') {
                    // Create component which points to itself
                    return state.runtime('createComponent', [`${state.host}.nodeName`, `${state.host}.componentModel.definition`, state.host], node);
                }

                if (state.isComponent(node)) {
                    // Create component
                    return state.runtime('createComponent', [qStr(elemName), state.getComponent(node), state.host], node);
                }

                // Create plain DOM element
                const cssScope = state.options.cssScope ? state.cssScopeSymbol : null;
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
     * Adds entity to mark slot updates
     */
    markSlots() {
        const { state, slotUpdate } = this;
        Object.keys(slotUpdate).forEach(slotName => {
            this.add(state.entity({
                update: () => state.runtime('markSlotUpdate', [this.getSymbol(), qStr(slotName), slotUpdate[slotName]])
            }));
        });
    }

    /**
     * Adds entity to finalize attributes of current element
     */
    finalizeAttributes() {
        const { state } = this;
        const runtimeName = 'finalizeAttributes';
        this.add(state.entity(runtimeName, {
            shared: () => state.runtime(runtimeName, [this.injector])
        }));
    }

    /**
     * Adds entity to finalize attributes of current element
     */
    finalizeEvents() {
        const { state } = this;
        this.add(state.entity({
            shared: () => state.runtime('finalizeEvents', [this.injector])
        }));
    }

    /**
     * Adds entity to set named ref to current element
     */
    setRef(refName: string | Program) {
        const { state } = this;
        this.add(state.entity({
            shared: () => {
                let ref: Chunk;
                if (typeof refName === 'string') {
                    ref = qStr(refName);
                } else {
                    ref = generateExpression(refName, state);
                }
                return state.runtime('setRef', [state.host, ref, this.getSymbol()]);
            }
        }));
    }

    /**
     * Adds entity to animate current element
     */
    animate() {
        if (this.animateIn || this.animateOut) {
            const { state } = this;
            const anim = state.entity();

            if (this.animateIn) {
                anim.setMount(() => state.runtime('animateIn', [this.getSymbol(), animationAttribute(this.animateIn, state), cssScopeArg(state)]));
            }

            if (this.animateOut) {
                // We need to create a callback function to properly unmount
                // contents of current element
                anim.setUnmount(() => {
                    const callback = animateOutCallback(this, state);
                    const args: ChunkList = [this.getSymbol(), animationAttribute(this.animateOut, state)];

                    if (callback) {
                        args.push(state.scope, callback);
                    }

                    args.push(cssScopeArg(state));

                    return state.runtime('animateOut', args);
                });
            }

            this.add(anim);
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

    private markSlotUpdate(entity: Entity) {
        if (entity instanceof ElementEntity) {
            const { component } = this.state;
            const prevSlot = component.slot;

            // In case if given element entity has explicit slot name,
            // swap it in current component context
            if (entity.node.type === 'ENDElement') {
                component.slot = getAttrValue(entity.node, 'slot') as string || prevSlot;
            }

            if (entity.isComponent) {
                // For component entity, we should mark inner mount entity only
                entity.children.forEach(child => {
                    if (child instanceof ComponentMountEntity) {
                        this.addSlotMark(child);
                    }
                });
            } else {
                // In regular DOM element, the only entity that affects layout
                // is an attribute
                entity.children.forEach(child => {
                    if (child.rawName === 'finalizeAttributes') {
                        this.addSlotMark(child);
                    }
                });
            }

            component.slot = prevSlot;
        } else if (entity.code.update) {
            const isSupported = entity instanceof ConditionEntity
                || entity instanceof InnerHTMLEntity
                || entity instanceof IteratorEntity
                || entity instanceof TextEntity;

            if (isSupported) {
                this.addSlotMark(entity);
            }
        }
    }

    private addSlotMark(entity: Entity) {
        entity.setUpdate(() => sn([this.state.component.slotMark, ' |= ', entity.getUpdate()]));
    }

    /**
     * Attaches given DOM entity to current element via DOM
     */
    private addDOM(entity: Entity): SourceNode {
        return sn([this.getSymbol(), `.appendChild(`, entity.code.mount, `)`]);
    }

    /**
     * Attaches given DOM entity to current element via injector
     */
    private addInjector(entity: Entity): SourceNode {
        const args: ChunkList = [this.injector, entity.code.mount];
        if (this.state.component) {
            let slotName = '';
            if (entity instanceof ElementEntity && isElement(entity.node)) {
                slotName = getAttrValue(entity.node, 'slot') as string || '';
            }
            args.push(qStr(slotName));
        }
        return this.state.runtime('insert', args);
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

function cssScopeArg(state: CompileState): string {
    return state.options.cssScope ? state.cssScopeSymbol : '';
}

/**
 * Generates animation out callback
 */
function animateOutCallback(elem: Entity, state: CompileState): string | null {
    const empty = sn();
    const callback = state.globalSymbol('animateOut');
    const code: ChunkList = [];

    const transfer = (item: Entity) => {
        item.children.forEach(transfer);
        if (isValidChunk(item.code.unmount)) {
            code.push(item.code.unmount);
            // NB: use empty source node to skip auto-null check
            // in block unmount
            item.code.unmount = empty;
        }
    };

    transfer(elem);

    if (code.length) {
        state.pushOutput(createFunction(callback, [state.scope], code));
        return callback;
    }

    return null;
}

/**
 * Compiles attribute for animation.
 * Animations are allowed to be defined either as strings (CSS Animations) or
 * functions (manual animation). Functions must be defined either as `{func}`
 * or `{func(options)}` and exported by component definition.
 * Animation function signature:
 * `function animate(elem, 'in' | 'out', callback?, options?)`
 */
function animationAttribute(value: ENDAttributeValue, state: CompileState): Chunk {
    if (isExpression(value) && value.body.length === 1) {
        const expr = value.body[0];
        if (expr.type === 'ExpressionStatement') {
            const elem = identifier('elem');
            const dir = identifier('dir');
            const callback = identifier('callback');
            const args: Expression[] = [elem, dir, callback];

            if (isIdentifier(expr.expression)) {
                // Pass given function as argument
                const id = expr.expression;
                return generateExpression({
                    ...id,
                    context: id.context === 'property' ? 'definition' : id.context
                } as Identifier, state);
            }

            if (expr.expression.type === 'ENDCaller') {
                // Upgrade callback with arguments
                const caller = {
                    ...expr.expression,
                    arguments: args.concat(expr.expression.arguments)
                };

                if (caller.object.type === 'ENDGetterPrefix' && caller.object.context === 'property') {
                    caller.object = {
                        ...caller.object,
                        context: 'definition'
                    };
                }

                return generateExpression({
                    type: 'ArrowFunctionExpression',
                    params: args,
                    expression: true,
                    body: caller
                } as ArrowFunctionExpression, state);
            }
        }
    }

    return compileAttributeValue(value, state);
}

function identifier(name: string, context?: IdentifierContext): Identifier {
    return { type: 'Identifier', name, context };
}
