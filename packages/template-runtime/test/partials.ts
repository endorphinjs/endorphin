import { equal } from 'assert';
import read from './assets/read-file';
import document from './assets/document';
import { createComponent, mountComponent, renderComponent } from '../src/runtime';

// @ts-ignore
import partials from './samples/partials.html';
// @ts-ignore
import * as OuterComponent from './samples/set2/outer-component.html';

describe('Partials', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('basic', () => {
		const component = createComponent('my-component', {
			default: partials,
			props() {
				return {
					items: ['one', 'two', 'three']
				};
			}
		});

		mountComponent(component);
		equal(component.innerHTML, read('fixtures/partials1.html'));
	});

	it('pass partial as prop', () => {
		const component = createComponent('outer-component', OuterComponent);

		mountComponent(component, {
			items1: ['one', 'two', 'three'],
			items2: ['foo', 'bar', 'baz']
		});
		equal(component.innerHTML, read('./samples/set2/output1.html'));

		// Re-render: keep everything as is
		renderComponent(component);
		equal(component.innerHTML, read('./samples/set2/output1.html'));

		component.setProps({
			items1: ['four', 'five'],
			items2: [4, 5, 6, 7]
		});
		equal(component.innerHTML, read('./samples/set2/output2.html'));
	});

	it('re-render outer partial', () => {
		const component = createComponent('outer-component', OuterComponent);

		mountComponent(component, {
			items1: ['one', 'two', 'three'],
			items2: ['foo', 'bar', 'baz'],
			enabled: false
		});
		equal(component.innerHTML, read('./samples/set2/output1.html'));

		// Re-render: keep everything as is
		renderComponent(component);
		equal(component.innerHTML, read('./samples/set2/output1.html'));

		component.setProps({ enabled: true });
		equal(component.innerHTML, read('./samples/set2/output3.html'));

		component.setProps({ enabled: false });
		equal(component.innerHTML, read('./samples/set2/output1.html'));
	});
});
