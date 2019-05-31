import { Component } from '@endorphinjs/template-runtime';

const hasMap = typeof Map !== 'undefined';
const hasSet = typeof Set !== 'undefined';

/**
 * Helper functions, used in templates and component definitions.
 * The fist argument of every helper *must* be a component!
 */

/**
 * Dispatches bubbling `type` event on given `elem` element
 */
export function emit<T extends Element>(elem: T, type: string, detail?: {}): T {
    elem.dispatchEvent(new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true, // break out of shadow root
        detail
    }));
	return elem;
}

/**
 * Same as `emit` but doesn’t bubble up event. A convenience for notifying component
 * subscribers only.
 */
export function notify<T extends Element>(elem: T, type: string, detail?: {}): T {
    elem.dispatchEvent(new CustomEvent(type, {
        bubbles: false,
        cancelable: false,
        detail
    }));
    return elem;
}

/**
 * Subscribes on given `type` event on `elem` element
 */
export function on<T extends Element>(elem: T, type: string, callback: (this: T, ev: Event) => any, options?: AddEventListenerOptions | boolean): T {
	elem.addEventListener(type, callback, options);
	return elem;
}

/**
 * Unsubscribes from given `type` event on `elem` element
 */
export function off<T extends Element>(elem: T, type: string, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): T {
	elem.removeEventListener(type, callback, options);
	return elem;
}

/**
 * Returns amount of elements in given collection. For non-collections returns
 * `0` for `null` and `undefined, `1` for all other types
 */
export function count(component: Component, obj: any): number {
    if (obj == null) {
        return 0;
    }

    if (Array.isArray(obj)) {
        return obj.length;
    }

    if ((hasMap && obj instanceof Map) || (hasSet && obj instanceof Set)) {
        return obj.size;
    }

    return 1;
}

/**
 * Check if given `value` exists in `collection`
 */
export function contains(component: Component, collection: any, value: any): boolean {
    if (hasSet && collection instanceof Set) {
        return collection.has(value);
    }

    if (hasMap && collection instanceof Map) {
        return contains(component, Array.from(collection.values()), value);
    }

    if (Array.isArray(collection) || (typeof collection === 'string' && value != null)) {
        return collection.indexOf(value) !== -1;
    }

    return collection != null ? collection === value : false;
}

/**
 * Returns index of given `value` in collection
 */
export function indexOf(component: Component, data: string | any[], value: any) {
    return data != null && data.indexOf ? data.indexOf(value) : -1;
}

/**
 * Replaces given `pattern` in string with `value`
 */
export function replace(component: Component, str: string, pattern: string | RegExp, value: string): string {
    return str != null ? String(str).replace(pattern, value) : '';
}

/**
 * Returns lowercase version of given string
 */
export function lowercase(component: Component, str: string): string {
    return str != null ? String(str).toLowerCase() : '';
}

/**
 * Returns uppercase version of given string
 */
export function uppercase(component: Component, str: string): string {
    return str != null ? String(str).toUpperCase() : '';
}

/**
 * Returns slice of given string or array
 */
export function slice<T>(component: Component, data: T[], start?: number, end?: number): T;
export function slice(component: Component, data: string, start?: number, end?: number): string;
export function slice(component: Component, data: string | any[], start?: number, end?: number) {
    return Array.isArray(data) || typeof data === 'string'
        ? data.slice(start, end) : null;
}

/**
 * Logs given data
 */
export function log(component: Component, ...args: any[]) {
    console.log(...args);
}

/**
 * Returns slot container with given name
 */
export function getSlot(component: Component, name: string): Element | void {
    const slot = component.componentModel && component.componentModel.input.slots![name];
	return slot && slot.element;
}
