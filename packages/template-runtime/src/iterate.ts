import { injectBlock, disposeBlock, Injector, Block } from './injector';
import { setScope, getScope } from './scope';
import { obj } from './utils';
import { Scope, MountBlock } from './types';
import { Component } from './component';
import { LinkedListItem } from './linked-list';

export type RenderItemsGetter = (host: Component, scope: Scope) => any[];

export interface IteratorBlock extends Block {
	get: RenderItemsGetter;
	body: MountBlock;
	index: number;
	updated: number;
}

type IteratorItemBlock = Block;

/**
 * Mounts iterator block
 * @param get A function that returns collection to iterate
 * @param body A function that renders item of iterated collection
 */
export function mountIterator(host: Component, injector: Injector, get: RenderItemsGetter, body: MountBlock): IteratorBlock {
	const block = injectBlock<IteratorBlock>(injector, {
		host,
		injector,
		scope: getScope(host),
		get,
		body,
		index: 0,
		updated: 0
	});
	updateIterator(block);
	return block;
}

/**
 * Updates iterator block defined in `ctx`
 * @returns Returns `1` if iterator was updated, `0` otherwise
 */
export function updateIterator(block: IteratorBlock): number {
	const { injector } = block;
	injector.ptr = block.start;
	block.index = block.updated = 0;

	const collection = block.get(block.host, block.scope);
	if (collection && typeof collection.forEach === 'function') {
		collection.forEach(iterator, block);
	}

	trimIteratorItems(block, injector.ptr!.next!);
	injector.ptr = block.end;
	return block.updated;
}

export function unmountIterator(block: IteratorBlock) {
	disposeBlock(block);
}

export function prepareScope(scope: Scope, index: number, key: any, value: any): Scope {
	scope.index = index;
	scope.key = key;
	scope.value = value;
	return scope;
}

/**
 * Removes remaining iterator items from current context
 */
function trimIteratorItems(block: IteratorBlock, start: LinkedListItem) {
	let listItem: IteratorItemBlock;
	while (start !== block.end) {
		block.updated = 1;
		listItem = start.value;
		start = listItem.end.next!;
		disposeBlock(listItem);
	}
}

function iterator(this: IteratorBlock, value: any, key: any) {
	const { host, injector, index, body, end } = this;
	const { next } = injector.ptr!;
	const prevScope = getScope(host);
	let rendered: IteratorItemBlock;

	if (next !== end) {
		rendered = next!.value;
		// We have rendered item, update it
		if (rendered.update) {
			const scope = prepareScope(rendered.scope, index, key, value);
			setScope(host, scope);
			if (rendered.update(host, scope)) {
				this.updated = 1;
			}
			setScope(host, prevScope);
		}
	} else {
		// Create & render new block
		const scope = prepareScope(obj(prevScope), index, key, value);

		rendered = injectBlock<IteratorItemBlock>(injector, {
			host,
			injector,
			scope,
			mount: body,
			update: undefined,
		});

		setScope(host, scope);
		injector.ptr = rendered.start;
		rendered.update = body(host, injector, scope);
		setScope(host, prevScope);
		this.updated = 1;
	}

	injector.ptr = rendered.end;
	this.index++;
}
