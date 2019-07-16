import { animate, attributeSet, createComponent, createInjector, detachPendingEvents, domRemove, elem, elemWithText, finalizeAttributes, finalizeAttributesNS, finalizePendingEvents, finalizePendingRefs, getPartial, insert, mountBlock, mountComponent, mountInnerHTML, mountIterator, mountPartial, obj, pendingEvents, stopAnimation, text, unmountBlock, unmountComponent, unmountInnerHTML, unmountIterator, unmountPartial, updateBlock, updateInnerHTML, updateIterator, updatePartial } from "endorphin";
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
	scope.partial$0 = mountPartial(host, injector, getPartial(host, "test", partials), {
		$$_attrs: scope._a$0,
		$$_events: scope._e$0
	});
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	updatePartial(scope.partial$0, getPartial(host, "test", partials), {});
}

function forContent$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

function animatedDiv$0(host, injector, scope) {
	const div$0 = scope.div$0 = insert(injector, elem("div"));
	const inj$1 = createInjector(div$0);
	const _a$0 = scope._a$0 = attributeSet();
	const _e$0 = scope._e$0 = pendingEvents(host, div$0);
	_a$0.c.class = "overlay";
	_a$0.c.style = attrValue$0(host, scope);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	scope.html$0 = mountInnerHTML(host, inj$1, html$0);
	scope.for$0 = mountIterator(host, inj$1, forSelect$0, forContent$0);
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$1, createComponent("inner-component", InnerComponent, host));
	mountComponent(innerComponent$0);
	finalizePendingEvents(_e$0);
	finalizeAttributes(div$0, _a$0) | finalizeAttributesNS(div$0, _a$0);
}

function animatedDiv$0Update(host, scope) {
	const { _a$0, div$0 } = scope;
	_a$0.c.class = "overlay";
	_a$0.c.style = attrValue$0(host, scope);
	updateBlock(scope.if$1);
	updateInnerHTML(scope.html$0);
	updateIterator(scope.for$0);
	finalizePendingEvents(scope._e$0);
	finalizeAttributes(div$0, _a$0) | finalizeAttributesNS(div$0, _a$0);
}

function animatedDiv$0Unmount(scope) {
	scope._e$0 = detachPendingEvents(scope._e$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.html$0 = unmountInnerHTML(scope.html$0);
	scope.for$0 = unmountIterator(scope.for$0);
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.div$0 = domRemove(scope.div$0);
	scope._a$0 = null;
}

function ifBody$0(host, injector, scope) {
	scope.div$0 ? animatedDiv$0Update(host, scope) : animatedDiv$0(host, injector, scope);
	animate(scope.div$0, "show");
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	animatedDiv$0Update(host, scope);
}

function ifBody$0Unmount(scope, host) {
	animate(scope.div$0, "hide", () => animatedDiv$0Unmount(scope, host));
}

function ifEntry$0(host) {
	if (host.props.enabled) {
		return ifBody$0;
	}
}

function animatedOuterComponent$0(host, injector, scope) {
	const outerComponent$0 = scope.outerComponent$0 = insert(injector, createComponent("outer-component", OuterComponent, host));
	const inj$2 = outerComponent$0.componentModel.input;
	const innerComponent$1 = scope.innerComponent$1 = insert(inj$2, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$1);
	mountComponent(outerComponent$0);
}

function animatedOuterComponent$0Unmount(scope) {
	const { outerComponent$0 } = scope;
	scope.innerComponent$1 = unmountComponent(scope.innerComponent$1);
	scope.outerComponent$0 = unmountComponent(outerComponent$0);
	domRemove(outerComponent$0);
}

function ifBody$2(host, injector, scope) {
	!scope.outerComponent$0 && animatedOuterComponent$0(host, injector, scope);
	stopAnimation(scope.outerComponent$0, true);
}

ifBody$2.dispose = ifBody$2Unmount;

function ifBody$2Unmount(scope, host) {
	animate(scope.outerComponent$0, "fade-out", () => animatedOuterComponent$0Unmount(scope, host));
}

function ifEntry$2(host) {
	if (host.props.enabled) {
		return ifBody$2;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	const refs$0 = scope.refs$0 = obj();
	insert(inj$0, elemWithText("p", "test"));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$2 = mountBlock(host, inj$0, ifEntry$2);
	finalizePendingRefs(host, refs$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateBlock(scope.if$2);
	finalizePendingRefs(host, scope.refs$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$2 = unmountBlock(scope.if$2);
	scope.refs$0 = null;
}

function partialTest$0(host, injector) {
	insert(injector, elemWithText("p", "partial"));
}