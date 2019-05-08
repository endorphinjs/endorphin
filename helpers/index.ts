import { Component } from '@endorphinjs/template-runtime';

/**
 * Helper functions, used in templates and component definitions.
 * The fist argument of every helper *must* be a component!
 */

/**
 * Dispatches bubbling `type` event on given `elem` element
 */
export function emit<T extends Element>(elem: T, type: string, detail?: {}): T {
	const evt = new CustomEvent(type, {
		bubbles: true,
		cancelable: true,
		composed: true, // break out of shadow root
		detail
	});

	elem.dispatchEvent(evt);
	return elem;
}

/**
 * Subscribes on given `type` event on `elem` element
 */
export function on<T extends Element>(elem: T, type: string, callback: EventListenerOrEventListenerObject, options: AddEventListenerOptions | boolean): T {
	elem.addEventListener(type, callback, options);
	return elem;
}

/**
 * Unsubscribes from given `type` event on `elem` element
 */
export function off<T extends Element>(elem: T, type: string, callback: EventListenerOrEventListenerObject, options: AddEventListenerOptions | boolean): T {
	elem.removeEventListener(type, callback, options);
	return elem;
}

/**
 * Updates state of given component
 */
export function setState(component: Component, value: {}) {
	if (value != null) {
		component.setState(value);
	}
}

/**
 * Updates state of given component
 */
export function setStore(component: Component, value: {}) {
	if (!component.store) {
		// tslint:disable-next-line:no-console
		console.warn(`${component.nodeName} doesn’t have attached store`);
	} else if (value != null) {
		component.store.set(value);
	}
}

/**
 * Returns slot container with given name
 */
export function getSlot(component: Component, name: string): Element | DocumentFragment | void {
	return component.componentModel && component.componentModel.input.slots[name];
}
