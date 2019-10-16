import { appendChild, createComponent, elem, insert, mountBlock, mountComponent, obj, text, unmountBlock, unmountComponent, updateAttribute, updateBlock, updateComponent, updateIncomingSlot } from "endorphin";
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

function e1Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", host.props.bar3);
}

function e1Attrs$1(elem, prev, host) {
	updateAttribute(elem, prev, "foo", host.props.bar4);
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

function e1Attrs$2(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : host.props.bar4));
}

function e1Attrs$3(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : host.props.bar4));
}

function ifBody$2(host, injector, scope) {
	insert(injector, elem("br"), "");
	scope.su$2 = 1;
}

ifBody$2.dispose = ifBody$2Unmount;

function ifBody$2Unmount(scope) {
	scope.su$2 = 1;
}

function ifEntry$2(host) {
	if (host.props.cond) {
		return ifBody$2;
	}
}

function e1Attrs$4(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : (("a " + host.props.bar4) + " b")));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = scope.e1$0 = appendChild(target$0, createComponent("e1", E1, host));
	const attrSet$0 = obj();
	attrSet$0.foo = "bar1";
	mountComponent(e1$0, attrSet$0);
	const e1$1 = scope.e1$1 = appendChild(target$0, createComponent("e1", E1, host));
	const inj$0 = e1$1.componentModel.input;
	const attrSet$1 = obj();
	attrSet$1.foo = "bar2";
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	mountComponent(e1$1, attrSet$1);
	const e1$2 = scope.e1$2 = appendChild(target$0, createComponent("e1", E1, host));
	const attrSet$2 = scope.attrSet$2 = obj();
	e1Attrs$0(e1$2, attrSet$2, host);
	mountComponent(e1$2, attrSet$2);
	const e1$3 = scope.e1$3 = appendChild(target$0, createComponent("e1", E1, host));
	const inj$1 = e1$3.componentModel.input;
	const attrSet$3 = scope.attrSet$3 = obj();
	e1Attrs$1(e1$3, attrSet$3, host);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	mountComponent(e1$3, attrSet$3);
	const e1$4 = scope.e1$4 = appendChild(target$0, createComponent("e1", E1, host));
	const attrSet$4 = scope.attrSet$4 = obj();
	e1Attrs$2(e1$4, attrSet$4, host);
	mountComponent(e1$4, attrSet$4);
	const e1$5 = scope.e1$5 = appendChild(target$0, createComponent("e1", E1, host));
	const inj$2 = e1$5.componentModel.input;
	const attrSet$5 = scope.attrSet$5 = obj();
	e1Attrs$3(e1$5, attrSet$5, host);
	scope.if$2 = mountBlock(host, inj$2, ifEntry$2);
	mountComponent(e1$5, attrSet$5);
	const e1$6 = scope.e1$6 = appendChild(target$0, createComponent("e1", E1, host));
	const attrSet$6 = scope.attrSet$6 = obj();
	e1Attrs$4(e1$6, attrSet$6, host);
	mountComponent(e1$6, attrSet$6);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { e1$2, attrSet$2, e1$3, attrSet$3, e1$4, attrSet$4, e1$5, attrSet$5, e1$6, attrSet$6 } = scope;
	scope.su$0 = scope.su$1 = scope.su$2 = 0;
	updateBlock(scope.if$0);
	updateIncomingSlot(scope.e1$1, "", scope.su$0);
	e1Attrs$0(e1$2, attrSet$2, host);
	updateComponent(e1$2, attrSet$2);
	e1Attrs$1(e1$3, attrSet$3, host);
	updateBlock(scope.if$1);
	updateIncomingSlot(e1$3, "", scope.su$1);
	updateComponent(e1$3, attrSet$3);
	e1Attrs$2(e1$4, attrSet$4, host);
	updateComponent(e1$4, attrSet$4);
	e1Attrs$3(e1$5, attrSet$5, host);
	updateBlock(scope.if$2);
	updateIncomingSlot(e1$5, "", scope.su$2);
	updateComponent(e1$5, attrSet$5);
	e1Attrs$4(e1$6, attrSet$6, host);
	updateComponent(e1$6, attrSet$6);
}

function template$0Unmount(scope) {
	scope.e1$0 = unmountComponent(scope.e1$0);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.e1$1 = unmountComponent(scope.e1$1);
	scope.e1$2 = unmountComponent(scope.e1$2);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.e1$3 = unmountComponent(scope.e1$3);
	scope.e1$4 = unmountComponent(scope.e1$4);
	scope.if$2 = unmountBlock(scope.if$2);
	scope.e1$5 = unmountComponent(scope.e1$5);
	scope.e1$6 = unmountComponent(scope.e1$6);
}