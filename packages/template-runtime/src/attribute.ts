import { isDefined, finalizeItems, obj, representAttributeValue, changeSet } from './utils';
import { Injector } from './injector';
import { Component } from './component';

interface NSCtx {
	node: Element;
	ns: string | null;
}

/**
 * Sets value of attribute `name` to `value`
 * @return  Update status. Always returns `0` since actual attribute value
 * is defined in `finalizeAttributes()`
 */
export function setAttribute(injector: Injector, name: string, value: any): number {
	injector.attributes.cur[name] = value;
	return 0;
}

/**
 * Sets value of attribute `name` under namespace of `nsURI` to `value`
 */
export function setAttributeNS(injector: Injector, nsURI: string, name: string, value: any) {
	if (!injector.attributesNS) {
		injector.attributesNS = obj();
	}

	const { attributesNS } = injector;

	if (!attributesNS[nsURI]) {
		attributesNS[nsURI] = changeSet();
	}

	attributesNS[nsURI].cur[name] = value;
}

/**
 * Updates `attrName` value in `elem`, if required
 * @returns New attribute value
 */
export function updateAttribute(elem: HTMLElement, attrName: string, value: any, prevValue: any): any {
	if (value !== prevValue) {
		changeAttribute(attrName, prevValue, value, elem);
		return value;
	}

	return prevValue;
}

/**
 * Updates props in given component, if required
 * @return Returns `true` if value was updated
 */
export function updateProps(elem: Component, data: object): boolean {
	const { props } = elem;
	let updated: any;

	for (const p in data) {
		if (data.hasOwnProperty(p) && props[p] !== data[p]) {
			if (!updated) {
				updated = obj();
			}
			updated[p] = data[p];
		}
	}

	if (updated) {
		elem.setProps(data);
		return true;
	}

	return false;
}

/**
 * Adds given class name as pending attribute
 */
export function addClass(injector: Injector, value: string) {
	if (isDefined(value)) {
		const className = injector.attributes.cur.class as string;
		setAttribute(injector, 'class', isDefined(className) ? className + ' ' + value : value);
	}
}

/**
 * Applies pending attributes changes to injector’s host element
 */
export function finalizeAttributes(injector: Injector): number {
	const { attributes, attributesNS } = injector;

	if (isDefined(attributes.cur.class)) {
		attributes.cur.class = normalizeClassName(attributes.cur.class);
	}

	let updated = finalizeItems(attributes, changeAttribute, injector.parentNode);

	if (attributesNS) {
		const ctx: NSCtx = { node: injector.parentNode, ns: null };
		for (const ns in attributesNS) {
			ctx.ns = ns;
			updated |= finalizeItems(attributesNS[ns], changeAttributeNS, ctx);
		}
	}

	return updated;
}

/**
 * Normalizes given class value: removes duplicates and trims whitespace
 */
export function normalizeClassName(str: string): string {
	const out: string[] = [];
	const parts = String(str).split(/\s+/);

	for (let i = 0, cl: string; i < parts.length; i++) {
		cl = parts[i];
		if (cl && out.indexOf(cl) === -1) {
			out.push(cl);
		}
	}

	return out.join(' ');
}

/**
 * Callback for changing attribute value
 */
function changeAttribute(name: string, prevValue: any, newValue: any, elem: Element): void {
	if (isDefined(newValue)) {
		if (name === 'class') {
			elem.className = normalizeClassName(newValue);
		} else {
			representAttributeValue(elem, name, newValue);
		}
	} else if (isDefined(prevValue)) {
		elem.removeAttribute(name);
	}
}

/**
 * Callback for changing attribute value
 */
function changeAttributeNS(name: string, prevValue: any, newValue: any, ctx: NSCtx): void {
	if (isDefined(newValue)) {
		ctx.node.setAttributeNS(ctx.ns, name, newValue);
	} else if (isDefined(prevValue)) {
		ctx.node.removeAttributeNS(ctx.ns, name);
	}
}
