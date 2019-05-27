import { strictEqual, deepStrictEqual } from 'assert';
import document from './assets/document';
import { createComponent, mountComponent } from '../src/runtime';

// @ts-ignore
import sample1 from './samples/slots/outer-component1.html';
// @ts-ignore
import sample2 from './samples/slots/outer-component2.html';
// @ts-ignore
import sample3 from './samples/slots/outer-component3.html';

describe('Slot Update Hook', () => {
	const slotCallbacks = [];
	const last = (arr: any[]) => arr[arr.length - 1];

	before(() => {
		global['document'] = document;
		global['slotCallbacks'] = slotCallbacks;
	});
	after(() => {
		delete global['document'];
		delete global['slotCallbacks'];
	});
	afterEach(() => slotCallbacks.length = 0);

	it('sample 1', () => {
		const component = createComponent('my-component', {
			default: sample1,
			props() {
				return { header: 'Header 1', content: 'Content 1', footer: 'Footer 1' };
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(slotCallbacks.length, 1);
		strictEqual(last(slotCallbacks)[0], '');
		strictEqual(last(slotCallbacks)[1], 'Content 1');

		component.setProps({ content: 'Content 2' });
		strictEqual(slotCallbacks.length, 2);
		strictEqual(last(slotCallbacks)[0], '');
		strictEqual(last(slotCallbacks)[1], 'Content 2');

		component.setProps({ footer: 'Footer 2' });
		strictEqual(slotCallbacks.length, 2);
	});

	it('sample 2', () => {
		const component = createComponent('my-component', {
			default: sample2,
			props() {
				return {
					header: 'Header 1',
					content: 'Content 1',
					content2: 'SubContent 1',
					enabled: false
				};
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(slotCallbacks.length, 1);
		strictEqual(last(slotCallbacks)[0], '');
		strictEqual(last(slotCallbacks)[1], 'Content 1');

		component.setProps({ content2: 'SubContent 2' });
		strictEqual(slotCallbacks.length, 1);

		component.setProps({ enabled: true });
		strictEqual(slotCallbacks.length, 2);
		strictEqual(last(slotCallbacks)[0], '');
		strictEqual(last(slotCallbacks)[1], 'Content 1SubContent 2');

		component.setProps({ enabled: false });
		strictEqual(slotCallbacks.length, 3);
		strictEqual(last(slotCallbacks)[0], '');
		strictEqual(last(slotCallbacks)[1], 'Content 1');
	});

	it('sample 3', () => {
		const component = createComponent('my-component', {
			default: sample3,
			props() {
				return {
					header: 'Header 1',
					content: 'Content 1',
					content2: 'SubContent 1',
					footer: 'Footer 1',
					enabled: false,
					active: false
				};
			}
		});

		mountComponent(component);
		strictEqual(slotCallbacks.length, 2);
		deepStrictEqual(slotCallbacks[0], ['', 'Content 1']);
		deepStrictEqual(slotCallbacks[1], ['footer', 'Footer 1']);

		component.setProps({ active: true });
		strictEqual(slotCallbacks.length, 3);
		deepStrictEqual(last(slotCallbacks), ['footer', 'Footer 1Branching footer']);

		component.setProps({ active: false, footer: 'Footer 2' });
		strictEqual(slotCallbacks.length, 4);
		deepStrictEqual(last(slotCallbacks), ['footer', 'Footer 2']);

		component.setProps({ enabled: true, footer: 'Footer 3' });
		strictEqual(slotCallbacks.length, 6);
		deepStrictEqual(slotCallbacks[4], ['', 'Content 1SubContent 1']);
		deepStrictEqual(slotCallbacks[5], ['footer', 'Footer 3']);
	});
});
