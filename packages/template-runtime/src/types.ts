import { Component } from './component';
import { Injector } from './injector';

export type RunCallback<D = any, R = undefined | null> = (host: Component, injector: Injector, data?: D) => R;
export type GetMount = (host: Component, scope: Scope) => MountBlock | undefined;
export type MountTemplate = (host: Component, scope: Scope) => UpdateTemplate | undefined;
export type UpdateTemplate = (host: Component, scope: Scope) => number | void;
export type MountBlock<D = Scope> = (host: Component, injector: Injector, data: D) => UpdateBlock | void;
export type UpdateBlock<D = Scope> = (host: Component, injector: Injector, data: D) => number | void;
export type UnmountBlock = (scope: Scope) => void;

export interface Scope {
	[key: string]: any;
}

export interface Data {
	[key: string]: any;
}

export interface ChangeSet<T = any> {
	prev: { [name: string]: T | null };
	cur: { [name: string]: T | null };
}

export interface Changes {
	[key: string]: {
		current: any,
		prev: any
	};
}

export interface EventBinding extends EventListenerObject {
	host: Component;
	scope: Scope;
	type: string;
	target: Element;
}
