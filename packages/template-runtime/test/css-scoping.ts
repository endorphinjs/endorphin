import { strictEqual, ok } from 'assert';
import read from './assets/read-file';
import document from './assets/document';
import branching from './samples/branching-scoped';
import { createComponent, mountComponent, updateComponent } from '../src/runtime';

describe('CSS scoping', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('basic', () => {
		const component = createComponent('my-component', {
			default: branching,
			cssScope: 'end1',
			props() {
				return { expr1: 2, expr2: true, expr3: true };
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, read('fixtures/branching1-scoped.html'));
		ok(component.hasAttribute('end1-host'));

		const [h1, p, div] = component.childNodes;

		// Re-render with the same state: must be exactly the same result
		const prevChildren = Array.from(component.childNodes);
		updateComponent(component);
		strictEqual(component.innerHTML, read('fixtures/branching1-scoped.html'));
		prevChildren.forEach((child, i) => strictEqual(child, component.childNodes[i]));

		// Render with updated state: keep common elements, detach removed
		component.setProps({ expr1: true, expr2: false, expr3: false });
		strictEqual(h1, component.childNodes[0]);
		strictEqual(p, component.childNodes[1]);
		strictEqual(div.parentNode, null);
		strictEqual(component.innerHTML, read('fixtures/branching2-scoped.html'));
	});
});
