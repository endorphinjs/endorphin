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

const hookStats = new Map<string, number>();
const hookCallStack: CallStackEntry[] = [];
let hookFlushTimer: number | null = null;

interface CallStackEntry {
	key: string;
	start: number;
	innerTime: number;
}

/**
 * Invokes `name` hook for given component definition
 */
export function runHook<T, U>(component: Component, name: string, arg1?: T, arg2?: U) {
	const { plugins } = component.componentModel;
	const key = `${component.nodeName}:${name}`;
	const start = Date.now();

	if (!hookFlushTimer) {
		hookFlushTimer = setTimeout(hookFlush);
	}

	hookCallStack.push({ key, start, innerTime: 0 });

	for (let i = plugins.length - 1, hook: (...args: any[]) => any; i >= 0; i--) {
		hook = plugins[i][name];
		if (typeof hook === 'function') {
			try {
				hook(component, arg1, arg2);
			} catch (error) {
				runtimeError(component, error);
				// tslint:disable-next-line:no-console
				console.error(error);
			}
		}
	}

	const curEntry = hookCallStack.pop();
	if (curEntry) {
		const ownTime = Date.now() - curEntry.start;
		if (hookCallStack.length) {
			hookCallStack[hookCallStack.length - 1]!.innerTime += ownTime;
		}

		const delta = (hookStats.get(key) || 0) + ownTime - curEntry.innerTime;
		hookStats.set(key, delta);
	}
}

function hookFlush() {
	if (hookFlushTimer) {
		clearTimeout(hookFlushTimer);
		hookFlushTimer = null;
	}

	const threshold = 500;
	const records: string[] = [];
	hookStats.forEach((value, key) => {
		if (value >= threshold) {
			records.push(`${key} took ${value}ms`);
		}
	});

	hookStats.clear();
	hookCallStack.length = 0;

	if (records.length) {
		document.dispatchEvent(new CustomEvent('endorphin-call-trace', {
			bubbles: false,
			cancelable: false,
			detail: records
		}));
	}
}
