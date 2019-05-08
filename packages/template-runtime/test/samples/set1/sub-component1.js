import {
	elem, elemWithText, text, insert,
	mountBlock, updateBlock, createInjector, mountSlot, getProp
} from '../../../src/runtime';

/**
 * @param {Component} host
 */
export default function subComponent1Template(host, scope) {
	const target = host.componentView;
	const injector = createInjector(target);

	insert(injector, elemWithText('h2', 'Sub component1'));

	scope.block1 = mountBlock(host, injector, ifBlock1);
	const slot1 = insert(injector, elem('slot'));
	mountSlot(host, '', slot1, slotContent1);

	return subComponent1Update;
}

function subComponent1Update(host, scope) {
	updateBlock(scope.block1);
}

function ifBlock1(host) {
	if (getProp(host, 'foo') === 1) {
		return ifContent1;
	}
}

function ifContent1(host, injector) {
	insert(injector, elemWithText('p', 'foo enabled'));
}

function slotContent1(host, injector) {
	insert(injector, text('Default sub-component data'));
}
