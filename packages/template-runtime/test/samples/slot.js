import {
	createInjector, mountBlock, updateBlock, setAttribute,
	elemWithText, elem, insert, createComponent, mountComponent, updateComponent,
	getProp, mountIterator, updateIterator, mountSlot
} from '../../src/runtime';

export default function template(host, scope) {
	const injector = createInjector(host.componentView);

	insert(injector, elemWithText('h1', 'Hello world'));
	scope.subComponent = insert(injector, createComponent('sub-component', { default: subComponentTemplate }, host));
	scope.subInjector = scope.subComponent.componentModel.input;

	setAttribute(scope.subInjector, 'id', attrValue1(host));
	insert(scope.subInjector, elemWithText('div', 'foo'));

	scope.block1 = mountBlock(host, scope.subInjector, ifBlock1);
	scope.block2 = mountBlock(host, scope.subInjector, ifBlock2);
	scope.iter1 = mountIterator(host, scope.subInjector, forEachExpr1, forEachBody1);
	scope.block3 = mountBlock(host, scope.subInjector, ifBlock3);

	mountComponent(scope.subComponent);

	return updateTemplate;
}

function updateTemplate(host, scope) {
	setAttribute(scope.subInjector, 'id', attrValue1(host));
	updateBlock(scope.block1);
	updateBlock(scope.block2);
	updateIterator(scope.iter1);
	updateBlock(scope.block3);
	updateComponent(scope.subComponent);
}

function subComponentTemplate(host, scope) {
	const injector = createInjector(host.componentView);

	const elem1 = insert(injector, elem('div'));
	elem1.setAttribute('class', 'container');

	const injector2 = createInjector(elem1);
	const slot1 = insert(injector2, elem('slot'));
	slot1.setAttribute('name', 'header');
	mountSlot(host, 'header', slot1, slotContent1);

	insert(injector2, elemWithText('p', 'content'));

	const slot2 = insert(injector2, elem('slot'));
	mountSlot(host, '', slot2);

	scope.block2 = mountBlock(host, injector2, ifBlock4);
	scope.block3 = mountBlock(host, injector2, ifBlock5);

	return subComponentTemplateUpdate;
}

function subComponentTemplateUpdate(host, scope) {
	updateBlock(scope.block2);
	updateBlock(scope.block3);
}

function attrValue1(scope) {
	return getProp(scope, 'id');
}

function ifBlock1(scope) {
	if (getProp(scope, 'c1')) {
		return ifContent1;
	}
}

function ifContent1(scope, injector) {
	insert(injector, elemWithText('p', 'bar'));
}

function ifBlock2(scope) {
	if (getProp(scope, 'c2')) {
		return ifContent2;
	}
}

function ifContent2(scope, injector) {
	const elem = insert(injector, elemWithText('p', 'bar'), 'header');
	elem.setAttribute('slot', 'header');
}

function ifBlock3(scope) {
	if (getProp(scope, 'error')) {
		return ifContent3;
	}
}

function ifContent3(scope, injector) {
	const elem = insert(injector, elemWithText('div', 'Got error'), 'error');
	elem.setAttribute('slot', 'error');
}

function ifBlock4(scope) {
	if (getProp(scope, 'showError')) {
		return ifContent4;
	}
}

function ifContent4(host, injector) {
	const elem = insert(injector, elem('slot'));
	elem.setAttribute('slot', 'error');
	mountSlot(host, 'error', elem);
	// NB: no default value in slot, no need to update anything
}

function ifBlock5(host) {
	if (getProp(host, 'showFooter')) {
		return ifContent5;
	}
}

function ifContent5(host, injector) {
	const slot = insert(injector, elem('slot'));
	slot.setAttribute('name', 'footer');
	mountSlot(host, 'footer', slot, slotContent2);

	return ifContent5Update;
}

function ifContent5Update(host, injector, scope) {
	updateBlock(scope.block10);
}

function forEachExpr1(host) {
	return getProp(host, 'items');
}

function forEachBody1(host, injector) {
	insert(injector, elemWithText('div', 'item'));
	const slot = insert(injector, elemWithText('div', 'item footer'), 'footer');
	slot.setAttribute('slot', 'footer');
}

function slotContent1(host, injector) {
	insert(injector, elemWithText('h2', 'Default header'));
}

function slotContent2(host, injector) {
	insert(injector, elemWithText('footer', 'Default footer'));
}
