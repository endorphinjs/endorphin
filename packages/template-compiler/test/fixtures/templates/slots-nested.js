import { createComponent, elem, insert, addDisposeCallback, mountBlock, updateBlock, unmountBlock, mountComponent, unmountComponent, createInjector, updateIncomingSlot, updateComponent } from "endorphin";
import * as MyComponent1 from "./my-component1.html";
import * as MyComponent2 from "./my-component2.html";
import * as InnerComponent from "./inner-component.html";

function ifBody$0(host, injector, scope) {
	insert(injector, elem("header"), "");
	scope.su$0 = 1;
	addDisposeCallback(injector, ifBody$0Unmount);
}

function ifBody$0Unmount(scope) {
	scope.su$0 = 1;
}

function ifEntry$0(host) {
	if (host.props.enabled) {
		return ifBody$0;
	}
}

function ifBody$1(host, injector, scope) {
	insert(injector, elem("blockquote"));
	scope.su$1 = 1;
	addDisposeCallback(injector, ifBody$1Unmount);
}

function ifBody$1Unmount(scope) {
	scope.su$1 = 1;
}

function ifEntry$1(host) {
	if (host.props.enabled) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComponent1$0 = scope.myComponent1$0 = target$0.appendChild(createComponent("my-component1", MyComponent1, host));
	const inj$0 = myComponent1$0.componentModel.input;
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const myComponent2$0 = scope.myComponent2$0 = insert(inj$0, createComponent("my-component2", MyComponent2, host), "header");
	const inj$1 = myComponent2$0.componentModel.input;
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$1, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$0);
	mountComponent(myComponent2$0, {
		slot: "header"
	});
	const div$0 = insert(inj$0, elem("div"), "footer");
	const inj$2 = createInjector(div$0);
	div$0.setAttribute("slot", "footer");
	scope.if$1 = mountBlock(host, inj$2, ifEntry$1);
	mountComponent(myComponent1$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	const { myComponent1$0 } = scope;
	scope.su$0 = scope.su$1 = 0;
	updateBlock(scope.if$0);
	updateBlock(scope.if$1);
	updateIncomingSlot(myComponent1$0, "", scope.su$0);
	updateIncomingSlot(myComponent1$0, "footer", scope.su$1);
	updateComponent(myComponent1$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.myComponent2$0 = unmountComponent(scope.myComponent2$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.myComponent1$0 = unmountComponent(scope.myComponent1$0);
}