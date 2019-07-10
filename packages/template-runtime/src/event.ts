import { runtimeError, obj } from './utils';
import { Scope, EventBinding } from './types';
import { Component } from './component';

interface PendingEvents {
	target: Element;
	host: Component;
	events: { [type: string]: EventBinding };
}

/**
 * Registers given event listener on `target` element and returns event binding
 * object to unregister event
 */
export function addEvent(target: Element, type: string, listener: EventListener, host: Component, scope: Scope): EventBinding {
	return registerBinding(type, { host, scope, target, listener, handleEvent, bound: true });
}

/**
 * Unregister given event binding
 */
export function removeEvent(type: string, binding: EventBinding): void {
	binding.target.removeEventListener(type, binding);
	binding.bound = false;
}

/**
 * Creates structure for collecting pending events
 */
export function pendingEvents(host: Component, target: Element): PendingEvents {
	return { host, target, events: obj() };
}

export function setPendingEvent(pending: PendingEvents, type: string, listener: EventListener, scope: Scope) {
	const { events } = pending;
	if (type in events) {
		events[type].listener = listener;
		events[type].scope = scope;
	} else {
		events[type] = {
			host: pending.host,
			target: pending.target,
			scope,
			listener,
			handleEvent,
			bound: false
		};
	}
}

export function finalizePendingEvents(pending: PendingEvents) {
	// For event listeners, we should only bind or unbind events, depending
	// on current listener value
	const { events } = pending;
	for (const type in events) {
		const binding = events[type];
		if (binding.listener && !binding.bound) {
			registerBinding(type, binding);
		} else if (!binding.listener && binding.bound) {
			removeEvent(type, binding);
		}
		binding.listener = void 0;
	}
}

export function detachPendingEvents(pending: PendingEvents) {
	const { events } = pending;
	for (const type in events) {
		const binding = events[type];
		if (binding.bound) {
			removeEvent(type, binding);
		}
	}
}

function handleEvent(this: EventBinding, event: Event) {
	try {
		this.listener && this.listener.call(this, event);
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
	binding.bound = true;
	return binding;
}
