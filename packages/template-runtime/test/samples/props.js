import {
	createInjector, setAttribute, mountBlock, updateBlock,
	insert, getProp, createComponent, mountComponent, updateComponent
} from '../../src/runtime';

import * as SubComponent1 from './set1/sub-component1';

export default function template(host, scope) {
	const injector = createInjector(host.componentView);

	scope.subComponent = createComponent('sub-component', SubComponent1, host);
	insert(injector, scope.subComponent);
	scope.subInjector = scope.subComponent.componentModel.input;

	setAttribute(scope.subInjector, 'p1', 1);
	setAttribute(scope.subInjector, 'id', attrValue1(host));
	scope.block1 = mountBlock(host, scope.subInjector, ifBlock1);
	setAttribute(scope.subInjector, 'p3', 3);
	mountComponent(scope.subComponent);

	return updateTemplate;
}

function updateTemplate(host, scope) {
	setAttribute(scope.subInjector, 'p1', 1);
	setAttribute(scope.subInjector, 'id', attrValue1(host));
	updateBlock(scope.block1);
	setAttribute(scope.subInjector, 'p3', 3);
	updateComponent(scope.subComponent);
}

function attrValue1(host) {
	return getProp(host, 'id');
}

function ifBlock1(host) {
	if (getProp(host, 'c1')) {
		return ifContent1;
	}
}

function ifContent1(host, injector) {
	setAttribute(injector, 'p2', 2);
	return ifContent1;
}
