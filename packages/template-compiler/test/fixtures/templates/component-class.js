import { createComponent, createInjector, get, insert, mountComponent, mountIterator, propsSet, unmountComponent, unmountIterator, updateClass, updateComponent, updateIterator } from "endorphin";
import * as MyComponent from "./my-component.html";
let __ifExpr;

function forSelect$0(host) {
	return host.state.items;
}

function setVars$0(host, scope) {
	__ifExpr = get(scope.value, "animation", "type");
}

function myComponentAttrs$0(elem, prev, host, scope) {
	updateClass(elem, prev, ((__ifExpr ? ("animate-" + get(scope.value, "animation", "type")) : "")) + ((get(scope.value, "reordered") ? " reordered" : "")));
}

function forContent$0(host, injector, scope) {
	setVars$0(host, scope);
	const myComponent$0 = scope.myComponent$0 = insert(injector, createComponent("my-component", MyComponent, host));
	const propSet$0 = scope.propSet$0 = propsSet(myComponent$0);
	myComponentAttrs$0(myComponent$0, propSet$0, host, scope);
	mountComponent(myComponent$0, propSet$0);
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	const { myComponent$0, propSet$0 } = scope;
	setVars$0(host, scope);
	myComponentAttrs$0(myComponent$0, propSet$0, host, scope);
	updateComponent(myComponent$0, propSet$0);
}

function forContent$0Unmount(scope) {
	scope.myComponent$0 = unmountComponent(scope.myComponent$0);
	scope.propSet$0 = null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateIterator(scope.for$0);
}

function template$0Unmount(scope) {
	scope.for$0 = unmountIterator(scope.for$0);
}