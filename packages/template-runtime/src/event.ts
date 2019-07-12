import { runtimeError, obj } from './utils';
import { Scope, EventBinding } from './types';
import { Component } from './component';

interface PendingEvents {
	target: Element;
	host: Component;
	events: { [type: string]: EventBinding | void };
}

/**
 * Registers given event listener on `target` element and returns event binding
 * object to unregister event
 */
export function addEvent(target: Element, type: string, listener: EventListener, host: Component, scope: Scope): EventBinding {
	return registerBinding(type, { host, scope, target, listener, handleEvent });
}

/**
 * Unregister given event binding
 */
export function removeEvent(type: string, binding: EventBinding): void {
	binding.target.removeEventListener(type, binding);
}

/**
 * Creates structure for collecting pending events
 */
export function pendingEvents(host: Component, target: Element): PendingEvents {
	return { host, target, events: obj() };
}

export function setPendingEvent(pending: PendingEvents, type: string, listener: EventListener, scope: Scope) {
	let binding = pending.events[type];
	if (binding) {
		binding.listener = listener;
		binding.scope = scope;
	} else {
		binding = pending.events[type] = addEvent(pending.target, type, listener, pending.host, scope);
	}
	binding.pending = listener;
}

export function finalizePendingEvents(pending: PendingEvents) {
	// For event listeners, we should only bind or unbind events, depending
	// on current listener value
	const { events } = pending;
	for (const type in events) {
		const binding = events[type];
		if (binding) {
			if (!binding.pending) {
				events[type] = removeEvent(type, binding);
			}

			binding.pending = void 0;
		}
	}
}

export function detachPendingEvents(pending: PendingEvents) {
	const { events } = pending;
	for (const type in events) {
		const binding = events[type];
		if (binding) {
			removeEvent(type, binding);
		}
	}
}

function handleEvent(this: EventBinding, event: Event) {
	try {
		this.listener && this.listener(event);
	} catch (error) {
		runtimeError(this.host, error);
		// tslint:disable-next-line:no-console
		console.error(error);
	}
}

export function safeEventListener(host: Component, handler: EventListener): EventListener {
	// tslint:disable-next-line:only-arrow-functions
	return function(this: EventBinding, event: Event) {
		try {
			handler.call(this, event);
		} catch (error) {
			runtimeError(host, error);
			// tslint:disable-next-line:no-console
			console.error(error);
		}
	};
}

function registerBinding(type: string, binding: EventBinding): EventBinding {
	binding.target.addEventListener(type, binding);
	return binding;
}
