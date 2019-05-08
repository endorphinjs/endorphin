import {
	createInjector, mountKeyIterator, updateKeyIterator, elem, elemWithText,
	text, get, insert, getProp, updateAttribute, mountBlock, updateBlock
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
	scope.iter1 = mountKeyIterator(host, injector2, forEachExpr1, forEachKey1, forEachBody1);

	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	updateKeyIterator(scope.iter1);
}

function forEachExpr1(host) {
	return getProp(host, 'items');
}

function forEachKey1(ctx, scope) {
	return get(scope.value, 'id');
}

function forEachBody1(host, injector, scope) {
	scope.elem1 = insert(injector, elem('li'));
	scope.attr1Value = updateAttribute(scope.elem1, 'id', get(scope.value, 'id'));

	const injector2 = createInjector(scope.elem1);
	insert(injector2, text('item'));
	scope.block2 = mountBlock(host, injector2, ifBlock2);

	return forEachBody1Update;
}

function forEachBody1Update(host, injector, scope) {
	scope.attr1Value = updateAttribute(scope.elem1, 'id', get(scope.value, 'id'), scope.attr1Value);
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
