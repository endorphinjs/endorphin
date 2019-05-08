import { safeCall } from './utils';
import { Component, ComponentDefinition } from './component';

type HookCallback = (dfn: ComponentDefinition) => void;

/**
 * Walks over each definition (including given one) and runs callback on it
 */
export function walkDefinitions(definition: ComponentDefinition, fn: HookCallback) {
	safeCall(fn, definition);
	const { plugins } = definition;
	if (plugins) {
		for (let i = 0; i < plugins.length; i++) {
			walkDefinitions(plugins[i], fn);
		}
	}
}

/**
 * Same as `walkDefinitions` but runs in reverse order
 */
export function reverseWalkDefinitions(definition: ComponentDefinition, fn: HookCallback) {
	const { plugins } = definition;
	if (plugins) {
		let i = plugins.length;
		while (i--) {
			walkDefinitions(plugins[i], fn);
		}
	}

	safeCall(fn, definition);
}

/**
 * Invokes `name` hook for given component definition
 */
export function runHook<T, U>(elem: Component, name: string, arg1?: T, arg2?: U) {
	walkDefinitions(elem.componentModel.definition, dfn => {
		const hook = dfn[name];
		if (typeof hook === 'function') {
			hook(elem, arg1, arg2);
		}
	});
}
