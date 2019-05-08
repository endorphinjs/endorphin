import {
	createInjector, text, insert, getProp, mountBlock, updateBlock
} from '../../src/runtime';

export default function template(component, scope) {
	const target = component.componentView;
	const injector = createInjector(target);
	scope.block1 = mountBlock(component, injector, ifBlock1);

	return updateTemplate;
}

function updateTemplate(host, scope) {
	updateBlock(scope.block1);
}

function ifBlock1(host) {
	if (getProp(host, 'expr1')) {
		return ifContent1;
	}
}

function ifBlock2(host) {
	if (getProp(host, 'expr2')) {
		return ifContent2;
	}
}

function ifBlock3(host) {
	if (getProp(host, 'expr3')) {
		return ifContent3;
	}
}

function ifContent1(host, injector, scope) {
	scope.block2 = mountBlock(host, injector, ifBlock2);
	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	updateBlock(scope.block2);
}

function ifContent2(host, injector, scope) {
	scope.block3 = mountBlock(host, injector, ifBlock3);

	return ifContent2Update;
}

function ifContent2Update(host, injector, scope) {
	updateBlock(scope.block3);
}

function ifContent3(host, injector) {
	insert(injector, text('test'));
}
