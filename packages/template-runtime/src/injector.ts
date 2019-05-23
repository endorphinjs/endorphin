import { createList, listInsertValueAfter, listPrependValue, listMoveFragmentAfter, listMoveFragmentFirst, listDetachFragment, LinkedList, LinkedListItem } from './linked-list';
import { changeSet, animatingKey } from './utils';
import { domInsert, domRemove } from './dom';
import { RunCallback, ChangeSet, EventBinding, Scope, UnmountBlock } from './types';
import { Component } from './component';
import { SlotContext } from './slot';

export interface Injector {
	/** Injector DOM target */
	parentNode: Element;

	/** Current injector contents */
	items: LinkedList;

	/** Current insertion pointer */
	ptr: LinkedListItem | null;

	/** Current block context */
	ctx: BaseBlock | null;

	/**
	 * Slots container
	 */
	slots?: {
		[name: string]: SlotContext
	} | null;

	/** Pending attributes updates */
	attributes: ChangeSet;

	/** Pending namespace updates */
	attributesNS?: { [uri: string]: ChangeSet };

	/** Current event handlers */
	events: ChangeSet<EventBinding>;
}

export interface BaseBlock<T = any> {
	$$block: true;
	host: Component;
	injector: Injector;
	scope: Scope;

	/** A function to dispose block contents */
	dispose: UnmountBlock | null;

	start: LinkedListItem<T>;
	end: LinkedListItem<T>;
}

/**
 * Creates injector instance for given target, if required
 */
export function createInjector(target: Element): Injector {
	return {
		parentNode: target,
		items: createList(),
		ctx: null,
		ptr: null,

		// NB create `slots` placeholder to promote object to hidden class.
		// Do not use any additional function argument for adding value to `slots`
		// to reduce runtime checks and keep functions in monomorphic state
		slots: null,
		attributes: changeSet(),
		events: changeSet()
	};
}

/**
 * Inserts given node into current context
 */
export function insert<T extends Node>(injector: Injector, node: T, slotName = ''): T {
	const { items, slots, ptr } = injector;
	const target = slots
		? getSlotContext(injector, slotName).element
		: injector.parentNode;

	domInsert(node, target, ptr ? getAnchorNode(ptr.next!, target) : void 0);
	injector.ptr = ptr ? listInsertValueAfter(node, ptr) : listPrependValue(items, node);

	return node;
}

type Diff<T, U> = T extends U ? never : T;
type BlockInput<T, TOptional extends keyof T> = Pick<T, Diff<keyof T, TOptional>> & Partial<T>;

/**
 * Injects given block
 */
export function injectBlock<T extends BaseBlock>(injector: Injector, block: BlockInput<T, 'start' | 'end' | '$$block'>): T {
	const { items, ptr } = injector;

	if (ptr) {
		block.end = listInsertValueAfter(block, ptr);
		block.start = listInsertValueAfter(block, ptr);
	} else {
		block.end = listPrependValue(items, block);
		block.start = listPrependValue(items, block);
	}

	block.$$block = true;
	injector.ptr = block.end;
	return block as T;
}

/**
 * Runs `fn` template function in context of given `block`
 */
export function run<D, R>(block: BaseBlock, fn: RunCallback<D, R>, data?: D): R {
	const { host, injector } = block;
	const { ctx } = injector;
	injector.ctx = block;
	injector.ptr = block.start;
	const result = fn(host, injector, data);
	injector.ptr = block.end;
	injector.ctx = ctx;

	return result;
}

/**
 * Returns named slot context from given component input’s injector. If slot context
 * doesn’t exists, it will be created
 */
export function getSlotContext(injector: Injector, name: string): SlotContext {
	const slots = injector.slots!;
	return slots[name] || (slots[name] = createSlotContext(name));
}

/**
 * Empties content of given block
 */
export function emptyBlockContent(block: BaseBlock): void {
	if (block.dispose) {
		block.dispose(block.scope, block.host);
		block.dispose = null;
	}

	let item = block.start.next;
	while (item && item !== block.end) {
		// tslint:disable-next-line:prefer-const
		let { value, next, prev } = item;

		if (isBlock(value)) {
			next = value.end.next;
			disposeBlock(value);
		} else if (!value[animatingKey]) {
			domRemove(value);
		}

		// NB: Block always contains `.next` and `.prev` items which are block
		// bounds so we can safely skip null check here
		prev!.next = next;
		next!.prev = prev;
		item = next;
	}
}

/**
 * Moves contents of `block` after `ref` list item
 */
export function move<T extends Node, B extends BaseBlock>(injector: Injector, block: B, ref?: LinkedListItem<T | BaseBlock>) {
	if (ref && ref.next && ref.next.value === block) {
		return;
	}

	// Update linked list
	const { start, end } = block;

	if (ref) {
		listMoveFragmentAfter(injector.items, start, end, ref);
	} else {
		listMoveFragmentFirst(injector.items, start, end);
	}

	// Move block contents in DOM
	let item = start.next;
	let node: Node;
	while (item && item !== end) {
		if (!isBlock(item.value)) {
			node = item.value;

			// NB it’s possible that a single block contains nodes from different
			// slots so we have to find anchor for each node individually
			domInsert(node, node.parentNode!, getAnchorNode(end.next!, node.parentNode!));
		}
		item = item.next;
	}
}

/**
 * Disposes given block
 */
export function disposeBlock(block: BaseBlock<any>) {
	emptyBlockContent(block);
	listDetachFragment(block.injector.items, block.start, block.end);

	// @ts-ignore: Nulling disposed object
	block.start = block.end = null;
}

/**
 * Check if given value is a block
 */
function isBlock(obj: any): obj is BaseBlock {
	return '$$block' in obj;
}

/**
 * Get DOM node nearest to given position of items list
 */
function getAnchorNode(item: LinkedListItem<Node>, parent: Node): Node | undefined {
	while (item) {
		if (item.value.parentNode === parent) {
			return item.value;
		}

		item = item.next!;
	}
}

/**
 * Creates context for given slot
 */
function createSlotContext(name: string): SlotContext {
	return {
		name,
		element: document.createElement('slot'),
		isDefault: false,
		defaultContent: null
	};
}
