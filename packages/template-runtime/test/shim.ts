import { strictEqual } from 'assert';
import document from './assets/document';

describe('Shim', () => {
	it('document', () => {
		const div = document.createElement('div');
		div.setAttribute('title', 'test');
		const strong = div.appendChild(document.createElement('strong'));
		strong.appendChild(document.createTextNode('hello world'));
		const text = document.createTextNode('text');
		div.insertBefore(text, strong);
		const comment = div.appendChild(document.createComment('sample comment'));

		strictEqual(div.childNodes.length, 3);
		strictEqual(div.attributes.length, 1);
		strictEqual(div.getAttribute('title'), 'test');

		strictEqual(div.childNodes[0], text);
		strictEqual(div.childNodes[1], strong);
		strictEqual(div.childNodes[2], comment);

		strictEqual(div.toString(), `<div title="test">
	text
	<strong>hello world</strong>
	<!--sample comment-->
</div>`);
	});

	it('document fragment', () => {
		const df = document.createDocumentFragment();
		const div = df.appendChild(document.createElement('div'));
		const span = df.appendChild(document.createElement('span'));
		df.appendChild(document.createTextNode('text'));
		strictEqual(df.childNodes.length, 3);

		const container = document.createElement('div');
		container.appendChild(df);
		strictEqual(df.childNodes.length, 0);
		strictEqual(container.childNodes.length, 3);
		strictEqual(container.firstChild, div);
		strictEqual(div.nextSibling, span);
		strictEqual(span.previousSibling, div);

		df.appendChild(document.createTextNode('1'));
		df.appendChild(document.createTextNode('2'));
		df.appendChild(document.createTextNode('3'));

		container.insertBefore(df, span);
		strictEqual(df.childNodes.length, 0);
		strictEqual(container.childNodes.length, 6);
		strictEqual(container.childNodes[1].nodeValue, '1');
		strictEqual(container.childNodes[2].nodeValue, '2');
		strictEqual(container.childNodes[3].nodeValue, '3');
	});
});
