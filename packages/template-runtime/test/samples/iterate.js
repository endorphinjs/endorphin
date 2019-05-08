import {
	createInjector, elem, elemWithText, text, insert, getProp, get,
	mountBlock, updateBlock, mountIterator, updateIterator
} from '../../src/runtime';

export default function template(host, scope) {
	const injector = createInjector(host.componentView);

	insert(injector, elemWithText('h1', 'Hello world'));
	scope.block1 = mountBlock(host, injector, ifBlock1);
	return updateTemplate;
}

function updateTemplate(host, scope) {
	updateBlock(scope.block1);
}

function ifBlock1(host) {
	if (getProp(host, 'items')) {
		return ifContent1;
	}
}

function ifContent1(host, injector, scope) {
	insert(injector, elemWithText('p', 'will iterate'));
	const elem1 = insert(injector, elem('ul'));
	const injector2 = createInjector(elem1);
	scope.iter1 = mountIterator(host, injector2, forEachExpr1, forEachBody1);

	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	updateIterator(scope.iter1);
}

function forEachExpr1(host) {
	return getProp(host, 'items');
}

function forEachBody1(host, injector, scope) {
	const elem1 = insert(injector, elem('li'));
	const injector2 = createInjector(elem1);
	insert(injector2, text('item'));
	scope.block2 = mountBlock(host, injector2, ifBlock2);
	return forEachBody1Update;
}

function forEachBody1Update(host, injector, scope) {
	updateBlock(scope.block2);
}

function ifBlock2(host, scope) {
	if (get(scope.value, 'marked')) {
		return ifContent2;
	}
}

function ifContent2(host, injector) {
	insert(injector, elemWithText('strong', '*'));
}
