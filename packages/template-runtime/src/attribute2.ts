import { isDefined, obj, changeSet } from './utils';
import { ChangeSet } from './types';

export interface AttributeChangeSet extends ChangeSet {
	elem: Element;
	ns: { [namespace: string]: ChangeSet } | null;
}

/**
 * Creates new attribute change set
 */
export function attributeSet(elem: Element): AttributeChangeSet {
	return { elem, ns: null, cur: obj(), prev: obj() };
}

/**
 * Alias for `elem.setAttribute`
 */
export function setAttribute(elem: Element, name: string, value: any) {
	elem.setAttribute(name, value);
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
	data.cur[name] = value;
}

/**
 * Sets pending namespaced attribute value which will be added to attribute later
 */
export function setPendingAttributeNS(data: AttributeChangeSet, ns: string, name: string, value: any) {
	if (!data.ns) {
		data.ns = obj();
	}

	if (!data.ns[ns]) {
		data.ns[ns] = changeSet();
	}

	data.ns[ns].cur[name] = value;
}

/**
 * Adds given class name to pending attribute set
 */
export function addPendingClass(data: AttributeChangeSet, className: string) {
	if (className != null) {
		const prev = data.cur.class;
		data.cur.class = prev ? prev + ' ' + className : String(className);
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
export function finalizeAttributes(data: AttributeChangeSet): number {
	let updated = 0;
	const { elem, cur, prev } = data;

	for (const name in cur) {
		const curValue = cur[name];

		if (curValue !== prev[name]) {
			updated = 1;
			if (name === 'class') {
				elem.className = classNames(curValue).join(' ');
			} else {
				setAttributeExpression(elem, name, curValue);
			}
			prev[name] = curValue;
		}
		cur[name] = null;
	}

	return updated;
}

/**
 * Finalizes pending namespaced attributes
 */
export function finalizeAttributesNS(data: AttributeChangeSet): number {
	if (!data.ns) {
		return 0;
	}

	let updated = 0;
	const { elem } = data;
	for (const ns in data.ns!) {
		const { cur, prev } = data.ns[ns];
		for (const name in cur) {
			const curValue = cur[name];

			if (curValue !== prev[name]) {
				updated = 1;
				setAttributeExpressionNS(elem, ns, name, curValue);
				prev[name] = curValue;
			}
			cur[name] = null;
		}
	}

	return updated;
}

/**
 * Returns normalized list of class names from given string
 */
function classNames(str: string): string[] {
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
