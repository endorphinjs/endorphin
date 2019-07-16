import { deepEqual } from 'assert';
import document from './assets/document';
import { createComponent, mountComponent, renderComponent, updateComponent, Component } from '../src/runtime';

// @ts-ignore
import template from './samples/props.html';

describe('Props', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('should update props', () => {
		const component = createComponent('my-component', {
			default: template,
			props() {
				return { id: 'foo', c1: false };
			}
		});

		// Initial render
		mountComponent(component);
		const sub = component.firstChild as Component;
		deepEqual(sub.props, { p1: 1, id: 'foo', p3: 3 });

		component.setProps({ id: 'bar', c1: true });
		deepEqual(sub.props, { p1: 1, id: 'bar', p3: 3, p2: 2 });

		renderComponent(component);
		deepEqual(sub.props, { p1: 1, id: 'bar', p3: 3, p2: 2 });

		component.setProps({ c1: false });
		deepEqual(sub.props, { p1: 1, id: 'bar', p3: 3, p2: null });
	});

	it('should init with default props', () => {
		const component = createComponent('my-component', {
			default: template,
			props() {
				return { id: 'foo', c1: false };
			}
		});

		const attrSet = { id: 'bar', c1: true };
		mountComponent(component, attrSet);
		deepEqual(component.props, { id: 'bar', c1: true });

		attrSet.c1 = false;
		updateComponent(component, attrSet);
		deepEqual(component.props, { id: 'bar', c1: false });
	});
});
