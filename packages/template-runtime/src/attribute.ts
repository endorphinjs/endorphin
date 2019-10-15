import { isDefined, obj, assign } from './utils';
import { Component } from './component';

export interface ChangeSet {
	p: { [name: string]: any };
	c: { [name: string]: any };
}

export interface AttributeChangeSet extends ChangeSet {
	n?: { [namespace: string]: ChangeSet };
}

/**
 * Creates new attribute change set
 */
export function attributeSet(): AttributeChangeSet {
	return { c: obj(), p: obj() };
}

/**
 * Create pending props change set
 */
export function propsSet(elem: Component): AttributeChangeSet {
	const props = assign(obj(), elem.componentModel.defaultProps);
	// NB in components, pending `c` props are tested against actual `.props`,
	// the `p` property is not used. To keep up with the same hidden JS class,
	// create `p` property as well and point it to `c` to reduce object allocations
	return { c: props, p: props };
}

/**
 * Alias for `elem.setAttribute`
 */
export function setAttribute(elem: Element, name: string, value: any) {
	elem.setAttribute(name, value);
	return value;
}

/**
 * Updates element’s `name` attribute value only if it differs from previous value,
 * defined in `prev`
 */
export function updateAttribute(elem: Element, prev: { [name: string]: any }, name: string, value: any) {
	if (value !== prev[name]) {
		const primitive = representedValue(value);
		if (primitive === null) {
			elem.removeAttribute(name);
		} else {
			setAttribute(elem, name, primitive);
		}
		prev[name] = value;
	}

	return value;
}

/**
 * Alias for `elem.className`
 */
export function setClass(elem: Element, value: any) {
	elem.className = value;
	return value;
}

/**
 * Sets attribute value as expression. Unlike regular primitive attributes,
 * expression values must be represented, e.g. non-primitive values must be
 * converted to string representations. Also, expression resolved to `false`,
 * `null` or `undefined` will remove attribute from element
 */
export function setAttributeExpression(elem: Element, name: string, value: any) {
	const primitive = representedValue(value);
	primitive === null
		? elem.removeAttribute(name)
		: setAttribute(elem, name, primitive);
	return value;
}

/**
 * Updates attribute value only if it’s not equal to previous value
 */
export function updateAttributeExpression<T = any>(elem: Element, name: string, value: T, prevValue?: any): T {
	return prevValue !== value
		? setAttributeExpression(elem, name, value)
		: value;
}

/**
 * Alias for `elem.setAttributeNS`
 */
export function setAttributeNS(elem: Element, ns: string, name: string, value: any) {
	elem.setAttributeNS(ns, name, value);
	return value;
}

/**
 * Same as `setAttributeExpression()` but for namespaced attributes
 */
export function setAttributeExpressionNS(elem: Element, ns: string, name: string, value: any) {
	const primitive = representedValue(value);
	primitive === null
		? elem.removeAttributeNS(ns, name)
		: setAttributeNS(elem, ns, name, primitive);
	return value;
}

/**
 * Adds or removes (if value is `void`) attribute to given element
 */
export function updateAttributeExpressionNS<T = any>(elem: Element, ns: string, name: string, value: T, prevValue?: any): T {
	return prevValue !== value
		? setAttributeExpressionNS(elem, ns, name, value)
		: value;
}

/**
 * Alias for `elem.classList.add()`
 */
export function addClass(elem: HTMLElement, className: string) {
	elem.classList.add(className);
}

/**
 * Adds class to given element if given condition is truthy
 */
export function addClassIf(elem: HTMLElement, className: string, condition: any): boolean {
	condition && addClass(elem, className);
	return condition;
}

/**
 * Toggles class on given element if condition is changed
 */
export function toggleClassIf(elem: HTMLElement, className: string, condition: any, prevResult: boolean): boolean {
	if (prevResult !== condition) {
		condition ? addClass(elem, className) : elem.classList.remove(className);
	}

	return condition;
}

/**
 * Sets pending attribute value which will be added to attribute later
 */
export function setPendingAttribute(data: AttributeChangeSet, name: string, value: any) {
	data.c[name] = value;
}

/**
 * Sets pending namespaced attribute value which will be added to attribute later
 */
export function setPendingAttributeNS(data: AttributeChangeSet, ns: string, name: string, value: any) {
	if (!data.n) {
		data.n = obj();
	}

	if (!data.n[ns]) {
		data.n[ns] = attributeSet();
	}

	data.n[ns].c[name] = value;
}

/**
 * Adds given class name to pending attribute set
 */
export function addPendingClass(data: AttributeChangeSet, className: string) {
	if (className != null) {
		const prev = data.c.class;
		data.c.class = prev ? prev + ' ' + className : String(className);
	}
}

/**
 * Adds given class name to pending attribute set if condition is truthy
 */
export function addPendingClassIf(data: AttributeChangeSet, className: string, condition: any) {
	condition && addPendingClass(data, className);
}

/**
 * Finalizes pending attributes
 */
export function finalizeAttributes(elem: Element, data: AttributeChangeSet): number {
	let updated = 0;
	const { c, p } = data;

	for (const name in c) {
		const curValue = c[name];

		if (curValue !== p[name]) {
			updated = 1;
			if (name === 'class') {
				elem.className = classNames(curValue).join(' ');
			} else {
				setAttributeExpression(elem, name, curValue);
			}
			p[name] = curValue;
		}
		c[name] = null;
	}

	return updated;
}

/**
 * Finalizes pending namespaced attributes
 */
export function finalizeAttributesNS(elem: Element, data: AttributeChangeSet): number {
	// NB use it as a separate function to use explicitly inside generated content.
	// It there’s no pending namespace attributes, this method will not be included
	// into final bundle
	if (!data.n) {
		return 0;
	}

	let updated = 0;
	for (const ns in data.n!) {
		const { c, p } = data.n[ns];
		for (const name in c) {
			const curValue = c[name];

			if (curValue !== p[name]) {
				updated = 1;
				setAttributeExpressionNS(elem, ns, name, curValue);
				p[name] = curValue;
			}
			c[name] = null;
		}
	}

	return updated;
}

/**
 * Returns normalized list of class names from given string
 */
export function classNames(str: string): string[] {
	const out: string[] = [];

	if (isDefined(str)) {
		const parts = String(str).split(/\s+/);

		for (let i = 0, cl: string; i < parts.length; i++) {
			cl = parts[i];
			if (cl && out.indexOf(cl) === -1) {
				out.push(cl);
			}
		}
	}

	return out;
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
