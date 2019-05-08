import { strictEqual } from 'assert';
import read from './assets/read-file';
import document from './assets/document';
import branching from './samples/branching';
import deepBranching from './samples/branching-deep-nesting';
import { createComponent, mountComponent, updateComponent } from '../src/runtime';

describe('Branching', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('basic', () => {
		const component = createComponent('my-component', {
			default: branching,
			props() {
				return { expr1: 2, expr2: true, expr3: true };
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, read('fixtures/branching1.html'));

		const [h1, p, div] = component.childNodes;

		// Re-render with the same state: must be exactly the same result
		const prevChildren = Array.from(component.childNodes);
		updateComponent(component);
		strictEqual(component.innerHTML, read('fixtures/branching1.html'));
		prevChildren.forEach((child, i) => strictEqual(child, component.childNodes[i]));

		// Render with updated state: keep common elements, detach removed
		component.setProps({ expr1: true, expr2: false, expr3: false });
		strictEqual(h1, component.childNodes[0]);
		strictEqual(p, component.childNodes[1]);
		strictEqual(div.parentNode, null);
		strictEqual(component.innerHTML, read('fixtures/branching2.html'));
	});

	it('deep', () => {
		const component = createComponent('my-component', {
			default: deepBranching,
			props() {
				return { expr1: 2, expr2: true, expr3: true };
			}
		});

		mountComponent(component);
		strictEqual(component.innerHTML, 'test');

		component.setProps({ expr2: false });
		strictEqual(component.innerHTML, '');

		component.setProps({ expr1: false, expr2: true });
		strictEqual(component.innerHTML, '');

		component.setProps({ expr1: true });
		strictEqual(component.innerHTML, 'test');
	});
});
