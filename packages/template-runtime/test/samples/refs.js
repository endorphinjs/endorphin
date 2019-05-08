import {
	createInjector, elem, getProp, insert, mountBlock, updateBlock,
	finalizeRefs, setRef, setStaticRef
} from '../../src/runtime';

export default function(host, scope) {
	const injector = createInjector(host.componentView);

	const elem1 = insert(injector, elem('main', host));
	setStaticRef(host, 'main', elem1);

	const injector2 = createInjector(elem1);
	scope.elem2 = insert(injector2, elem('div', host));
	setRef(host, 'header', scope.elem2);

	scope.block1 = mountBlock(host, injector2, ifBlock1);

	scope.elem3 = insert(injector2, elem('footer', host));
	setRef(host, getProp(host, 'dynRef'), scope.elem3);

	finalizeRefs(host);

	return updateTemplate;
}

function updateTemplate(host, scope) {
	setRef(host, 'header', scope.elem2);
	updateBlock(scope.block1);
	setRef(host, getProp(host, 'dynRef'), scope.elem3);
	finalizeRefs(host);
}

function ifBlock1(host) {
	if (getProp(host, 'c1')) {
		return ifContent1;
	}
}

function ifContent1(host, injector, scope) {
	scope.elem1 = insert(injector, elem('span', host));
	setRef(host, 'header', scope.elem1);

	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	setRef(host, 'header', scope.elem1);
}
