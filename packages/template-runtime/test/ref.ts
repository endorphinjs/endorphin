import { deepStrictEqual, strictEqual, ok } from 'assert';
import document from './assets/document';
import { createComponent, mountComponent } from '../src/runtime';

// @ts-ignore
import template from './samples/refs.html';

describe('Refs', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('should store and update refs', () => {
		const component = createComponent('my-component', {
			default: template,
			props() {
				return { c1: false, dynRef: 'foo' };
			}
		});

		// Initial render
		mountComponent(component);
		const refs = component.refs;
		deepStrictEqual(Object.keys(refs), ['main', 'header', 'foo']);

		strictEqual(refs.main.nodeName, 'main');
		ok(refs.main.hasAttribute('ref-main'));

		strictEqual(refs.header.nodeName, 'div');
		ok(refs.header.hasAttribute('ref-header'));

		strictEqual(refs.foo.nodeName, 'footer');
		ok(refs.foo.hasAttribute('ref-foo'));

		const prevHeader = refs.header;
		const prevFoo = refs.foo;

		component.setProps({ c1: true, dynRef: 'bar' });
		deepStrictEqual(Object.keys(refs), ['main', 'header', 'foo', 'bar']);

		strictEqual(refs.main.nodeName, 'main');
		ok(refs.main.hasAttribute('ref-main'));

		strictEqual(refs.header.nodeName, 'span');
		ok(refs.header.hasAttribute('ref-header'));

		strictEqual(refs.foo, null);

		strictEqual(refs.bar.nodeName, 'footer');
		ok(refs.bar.hasAttribute('ref-bar'));

		// Make sure ref attributes are removed
		// NB: see comment for `removeRef()` in refs.ts
		// ok(!prevHeader.hasAttribute('ref-header'));
		// ok(!prevFoo.hasAttribute('ref-foo'));

		component.setProps({ c1: false, dynRef: 'bar' });
		deepStrictEqual(Object.keys(refs), ['main', 'header', 'foo', 'bar']);
		strictEqual(refs.header.nodeName, 'div');
		strictEqual(refs.header, prevHeader);
		ok(refs.header.hasAttribute('ref-header'));
	});
});
