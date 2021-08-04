import { isDefined, obj, assign } from './utils';
import { Component } from './component';

export interface ChangeSet {
	p: { [name: string]: any };
	c: { [name: string]: any };
}

export interface AttributeChangeSet extends ChangeSet {
	n?: { [namespace: string]: ChangeSet };
}

interface ValueMap {
	[name: string]: any;
}

interface ValueMapNS {
	[ns: string]: ValueMap;
}

/** Base object to create pending namespaced attribute set */
const nsProto = obj();

/**
 * Create pending props change set
 */
export function propsSet(elem: Component, initial?: Record<string, unknown>): Record<string, unknown> {
	const base = obj(elem.componentModel.defaultProps);
	return initial ? assign(base, initial) : base;
}

/**
 * Alias for `elem.setAttribute`
 */
export function setAttribute<T = unknown>(elem: Element, name: string, value: T): T {
	elem.setAttribute(name, value as unknown as string);
	return value;
}

/**
 * Updates element’s `name` attribute value only if it differs from previous value,
 * defined in `prev`
 */
export function updateAttribute(elem: Element, prev: ValueMap, name: string, value: unknown): number {
	if (value !== prev[name]) {
		const primitive = representedValue(value);
		if (primitive === null) {
			elem.removeAttribute(name);
		} else {
			setAttribute(elem, name, primitive);
		}
		prev[name] = value;
		return 1;
	}

	return 0;
}

/**
 * Alias for `elem.className`
 */
export function setClass<T = unknown>(elem: Element, value: T): T {
	elem.className = value as unknown as string;
	return value;
}

/**
 * Shorthand to update class name, specific to Endorphin compiled code
 */
export function updateClass(elem: Element, prev: ValueMap, value: unknown): number {
	return updateAttribute(elem, prev, 'class', value === '' ? undefined : value);
}

/**
 * Sets attribute value as expression. Unlike regular primitive attributes,
 * expression values must be represented, e.g. non-primitive values must be
 * converted to string representations. Also, expression resolved to `false`,
 * `null` or `undefined` will remove attribute from element
 */
export function setAttributeExpression<T = unknown>(elem: Element, name: string, value: T): T {
	const primitive = representedValue(value);
	primitive === null
		? elem.removeAttribute(name)
		: setAttribute(elem, name, primitive);
	return value;
}

/**
 * Alias for `elem.setAttributeNS`
 */
export function setAttributeNS<T = unknown>(elem: Element, ns: string, name: string, value: T): T {
	elem.setAttributeNS(ns, name, value as unknown as string);
	return value;
}

/**
 * Updates element’s `name` attribute value only if it differs from previous value,
 * defined in `prev`
 */
export function updateAttributeNS(elem: Element, prevNS: ValueMapNS, ns: string, name: string, value: unknown): number {
	const prev = ns in prevNS ? prevNS[ns] : (prevNS[ns] = obj());
	if (value !== prev[name]) {
		const primitive = representedValue(value);
		if (primitive === null) {
			elem.removeAttributeNS(ns, name);
		} else {
			setAttributeNS(elem, ns, name, primitive);
		}
		prev[name] = value;
		return 1;
	}

	return 0;
}

/**
 * Same as `setAttributeExpression()` but for namespaced attributes
 */
export function setAttributeExpressionNS<T = unknown>(elem: Element, ns: string, name: string, value: T): T {
	const primitive = representedValue(value);
	primitive === null
		? elem.removeAttributeNS(ns, name)
		: setAttributeNS(elem, ns, name, primitive);
	return value;
}

/**
 * Sets pending namespaced attribute value which will be added to element later
 */
export function setPendingAttributeNS(attrs: ValueMapNS, ns: string, name: string, value: unknown): void {
	const map = pendingNS(attrs, ns);
	map[name] = value;
}

/**
 * Updates pending `name` value only if given `value` is not null
 */
export function updatePendingAttribute(attrs: ValueMap, name: string, value: unknown): void {
	if (value != null) {
		attrs[name] = value;
	}
}

/**
 * Updates pending namespaced `name` value only if given `value` is not null
 */
export function updatePendingAttributeNS(attrs: ValueMap, ns: string, name: string, value: unknown): void {
	if (value != null) {
		pendingNS(attrs, ns)[name] = value;
	}
}

/**
 * Adds given class name to pending attribute set
 */
export function addPendingClass(data: ValueMap, className: string): void {
	if (className != null) {
		const prev = data.class;
		data.class = prev ? prev + ' ' + className : String(className);
	}
}

/**
 * Adds given class name to pending attribute set if condition is truthy
 */
export function addPendingClassIf(data: ValueMap, className: string, condition: unknown): void {
	condition && addPendingClass(data, className);
}

/**
 * Finalizes pending attributes
 */
export function finalizeAttributes(elem: Element, cur: ValueMap, prev: ValueMap): number {
	let updated = 0;

	for (const key in cur) {
		const curValue = cur[key];
		if (isPendingNS(curValue)) {
			// It’s a pending attribute set
			const prevNS = pendingNS(prev, key);
			for (const name in curValue) {
				const curNS = curValue[name];

				if (curNS !== prevNS[name]) {
					updated = 1;
					setAttributeExpressionNS(elem, key, name, curNS);
					prevNS[name] = curNS;
				}
				curValue[name] = null;
			}
		} else {
			if (curValue !== prev[key]) {
				updated = 1;
				if (key === 'class') {
					elem.className = classNames(curValue);
				} else {
					setAttributeExpression(elem, key, curValue);
				}
				prev[key] = curValue;
			}
			cur[key] = null;
		}
	}

	return updated;
}

/**
 * Returns normalized list of class names from given string
 */
export function classNames(str: string): string {
	if (isDefined(str)) {
		return String(str).split(/\s+/).filter(uniqueClassFilter).join(' ');
	}

	return '';
}

/**
 * Returns value for <input> element
 */
export function inputValue(value: unknown): string {
	return value != null ? value as string : '';
}

/**
 * Updates element’s `name` property value only if it differs from previous value,
 * defined in `prev`
 */
export function updateProperty(elem: Element, prev: ValueMap, name: string, value: unknown): number {
	if (value !== prev[name]) {
		elem[name] = name === 'value' ? inputValue(value) : value;
		prev[name] = value;
		return 1;
	}

	return 0;
}

/**
 * Returns represented attribute value for given data
 */
function representedValue(value: any): string | number | null {
	if (value === false || !isDefined(value)) {
		return null;
	}

	if (value === true) {
		return '';
	}

	if (Array.isArray(value)) {
		return '[]';
	}

	if (typeof value === 'function') {
		return '𝑓';
	}

	if (typeof value === 'object') {
		return '{}';
	}

	return value;
}

/**
 * Check if given object is a pending namespaced attribute set
 */
function isPendingNS(data: any): data is ValueMap {
	return data != null && typeof data === 'object' && Object.getPrototypeOf(data) === nsProto;
}

/**
 * Ensures given attribute value map contains namespace map for given `ns` and
 * returns it
 */
function pendingNS(attrs: ValueMap, ns: string): ValueMap {
	return ns in attrs ? attrs[ns] : (attrs[ns] = Object.create(nsProto));
}

function uniqueClassFilter(cl: string, index: number, arr: string[]): boolean {
	return cl ? arr.indexOf(cl) === index : false;
}
