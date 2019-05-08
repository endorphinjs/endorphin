import {
	createInjector, elem, elemWithText, text, insert, getProp, mountBlock, updateBlock
} from '../../src/runtime';

export default function(host, scope) {
	const target = host.componentView;
	const injector = createInjector(target);
	insert(injector, elemWithText('h1', 'Hello world'));
	scope.block1 = mountBlock(host, injector, ifBlock1);

	const elem1 = insert(injector, elem('blockquote'));
	const injector2 = createInjector(elem1);
	insert(injector2, elemWithText('p', 'Lorem ipsum 1'));
	scope.block2 = mountBlock(host, injector2, chooseBlock1);
	insert(injector2, elemWithText('p', 'Lorem ipsum 2'));

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
	const p = insert(injector, elem('p'));
	p.appendChild(elemWithText('strong', 'top 1'));
	scope.block3 = mountBlock(host, injector, ifBlock2);
	scope.block4 = mountBlock(host, injector, ifBlock3);

	return ifContent1Update;
}

function ifContent1Update(host, injector, scope) {
	updateBlock(scope.block3);
	updateBlock(scope.block4);
}

function ifContent2(host, injector) {
	insert(injector, elemWithText('div', 'top 2'));
}

function ifContent3(host, injector) {
	insert(injector, elemWithText('div', 'top 3'));
	insert(injector, text('top 3.1'));
}

function chooseContent1(host, injector) {
	insert(injector, elemWithText('div', 'sub 1'));
}

function chooseContent2(host, injector) {
	insert(injector, elemWithText('div', 'sub 2'));
}

function chooseContent3(host, injector) {
	insert(injector, elemWithText('div', 'sub 3'));
}
