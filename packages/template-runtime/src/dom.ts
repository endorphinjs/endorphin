type TextNode = Text & { $value: any };

/**
 * Creates element with given tag name
 * @param cssScope Scope for CSS isolation
 */
export function elem(tagName: string, cssScope?: string): Element {
	const el = document.createElement(tagName);
	cssScope && el.setAttribute(cssScope, '');
	return el;
}

/**
 * Creates element with given tag name under `ns` namespace
 * @param cssScope Scope for CSS isolation
 */
export function elemNS(tagName: string, ns: string, cssScope?: string): Element {
	const el = document.createElementNS(ns, tagName);
	cssScope && el.setAttribute(cssScope, '');
	return el;
}

/**
 * Creates element with given tag name and text
 * @param cssScope Scope for CSS isolation
 */
export function elemWithText(tagName: string, value: string, cssScope?: string): Element {
	const el = elem(tagName, cssScope);
	el.textContent = textValue(value);
	return el;
}

/**
 * Creates element with given tag name under `ns` namespace and text
 * @param cssScope Scope for CSS isolation
 */
export function elemNSWithText(tagName: string, ns: string, value: string, cssScope?: string): Element {
	const el = elemNS(tagName, ns, cssScope);
	el.textContent = textValue(value);
	return el;
}

/**
 * Creates text node with given value
 */
export function text(value: string): TextNode {
	const node = document.createTextNode(textValue(value)) as TextNode;
	node.$value = value;
	return node;
}

/**
 * Updates given text node value, if required
 * @returns Returns `1` if text was updated, `0` otherwise
 */
export function updateText(node: TextNode, value: any): number {
	if (value !== node.$value) {
		node.nodeValue = textValue(value);
		node.$value = value;
		return 1;
	}

	return 0;
}

/**
 * @returns Inserted item
 */
export function domInsert<T extends Node>(node: T, parent: Node, anchor?: Node): T {
	return anchor
		? parent.insertBefore(node, anchor)
		: parent.appendChild(node);
}

/**
 * Removes given DOM node from its tree
 * @param {Node} node
 */
export function domRemove(node: Node) {
	const { parentNode } = node;
	parentNode && parentNode.removeChild(node);
}

/**
 * Returns textual representation of given `value` object
 */
function textValue(value: any): string {
	return value != null ? value : '';
}
