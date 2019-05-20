import { elemWithText, createInjector, createComponent, mountComponent, updateComponent, unmountComponent, insert, markSlotUpdate, animateIn, call, animateOut, addDisposeCallback, mountBlock, updateBlock, unmountBlock } from "endorphin";
import * as InnerComponent from "./inner-component.html";
import * as OuterComponent from "./outer-component.html";

function animateOut$0(scope) {
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.outerComponent$0 = unmountComponent(scope.outerComponent$0);
}

function ifBody$0(host, injector, scope) {
	const outerComponent$0 = scope.outerComponent$0 = insert(injector, createComponent("outer-component", OuterComponent, host));
	const inj$1 = outerComponent$0.componentModel.input;
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$1, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$0);
	mountComponent(outerComponent$0);
	animateIn(outerComponent$0, host.componentModel.definition.expand);
	addDisposeCallback(injector, ifBody$0Unmount);
	return ifBody$0Update;
}

function ifBody$0Update(host, injector, scope) {
	let su$0 = 0;
	const { outerComponent$0 } = scope;
	su$0 |= updateComponent(scope.innerComponent$0);
	markSlotUpdate(outerComponent$0, "", su$0);
	updateComponent(outerComponent$0);
	return su$0;
}

function ifBody$0Unmount(scope, host) {
	animateOut(scope.outerComponent$0, (elem, dir, callback) => call(host.componentModel.definition, "collapse", [elem, dir, callback, { duration: host.state.duration }]), scope, animateOut$0);
}

function ifEntry$0(host) {
	if (host.props.enabled) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	insert(inj$0, elemWithText("p", "test"));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
}