import { deepEqual, strictEqual } from 'assert';
import document from './assets/document';
import { Store } from '../src/store';
import { createComponent, mountComponent, unmountComponent } from '../src/runtime';

// @ts-ignore
import storeTemplate from './samples/store.html';

interface StoreData {
	foo?: string;
	a?: number | string;
	b?: number | string;
	c?: number | string;
}

describe('Store', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('should set & get value', () => {
		const store = new Store<StoreData>();
		deepEqual(store.get(), {});

		store.set({ foo: 'bar' });
		strictEqual(store.get().foo, 'bar');

		store.set(null);
		strictEqual(store.get().foo, 'bar');
	});

	it('should notify subscribers', () => {
		const store = new Store({ a: 0, b: 0, c: 0 } as StoreData);
		const a = [];
		const b = [];
		const c = [];

		const entry1 = store.subscribe(data => a.push(data.a));
		store.subscribe(data => b.push(data.b), ['b']);
		store.subscribe(data => c.push(data.c), ['a', 'c']);

		store.set({ a: 1 });
		deepEqual(a, [1]);
		deepEqual(b, []);
		deepEqual(c, [0]);

		// Setting the same value should not trigger update
		store.set({ a: 1 });
		deepEqual(a, [1]);
		deepEqual(b, []);
		deepEqual(c, [0]);

		store.set({ b: 10 });
		deepEqual(a, [1, 1]);
		deepEqual(b, [10]);
		deepEqual(c, [0]);

		store.unsubscribe(entry1);
		store.set({ c: 100 });
		deepEqual(a, [1, 1]);
		deepEqual(b, [10]);
		deepEqual(c, [0, 100]);
	});

	it('should auto-update component', () => {
		let renderCount = 0;
		const store = new Store({ foo: 'bar' } as StoreData);
		store.sync = true;
		const component = createComponent('my-component', {
			default: storeTemplate,
			store() {
				return store;
			},
			willRender() {
				renderCount++;
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, '<div>\n\t<p>\n\t\tStore value is \n\t\tbar\n\t</p>\n</div>');
		strictEqual(renderCount, 1);
		strictEqual(store['listeners'].length, 1);

		store.set({ foo: 'baz' });
		strictEqual(component.innerHTML, '<div>\n\t<p>\n\t\tStore value is \n\t\tbaz\n\t</p>\n</div>');
		strictEqual(renderCount, 2);
		strictEqual(store['listeners'].length, 1);

		// Other values should not trigger updated
		store.set({ a: 'b' });
		strictEqual(component.innerHTML, '<div>\n\t<p>\n\t\tStore value is \n\t\tbaz\n\t</p>\n</div>');
		strictEqual(renderCount, 2);
		strictEqual(store['listeners'].length, 1);

		// Should not trigger updates for unmounted components
		unmountComponent(component);
		store.set({ foo: 'bam' });
		strictEqual(component.innerHTML, '<div>\n\t<p>\n\t\tStore value is \n\t\tbaz\n\t</p>\n</div>');
		strictEqual(renderCount, 2);
		strictEqual(store['listeners'].length, 0);
	});
});
