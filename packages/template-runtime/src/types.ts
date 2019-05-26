import { Component } from './component';
import { Injector } from './injector';

export type GetMount = (host: Component, scope: Scope) => MountBlock | undefined;

export interface MountTemplate {
	(host: Component, scope: Scope): UpdateTemplate | undefined
	dispose?: UnmountBlock
}

export type UpdateTemplate = (host: Component, scope: Scope) => number | void;

export interface MountBlock<D = Scope> {
	(host: Component, injector: Injector, data: D): UpdateBlock | undefined;
	dispose?: UnmountBlock
}

export type UpdateBlock<D = Scope> = (host: Component, injector: Injector, data: D) => number | void;
// NB: unlike in `MountBlock` and `UpdateBlock` types, use `host` as last argument
// since it’s used in rare cases (for example, in `animate:out`) and can be safely
// ignored by compiler in most cases to produce smaller bundle
export type UnmountBlock = (scope: Scope, host: Component) => void;

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

export type Changes<T = any> = {
	[P in keyof T]?: {
		current: T[P] | null,
		prev: T[P] | null
	}
};

export interface EventBinding extends EventListenerObject {
	host: Component;
	scope: Scope;
	type: string;
	target: Element;
}
