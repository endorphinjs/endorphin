import { elemWithText, createInjector, createComponent, mountComponent, unmountComponent, insert, animate, domRemove, mountBlock, updateBlock, unmountBlock } from "endorphin";
import * as InnerComponent from "./inner-component.html";
import * as OuterComponent from "./outer-component.html";

function animateOut$0(scope) {
	const _ref = scope.outerComponent$0;
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.outerComponent$0 = unmountComponent(scope.outerComponent$0);
	domRemove(_ref);
}

function ifBody$0(host, injector, scope) {
	const outerComponent$0 = scope.outerComponent$0 = insert(injector, createComponent("outer-component", OuterComponent, host));
	const inj$1 = outerComponent$0.componentModel.input;
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$1, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$0);
	mountComponent(outerComponent$0);
	animate(outerComponent$0, host.componentModel.definition.expand(outerComponent$0));
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope, host) {
	animate(scope.outerComponent$0, host.componentModel.definition.collapse(scope.outerComponent$0, { duration: host.state.duration }), () => animateOut$0(scope, host));
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
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
}