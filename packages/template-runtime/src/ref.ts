import { Component, RefMap } from './component';

/**
 * Adds given element as a named ref
 */
export function setRef(host: Component, key: string, elem: Element) {
	elem.setAttribute(getRefAttr(key, host), '');
	host.refs[key] = elem;
}

/**
 * Removes ref for given key
 */
export function removeRef(host: Component, key: string) {
	const elem = host.refs[key];
	if (elem) {
		elem.removeAttribute(getRefAttr(key, host));
		host.refs[key] = null;
	}
}

export function setPendingRef(pending: RefMap, key: string | void, elem: Element | null) {
	if (key && elem) {
		pending[key] = elem;
	}
}

export function finalizePendingRefs(host: Component, pending: RefMap) {
	for (const key in pending) {
		const prev = host.refs[key];
		const next = pending[key];
		if (prev !== next) {
			prev && removeRef(host, key);
			next && setRef(host, key, next);
		}
		pending[key] = null;
	}
}

/**
 * Returns attribute name to identify element in CSS
 */
function getRefAttr(name: string, host: Component) {
	const cssScope = host.componentModel.definition.cssScope;
	return 'ref-' + name + (cssScope ? '-' + cssScope : '');
}
