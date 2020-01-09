import { animate, clearBlock, createComponent, createInjector, domRemove, elemWithText, insert, mountBlock, mountComponent, unmountComponent, updateBlock } from "endorphin";
import * as InnerComponent from "./inner-component.html";
import * as OuterComponent from "./outer-component.html";

export function collapse() {};
export function expand() {};


function animatedOuterComponent$0(host, injector, scope) {
	const outerComponent$0 = scope.outerComponent$0 = insert(injector, createComponent("outer-component", OuterComponent, host));
	const inj$0 = outerComponent$0.componentModel.input;
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$0, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$0);
	mountComponent(outerComponent$0);
}

function animatedOuterComponent$0Unmount(scope) {
	const { outerComponent$0 } = scope;
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.outerComponent$0 = unmountComponent(outerComponent$0);
	domRemove(outerComponent$0);
}

function ifBody$0(host, injector, scope) {
	!scope.outerComponent$0 && animatedOuterComponent$0(host, injector, scope);
	animate(scope.outerComponent$0, expand(scope.outerComponent$0));
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope, host) {
	const { outerComponent$0 } = scope;
	animate(outerComponent$0, collapse(outerComponent$0, { duration: host.state.duration }), () => animatedOuterComponent$0Unmount(scope, host));
}

function ifEntry$0(host) {
	return host.props.enabled ? ifBody$0 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$1 = createInjector(target$0);
	insert(inj$1, elemWithText("p", "test"));
	scope.if$0 = mountBlock(host, inj$1, ifEntry$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.if$0 = clearBlock(scope.if$0);
}