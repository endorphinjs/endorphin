import { finalizeItems } from './utils';
import { Scope, EventBinding } from './types';
import { Injector } from './injector';
import { Component } from './component';

/**
 * Registers given event listener on `target` element and returns event binding
 * object to unregister event
 */
export function addStaticEvent(target: Element, type: string, handleEvent: EventListener, host: Component, scope: Scope): EventBinding {
	return registerBinding({ host, scope, type, handleEvent, target });
}

/**
 * Unregister given event binding
 */
export function removeStaticEvent(binding: EventBinding): void {
	binding.target.removeEventListener(binding.type, binding);
}

/**
 * Adds pending event `name` handler
 */
export function addEvent(injector: Injector, type: string, handleEvent: EventListener, host: Component, scope: Scope): void {
	// We’ll use `ChangeSet` to bind and unbind events only: once binding is registered,
	// we will mutate binding props
	const { prev, cur } = injector.events;
	const binding = cur[type] || prev[type];

	if (binding) {
		binding.scope = scope;
		binding.handleEvent = handleEvent;
		cur[type] = binding;
	} else {
		cur[type] = { host, scope, type, handleEvent, target: injector.parentNode };
	}
}

/**
 * Finalizes events of given injector
 */
export function finalizeEvents(injector: Injector): number {
	return finalizeItems(injector.events, changeEvent, injector.parentNode);
}

function registerBinding(binding: EventBinding): EventBinding {
	binding.target.addEventListener(binding.type, binding);
	return binding;
}

/**
 * Invoked when event handler was changed
 */
function changeEvent(name: string, prevValue: EventBinding | null, newValue: EventBinding | null): void {
	if (!prevValue && newValue) {
		// Should register new binding
		registerBinding(newValue);
	} else if (prevValue && !newValue) {
		removeStaticEvent(prevValue);
	}
}
