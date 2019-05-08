import { run, injectBlock, disposeBlock, BaseBlock, Injector } from './injector';
import { setScope, getScope } from './scope';
import { obj } from './utils';
import { Scope, MountBlock, UpdateBlock } from './types';
import { Component } from './component';
import { LinkedListItem } from './linked-list';

export type RenderItemsGetter = (host: Component, scope: Scope) => any[];

export interface IteratorBlock extends BaseBlock<IteratorBlock> {
	get: RenderItemsGetter;
	body: MountBlock;
	index: number;
	updated: number;
}

interface IteratorItemBlock extends BaseBlock<IteratorItemBlock> {
	update: UpdateBlock | void;
	owner: IteratorBlock;
}

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
		dispose: null,
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
	run(block, iteratorHost, block);
	return block.updated;
}

export function unmountIterator(block: IteratorBlock) {
	disposeBlock(block);
}

function iteratorHost(host: Component, injector: Injector, block: IteratorBlock) {
	block.index = 0;
	block.updated = 0;
	const collection = block.get(host, block.scope);
	if (collection && typeof collection.forEach === 'function') {
		collection.forEach(iterator, block);
	}

	trimIteratorItems(block);
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
function trimIteratorItems(block: IteratorBlock) {
	let item: LinkedListItem<IteratorItemBlock> | null = block.injector.ptr!.next;
	let listItem: IteratorItemBlock;
	while (item && item.value.owner === block) {
		block.updated = 1;
		listItem = item.value;
		item = listItem.end.next;
		disposeBlock(listItem);
	}
}

function iterator(this: IteratorBlock, value: any, key: any) {
	const { host, injector, index } = this;
	const { ptr } = injector;
	const prevScope = getScope(host);

	let rendered: IteratorItemBlock = ptr!.next!.value;

	if (rendered.owner === this) {
		// We have rendered item, update it
		if (rendered.update) {
			const scope = prepareScope(rendered.scope, index, key, value);
			setScope(host, scope);
			if (run(rendered, rendered.update, scope)) {
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
			dispose: null,
			update: undefined,
			owner: this
		});

		setScope(host, scope);
		rendered.update = run(rendered, this.body, scope);
		setScope(host, prevScope);
		this.updated = 1;
	}

	injector.ptr = rendered.end;
	this.index++;
}
