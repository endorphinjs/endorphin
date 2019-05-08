import {
	createInjector, elem, elemWithText, text, insert, getProp, mountBlock, updateBlock
} from '../../src/runtime';

const cssScope = 'end1';

export default function(component, scope) {
	const target = component.componentView;
	const injector = createInjector(target);
	insert(injector, elemWithText('h1', 'Hello world', cssScope));

	scope.block1 = mountBlock(component, injector, ifBlock1);
	const elem1 = insert(injector, elem('blockquote', cssScope));
	const injector2 = createInjector(elem1);
	insert(injector2, elemWithText('p', 'Lorem ipsum 1', cssScope));

	scope.block2 = mountBlock(component, injector2, chooseBlock1);
	insert(injector2, elemWithText('p', 'Lorem ipsum 2', cssScope));

	return updateTemplate;
}

function updateTemplate(host, scope) {
	updateBlock(scope.block1);
	updateBlock(scope.block2);
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

function chooseBlock1(host) {
	if (getProp(host, 'expr1') === 1) {
		return chooseContent1;
	} else if (getProp(host, 'expr1') === 2) {
		return chooseContent2;
	} else {
		return chooseContent3;
	}
}

function ifContent1(host, injector, scope) {
	const p = insert(injector, elem('p', cssScope));
	p.appendChild(elemWithText('strong', 'top 1', cssScope));
	scope.block3 = mountBlock(host, injector, ifBlock2);
	scope.block4 = mountBlock(host, injector, ifBlock3);
	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	updateBlock(scope.block3);
	updateBlock(scope.block4);
}

function ifContent2(host, injector) {
	insert(injector, elemWithText('div', 'top 2', cssScope));
}

function ifContent3(host, injector) {
	insert(injector, elemWithText('div', 'top 3', cssScope));
	insert(injector, text('top 3.1'));
}

function chooseContent1(host, injector) {
	insert(injector, elemWithText('div', 'sub 1', cssScope));
}

function chooseContent2(host, injector) {
	insert(injector, elemWithText('div', 'sub 2', cssScope));
}

function chooseContent3(host, injector) {
	insert(injector, elemWithText('div', 'sub 3', cssScope));
}
