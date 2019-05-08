import { strictEqual } from 'assert';
import document from './assets/document';
import template, { cssScope } from './samples/inner-html';
import { createComponent, mountComponent } from '../src/runtime';

describe('Inner HTML', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('render and update inner HTML', () => {
		const component = createComponent('my-component', {
			default: template,
			cssScope,
			props() {
				return { c1: false, c2: false, html: '<main>hello <b>world</b></main>' };
			}
		});

		// Initial render
		mountComponent(component);
		strictEqual(component.innerHTML, '<main ih="">\n\thello \n\t<b ih="">world</b>\n</main>');
		const prevFirst = component.firstChild;

		// Re-render with same content, make sure content is not re-rendered
		strictEqual(component.innerHTML, '<main ih="">\n\thello \n\t<b ih="">world</b>\n</main>');
		strictEqual(component.firstChild, prevFirst);

		component.setProps({ c1: true, c2: true, html: '<main>hello <b>world</b></main>' });
		strictEqual(component.innerHTML, '<div ih="">foo</div>\n<main ih="">\n\thello \n\t<b ih="">world</b>\n</main>\n<p ih="">bar</p>');
		strictEqual(component.childNodes[1], prevFirst);

		// Update inner HTML
		component.setProps({ c1: true, c2: true, html: '<main>hello1 <span>world2</span></main>' });
		strictEqual(component.innerHTML, '<div ih="">foo</div>\n<main ih="">\n\thello1 \n\t<span ih="">world2</span>\n</main>\n<p ih="">bar</p>');
	});
});
