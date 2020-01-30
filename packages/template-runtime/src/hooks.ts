import { captureError, runtimeError } from './utils';
import { Component, ComponentDefinition } from './component';

type HookCallback = (dfn: ComponentDefinition) => void;

/**
 * Walks over each definition (including given one) and runs callback on it
 */
export function walkDefinitions(component: Component, definition: ComponentDefinition, fn: HookCallback) {
	captureError(component, fn, definition);
	const { plugins } = definition;
	if (plugins) {
		for (let i = 0; i < plugins.length; i++) {
			walkDefinitions(component, plugins[i], fn);
		}
	}
}

/**
 * Same as `walkDefinitions` but runs in reverse order
 */
export function reverseWalkDefinitions(component: Component, definition: ComponentDefinition, fn: HookCallback) {
	const { plugins } = definition;
	if (plugins) {
		let i = plugins.length;
		while (i--) {
			reverseWalkDefinitions(component, plugins[i], fn);
		}
	}

	captureError(component, fn, definition);
}

/**
 * Invokes `name` hook for given component definition
 */
export function runHook<T, U>(component: Component, name: string, arg1?: T, arg2?: U) {
	const { plugins } = component.componentModel;

	for (let i = 0, hook: (...args: any[]) => any; i < plugins.length; i++) {
		hook = plugins[i][name];
		if (typeof hook === 'function') {
			try {
				return hook(component, arg1, arg2);
			} catch (error) {
				runtimeError(component, error);
				// tslint:disable-next-line:no-console
				console.error(error);
			}
		}
	}
}
