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
		const prevScope = getScope(host);
		collection.forEach(iterator, block);
		setScope(host, prevScope);
	}

	block.updated |= disposeLookup(rendered!);

	if (block.needReorder) {
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

function iterator(this: KeyIteratorBlock, value: any, key: any) {
	const { host, injector, index, rendered } = this;
	const id = this.keyExpr(value, prepareScope(this.scope, index, key, value));
	let entry = rendered && getLookup(rendered, id);

	const scope = prepareScope(entry ? entry.scope : obj(this.scope), index, key, value);
	setScope(host, scope);

	if (!entry) {
		entry = createItem(this, scope);
		injector.ptr = entry.start;
		entry.update = this.body(host, injector, scope);
		this.updated = 1;
	} else if (entry.update) {
		if (entry.start.prev !== injector.ptr) {
			this.needReorder = true;
		}

		if (entry.update(host, injector, scope)) {
			this.updated = 1;
		}
	}

	putLookup(this.used!, id, entry);
	this.order.push(entry);
	injector.ptr = entry.end;
	this.index++;
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

		if (expectedPrev !== actualPrev && expectedNext !== actualNext) {
			// Blocks must be reordered
			move(injector, item, expectedPrev ? expectedPrev.end : block.start);
		}
	}
}

function createItem(iter: KeyIteratorBlock, scope: Scope): KeyIteratorItemBlock {
	return injectBlock<KeyIteratorItemBlock>(iter.injector, {
		host: iter.host,
		injector: iter.injector,
		scope,
		mount: iter.body,
		update: undefined,
		next: null
	});
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
