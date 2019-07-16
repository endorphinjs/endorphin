import { addPendingClass, addPendingClassIf, createComponent, createInjector, get, insert, mountComponent, mountIterator, propsSet, unmountComponent, unmountIterator, updateComponent, updateIterator } from "endorphin";
import * as MyComponent from "./my-component.html";

function forSelect$0(host) {
	return host.state.items;
}

function ifAttr$0(host, scope) {
	if (get(scope.value, "animation", "type")) {
		addPendingClass(scope._p$0, "animate-" + get(scope.value, "animation", "type"));
	}
}

function forContent$0(host, injector, scope) {
	const myComponent$0 = scope.myComponent$0 = insert(injector, createComponent("my-component", MyComponent, host));
	const _p$0 = scope._p$0 = propsSet(myComponent$0);
	addPendingClassIf(_p$0, "reordered", get(scope.value, "reordered"));
	ifAttr$0(host, scope);
	mountComponent(myComponent$0, _p$0.c);
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	const { _p$0 } = scope;
	_p$0.c.class = null;
	addPendingClassIf(_p$0, "reordered", get(scope.value, "reordered"));
	ifAttr$0(host, scope);
	updateComponent(scope.myComponent$0, _p$0.c);
}

function forContent$0Unmount(scope) {
	scope.myComponent$0 = unmountComponent(scope.myComponent$0);
	scope._p$0 = null;
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