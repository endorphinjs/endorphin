import { finalizeItems } from './utils';
import { Component } from './component';

/**
 * Sets runtime ref (e.g. ref which will be changed over time) to given host
 * @returns Update status. Refs must be explicitly finalized, thus
 * we always return `0` as nothing was changed
 */
export function setRef(host: Component, name: string, elem: HTMLElement): number {
	host.componentModel.refs.cur[name] = elem;
	return 0;
}

/**
 * Sets static ref (e.g. ref which won’t be changed over time) to given host
 */
export function setStaticRef(host: Component, name: string, value: Element) {
	value && value.setAttribute(getRefAttr(name, host), '');
	host.refs[name] = value;
}

/**
 * Finalizes refs on given scope
 * @returns Update status
 */
export function finalizeRefs(host: Component): number {
	return finalizeItems(host.componentModel.refs, changeRef, host);
}

/**
 * Invoked when element reference was changed
 */
function changeRef(name: string, prevValue: Element, newValue: Element, host: Component) {
	prevValue && prevValue.removeAttribute(getRefAttr(name, host));
	setStaticRef(host, name, newValue);
}

/**
 * Returns attribute name to identify element in CSS
 */
function getRefAttr(name: string, host: Component) {
	const cssScope = host.componentModel.definition.cssScope;
	return 'ref-' + name + (cssScope ? '-' + cssScope : '');
}
