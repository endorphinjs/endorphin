import { obj, assign } from './utils';
import { Scope } from './types';
import { Component } from './component';

/**
 * Enters new variable scope context
 */
export function enterScope(host: Component, incoming?: Record<string, unknown>): Scope {
	return setScope(host, createScope(host, incoming));
}

/**
 * Exit from current variable scope
 */
export function exitScope(host: Component): Scope {
	return setScope(host, Object.getPrototypeOf(host.componentModel.vars));
}

/**
 * Creates new scope from given component state
 */
export function createScope(host: Component, incoming?: Record<string, unknown>): Scope {
	return assign(obj(host.componentModel.vars), incoming);
}

/**
 * Sets given object as current component scope
 */
export function setScope(host: Component, scope: Scope): Scope {
	return host.componentModel.vars = scope;
}

/**
 * Returns current variable scope
 */
export function getScope(elem: Component): Scope {
	return elem.componentModel.vars;
}

/**
 * Returns property with given name from component
 */
export function getProp(elem: Component, name: string): any {
	return elem.props[name];
}

/**
 * Returns state value with given name from component
 */
export function getState(elem: Component, name: string): any {
	return elem.state[name];
}

/**
 * Returns value of given runtime variable from component
 */
export function getVar(elem: Component, name: string): any {
	return elem.componentModel.vars[name];
}

/**
 * Sets value of given runtime variable for component
 */
export function setVar(elem: Component, name: string, value: unknown): void {
	elem.componentModel.vars[name] = value;
}
