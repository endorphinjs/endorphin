import { strictEqual, ok } from 'assert';
import document, { ElementShim } from './assets/document';
import read from './assets/read-file';
import { createComponent, mountComponent } from '../src/runtime';

// @ts-ignore
import * as MyComponent from './samples/set1/my-component.html';

describe('Full component render', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('set1', () => {
		const component = createComponent('my-component', MyComponent);
		mountComponent(component);

		strictEqual(component.innerHTML, read('samples/set1/output1.html'));

		const sub1 = (component as any as ElementShim).findByName('sub-component1');
		const sub2 = (component as any as ElementShim).findByName('sub-component2');
		ok(component.store);
		ok(sub1);
		ok(sub2);

		strictEqual(sub1.root, component);
		strictEqual(sub1.store, component.store);
		strictEqual(sub2.root, component);
		strictEqual(sub2.store, component.store);

		component.setProps({ value1: 0 });
		strictEqual(component.innerHTML, read('samples/set1/output2.html'));
	});
});
