import { move, injectBlock, disposeBlock, Injector, Block } from './injector';
import { setScope, getScope } from './scope';
import { obj } from './utils';
import { prepareScope, IteratorBlock, RenderItemsGetter } from './iterate';
import { MountBlock, Scope } from './types';
import { Component } from './component';
import { LinkedListItem } from './linked-list';

type KeyExpr = (host: Component, scope?: Scope) => string;

interface ItemLookup {
	[key: string]: KeyIteratorItemBlock;
}

interface KeyIteratorBlock extends IteratorBlock {
	keyExpr: KeyExpr;
	used: ItemLookup | null;
	rendered: ItemLookup | null;
	order: KeyIteratorItemBlock[];
	needReorder: boolean;
	parentScope: Scope;
}

interface KeyIteratorItemBlock extends Block {
	next: this | null;
}

/**
 * Renders key iterator block
 */
export function mountKeyIterator(host: Component, injector: Injector, get: RenderItemsGetter, keyExpr: KeyExpr, body: MountBlock): KeyIteratorBlock {
	const parentScope = getScope(host);
	const block = injectBlock<KeyIteratorBlock>(injector, {
		host,
		injector,
		scope: obj(parentScope),
		get,
		body,
		keyExpr,
		index: 0,
		updated: 0,
		used: null,
		rendered: null,
		needReorder: false,
		parentScope,
		order: []
	});
	updateKeyIterator(block);
	return block;
}

/**
 * Updates iterator block defined in `ctx`
 * @returns Returns `1` if iterator was updated, `0` otherwise
 */
export function updateKeyIterator(block: KeyIteratorBlock): number {
	const { host, injector, rendered } = block;
	injector.ptr = block.start;
	block.used = obj();
	block.index = block.updated = 0;
	block.needReorder = false;

	const collection = block.get(host, block.parentScope);
	if (collection && typeof collection.forEach === 'function') {
		collection.forEach(keyIterator, block);
	}

	if (rendered) {
		block.updated |= disposeLookup(rendered);
	}

	if (block.needReorder) {
		block.updated = 1;
		reorder(block);
	}

	block.order.length = 0;
	block.rendered = block.used;
	injector.ptr = block.end;
	return block.updated;
}

export function unmountKeyIterator(block: KeyIteratorBlock) {
	disposeBlock(block);
}

function getItem(listItem: LinkedListItem, bound: LinkedListItem): KeyIteratorItemBlock | null {
	return listItem !== bound ? listItem.value : null;
}

function keyIterator(this: KeyIteratorBlock, value: any, key: any) {
	const { injector, index, rendered } = this;
	const id = this.keyExpr(value, prepareScope(this.scope, index, key, value));
	let entry = rendered && getLookup(rendered, id);

	if (entry) {
		if (entry.start.prev !== injector.ptr) {
			this.needReorder = true;
		}

		this.updated |= updateEntry(entry, value, key, index);
	} else {
		entry = mountEntry(this, value, key, index);
		this.updated = 1;
	}

	putLookup(this.used!, id, entry);
	this.order.push(entry);
	injector.ptr = entry.end;
	this.index++;
}

function mountEntry(block: KeyIteratorBlock, value: any, key: any, index: number): KeyIteratorItemBlock {
	const { host, injector, body: mount } = block;
	const scope = prepareScope(obj(block.scope), index, key, value);
	setScope(host, scope);
	const entry = injectBlock<KeyIteratorItemBlock>(injector, {
		host,
		injector,
		scope,
		mount,
		update: undefined,
		next: null
	});

	injector.ptr = entry.start;
	entry.update = mount && mount(host, injector, scope);
	return entry;
}

function updateEntry(entry: KeyIteratorItemBlock, value: any, key: any, index: number): number {
	if (entry.update) {
		const { host } = entry;
		const scope = prepareScope(entry.scope, index, key, value);
		setScope(host, scope);
		if (entry.update(host, scope)) {
			return 1;
		}
	}

	return 0;
}

function reorder(block: KeyIteratorBlock) {
	const { injector, order } = block;
	let actualPrev: KeyIteratorItemBlock | null;
	let actualNext: KeyIteratorItemBlock | null;
	let expectedPrev: KeyIteratorItemBlock | null;
	let expectedNext: KeyIteratorItemBlock | null;
	const { start, end } = block;

	for (let i = 0, maxIx = order.length - 1, item: KeyIteratorItemBlock; i <= maxIx; i++) {
		item = order[i];
		expectedPrev = i > 0 ? order[i - 1] : null;
		expectedNext = i < maxIx ? order[i + 1] : null;
		actualPrev = getItem(item.start.prev!, start);
		actualNext = getItem(item.end.next!, end);

		if (expectedPrev !== actualPrev || expectedNext !== actualNext) {
			// Blocks must be reordered
			move(injector, item, expectedPrev ? expectedPrev.end : block.start);
		}
	}
}

function getLookup<K extends keyof ItemLookup>(lookup: ItemLookup, key: K): ItemLookup[K] | void {
	const item = lookup[key];
	if (item && (lookup[key] = item.next!)) {
		item.next = null;
	}

	return item;
}

function putLookup<K extends keyof ItemLookup>(lookup: ItemLookup, key: K, value: ItemLookup[K]) {
	value.next = lookup[key];
	lookup[key] = value;
}

function disposeLookup(lookup: ItemLookup): number {
	let updated = 0;
	for (const p in lookup) {
		let item = lookup[p];
		while (item) {
			updated = 1;
			disposeBlock(item);
			item = item.next!;
		}
	}

	return updated;
}
