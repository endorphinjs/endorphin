import { createComponent, insert, mountComponent, updateComponent, unmountComponent, addDisposeCallback, mountBlock, updateBlock, unmountBlock, createInjector } from '../../src/runtime';
import * as SubComponent1 from 'sub-component1.html';
import * as SubComponent2 from 'sub-component2.html';

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const injector0 = createInjector(target0);
	const subComponent10 = scope.$_subComponent10 = insert(injector0, createComponent('sub-component1', SubComponent1, host));
	mountComponent(subComponent10);
	scope.$_block1 = mountBlock(host, injector0, $$conditionEntry0);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateComponent(scope.$_subComponent10);
	updateBlock(scope.$_block1);
	return 0;
}

function $$template0Unmount(scope) {
	scope.$_subComponent10 = unmountComponent(scope.$_subComponent10);
	scope.$_block1 = unmountBlock(scope.$_block1);
}

function $$conditionContent1(host, injector, scope) {
	const subComponent20 = scope.$_subComponent21 = insert(injector, createComponent('sub-component2', SubComponent2, host));
	mountComponent(subComponent20);
	addDisposeCallback(injector, $$conditionContent1Unmount);
	return $$conditionContent1Update;
}

function $$conditionContent1Update(host, injector, scope) {
	updateComponent(scope.$_subComponent21);
	return 0;
}

function $$conditionContent1Unmount(scope) {
	scope.$_subComponent21 = unmountComponent(scope.$_subComponent21);
}

function $$conditionEntry1(host) {
	if (host.props.enabled2) {
		return $$conditionContent1;
	}
}

function $$conditionContent0(host, injector, scope) {
	const subComponent20 = scope.$_subComponent20 = insert(injector, createComponent('sub-component2', SubComponent2, host));
	mountComponent(subComponent20);
	scope.$_block0 = mountBlock(host, injector, $$conditionEntry1);
	addDisposeCallback(injector, $$conditionContent0Unmount);
	return $$conditionContent0Update;
}

function $$conditionContent0Update(host, injector, scope) {
	updateComponent(scope.$_subComponent20);
	updateBlock(scope.$_block0);
	return 0;
}

function $$conditionContent0Unmount(scope) {
	scope.$_subComponent20 = unmountComponent(scope.$_subComponent20);
	scope.$_block0 = unmountBlock(scope.$_block0);
}

function $$conditionEntry0(host) {
	if (host.props.enabled1) {
		return $$conditionContent0;
	}
}
