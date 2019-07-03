import { createComponent, mountComponent, Component, ComponentDefinition } from './component';
import { Store } from './store';

export * from './block';
export * from './iterate';
export * from './key-iterate';
export * from './injector';
export * from './scope';
export * from './attribute2';
export * from './event';
export * from './slot';
export * from './ref';
export * from './component';
export * from './inner-html';
export * from './dom';
export * from './partial';
export * from './store';
export * from './animation';
export { assign, obj, changeSet } from './utils';

type FilterCallback<T> = (value: T, key: string | number) => boolean;

interface ComponentOptions {
	/** Parent element where created component should be mounted */
	target?: HTMLElement;

	/** Initial component props */
	props?: {};

	/** Store for component */
	store?: Store;

	/** If `true`, do not attach component to target */
	detached?: boolean;
}

/**
 * Creates Endorphin component and mounts it into given `options.target` container
 */
export default function endorphin(name: string, definition: ComponentDefinition, options: ComponentOptions = {}): Component {
	const component = createComponent(name, definition, options.target);

	if (options.store) {
		component.store = options.store;
	}

	if (options.target && !options.detached) {
		options.target.appendChild(component);
	}

	mountComponent(component, options.props);
	return component;
}

/**
 * Safe property getter
 * @param {*} ctx
 * @param {*} ...args
 * @returns {*}
 */
export function get(ctx: any): any {
	const hasMap = typeof Map !== 'undefined';
	for (let i = 1, il = arguments.length, arg: any; ctx != null && i < il; i++) {
		arg = arguments[i];
		if (hasMap && ctx instanceof Map) {
			ctx = ctx.get(arg);
		} else {
			ctx = ctx[arg];
		}
	}

	return ctx;
}

/**
 * Invokes `methodName` of `ctx` object with given args
 */
export function call(ctx: any, methodName: string, args?: any[]): any {
	const method = ctx != null && ctx[methodName];
	if (typeof method === 'function') {
		return args ? method.apply(ctx, args) : method.call(ctx);
	}
}

/**
 * Filter items from given collection that matches `fn` criteria and returns
 * matched items
 */
export function filter<T>(collection: T[], fn: FilterCallback<T>): T[] {
	const result: T[] = [];
	if (collection && collection.forEach) {
		collection.forEach((value, key) => {
			if (fn(value, key)) {
				result.push(value);
			}
		});
	}

	return result;
}

/**
 * Finds first item in given `collection` that matches truth test of `fn`
 */
export function find<T>(collection: T[] | Map<any, T> | Set<T>, fn: FilterCallback<T>): T | null | undefined {
	if (Array.isArray(collection)) {
		// Fast path: find item in array
		for (let i = 0, item: T; i < collection.length; i++) {
			item = collection[i];
			if (fn(item, i)) {
				return item;
			}
		}
	} else if (collection && collection.forEach) {
		// Iterate over collection
		let found = false;
		let result: T | null = null;
		collection.forEach((value: T, key: any) => {
			if (!found && fn(value, key)) {
				found = true;
				result = value;
			}
		});

		return result;
	}
}
