import { appendChild, createComponent, elem, insert, mountBlock, mountComponent, propsSet, text, unmountBlock, unmountComponent, updateBlock, updateComponent, updateIncomingSlot } from "endorphin";
import * as E1 from "./attrs.html";

function ifBody$0(host, injector, scope) {
	insert(injector, text("aaa"));
	scope.su$0 = 1;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope) {
	scope.su$0 = 1;
}

function ifEntry$0(host) {
	if (host.props.cond) {
		return ifBody$0;
	}
}

function ifBody$1(host, injector, scope) {
	insert(injector, text("aaa"));
	scope.su$1 = 1;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Unmount(scope) {
	scope.su$1 = 1;
}

function ifEntry$1(host) {
	if (host.props.cond) {
		return ifBody$1;
	}
}

function ifAttr$0(host, scope) {
	if (host.props.cond) {
		scope._p$4.c.foo = host.props.baz;
	}
}

function ifBody$2(host, injector, scope) {
	scope._p$5.c.foo = host.props.baz;
	insert(injector, elem("br"), "");
	scope.su$2 = 1;
	return ifBody$2Update;
}

ifBody$2.dispose = ifBody$2Unmount;

function ifBody$2Update(host, scope) {
	scope._p$5.c.foo = host.props.baz;
}

function ifBody$2Unmount(scope) {
	scope.su$2 = 1;
}

function ifEntry$2(host) {
	if (host.props.cond) {
		return ifBody$2;
	}
}

function attrValue$0(host) {
	return "a " + (host.props.bar4) + " b";
}

function ifAttr$1(host, scope) {
	if (host.props.cond) {
		scope._p$6.c.foo = host.props.baz;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = scope.e1$0 = appendChild(target$0, createComponent("e1", E1, host));
	const _p$0 = propsSet(e1$0);
	_p$0.c.foo = "bar1";
	mountComponent(e1$0, _p$0.c);
	const e1$1 = scope.e1$1 = appendChild(target$0, createComponent("e1", E1, host));
	const inj$0 = e1$1.componentModel.input;
	const _p$1 = propsSet(e1$1);
	_p$1.c.foo = "bar2";
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	mountComponent(e1$1, _p$1.c);
	const e1$2 = scope.e1$2 = appendChild(target$0, createComponent("e1", E1, host));
	const _p$2 = scope._p$2 = propsSet(e1$2);
	_p$2.c.foo = host.props.bar3;
	mountComponent(e1$2, _p$2.c);
	const e1$3 = scope.e1$3 = appendChild(target$0, createComponent("e1", E1, host));
	const inj$1 = e1$3.componentModel.input;
	const _p$3 = scope._p$3 = propsSet(e1$3);
	_p$3.c.foo = host.props.bar4;
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	mountComponent(e1$3, _p$3.c);
	const e1$4 = scope.e1$4 = appendChild(target$0, createComponent("e1", E1, host));
	const _p$4 = scope._p$4 = propsSet(e1$4);
	_p$4.c.foo = host.props.bar4;
	ifAttr$0(host, scope);
	mountComponent(e1$4, _p$4.c);
	const e1$5 = scope.e1$5 = appendChild(target$0, createComponent("e1", E1, host));
	const inj$2 = e1$5.componentModel.input;
	const _p$5 = scope._p$5 = propsSet(e1$5);
	_p$5.c.foo = host.props.bar4;
	scope.if$3 = mountBlock(host, inj$2, ifEntry$2);
	mountComponent(e1$5, _p$5.c);
	const e1$6 = scope.e1$6 = appendChild(target$0, createComponent("e1", E1, host));
	const _p$6 = scope._p$6 = propsSet(e1$6);
	_p$6.c.foo = attrValue$0(host, scope);
	ifAttr$1(host, scope);
	mountComponent(e1$6, _p$6.c);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _p$2, e1$3, _p$3, _p$4, e1$5, _p$5, _p$6 } = scope;
	scope.su$0 = scope.su$1 = scope.su$2 = 0;
	updateBlock(scope.if$0);
	updateIncomingSlot(scope.e1$1, "", scope.su$0);
	_p$2.c.foo = host.props.bar3;
	updateComponent(scope.e1$2, _p$2.c);
	_p$3.c.foo = host.props.bar4;
	updateBlock(scope.if$1);
	updateIncomingSlot(e1$3, "", scope.su$1);
	updateComponent(e1$3, _p$3.c);
	_p$4.c.foo = host.props.bar4;
	ifAttr$0(host, scope);
	updateComponent(scope.e1$4, _p$4.c);
	_p$5.c.foo = host.props.bar4;
	updateBlock(scope.if$3);
	updateIncomingSlot(e1$5, "", scope.su$2);
	updateComponent(e1$5, _p$5.c);
	_p$6.c.foo = attrValue$0(host, scope);
	ifAttr$1(host, scope);
	updateComponent(scope.e1$6, _p$6.c);
}

function template$0Unmount(scope) {
	scope.e1$0 = unmountComponent(scope.e1$0);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.e1$1 = unmountComponent(scope.e1$1);
	scope.e1$2 = unmountComponent(scope.e1$2);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.e1$3 = unmountComponent(scope.e1$3);
	scope.e1$4 = unmountComponent(scope.e1$4);
	scope.if$3 = unmountBlock(scope.if$3);
	scope.e1$5 = unmountComponent(scope.e1$5);
	scope.e1$6 = unmountComponent(scope.e1$6);
	scope._p$2 = scope._p$3 = scope._p$4 = scope._p$5 = scope._p$6 = null;
}