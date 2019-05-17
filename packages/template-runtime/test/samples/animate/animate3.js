import { elemWithText, addStaticEvent, removeStaticEvent, createInjector, elem, createComponent, text, insert, mountComponent, updateComponent, unmountComponent, animateIn, animateOut, addDisposeCallback, mountBlock, updateBlock, unmountBlock } from "../../../dist/runtime.es.js";
import * as SubComponent from "./sub-component.js";

export function state() {
	return {
		outer: false,
		inner: false
	}
}


function onClick$0(evt) {
	this.host.setState({ outer: !this.host.state.outer });
}

function onClick$1(evt) {
	this.host.setState({ inner: !this.host.state.inner });
}

function animateOut$0(scope) {
	scope.subComponent$1 = unmountComponent(scope.subComponent$1);
}

function ifBody$1(host, injector, scope) {
	const div$1 = scope.div$1 = insert(injector, elem("div"));
	div$1.setAttribute("class", "block");
	const subComponent$1 = scope.subComponent$1 = div$1.appendChild(createComponent("sub-component", SubComponent, host));
	const inj$3 = subComponent$1.componentModel.input;
	insert(inj$3, text("Inner block"), "");
	mountComponent(subComponent$1, {
		a: 2
	});
	animateIn(div$1, "show 1s ease-out");
	addDisposeCallback(injector, ifBody$1Unmount);
	return ifBody$1Update;
}

function ifBody$1Update(host, injector, scope) {
	updateComponent(scope.subComponent$1);
}

function ifBody$1Unmount(scope) {
	animateOut(scope.div$1, "hide 0.5s ease-in", scope, animateOut$0);
}

function ifEntry$1(host) {
	if (host.state.inner) {
		return ifBody$1;
	}
}

function animateOut$1(scope) {
	scope.subComponent$0 = unmountComponent(scope.subComponent$0);
	scope.if$1 = unmountBlock(scope.if$1);
}

function ifBody$0(host, injector, scope) {
	const div$0 = scope.div$0 = insert(injector, elem("div"));
	const inj$2 = createInjector(div$0);
	div$0.setAttribute("class", "block");
	const subComponent$0 = scope.subComponent$0 = insert(inj$2, createComponent("sub-component", SubComponent, host));
	const inj$1 = subComponent$0.componentModel.input;
	insert(inj$1, text("Outer block"), "");
	mountComponent(subComponent$0, {
		a: 1
	});
	scope.if$1 = mountBlock(host, inj$2, ifEntry$1);
	animateIn(div$0, "show 1s ease-out");
	addDisposeCallback(injector, ifBody$0Unmount);
	return ifBody$0Update;
}

function ifBody$0Update(host, injector, scope) {
	updateComponent(scope.subComponent$0);
	updateBlock(scope.if$1);
}

function ifBody$0Unmount(scope) {
	animateOut(scope.div$0, "hide 0.5s ease-in", scope, animateOut$1);
}

function ifEntry$0(host) {
	if (host.state.outer) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	insert(inj$0, elemWithText("h1", "Nested animation sample"));
	const button$0 = insert(inj$0, elemWithText("button", "Toggle outer"));
	scope.click$0 = addStaticEvent(button$0, "click", onClick$0, host, scope);
	const button$1 = insert(inj$0, elemWithText("button", "Toggle inner"));
	scope.click$1 = addStaticEvent(button$1, "click", onClick$1, host, scope);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.click$0 = removeStaticEvent(scope.click$0);
	scope.click$1 = removeStaticEvent(scope.click$1);
	scope.if$0 = unmountBlock(scope.if$0);
}

