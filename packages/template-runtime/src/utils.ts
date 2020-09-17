import { Changes, ChangeSet } from './types';
import { Component } from './component';

export const animatingKey = '$$animating';

/**
 * Creates fast object
 */
export function obj(proto: any = null): {} {
	return Object.create(proto);
}

/**
 * Check if given value id defined, e.g. not `null`, `undefined` or `NaN`
 */
export function isDefined(value: any): boolean {
	return value != null && value === value;
}

/**
 * Creates object for storing change sets, e.g. current and previous values
 */
export function changeSet(): ChangeSet {
	return { prev: obj(), cur: obj() };
}

/**
 * Returns properties from `next` which were changed since `prev` state.
 * Returns `null` if there are no changes
 */
export function changed(next: any, prev: any, prefix = ''): Changes | null {
	const result: Changes = obj();
	let dirty = false;

	// Check if data was actually changed
	for (const p in next) {
		if (prev[p] !== next[p]) {
			dirty = true;
			result[prefix ? prefix + p : p] = {
				prev: prev[p],
				current: next[p]
			};
		}
	}

	return dirty ? result : null;
}

/**
 * Adds given `scope` attribute to `el` to isolate its CSS
 */
export function cssScope(el: HTMLElement, host?: Component): HTMLElement {
	const scope = host && host.componentModel && host.componentModel.definition.cssScope;
	scope && el.setAttribute(scope, '');
	return el;
}

// tslint:disable-next-line:only-arrow-functions
const assign = Object.assign || function(target: any) {
	for (let i = 1, source: any; i < arguments.length; i++) {
		source = arguments[i];

		for (const p in source) {
			if (source.hasOwnProperty(p)) {
				target[p] = source[p];
			}
		}
	}

	return target;
};

/**
 * Returns property descriptors from given object
 */
// tslint:disable-next-line:only-arrow-functions
const getObjectDescriptors = Object['getOwnPropertyDescriptors'] || function(source: any) {
	const descriptors = obj();
	const props = Object.getOwnPropertyNames(source);

	for (let i = 0, prop: string, descriptor: PropertyDescriptor | void; i < props.length; i++) {
		prop = props[i];
		descriptor = Object.getOwnPropertyDescriptor(source, prop);
		if (descriptor != null) {
			descriptors[prop] = descriptor;
		}
	}

	return descriptors;
};

export { assign, getObjectDescriptors };

/**
 * Assign data from `next` to `prev` if there are any updates
 * @return Returns `true` if data was assigned
 */
export function assignIfNeeded(prev: any, next: any): boolean {
	for (const p in next) {
		if (next.hasOwnProperty(p) && prev[p] !== next[p]) {
			return assign(prev, next);
		}
	}

	return false;
}

export function safeCall<T, U, Y>(fn?: (p1?: T, p2?: U) => Y, arg1?: T, arg2?: U): Y | undefined {
	try {
		return fn && fn(arg1, arg2);
	} catch (err) {
		// tslint:disable-next-line:no-console
		console.error(err);
	}
}

export function captureError<T, U, Y>(host: Component, fn?: (p1?: T, p2?: U) => Y, arg1?: T, arg2?: U): Y | undefined {
	try {
		return fn && fn(arg1, arg2);
	} catch (error) {
		runtimeError(host, error);
		// tslint:disable-next-line:no-console
		console.error(error);
	}
}

export function runtimeError(host: Component, error: Error) {
	if (typeof CustomEvent !== 'undefined') {
		host.dispatchEvent(new CustomEvent('runtime-error', {
			bubbles: true,
			cancelable: true,
			detail: { error, host }
		}));
	} else {
		throw error;
	}
}

/**
 * Schedule a microtask
 */
export const nextTick = (() => {
	if (typeof queueMicrotask !== 'undefined') {
		return queueMicrotask;
	}

	if (typeof Promise !== 'undefined') {
		const promise = Promise.resolve();

		return (fn: (...args: any[]) => any) => {
			return promise.then(fn);
		};
	}

	return requestAnimationFrame;
})();
