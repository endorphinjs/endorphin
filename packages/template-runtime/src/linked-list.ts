export interface LinkedList<T = any> {
	head: LinkedListItem<T> | null;
}

export interface LinkedListItem<T = any> {
	value: T;
	next: LinkedListItem<T> | null;
	prev: LinkedListItem<T> | null;
}

/**
 * Creates linted list
 */
export function createList<T>(): LinkedList<T> {
	return { head: null };
}

/**
 * Creates linked list item
 */
export function createListItem<T>(value: T): LinkedListItem<T> {
	return { value, next: null, prev: null };
}

/**
 * Prepends given value to linked list
 */
export function listPrependValue<T>(list: LinkedList<T>, value: T): LinkedListItem<T> {
	const item = createListItem(value);
	if (item.next = list.head) {
		item.next.prev = item;
	}

	return list.head = item;
}

/**
 * Inserts given value after given `ref` item
 */
export function listInsertValueAfter<T>(value: T, ref: LinkedListItem<any>): LinkedListItem<T> {
	const item = createListItem(value);
	const { next } = ref;
	ref.next = item;
	item.prev = ref;

	if (item.next = next) {
		next!.prev = item;
	}

	return item;
}

/**
 * Removes given item from list
 */
export function listRemove(list: LinkedList<any>, item: LinkedListItem<any>) {
	listDetachFragment(list, item, item);
}

/**
 * Moves list fragment with `start` and `end` bounds right after `ref` item
 */
export function listMoveFragmentAfter(list: LinkedList<any>, start: LinkedListItem<any>, end: LinkedListItem<any>, ref: LinkedListItem<any>) {
	listDetachFragment(list, start, end);

	if (end.next = ref.next) {
		end.next.prev = end;
	}

	ref.next = start;
	start.prev = ref;
}

/**
 * Moves list fragment with `start` and `end` to list head
 */
export function listMoveFragmentFirst(list: LinkedList<any>, start: LinkedListItem<any>, end: LinkedListItem<any>) {
	listDetachFragment(list, start, end);

	if (end.next = list.head) {
		end.next.prev = end;
	}

	list.head = start;
}

/**
 * Detaches list fragment with `start` and `end` from list
 */
export function listDetachFragment(list: LinkedList<any>, start: LinkedListItem<any>, end: LinkedListItem<any>) {
	const { prev } = start;
	const { next } = end;

	if (prev) {
		prev.next = next;
	} else {
		list.head = next;
	}

	if (next) {
		next.prev = prev;
	}

	start.prev = end.next = null;
}
