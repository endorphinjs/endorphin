import { listInsertValueAfter, listPrependValue, listMoveFragmentAfter, listMoveFragmentFirst, listDetachFragment, LinkedList, LinkedListItem } from './linked-list';
import { animatingKey } from './utils';
import { domInsert, domRemove } from './dom';
import { Scope, MountBlock, UpdateBlock } from './types';
import { Component } from './component';
import { SlotContext } from './slot';

export interface Injector extends LinkedList {
	/** Injector DOM target */
	parentNode: Element;

	/** Current injector contents */
	head: LinkedListItem | null;

	/** Current insertion pointer */
	ptr: LinkedListItem | null;

	/** Slots container */
	slots: { [name: string]: SlotContext } | null;
}

export interface Block {
	parentNode?: void;
	host: Component;
	injector: Injector;
	scope: Scope;
	mount?: MountBlock;
	update?: UpdateBlock;
	start: LinkedListItem<this>;
	end: LinkedListItem<this>;
}

/**
 * Creates injector instance for given target, if required
 */
export function createInjector(target: Element): Injector {
	return {
		parentNode: target,
		head: null,
		ptr: null,

		// NB create `slots` placeholder to promote object to hidden class.
		// Do not use any additional function argument for adding value to `slots`
		// to reduce runtime checks and keep functions in monomorphic state
		slots: null
	};
}

/**
 * Inserts given node into current context
 */
export function insert<T extends Node>(injector: Injector, node: T, slotName = ''): T {
	const { slots, ptr } = injector;
	const target = slots
		? getSlotContext(injector, slotName).element
		: injector.parentNode;

	domInsert(node, target, ptr ? getAnchorNode(ptr.next!, target) : void 0);
	injector.ptr = ptr ? listInsertValueAfter(node, ptr) : listPrependValue(injector, node);

	return node;
}

type Diff<T, U> = T extends U ? never : T;
type BlockInput<T, TOptional extends keyof T> = Pick<T, Diff<keyof T, TOptional>> & Partial<T>;

/**
 * Injects given block
 */
export function injectBlock<T extends Block>(injector: Injector, block: BlockInput<T, 'start' | 'end'>): T {
	const { ptr } = injector;

	if (ptr) {
		block.end = listInsertValueAfter(block as T, ptr);
		block.start = listInsertValueAfter(block as T, ptr);
	} else {
		block.end = listPrependValue(injector, block);
		block.start = listPrependValue(injector, block);
	}

	injector.ptr = block.end!;
	return block as T;
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
export function emptyBlockContent<T extends Block>(block: T): void {
	const unmount = block.mount && block.mount.dispose;
	if (unmount) {
		unmount(block.scope, block.host);
	}

	let item = block.start.next;
	while (item && item !== block.end) {
		// tslint:disable-next-line:prefer-const
		let { value, next, prev } = item;

		if (!isElement(value)) {
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
export function move<T extends Node, B extends Block>(injector: Injector, block: B, ref?: LinkedListItem<T | Block>) {
	if (ref && ref.next && ref.next.value === block) {
		return;
	}

	// Update linked list
	const { start, end } = block;

	if (ref) {
		listMoveFragmentAfter(injector, start, end, ref);
	} else {
		listMoveFragmentFirst(injector, start, end);
	}

	// Move block contents in DOM
	let item = start.next;
	let node: Node;
	while (item && item !== end) {
		if (isElement(item.value)) {
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
export function disposeBlock(block: Block) {
	emptyBlockContent(block);
	listDetachFragment(block.injector, block.start, block.end);

	// @ts-ignore: Nulling disposed object
	block.start = block.end = block.scope = null;
}

function isElement(obj: any): obj is Element {
	return 'nodeType' in obj;
}

/**
 * Get DOM node nearest to given position of items list
 */
function getAnchorNode(item: LinkedListItem<Node | Block>, parent: Node): Node | undefined {
	while (item) {
		if (item.value.parentNode === parent) {
			return item.value as Node;
		}

		item = item.next!;
	}
}

/**
 * Creates context for given slot
 */
function createSlotContext(name: string): SlotContext {
	const element = document.createElement('slot');
	name && element.setAttribute('name', name);

	return {
		name,
		element,
		isDefault: false,
		defaultContent: null
	};
}
