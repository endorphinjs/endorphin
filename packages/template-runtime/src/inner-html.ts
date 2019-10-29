import { insert, injectBlock, disposeBlock, emptyBlockContent, Injector, Block } from './injector';
import { isDefined } from './utils';
import { getScope } from './scope';
import { GetMount } from './types';
import { Component } from './component';
import { isolateElement } from './dom';

interface InnerHtmlBlock extends Block {
	get: GetMount;
	code: string | Node | null;
	slotName: string;
}

/**
 * Renders code, returned from `get` function, as HTML
 */
export function mountInnerHTML(host: Component, injector: Injector, get: GetMount, slotName: string): InnerHtmlBlock {
	const block = injectBlock<InnerHtmlBlock>(injector, {
		host,
		injector,
		scope: getScope(host),
		get,
		code: null,
		slotName
	});
	updateInnerHTML(block);
	return block;
}

/**
 * Updates inner HTML of block, defined in `ctx`
 * @returns Returns `1` if inner HTML was updated, `0` otherwise
 */
export function updateInnerHTML(block: InnerHtmlBlock): number {
	const { host, injector, scope } = block;
	const code = block.get(host, scope) as any as string | Node;

	if (code !== block.code) {
		emptyBlockContent(block);
		if (isDefined(block.code = code)) {
			injector.ptr = block.start;
			renderHTML(host, injector, code, block.slotName);
		}
		injector.ptr = block.end;
		return 1;
	}

	return 0;
}

export function unmountInnerHTML(block: InnerHtmlBlock) {
	disposeBlock(block);
}

function renderHTML(host: Component, injector: Injector, code: string | Node, slotName: string) {
	const { cssScope } = host.componentModel.definition;

	if (isNode(code)) {
		// Insert as DOM element
		cssScope && scopeDOM(code, cssScope);
		if (code.nodeType === code.DOCUMENT_FRAGMENT_NODE) {
			// Insert document fragment contents separately to properly maintain
			// list of inserted elements
			while (code.firstChild) {
				insert(injector, code.firstChild, slotName);
			}
		} else {
			insert(injector, code, slotName);
		}
	} else {
		// Render as HTML
		const div = document.createElement('div');
		div.innerHTML = code;

		cssScope && scopeDOM(div, cssScope);
		while (div.firstChild) {
			insert(injector, div.firstChild, slotName);
		}
	}
}

/**
 * Scopes CSS of all elements in given node
 */
function scopeDOM(node: Node, cssScope: string) {
	node = node.firstChild as Element;
	while (node) {
		if (node.nodeType === node.ELEMENT_NODE) {
			isolateElement(node as Element, cssScope);
			scopeDOM(node, cssScope);
		}
		node = node.nextSibling as Element;
	}
}

function isNode(obj: any): obj is Node {
	return obj && obj.nodeType;
}
