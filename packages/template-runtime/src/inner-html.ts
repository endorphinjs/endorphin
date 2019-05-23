import { run, insert, injectBlock, disposeBlock, emptyBlockContent, BaseBlock, Injector } from './injector';
import { isDefined } from './utils';
import { getScope } from './scope';
import { GetMount } from './types';
import { Component } from './component';
import { isolateElement } from './dom';

interface InnerHtmlBlock extends BaseBlock<InnerHtmlBlock> {
	get: GetMount;
	code: any;
	slotName: string;
}

/**
 * Renders code, returned from `get` function, as HTML
 */
export function mountInnerHTML(host: Component, injector: Injector, get: GetMount, slotName: string): InnerHtmlBlock {
	const block = injectBlock<InnerHtmlBlock>(injector, {
		$$block: true,
		host,
		injector,
		scope: getScope(host),
		dispose: null,
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
	const code = block.get(block.host, block.scope);

	if (code !== block.code) {
		emptyBlockContent(block);
		if (isDefined(block.code = code)) {
			run(block, renderHTML, block);
		}
		block.injector.ptr = block.end;
		return 1;
	}

	return 0;
}

export function unmountInnerHTML(ctx: InnerHtmlBlock) {
	disposeBlock(ctx);
}

function renderHTML(host: Component, injector: Injector, ctx: InnerHtmlBlock) {
	const { code } = ctx;
	const { cssScope } = host.componentModel.definition;

	if (code && code.nodeType) {
		// Insert as DOM element
		cssScope && scopeDOM(code, cssScope);
		insert(injector, code, ctx.slotName);
	} else {
		// Render as HTML
		const div = document.createElement('div');
		div.innerHTML = ctx.code;

		cssScope && scopeDOM(div, cssScope);
		while (div.firstChild) {
			insert(injector, div.firstChild, ctx.slotName);
		}
	}
}

/**
 * Scopes CSS of all elements in given node
 */
function scopeDOM(node: Element, cssScope: string) {
	node = node.firstChild as Element;
	while (node) {
		if (node.nodeType === node.ELEMENT_NODE) {
			isolateElement(node, cssScope);
			scopeDOM(node, cssScope);
		}
		node = node.nextSibling as Element;
	}
}
