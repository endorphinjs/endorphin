import { animate, appendChild, createComponent, createInjector, domRemove, elem, elemWithText, insert, mountBlock, mountComponent, stopAnimation, unmountBlock, unmountComponent, updateBlock } from "endorphin";
import * as MyComponent from "my-component.html";

function animatedSection$0(host, injector, scope) {
	scope.section$0 = insert(injector, elem("section"));
}

function animatedSection$0Unmount(scope) {
	scope.section$0 = domRemove(scope.section$0);
}

function ifBody$0(host, injector, scope) {
	!scope.section$0 && animatedSection$0(host, injector, scope);
	stopAnimation(scope.section$0, true);
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope, host) {
	animate(scope.section$0, "hide", () => animatedSection$0Unmount(scope, host));
}

function ifEntry$0(host) {
	if (host.state.cond) {
		return ifBody$0;
	}
}

function animatedMyComponent$0(host, injector, scope) {
	const myComponent$0 = scope.myComponent$0 = insert(injector, createComponent("my-component", MyComponent, host));
	mountComponent(myComponent$0);
}

function animatedMyComponent$0Unmount(scope) {
	const { myComponent$0 } = scope;
	scope.myComponent$0 = unmountComponent(myComponent$0);
	domRemove(myComponent$0);
}

function ifBody$1(host, injector, scope) {
	!scope.myComponent$0 && animatedMyComponent$0(host, injector, scope);
	stopAnimation(scope.myComponent$0, true);
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Unmount(scope, host) {
	animate(scope.myComponent$0, "hide", () => animatedMyComponent$0Unmount(scope, host));
}

function ifEntry$1(host) {
	if (host.state.cond) {
		return ifBody$1;
	}
}

function animatedSection$1(host, injector, scope) {
	const section$1 = scope.section$1 = insert(injector, elem("section"));
	appendChild(section$1, elemWithText("p", "Inner 2"));
}

function animatedSection$1Unmount(scope) {
	scope.section$1 = domRemove(scope.section$1);
}

function ifBody$2(host, injector, scope) {
	!scope.section$1 && animatedSection$1(host, injector, scope);
	stopAnimation(scope.section$1, true);
}

ifBody$2.dispose = ifBody$2Unmount;

function ifBody$2Unmount(scope, host) {
	animate(scope.section$1, "hide", () => animatedSection$1Unmount(scope, host));
}

function ifEntry$2(host) {
	if (host.state.cond) {
		return ifBody$2;
	}
}

function animatedMyComponent$1(host, injector, scope) {
	const myComponent$1 = scope.myComponent$1 = insert(injector, createComponent("my-component", MyComponent, host));
	const inj$1 = myComponent$1.componentModel.input;
	insert(inj$1, elemWithText("p", "Inner 3"), "");
	mountComponent(myComponent$1);
}

function animatedMyComponent$1Unmount(scope) {
	const { myComponent$1 } = scope;
	scope.myComponent$1 = unmountComponent(myComponent$1);
	domRemove(myComponent$1);
}

function ifBody$3(host, injector, scope) {
	!scope.myComponent$1 && animatedMyComponent$1(host, injector, scope);
	stopAnimation(scope.myComponent$1, true);
}

ifBody$3.dispose = ifBody$3Unmount;

function ifBody$3Unmount(scope, host) {
	animate(scope.myComponent$1, "hide", () => animatedMyComponent$1Unmount(scope, host));
}

function ifEntry$3(host) {
	if (host.state.cond) {
		return ifBody$3;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	insert(inj$0, elem("div"));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	insert(inj$0, elemWithText("span", "static"));
	const div$1 = insert(inj$0, elem("div"));
	appendChild(div$1, elemWithText("p", "Inner 1"));
	scope.if$2 = mountBlock(host, inj$0, ifEntry$2);
	scope.if$3 = mountBlock(host, inj$0, ifEntry$3);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateBlock(scope.if$1);
	updateBlock(scope.if$2);
	updateBlock(scope.if$3);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.if$2 = unmountBlock(scope.if$2);
	scope.if$3 = unmountBlock(scope.if$3);
}