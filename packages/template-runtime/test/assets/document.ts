import { EventBinding } from '../../src/types';

type Callback = (elem: NodeShim) => void;
const callbacks: Callback[] = [];

interface AttributeShim {
	name: string;
	value: string | null;
}

export interface EventShim {
	type: string;
	[name: string]: any;
}

/**
 * Minimal DOM shim, required for testing
 */
class NodeShim {
	style: { [name: string]: string } = { animation: '' };
	childNodes: NodeShim[] = [];
	attributes: AttributeShim[] = [];
	parentNode?: NodeShim | null;
	attached = 0;
	detached = 0;
	listeners: { [name: string]: Array<EventBinding | EventListener> } = {};

	constructor(public nodeName: string, public nodeType: number = 0, public nodeValue?: string) {}

	get _index(): number {
		return this.parentNode ? this.parentNode._getIndex(this) : -1;
	}

	_getIndex(node: NodeShim): number {
		return this.childNodes.indexOf(node);
	}

	get nextSibling(): NodeShim | null {
		if (this.parentNode) {
			const siblings = this.parentNode.childNodes;
			const ix = this._index;
			if (ix !== -1 && ix < siblings.length - 1) {
				return siblings[ix + 1];
			}
		}

		return null;
	}

	get previousSibling(): NodeShim | null {
		if (this.parentNode) {
			const siblings = this.parentNode.childNodes;
			const ix = this._index;
			if (ix > 0) {
				return siblings[ix - 1];
			}
		}
		return null;
	}

	get className() {
		return this.getAttribute('class');
	}

	set className(value) {
		this.setAttribute('class', value);
	}

	get firstChild(): NodeShim {
		return this.childNodes[0];
	}

	getAttribute(name: string): string | null {
		const attr = this.attributes.find(a => a.name === name);
		return attr ? attr.value : null;
	}

	setAttribute(name: string, value: string | null) {
		const attr = this.attributes.find(a => a.name === name);
		if (attr) {
			attr.value = value;
		} else {
			this.attributes.push({ name, value });
		}
	}

	removeAttribute(name: string) {
		this.attributes = this.attributes.filter(attr => attr.name !== name);
	}

	hasAttribute(name: string): boolean {
		return !!this.attributes.find(attr => attr.name === name);
	}

	appendChild<T extends NodeShim>(node: T): T {
		if (node.nodeType === NodeShim.DOCUMENT_FRAGMENT_NODE) {
			while (node.firstChild) {
				this.appendChild(node.firstChild);
			}
		} else {
			node.remove();
			this.childNodes.push(node);
			node.parentNode = this;
			node.attached++;
		}

		return node;
	}

	insertBefore(node: NodeShim, ref: NodeShim) {
		if (node.nodeType === NodeShim.DOCUMENT_FRAGMENT_NODE) {
			while (node.firstChild) {
				this.insertBefore(node.firstChild, ref);
			}
		} else {
			if (!this.childNodes.includes(ref)) {
				throw new Error('Not a child node');
			}

			node.remove();

			const ix = this._getIndex(ref);
			this.childNodes.splice(ix, 0, node);
			node.parentNode = this;
			node.attached++;
		}

		return node;
	}

	removeChild(node: NodeShim) {
		if (this._getIndex(node) === -1) {
			throw new Error('Not a child node');
		}
		node.remove();
	}

	remove() {
		if (this.parentNode) {
			const siblings = this.parentNode.childNodes;
			const ix = this._index;
			if (ix === -1) {
				throw new Error('Not a child!');
			}

			siblings.splice(ix, 1);
			this.parentNode = null;
			this.detached++;
		}
	}

	addEventListener(name: string, listener: EventBinding) {
		if (!this.listeners[name]) {
			this.listeners[name] = [listener];
		} else if (!this.listeners[name].includes(listener)) {
			this.listeners[name].push(listener);
		}
	}

	removeEventListener(name: string, listener: EventBinding) {
		if (name in this.listeners) {
			this.listeners[name] = this.listeners[name].filter(item => item !== listener);
			if (!this.listeners[name].length) {
				delete this.listeners[name];
			}
		}
	}

	dispatchEvent(event: EventShim) {
		const listeners = this.listeners[event.type];
		if (listeners) {
			for (let i = listeners.length - 1; i >= 0; i--) {
				const listener = listeners[i];
				if (typeof listener === 'function') {
					listener(event as Event);
				} else {
					listener.handleEvent(event as Event);
				}
			}
		}

		if (this.parentNode) {
			this.parentNode.dispatchEvent(event);
		}
	}

	toString(indent = '\t', level = 0) {
		return this.nodeName;
	}

	static get ELEMENT_NODE() { return 1; }
	static get TEXT_NODE() { return 3; }
	static get COMMENT_NODE() { return 8; }
	static get DOCUMENT_NODE() { return 9; }
	static get DOCUMENT_FRAGMENT_NODE() { return 11; }

	get ELEMENT_NODE() { return 1; }
	get TEXT_NODE() { return 3; }
	get COMMENT_NODE() { return 8; }
	get DOCUMENT_NODE() { return 9; }
	get DOCUMENT_FRAGMENT_NODE() { return 11; }
	get textContent() {
		return this.nodeValue;
	}
}

class DocumentShim extends NodeShim {
	constructor() {
		super('#document', NodeShim.DOCUMENT_NODE);
	}

	toString() {
		return stringifyChildren(this);
	}

	createDocumentFragment() {
		return new DocumentFragmentShim();
	}

	createElement(name: string) {
		const elem = new ElementShim(name);
		callbacks.forEach(fn => fn(elem));
		return elem;
	}

	createTextNode(value: string) {
		return new TextShim(value);
	}

	createComment(value: string) {
		return new CommentShim(value);
	}
}

class DocumentFragmentShim extends NodeShim {
	constructor() {
		super('#document-fragment', NodeShim.DOCUMENT_FRAGMENT_NODE);
	}

	get textContent() {
		return this.childNodes.map(node => node.textContent).join('');
	}

	toString(indent = '\t', level = 0) {
		const prefix = indent.repeat(level);
		return `${prefix}${this.nodeName}\n${stringifyChildren(this, indent, level + 1)}`;
	}
}

export class ElementShim extends NodeShim {
	root?: any;
	store?: any;

	constructor(name: string) {
		super(name, NodeShim.ELEMENT_NODE);
	}

	get textContent() {
		return this.childNodes.map(node => node.textContent).join('');
	}

	set textContent(value) {
		while (this.firstChild) {
			this.removeChild(this.firstChild);
		}

		this.appendChild(new TextShim(value));
	}

	get innerHTML() {
		return stringifyChildren(this);
	}

	set innerHTML(value) {
		this.childNodes.length = 0;
		parseHTML(this, value);
	}

	/**
	 * Finds node by given name
	 * @param {string} name
	 * @returns {ElementShim}
	 */
	findByName(name: string): ElementShim | undefined {
		let ctx = this.firstChild as ElementShim;
		let child: ElementShim | undefined;
		while (ctx) {
			if (ctx.nodeName === name) {
				return ctx;
			}

			if (ctx.nodeType === ctx.ELEMENT_NODE) {
				child = ctx.findByName(name);
				if (child) {
					return child;
				}
			}

			ctx = ctx.nextSibling as ElementShim;
		}
	}

	toString(indent = '\t', level = 0) {
		const attrs = this.attributes.map(attr => ` ${attr.name}="${attr.value}"`).join('');
		const prefix = indent.repeat(level);

		if (!this.childNodes.length || this.childNodes.length === 1 && this.firstChild.nodeType === NodeShim.TEXT_NODE) {
			return `${prefix}<${this.nodeName}${attrs}>${stringifyChildren(this)}</${this.nodeName}>`;
		}

		return `${prefix}<${this.nodeName}${attrs}>\n${stringifyChildren(this, indent, level + 1)}\n${prefix}</${this.nodeName}>`;
	}
}

class TextShim extends NodeShim {
	constructor(value: string) {
		super('#text', NodeShim.TEXT_NODE, value);
	}

	get textContent() {
		return this.nodeValue;
	}

	set textContent(value) {
		this.nodeValue = value;
	}

	toString(indent = '\t', level = 0) {
		return `${indent.repeat(level)}${this.nodeValue}`;
	}
}

class CommentShim extends NodeShim {
	constructor(value: string) {
		super('#comment', NodeShim.COMMENT_NODE, value);
	}

	toString(indent = '\t', level = 0) {
		return `${indent.repeat(level)}<!--${this.nodeValue}-->`;
	}
}

/**
 * @param {NodeShim} node
 * @param {String} indent
 * @param {Number} level
 * @returns {String}
 */
function stringifyChildren(node: NodeShim, indent = '\t', level = 0): string {
	return node.childNodes
		.map(n => `${n.toString(indent, level)}`)
		.join('\n');
}

export default new DocumentShim();

export function setCallback(fn: Callback) {
	callbacks.push(fn);
}

export function clearCallbacks() {
	callbacks.length = 0;
}

/**
 * Parses given HTML code into dom
 */
function parseHTML(ctx: ElementShim, html: string): ElementShim {
	let pos = 0;
	let m: RegExpExecArray | null;
	const re = /<\/?(\w+)>/g;

	// For testing purposes, parse XML nodes without attributes
	while (m = re.exec(html)) {
		if (pos !== m.index) {
			ctx.appendChild(new TextShim(html.slice(pos, m.index)));
		}

		if (m[0][1] === '/') {
			ctx = ctx.parentNode as ElementShim;
		} else {
			ctx = ctx.appendChild(new ElementShim(m[1]));
		}

		pos = m.index + m[0].length;
	}

	if (pos < html.length) {
		ctx.appendChild(new TextShim(html.slice(pos)));
	}

	return ctx;
}
