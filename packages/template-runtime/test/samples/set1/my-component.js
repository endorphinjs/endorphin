import {
	elemWithText, text, insert, setAttribute, getProp,
	createComponent, mountComponent, updateComponent, createInjector,
	mountBlock, updateBlock, Store
} from '../../../src/runtime';

import * as SubComponent1 from './sub-component1';
import * as SubComponent2 from './sub-component2';

export function store() {
	return new Store({ foo: 'bar' });
}

/**
 * @param {Component} host
 */
export default function myComponentTemplate(host, scope) {
	const target = host.componentView;
	const injector = createInjector(target);

	insert(injector, elemWithText('h1', 'Title'));

	scope.subComponent1 = createComponent('sub-component1', SubComponent1, host);
	scope.injector2 = scope.subComponent1.componentModel.input;
	setAttribute(scope.injector2, 'foo', attrValue1(host));
	insert(injector, scope.subComponent1);

	scope.block1 = mountBlock(host, scope.injector2, ifBlock1);

	mountComponent(scope.subComponent1);

	return myComponentUpdate;
}

function myComponentUpdate(host, scope) {
	setAttribute(scope.injector2, 'foo', attrValue1(host));
	updateBlock(scope.block1);
	updateComponent(scope.subComponent1);
}

export function props() {
	return {
		value1: 1,
		value2: 2
	};
}

function ifBlock1(host) {
	if (getProp(host, 'value1') > 0) {
		return ifContent1;
	}
}

function ifContent1(host, injector, scope) {
	scope.subComponent2 = createComponent('sub-component2', SubComponent2, host);
	scope.injector3 = scope.subComponent2.componentModel.input;
	setAttribute(scope.injector3, 'bar', attrValue2(host));
	insert(injector, scope.subComponent2);
	insert(scope.injector3, text('Hello world'));

	mountComponent(scope.subComponent2);

	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	setAttribute(scope.injector3, 'bar', attrValue2(host));
	updateComponent(scope.subComponent2);
}

function attrValue1(host) {
	return getProp(host, 'value1');
}

function attrValue2(host) {
	return getProp(host, 'value2');
}
