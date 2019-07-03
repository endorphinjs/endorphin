import { isDefined } from './utils';
import { ChangeSet } from './types';

/**
 * Alias for `elem.setAttribute`
 */
export function setAttribute(elem: Element, name: string, value: any) {
	elem.setAttribute(name, value);
	return value;
}

/**
 * Updates attribute value only if it’s not equal to previous value
 */
export function updateAttribute<T = any>(elem: Element, name: string, value: T, prevValue?: any): T {
	return prevValue !== value
		? setAttribute(elem, name, value)
		: value;
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
 * Adds or removes (if value is `void`) attribute to given element
 */
export function updateAttributeNS<T = any>(elem: Element, ns: string, name: string, value: T, prevValue?: any): T {
	return prevValue !== value
		? setAttributeNS(elem, ns, name, value)
		: value;
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
 * Alias for `elem.classList.toggle()` with additional fast check if class should
 * be added or removed
 * @returns `true` if class was added, `false` if removed
 */
export function toggleClass(elem: HTMLElement, className: string, condition: any, prevResult?: boolean): boolean {
	condition = !!condition;

	if (prevResult !== condition) {
		condition ? addClass(elem, className) : elem.classList.remove(className);
	}

	return condition;
}

/**
 * Adds potentially multiple class names to element
 */
export function addMultiClass(elem: HTMLElement, className: string) {
	const tokens = classNames(className);
	for (let i = 0; i < tokens.length; i++) {
		addClass(elem, tokens[i]);
	}
}

/**
 * Toggles potentially multiple class names on given element
 */
export function toggleMultiClass(elem: HTMLElement, className: string, condition: any, prevResult?: boolean): boolean {
	condition = !!condition;

	if (prevResult !== condition) {
		if (condition) {
			addMultiClass(elem, className);
		} else {
			const tokens = classNames(className);
			for (let i = 0; i < tokens.length; i++) {
				elem.classList.remove(tokens[i]);
			}
		}
	}

	return condition;
}

/**
 * Sets pending attribute value which will be added to attribute later
 */
export function setPendingAttribute(data: ChangeSet, name: string, value: any) {
	data.cur[name] = value;
}

/**
 * Adds given class name to pending attribute set
 */
export function addPendingClass(data: ChangeSet, className: string) {
	data.cur.class = data.cur.class ? ' ' + className : String(className);
}

/**
 * Finalizes pending attributes for given element
 */
export function finalizeAttributes(elem: Element, data: ChangeSet): number {
	let updated = 0;
	const { cur, prev } = data;

	for (const name in cur) {
		const curValue = cur[name];
		const prevValue = prev[name];

		if (curValue !== prevValue) {
			updated = 1;
			if (name === 'class') {
				elem.className = classNames(curValue).join(' ');
			} else {
				setAttributeExpression(elem, name, curValue);
			}
		}
		prev[name] = curValue;
		cur[name] = null;
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
		value = null;
	} else if (value === true) {
		value = '';
	} else if (Array.isArray(value)) {
		value = '[]';
	} else if (typeof value === 'function') {
		value = '𝑓';
	} else if (typeof value === 'object') {
		value = '{}';
	}

	return value;
}
