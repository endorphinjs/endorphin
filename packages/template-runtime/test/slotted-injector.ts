import { deepEqual, ok } from 'assert';
import document from './assets/document';
import { createInjector, run, insert, injectBlock, emptyBlockContent, disposeBlock, Injector } from '../src/injector';
import { obj } from '../src/utils';
import { MountBlock } from '../src/types';
import { FunctionBlock } from '../src/block';
import { LinkedList } from '../src/linked-list';

describe('Slotted injector', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	const elem = (name: string) => document.createElement(name) as any as HTMLElement;
	const children = (node: Element | DocumentFragment) => Array.from(node.childNodes).map(el => el.nodeName);

	function render(injector: Injector, fn: MountBlock | null = null): FunctionBlock {
		// @ts-ignore
		const b = injectBlock<FunctionBlock>(injector, { injector, fn });
		fn && run(b, fn, b);
		injector.ptr = b.end;
		return b;
	}

	function listHas<T>(list: LinkedList<T>, value: T): boolean {
		let item = list.head;
		while (item) {
			if (item.value === value) {
				return true;
			}

			item = item.next;
		}
	}

	it('flat blocks', () => {
		const parent = elem('div');
		const injector = createInjector(parent as Element);
		injector.slots = obj();

		const content1 = () => {
			insert(injector, elem('3'));
			insert(injector, elem('4'), 'slot1');
			insert(injector, elem('5'));
		};

		const content2 = () => {
			insert(injector, elem('6'), 'slot1');
			insert(injector, elem('7'), 'slot2');
		};

		const content3 = () => {
			insert(injector, elem('8'));
		};

		insert(injector, elem('1'));
		insert(injector, elem('2'));

		const block1 = render(injector, content1);
		const block2 = render(injector);
		const block3 = render(injector, content3);

		insert(injector, elem('9'));

		// In slotted injector, parent node should be empty, all nodes should
		// be spreaded across slots
		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2', '3', '5', '8', '9']);
		deepEqual(children(injector.slots['slot1']), ['4']);

		// Empty rendered block
		emptyBlockContent(block1);

		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2', '8', '9']);
		deepEqual(children(injector.slots['slot1']), []);

		emptyBlockContent(block3);
		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2', '9']);
		deepEqual(children(injector.slots['slot1']), []);

		// Render previously empty blocks
		run(block2, content2);
		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2', '9']);
		deepEqual(children(injector.slots['slot1']), ['6']);
		deepEqual(children(injector.slots['slot2']), ['7']);

		run(block1, content1);
		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2', '3', '5', '9']);
		deepEqual(children(injector.slots['slot1']), ['4', '6']);
		deepEqual(children(injector.slots['slot2']), ['7']);
	});

	it('nested blocks', () => {
		const parent = elem('div');
		const injector = createInjector(parent);
		injector.slots = obj();

		const content1 = () => {
			insert(injector, elem('1'));
		};

		const content2 = () => {
			insert(injector, elem('2'));
			insert(injector, elem('3'), 'slot1');
		};

		const content3 = () => {
			insert(injector, elem('4'), 'slot1');
		};

		let block1: FunctionBlock;
		let block2: FunctionBlock;
		let block3: FunctionBlock;

		block1 = render(injector, () => {
			content1();
			block2 = render(injector, () => {
				content2();
				block3 = render(injector, content3);
			});
		});

		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2']);
		deepEqual(children(injector.slots['slot1']), ['3', '4']);

		// Empty deepest block
		emptyBlockContent(block3);

		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '2']);
		deepEqual(children(injector.slots['slot1']), ['3']);

		ok(listHas(injector.items, block1));
		ok(listHas(injector.items, block2));
		ok(listHas(injector.items, block3));

		// Empty outer block
		emptyBlockContent(block1);

		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), []);
		deepEqual(children(injector.slots['slot1']), []);
		ok(listHas(injector.items, block1));
		ok(!listHas(injector.items, block2));
		ok(!listHas(injector.items, block3));
	});

	it('dispose', () => {
		const parent = elem('div');
		const injector = createInjector(parent);
		injector.slots = obj();

		const content1 = () => {
			insert(injector, elem('1'));
		};

		const content2 = () => {
			insert(injector, elem('2'), 'slot1');
			insert(injector, elem('3'));
		};

		const content3 = () => {
			insert(injector, elem('4'));
		};

		let block1: FunctionBlock;
		let block2: FunctionBlock;
		let block3: FunctionBlock;

		block1 = render(injector, () => {
			content1();
			block2 = render(injector, () => {
				content2();
				block3 = render(injector, content3);
			});
		});

		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1', '3', '4']);
		deepEqual(children(injector.slots['slot1']), ['2']);

		// Completely remove second block
		disposeBlock(block2);

		deepEqual(children(parent), []);
		deepEqual(children(injector.slots['']), ['1']);
		deepEqual(children(injector.slots['slot1']), []);
		ok(listHas(injector.items, block1));
		ok(!listHas(injector.items, block2));
		ok(!listHas(injector.items, block3));
	});
});
