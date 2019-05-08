import {
	createInjector, elemWithText, getProp, insert,
	mountInnerHTML, updateInnerHTML, mountBlock, updateBlock
} from '../../src/runtime';

export const cssScope = 'ih';

export default function(host, scope) {
	const injector = createInjector(host.componentView);
	scope.block1 = mountBlock(host, injector, ifBlock1);
	scope.html1 = mountInnerHTML(host, injector, getHTML);
	scope.block2 = mountBlock(host, injector, ifBlock2);

	return updateTemplate;
}

function updateTemplate(host, scope) {
	updateBlock(scope.block1);
	updateInnerHTML(scope.html1);
	updateBlock(scope.block2);
}

function getHTML(host) {
	return getProp(host, 'html');
}

function ifBlock1(host) {
	if (getProp(host, 'c1')) {
		return ifContent1;
	}
}

function ifContent1(host, injector) {
	insert(injector, elemWithText('div', 'foo', cssScope));
}

function ifBlock2(host) {
	if (getProp(host, 'c2')) {
		return ifContent2;
	}
}

function ifContent2(host, injector) {
	insert(injector, elemWithText('p', 'bar', cssScope));
}
