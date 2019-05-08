import { strictEqual, ok } from 'assert';
import read from './assets/read-file';
import document, { setCallback, clearCallbacks, ElementShim } from './assets/document';
import parentTemplate from './samples/slot';
import { createComponent, mountComponent, renderComponent, Component } from '../src/runtime';

describe('Slots', () => {
	before(() => global['document'] = document);
	after(() => {
		delete global['document'];
		clearCallbacks();
	});

	it('should render slotted component', () => {
		let subComponent: Component;
		const component = createComponent('my-component', {
			default: parentTemplate,
			props() {
				return { id: 'foo', c1: false, c2: false };
			}
		});

		setCallback((elem: ElementShim) => {
			if (elem.nodeName === 'sub-component') {
				subComponent = elem as any as Component;
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, read('./fixtures/slot1.html'));
		ok(subComponent);

		component.setProps({ c1: true, c2: true });
		strictEqual(component.innerHTML, read('./fixtures/slot2.html'));

		// Dispose incoming "header" slot: should render default value
		component.setProps({ c2: false });
		strictEqual(component.innerHTML, read('./fixtures/slot3.html'));

		// Set back incoming "header" slot
		component.setProps({ c2: true });
		strictEqual(component.innerHTML, read('./fixtures/slot2.html'));

		// Fill slot contents with iterator
		component.setProps({ items: [1, 2] });
		strictEqual(component.innerHTML, read('./fixtures/slot4.html'));

		// Enable "footer" slot in sub-component
		subComponent.setProps({ showFooter: true });
		strictEqual(component.innerHTML, read('./fixtures/slot5.html'));

		// Disable "footer" slot
		subComponent.setProps({ showFooter: false });
		strictEqual(component.innerHTML, read('./fixtures/slot4.html'));

		// ...and enable "footer" slot back again
		subComponent.setProps({ showFooter: true });
		strictEqual(component.innerHTML, read('./fixtures/slot5.html'));

		// Re-render the same template: keep data as-is
		renderComponent(component);
		strictEqual(component.innerHTML, read('./fixtures/slot5.html'));

		// Dispose data rendered in iterator
		component.setProps({ items: null });
		strictEqual(component.innerHTML, read('./fixtures/slot6.html'));
	});
});
