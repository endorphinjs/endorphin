import { addEvent, addPendingClassIf, createComponent, createInjector, get, insert, mountBlock, mountComponent, propsSet, removeEvent, unmountBlock, unmountComponent, updateBlock, updateComponent } from "endorphin";
import * as MyComponent from "./my-component.html";

export function onToggleSelect() {}


function ifBody$1(host, injector, scope) {
	const myComponent$0 = scope.myComponent$0 = insert(injector, createComponent("my-component", MyComponent, host));
	const _p$0 = scope._p$0 = propsSet(myComponent$0);
	_p$0.c.class = "foo";
	_p$0.c.checked = get(host.props.message, "selected");
	_p$0.c["data-l"] = "t,selectMultiple";
	scope.click$0 = addEvent(myComponent$0, "click", onToggleSelect, host, scope);
	addPendingClassIf(_p$0, "shift", (host.props.a > 10));
	mountComponent(myComponent$0, _p$0.c);
	return ifBody$1Update;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Update(host, scope) {
	const { _p$0 } = scope;
	_p$0.c.class = null;
	_p$0.c.class = "foo";
	_p$0.c.checked = get(host.props.message, "selected");
	addPendingClassIf(_p$0, "shift", (host.props.a > 10));
	updateComponent(scope.myComponent$0, _p$0.c);
}

function ifBody$1Unmount(scope) {
	scope.click$0 = removeEvent("click", scope.click$0);
	scope.myComponent$0 = unmountComponent(scope.myComponent$0);
	scope._p$0 = null;
}

function ifEntry$1(host) {
	if ((host.props.c1 && (host.props.c2 || host.props.c3))) {
		return ifBody$1;
	}
}

function ifBody$0(host, injector, scope) {
	scope.if$1 = mountBlock(host, injector, ifEntry$1);
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	updateBlock(scope.if$1);
}

function ifBody$0Unmount(scope) {
	scope.if$1 = unmountBlock(scope.if$1);
}

function ifEntry$0(host) {
	if (host.props.enabled) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
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