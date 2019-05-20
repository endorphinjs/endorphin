import { elemWithText, setAttribute, createComponent, insert, mountBlock, updateBlock, unmountBlock, mountIterator, updateIterator, unmountIterator, markSlotUpdate, mountComponent, updateComponent, unmountComponent, addDisposeCallback } from "endorphin";
import * as SubComponent from "./slot-inner.html";

function setVars$0(host, scope) {
	scope.foo = host.props.bar;
}

function ifBody$0(host, injector) {
	insert(injector, elemWithText("p", "bar"), "");
}

function ifEntry$0(host) {
	if (host.props.c1) {
		return ifBody$0;
	}
}

function ifBody$1(host, injector) {
	const p$1 = insert(injector, elemWithText("p", "bar"), "header");
	p$1.setAttribute("slot", "header");
}

function ifEntry$1(host) {
	if (host.props.c2) {
		return ifBody$1;
	}
}

function forSelect$0(host) {
	return host.props.items;
}

function forContent$0(host, injector) {
	insert(injector, elemWithText("div", "item"), "");
	const div$2 = insert(injector, elemWithText("div", "item footer"), "footer");
	div$2.setAttribute("slot", "footer");
}

function ifBody$2(host, injector) {
	const div$3 = insert(injector, elemWithText("div", "Got error"), "error");
	div$3.setAttribute("slot", "error");
}

function ifEntry$2(host) {
	if (host.props.error) {
		return ifBody$2;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	target$0.appendChild(elemWithText("h1", "Hello world"));
	const subComponent$0 = scope.subComponent$0 = target$0.appendChild(createComponent("sub-component", SubComponent, host));
	const inj$0 = scope.inj$0 = subComponent$0.componentModel.input;
	setAttribute(inj$0, "id", host.props.id);
	setVars$0(host, scope);
	insert(inj$0, elemWithText("div", "foo"), "");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	scope.if$2 = mountBlock(host, inj$0, ifEntry$2);
	mountComponent(subComponent$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	let su$0 = 0;
	const { subComponent$0 } = scope;
	setAttribute(scope.inj$0, "id", host.props.id);
	setVars$0(host, scope);
	su$0 |= updateBlock(scope.if$0);
	su$0 |= updateBlock(scope.if$1);
	su$0 |= updateIterator(scope.for$0);
	su$0 |= updateBlock(scope.if$2);
	markSlotUpdate(subComponent$0, "", su$0);
	updateComponent(subComponent$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.for$0 = unmountIterator(scope.for$0);
	scope.if$2 = unmountBlock(scope.if$2);
	scope.subComponent$0 = unmountComponent(scope.subComponent$0);
	scope.inj$0 = null;
}