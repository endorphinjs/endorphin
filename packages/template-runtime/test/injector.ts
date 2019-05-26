import { deepStrictEqual, ok } from 'assert';
import document, { ElementShim } from './assets/document';
import { createInjector, insert, move, emptyBlockContent, injectBlock, disposeBlock, Injector, Block } from '../src/injector';
import { LinkedList, LinkedListItem } from '../src/linked-list';
import { FunctionBlock } from '../src/block';

describe('Injector', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	const elem = (name: string) => document.createElement(name) as any as Element;
	const children = (node: Element) => (node as any as ElementShim).childNodes.map((el: ElementShim) => el.nodeName);

	function run(block: Block, fn?: () => void) {
		block.injector.ptr = block.start;
		fn && fn();
		block.injector.ptr = block.end;
	}

	function render(injector: Injector, fn?: () => void) {
		// @ts-ignore
		const b = injectBlock<FunctionBlock>(injector, { injector, fn });
		run(b, fn);
		return b;
	}

	function listHas<T>(list: LinkedList<T>, value: T) {
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
		const injector = createInjector(parent);
		const content1 = () => {
			insert(injector, elem('3'));
			insert(injector, elem('4'));
			insert(injector, elem('5'));
		};

		const content2 = () => {
			insert(injector, elem('6'));
			insert(injector, elem('7'));
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

		deepStrictEqual(children(parent), ['1', '2', '3', '4', '5', '8', '9']);

		// Empty rendered block
		emptyBlockContent(block1);
		deepStrictEqual(children(parent), ['1', '2', '8', '9']);

		emptyBlockContent(block3);
		deepStrictEqual(children(parent), ['1', '2', '9']);

		// Render previously empty blocks
		run(block2, content2);
		deepStrictEqual(children(parent), ['1', '2', '6', '7', '9']);

		run(block3, content3);
		deepStrictEqual(children(parent), ['1', '2', '6', '7', '8', '9']);
	});

	it('nested blocks', () => {
		const parent = elem('div');
		const injector = createInjector(parent);
		const content1 = () => {
			insert(injector, elem('1'));
		};

		const content2 = () => {
			insert(injector, elem('2'));
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

		deepStrictEqual(children(parent), ['1', '2', '3', '4']);

		// Empty deepest block
		emptyBlockContent(block3);

		deepStrictEqual(children(parent), ['1', '2', '3']);
		ok(listHas(injector.items, block1));
		ok(listHas(injector.items, block2));
		ok(listHas(injector.items, block3));

		// Empty outer block
		emptyBlockContent(block1);

		deepStrictEqual(children(parent), []);
		ok(listHas(injector.items, block1));
		ok(!listHas(injector.items, block2));
		ok(!listHas(injector.items, block3));
	});

	it('dispose', () => {
		const parent = elem('div');
		const injector = createInjector(parent);
		const content1 = () => {
			insert(injector, elem('1'));
		};

		const content2 = () => {
			insert(injector, elem('2'));
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

		deepStrictEqual(children(parent), ['1', '2', '3', '4']);

		// Empty deepest block
		emptyBlockContent(block3);

		deepStrictEqual(children(parent), ['1', '2', '3']);
		ok(listHas(injector.items, block1));
		ok(listHas(injector.items, block2));
		ok(listHas(injector.items, block3));

		// Completely remove second block
		disposeBlock(block2);

		deepStrictEqual(children(parent), ['1']);
		ok(listHas(injector.items, block1));
		ok(!listHas(injector.items, block2));
		ok(!listHas(injector.items, block3));
	});

	it('move', () => {
		const parent = elem('div');
		const injector = createInjector(parent);
		const content1 = () => {
			insert(injector, elem('1'));
		};

		const content2 = () => {
			insert(injector, elem('2'));
			insert(injector, elem('3'));
		};

		const content3 = () => {
			insert(injector, elem('4'));
			insert(injector, elem('5'));
		};

		const content4 = () => {
			insert(injector, elem('6'));
			insert(injector, elem('7'));
			insert(injector, elem('8'));
		};

		render(injector, content1);
		const block2 = render(injector, content2);
		const block3 = render(injector, content3);
		const block4 = render(injector, content4);

		deepStrictEqual(children(parent), ['1', '2', '3', '4', '5', '6', '7', '8']);

		// move as first item
		move(injector, block4);
		deepStrictEqual(children(parent), ['6', '7', '8', '1', '2', '3', '4', '5']);

		// TODO something’s not right here
		move(injector, block2, block3 as any as LinkedListItem<any>);
		deepStrictEqual(children(parent), ['6', '7', '8', '1', '4', '5', '2', '3']);
	});
});
