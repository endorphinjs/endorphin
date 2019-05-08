import { elem } from './dom';
import { assign, obj, changeSet, representAttributeValue, safeCall, getObjectDescriptors } from './utils';
import { finalizeEvents } from './event';
import { normalizeClassName } from './attribute';
import { createInjector, disposeBlock, Injector, BaseBlock } from './injector';
import { runHook, reverseWalkDefinitions } from './hooks';
import { getScope } from './scope';
import { updateSlots } from './slot';
import { Changes, Data, UpdateTemplate, ChangeSet, UnmountBlock, MountTemplate } from './types';
import { Store } from './store';

type DescriptorMap = object & { [x: string]: PropertyDescriptor };
interface RefMap { [key: string]: Element; }

export type ComponentEventHandler = (component: Component, event: Event, target: HTMLElement) => void;
export type StaticEventHandler = (evt: Event) => void;

export interface AttachedStaticEvents {
	handler: StaticEventHandler;
	listeners: {
		[event: string]: ComponentEventHandler[];
	};
}

export interface Component<P = Data, S = Data, T = Store> extends HTMLElement {
	/**
	 * Pointer to component view container. By default, it’s the same as component
	 * element, but for native Web Components it points to shadow root
	 */
	componentView: Element;

	/** Internal component model */
	componentModel: ComponentModel;

	/** Component properties (external contract) */
	props: P;

	/** Component state (internal contract) */
	state: S;

	/** Named references to elements rendered inside current component */
	refs: RefMap;

	/** A store, bound to current component */
	store?: T;

	/** References to component slot containers. Default slot is available as `slot['']` */
	slots: RefMap;

	/** Reference to the root component of the current app */
	root?: Component;

	/**
	 * Updates props with data from `value`
	 * @param value Updated props
	 */
	setProps(value: object): void;

	/**
	 * Updates state with data from `value`
	 * @param value Updated values
	 */
	setState(value: object): void;
}

/**
 * Internal Endorphin component descriptor
 */
interface ComponentModel {
	/** Component’s definition */
	definition: ComponentDefinition;

	/** Injector for incoming component data */
	input: Injector;

	/** Change set for component refs */
	refs: ChangeSet;

	/** Runtime variables */
	vars: object;

	/**
	 * A function for updating rendered component content. Might be available
	 * after component was mounted and only if component has update cycle
	 */
	update?: UpdateTemplate | undefined;

	/** List of attached event handlers */
	events?: AttachedStaticEvents;

	/** Slot output for component */
	slots: { [name: string]: BaseBlock };

	/** Slots update status */
	slotStatus?: { [name: string]: number };

	/** Indicates that component was mounted */
	mounted: boolean;

	/** Component render is queued */
	queued: boolean;

	/** Indicates that component is currently rendering */
	rendering: boolean;

	/** Indicates that component is currently in finalization state (calling `did*` hooks) */
	finalizing: boolean;

	/** Default props values */
	defaultProps: object;

	/** A function for disposing component contents */
	dispose?: UnmountBlock;
}

/**
 * A definition of component, written as ES module
 */
export interface ComponentDefinition {
	/** Listeners for events bubbling from component contents */
	events?: { [type: string]: ComponentEventHandler; };

	/**
	 * Public methods to attach to component element
	 * @deprecated Use `extend` instead
	 */
	methods?: { [name: string]: (this: Component) => void; };

	/** Methods and properties to extend component with */
	extend?: object;

	/** List of plugins for current component */
	plugins?: ComponentDefinition[];

	/** A scope token to be added for every element, created inside current component bound */
	cssScope?: string;

	/**
	 * A function for rendering component contents. Will be added automatically
	 * in compilation step with compiled HTML template, if not provided.
	 * If rendered result must be updated, should return function that will be
	 * invoked for update
	 */
	default?: MountTemplate;

	/** Initial props factory */
	props?(component: Component): {};

	/** Initial state factory */
	state?(component: Component): {};

	/** Returns instance of store used for components */
	store?(): Store;

	/** Component created */
	init?(component: Component): void;

	/** Component is about to be mounted (will be initially rendered) */
	willMount?(component: Component): void;

	/** Component just mounted (initially rendered) */
	didMount?(component: Component): void;

	/** Component props changed */
	didChange?(component: Component, changes: Changes): void;

	/**
	 * Component is about to be updated (next renders after mount)
	 * @param component
	 * @param changes List of changed properties which caused component update
	 */
	willUpdate?(component: Component, changes: Changes): void;

	/**
	 * Component just updated (next renders after mount)
	 * @param component
	 * @param changes List of changed properties which caused component update
	 */
	didUpdate?(component: Component, changes: Changes): void;

	/**
	 * Component is about to be rendered. If `false` value is returned, component
	 * rendering will be cancelled
	 * @param component
	 * @param changes List of changed properties which caused component update
	 */
	willRender?(component: Component, changes: Changes): void;

	/**
	 * Component just rendered
	 * @param component
	 * @param changes List of changed properties which caused component update
	 */
	didRender?(component: Component, changes: Changes): void;

	/** Component is about to be removed */
	willUnmount?(component: Component): void;

	/** Component was removed */
	didUnmount?(component: Component): void;

	[key: string]: any;
}

let renderQueue: Array<Component | Changes | undefined> | null = null;

/**
 * Creates internal lightweight Endorphin component with given definition
 */
export function createComponent(name: string, definition: ComponentDefinition, host?: HTMLElement | Component): Component {
	let cssScope: string | undefined;
	let root: Component | undefined;

	if (host && 'componentModel' in host) {
		cssScope = host.componentModel.definition.cssScope;
		root = host.root || host;
	}

	const element = elem(name, cssScope) as Component;

	// Add host scope marker: we can’t rely on tag name since component
	// definition is bound to element in runtime, not compile time
	if (definition.cssScope) {
		element.setAttribute(definition.cssScope + '-host', '');
	}

	const { props, state, extend, events } = prepare(element, definition);

	element.refs = {};
	element.props = obj(props);
	element.state = state;
	element.componentView = element; // XXX Should point to Shadow Root in Web Components
	root && (element.root = root);

	addPropsState(element);

	if (extend) {
		Object.defineProperties(element, extend);
	}

	if (definition.store) {
		element.store = definition.store();
	} else if (root && root.store) {
		element.store = root.store;
	}

	// Create slotted input
	const input = createInjector(element.componentView);
	input.slots = obj();

	element.componentModel = {
		definition,
		input,
		vars: obj(),
		refs: changeSet(),
		slots: obj(),
		slotStatus: obj(),
		mounted: false,
		rendering: false,
		finalizing: false,
		update: void 0,
		queued: false,
		events,
		dispose: void 0,
		defaultProps: props
	};

	runHook(element, 'init');

	return element;
}

/**
 * Mounts given component
 */
export function mountComponent(component: Component, initialProps?: object) {
	const { componentModel } = component;
	const { input, definition, defaultProps } = componentModel;

	let changes = setPropsInternal(component, obj(), assign(obj(defaultProps), initialProps));
	const runtimeChanges = setPropsInternal(component, input.attributes.prev, input.attributes.cur);

	if (changes && runtimeChanges) {
		assign(changes, runtimeChanges);
	} else if (runtimeChanges) {
		changes = runtimeChanges;
	}

	const arg = changes || {};
	finalizeEvents(input);

	componentModel.rendering = true;

	// Notify slot status
	for (const p in input.slots) {
		runHook(component, 'didSlotUpdate', p, input.slots[p]);
	}

	if (changes) {
		runHook(component, 'didChange', arg);
	}

	runHook(component, 'willMount', arg);
	runHook(component, 'willRender', arg);
	componentModel.update = safeCall(definition.default, component, getScope(component));
	componentModel.mounted = true;
	componentModel.rendering = false;
	componentModel.finalizing = true;
	runHook(component, 'didRender', arg);
	runHook(component, 'didMount', arg);
	componentModel.finalizing = false;
}

/**
 * Updates given mounted component
 */
export function updateComponent(component: Component): number {
	const { input } = component.componentModel;
	const changes = setPropsInternal(component, input.attributes.prev, input.attributes.cur);
	finalizeEvents(input);
	updateSlots(component);

	if (changes || component.componentModel.queued) {
		renderNext(component, changes!);
	}

	return changes ? 1 : 0;
}

/**
 * Destroys given component: removes static event listeners and cleans things up
 * @returns Should return nothing since function result will be used
 * as shorthand to reset cached value
 */
export function unmountComponent(component: Component): void {
	const { componentModel } = component;
	const { slots, dispose, events } = componentModel;
	const scope = getScope(component);

	runHook(component, 'willUnmount');

	componentModel.mounted = false;
	if (events) {
		detachStaticEvents(component, events);
	}

	if (component.store) {
		component.store.unwatch(component);
	}

	safeCall(dispose, scope);

	for (const slotName in slots) {
		disposeBlock(slots[slotName]);
	}

	runHook(component, 'didUnmount');

	// @ts-ignore: Nulling disposed object
	component.componentModel = null;
}

/**
 * Subscribes to store updates of given component
 */
export function subscribeStore(component: Component, keys?: string[]) {
	if (!component.store) {
		throw new Error(`Store is not defined for ${component.nodeName} component`);
	}

	component.store.watch(component, keys);
}

/**
 * Queues next component render
 */
function renderNext(component: Component, changes?: Changes) {
	if (!component.componentModel.rendering) {
		renderComponent(component, changes);
	} else {
		scheduleRender(component, changes);
	}
}

/**
 * Schedules render of given component on next tick
 */
export function scheduleRender(component: Component, changes?: Changes) {
	if (!component.componentModel.queued) {
		component.componentModel.queued = true;
		if (renderQueue) {
			renderQueue.push(component, changes);
		} else {
			renderQueue = [component, changes];
			requestAnimationFrame(drainQueue);
		}
	}
}

/**
 * Renders given component
 */
export function renderComponent(component: Component, changes?: Changes) {
	const { componentModel } = component;
	const arg = changes || {};

	componentModel.queued = false;
	componentModel.rendering = true;

	if (changes) {
		runHook(component, 'didChange', arg);
	}

	runHook(component, 'willUpdate', arg);
	runHook(component, 'willRender', arg);
	safeCall(componentModel.update, component, getScope(component));
	componentModel.rendering = false;
	componentModel.finalizing = true;
	runHook(component, 'didRender', arg);
	runHook(component, 'didUpdate', arg);
	componentModel.finalizing = false;
}

/**
 * Removes attached events from given map
 */
function detachStaticEvents(component: Component, eventMap: AttachedStaticEvents) {
	const { listeners, handler } = eventMap;
	for (const p in listeners) {
		component.removeEventListener(p, handler);
	}
}

function kebabCase(ch: string): string {
	return '-' + ch.toLowerCase();
}

function setPropsInternal(component: Component, prevProps: object, nextProps: object): Changes | null {
	const changes: Changes = {};
	let didChanged = false;
	const { props } = component;
	const { defaultProps } = component.componentModel;

	for (const p in nextProps) {
		const prev = prevProps[p];
		let current = nextProps[p];

		if (current == null) {
			current = defaultProps[p];
		}

		if (p === 'class' && current != null) {
			current = normalizeClassName(current);
		}

		if (current !== prev) {
			didChanged = true;
			props[p] = prevProps[p] = current;
			changes[p] = { current, prev };

			if (!/^partial:/.test(p)) {
				representAttributeValue(component, p.replace(/[A-Z]/g, kebabCase), current);
			}
		}

		nextProps[p] = null;
	}

	return didChanged ? changes : null;
}

/**
 * Check if `next` contains value that differs from one in `prev`
 */
function hasChanges(prev: {}, next: {}): boolean {
	for (const p in next) {
		if (next[p] !== prev[p]) {
			return true;
		}
	}

	return false;
}

/**
 * Prepares internal data for given component
 */
function prepare(component: Component, definition: ComponentDefinition) {
	const props = obj();
	const state = obj();
	let events: AttachedStaticEvents | undefined;
	let extend: DescriptorMap | undefined;

	reverseWalkDefinitions(definition, dfn => {
		dfn.props && assign(props, dfn.props(component));
		dfn.state && assign(state, dfn.state(component));

		// NB: backward compatibility with previous implementation
		if (dfn.methods) {
			extend = getDescriptors(dfn.methods, extend);
		}

		if (dfn.extend) {
			extend = getDescriptors(dfn.extend, extend);
		}

		if (dfn.events) {
			if (!events) {
				events = createEventsMap(component);
			}
			attachEventHandlers(component, dfn.events, events);
		}
	});

	return { props, state, extend, events };
}

/**
 * Extracts property descriptors from given source object and merges it with `prev`
 * descriptor map, if given
 */
function getDescriptors(source: object, prev?: DescriptorMap): DescriptorMap {
	const descriptors = getObjectDescriptors(source);
	return prev ? assign(prev, descriptors) : descriptors;
}

function createEventsMap(component: Component): AttachedStaticEvents {
	const listeners: { [event: string]: ComponentEventHandler[]; } = obj();

	const handler: StaticEventHandler = function(this: HTMLElement, evt: Event) {
		if (component.componentModel) {
			const handlers = listeners[evt.type];
			for (let i = 0; i < handlers.length; i++) {
				handlers[i](component, evt, this);
			}
		}
	};

	return { handler, listeners };
}

function attachEventHandlers(component: Component, events: { [name: string]: ComponentEventHandler; }, eventMap: AttachedStaticEvents) {
	const names = Object.keys(events);
	const { listeners } = eventMap;
	for (let i = 0, name: string; i < names.length; i++) {
		name = names[i];
		if (name in listeners) {
			listeners[name].push(events[name]);
		} else {
			component.addEventListener(name, eventMap.handler);
			listeners[name] = [events[name]];
		}
	}
}

function addPropsState(element: Component) {
	element.setProps = function setProps(value) {
		const { componentModel } = element;

		// In case of calling `setProps` after component was unmounted,
		// check if `componentModel` is available
		if (value != null && componentModel && componentModel.mounted) {
			const changes = setPropsInternal(element, element.props, obj(value));
			changes && renderNext(element, changes);
		}
	};

	element.setState = function setState(value) {
		const { componentModel } = element;

		// In case of calling `setState` after component was unmounted,
		// check if `componentModel` is available
		if (value != null && componentModel && hasChanges(element.state, value)) {
			assign(element.state, value);

			// If we’re in rendering state than current `setState()` is caused by
			// one of the `will*` hooks, which means applied changes will be automatically
			// applied during rendering stage.
			// If called outside of rendering state we should schedule render
			// on next tick
			if (componentModel.mounted && !componentModel.rendering) {
				scheduleRender(element);
			}
		}
	};
}

function drainQueue() {
	const pending = renderQueue!;
	renderQueue = null;

	for (let i = 0, component: Component; i < pending.length; i += 2) {
		component = pending[i] as Component;

		// It’s possible that a component can be rendered before next tick
		// (for example, if parent node updated component props).
		// Check if it’s still queued then render.
		// Also, component can be unmounted after it’s rendering was scheduled
		if (component.componentModel && component.componentModel.queued) {
			renderComponent(component, pending[i + 1] as Changes);
		}
	}
}
