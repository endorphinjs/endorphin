import { elemWithText, createInjector, setAttribute, elem, text, insert, mountBlock, updateBlock, unmountBlock, mountInnerHTML, updateInnerHTML, unmountInnerHTML, mountPartial, updatePartial, unmountPartial, mountIterator, updateIterator, unmountIterator, createComponent, mountComponent, unmountComponent, finalizeAttributes, finalizeEvents, animate, domRemove, finalizeRefs } from "endorphin";
import * as InnerComponent from "./inner-component.html";
import * as OuterComponent from "./outer-component.html";

export const partials = {
	test: {
		body: partialTest$0,
		defaults: {}
	}
};

function attrValue$0(host) {
	return "left: " + (host.props.left) + "px";
}

function attrValue$1(host) {
	return "left: " + (host.props.left) + "px";
}

function ifBody$1(host, injector) {
	insert(injector, text("\n            bar\n        "));
}

function ifEntry$1(host) {
	if (host.props.foo) {
		return ifBody$1;
	}
}

function html$0(host) {
	return host.props.html;
}

function forSelect$0(host) {
	return host.props.items;
}

function forContent$0(host, injector, scope) {
	scope.partial$0 = mountPartial(host, injector, host.props['partial:test'] || partials.test, {});
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, injector, scope) {
	updatePartial(scope.partial$0, host.props['partial:test'] || partials.test, {});
}

function forContent$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

function animateOut$0(scope) {
	domRemove(scope.div$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.html$0 = unmountInnerHTML(scope.html$0);
	scope.for$0 = unmountIterator(scope.for$0);
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
}

function ifBody$0(host, injector, scope) {
	const div$0 = scope.div$0 = insert(injector, elem("div"));
	const inj$1 = scope.inj$1 = createInjector(div$0);
	setAttribute(inj$1, "class", "overlay");
	setAttribute(inj$1, "style", attrValue$0(host, scope));
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	scope.html$0 = mountInnerHTML(host, inj$1, html$0);
	scope.for$0 = mountIterator(host, inj$1, forSelect$0, forContent$0);
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$1, createComponent("inner-component", InnerComponent, host));
	mountComponent(innerComponent$0);
	finalizeAttributes(inj$1);
	finalizeEvents(inj$1);
	animate(div$0, "show");
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, injector, scope) {
	const { inj$1 } = scope;
	setAttribute(inj$1, "class", "overlay");
	setAttribute(inj$1, "style", attrValue$1(host, scope));
	updateBlock(scope.if$1);
	updateInnerHTML(scope.html$0);
	updateIterator(scope.for$0);
	finalizeAttributes(inj$1);
	finalizeEvents(inj$1);
}

function ifBody$0Unmount(scope, host) {
	animate(scope.div$0, "hide", () => animateOut$0(scope, host));
	scope.inj$1 = null;
}

function ifEntry$0(host) {
	if (host.props.enabled) {
		return ifBody$0;
	}
}

function animateOut$1(scope) {
	domRemove(scope.outerComponent$0);
	scope.innerComponent$1 = unmountComponent(scope.innerComponent$1);
	scope.outerComponent$0 = unmountComponent(scope.outerComponent$0);
}

function ifBody$2(host, injector, scope) {
	const outerComponent$0 = scope.outerComponent$0 = insert(injector, createComponent("outer-component", OuterComponent, host));
	const inj$2 = outerComponent$0.componentModel.input;
	const innerComponent$1 = scope.innerComponent$1 = insert(inj$2, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$1);
	mountComponent(outerComponent$0);
}

ifBody$2.dispose = ifBody$2Unmount;

function ifBody$2Unmount(scope, host) {
	animate(scope.outerComponent$0, "fade-out", () => animateOut$1(scope, host));
}

function ifEntry$2(host) {
	if (host.props.enabled) {
		return ifBody$2;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	insert(inj$0, elemWithText("p", "test"));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$2 = mountBlock(host, inj$0, ifEntry$2);
	finalizeRefs(host);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateBlock(scope.if$2);
	finalizeRefs(host);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$2 = unmountBlock(scope.if$2);
}

function partialTest$0(host, injector) {
	insert(injector, elemWithText("p", "partial"));
}