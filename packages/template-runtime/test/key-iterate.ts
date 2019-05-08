import { strictEqual, ok } from 'assert';
import read from './assets/read-file';
import document from './assets/document';
import keyIterate from './samples/key-iterate';
import { createComponent, mountComponent } from '../src/runtime';

describe('Key iterate', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('keyed', () => {
		let prev: ChildNode[];
		let cur: ChildNode[];
		const listNodes = () => Array.from(component.childNodes[2].childNodes);
		const component = createComponent('my-component', {
			default: keyIterate,
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
		strictEqual(component.innerHTML, read('fixtures/key-iterate1.html'));

		// Render same content but in different order: must keep the same `<li>` nodes,
		// but they should be reordered
		prev = listNodes();

		component.setProps({
			items: [
				{ id: 3, marked: false },
				{ id: 2, marked: false },
				{ id: 1, marked: true },
				{ id: 4, marked: true }
			]
		});
		strictEqual(component.innerHTML, read('fixtures/key-iterate2.html'));

		cur = listNodes();

		strictEqual(cur[0], prev[2]);
		strictEqual(cur[1], prev[1]);
		strictEqual(cur[2], prev[0]);
		strictEqual(cur[4], prev[4]);

		// Both 2 and 3 should be reordered (detached and attached)
		ok(cur[0]['attached'] > cur[2]['attached']);
		ok(cur[0]['detached'] > cur[2]['detached']);
		ok(cur[0]['attached'] === cur[1]['attached']);
		ok(cur[0]['detached'] === cur[1]['detached']);

		// Render less elements
		component.setProps({
			items: [
				{ id: 1, marked: false },
				{ id: 2, marked: false }
			]
		});

		cur = listNodes();
		strictEqual(component.innerHTML, read('fixtures/key-iterate3.html'));
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
		strictEqual(component.innerHTML, read('fixtures/key-iterate2.html'));
		ok(cur[1] === prev[1]);
		ok(cur[2] === prev[0]);
		ok(cur[0] !== prev[2]);
		ok(cur[3] !== prev[3]);

		prev = cur;

		// Reorder elements again
		component.setProps({
			items: [
				{ id: 1, marked: true },
				{ id: 2, marked: false },
				{ id: 3, marked: false },
				{ id: 4, marked: true }
			]
		});

		cur = listNodes();
		strictEqual(component.innerHTML, read('fixtures/key-iterate1.html'));
		strictEqual(cur[0], prev[2]);
		strictEqual(cur[1], prev[1]);
		strictEqual(cur[2], prev[0]);
		strictEqual(cur[4], prev[4]);
	});
});
