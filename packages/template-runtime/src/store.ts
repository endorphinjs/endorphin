import { assign, changed } from './utils';
import { scheduleRender, renderComponent, Component } from './component';
import { Data } from './types';

const prefix = '$';

type StoreUpdateHandler = (state: any, changes: object) => void;

interface StoreUpdateEntry {
	keys?: string[];
	component?: Component;
	handler?: StoreUpdateHandler;
}

export class Store<T = Data> {
	data: T;
	sync: boolean = false;
	private listeners: StoreUpdateEntry[] = [];

	constructor(data?: T) {
		this.data = assign({}, data || {}) as T;
	}

	/**
	 * Returns current store data
	 */
	get(): T {
		return this.data;
	}

	/**
	 * Updates data in store
	 */
	set(data: Partial<T>): void {
		const updated = changed(data, this.data, prefix);
		const render = this.sync ? renderComponent : scheduleRender;

		if (updated) {
			const next = this.data = assign(this.data, data);
			// Notify listeners.
			// Run in reverse order for listener safety (in case if handler decides
			// to unsubscribe during notification)
			for (let i = this.listeners.length - 1, item: StoreUpdateEntry; i >= 0; i--) {
				item = this.listeners[i];
				if (!item.keys || !item.keys.length || hasChange(item.keys, updated)) {
					if ('component' in item) {
						render(item.component!, updated);
					} else if ('handler' in item) {
						item.handler!(next, updated);
					}
				}
			}
		}
	}

	/**
	 * Subscribes to changes in given store
	 * @param handler Function to invoke when store changes
	 * @param keys Run handler only if given top-level keys are changed
	 * @returns Object that should be used to unsubscribe from updates
	 */
	subscribe(handler: StoreUpdateHandler, keys?: string[]): StoreUpdateEntry {
		const obj: StoreUpdateEntry = {
			handler,
			keys: scopeKeys(keys, prefix)
		};
		this.listeners.push(obj);
		return obj;
	}

	/**
	 * Unsubscribes from further updates
	 */
	unsubscribe(obj: StoreUpdateEntry) {
		const ix = this.listeners.indexOf(obj);
		if (ix !== -1) {
			this.listeners.splice(ix, 1);
		}
	}

	/**
	 * Watches for updates of given `keys` in store and runs `component` render on change
	 */
	watch(component: Component, keys?: string[]) {
		this.listeners.push({
			component,
			keys: scopeKeys(keys, prefix)
		});
	}

	/**
	 * Stops watching for store updates for given component
	 * @param {Component} component
	 */
	unwatch(component: Component) {
		for (let i = 0; i < this.listeners.length; i++) {
			if (this.listeners[i].component === component) {
				this.listeners.splice(i, 1);
				return;
			}

		}
	}
}

/**
 * Check if any of `keys` was changed in `next` object since `prev` state
 * @param {string[]} keys
 * @param {Object} updated
 * @return {boolean}
 */
function hasChange(keys: string[], updated: object): boolean {
	for (let i = 0; i < keys.length; i++) {
		if (keys[i] in updated) {
			return true;
		}
	}

	return false;
}

/**
 * Adds given prefix to keys
 */
function scopeKeys(keys?: string[], pfx?: string): string[] | undefined {
	return keys && pfx ? keys.map(key => pfx + key) : keys;
}
