import { strictEqual } from 'assert';
import read from './assets/read-file';
import document from './assets/document';
import iterate from './samples/iterate';
import { createComponent, mountComponent } from '../src/runtime';

describe('Iterate', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('basic', () => {
		let prev: ChildNode[];
		let cur: ChildNode[];
		const listNodes = () => Array.from(component.childNodes[2].childNodes);
		const component = createComponent('my-component', {
			default: iterate,
			props() {
				return {
					items: [
						{ id: 1, marked: true },
						{ id: 2, marked: false },
						{ id: 3, marked: false },
						{ id: 4, marked: true }
					]
				};
			}
		});

		mountComponent(component);
		strictEqual(component.innerHTML, read('fixtures/iterate1.html'));

		// Render same content but in different order: must keep the same `<li>`
		// nodes in original order and update its contents
		prev = listNodes();
		component.setProps({
			items: [
				{ id: 3, marked: false },
				{ id: 2, marked: false },
				{ id: 1, marked: true },
				{ id: 4, marked: true }
			]
		});
		strictEqual(component.innerHTML, read('fixtures/iterate2.html'));

		cur = listNodes();
		cur.forEach((node, i) => strictEqual(node, prev[i]));

		// Render less elements
		component.setProps({
			items: [
				{ id: 1, marked: false },
				{ id: 2, marked: false }
			]
		});

		cur = listNodes();
		strictEqual(component.innerHTML, read('fixtures/iterate3.html'));
		strictEqual(cur[0], prev[0]);
		strictEqual(cur[1], prev[1]);

		// Render more elements
		component.setProps({
			items: [
				{ id: 3, marked: false },
				{ id: 2, marked: false },
				{ id: 1, marked: true },
				{ id: 4, marked: true }
			]
		});

		cur = listNodes();
		strictEqual(component.innerHTML, read('fixtures/iterate2.html'));
		strictEqual(cur[0], prev[0]);
		strictEqual(cur[1], prev[1]);
	});
});
