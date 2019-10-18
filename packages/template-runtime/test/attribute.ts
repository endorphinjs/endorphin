import { strictEqual } from 'assert';
import document from './assets/document';
import { createComponent, mountComponent, renderComponent } from '../src/runtime';

// @ts-ignore
import attribute1 from './samples/attribute1.html';
// @ts-ignore
import attribute2 from './samples/attribute2.html';

describe('Attribute', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('should properly update attributes with the same name', () => {
		const component = createComponent('my-component', {
			default: attribute1,
			props() {
				return { id: 'foo', c1: false, c2: false, c3: false };
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, '<main a3="4" a1="foo" a2="0"></main>');

		component.setProps({ id: 'foo2', c1: true, c2: false, c3: true });
		strictEqual(component.innerHTML, '<main a3="4" a1="3" a2="3"></main>');

		component.setProps({ c2: true, c3: false });
		strictEqual(component.innerHTML, '<main a3="4" a1="foo2" a2="2"></main>');

		// Re-render: should keep previous result
		renderComponent(component);
		strictEqual(component.innerHTML, '<main a3="4" a1="foo2" a2="2"></main>');

		component.setProps({ c1: false, c2: false });
		strictEqual(component.innerHTML, '<main a3="4" a1="foo2" a2="0"></main>');
	});

	it('should add class names', () => {
		const component = createComponent('my-component', {
			default: attribute2,
			props() {
				return { id: 'foo', c1: false, c2: false, c3: false, classAddon: 'baz' };
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, '<main a1="foo" a2="0" class="foo baz"></main>');

		// Re-render: retain the same result
		renderComponent(component);
		strictEqual(component.innerHTML, '<main a1="foo" a2="0" class="foo baz"></main>');

		component.setProps({ c1: true, c2: true });
		strictEqual(component.innerHTML, '<main a1="foo" a2="1" class="foo foo bar baz"></main>');

		// Re-render: should retain previous result
		renderComponent(component);
		strictEqual(component.innerHTML, '<main a1="foo" a2="1" class="foo foo bar baz"></main>');

		component.setProps({ c3: true });
		strictEqual(component.innerHTML, '<main a1="foo" a2="1" class="bam foo baz"></main>');
	});
});
