import { appendChild, createInjector, elem, insert, mountBlock, obj, setAttribute, text, unmountBlock, updateAttribute, updateBlock } from "endorphin";

function ifBody$0(host, injector) {
	insert(injector, text("aaa"));
}

function ifEntry$0(host) {
	return host.props.cond ? ifBody$0 : null;
}

function e3Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", host.props.bar3);
}

function e4Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", host.props.bar4);
}

function ifBody$1(host, injector) {
	insert(injector, text("aaa"));
}

function ifEntry$1(host) {
	return host.props.cond ? ifBody$1 : null;
}

function e5Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : host.props.bar4));
}

function e6Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : host.props.bar4));
}

function ifBody$2(host, injector) {
	insert(injector, elem("br"));
}

function ifEntry$2(host) {
	return host.props.cond ? ifBody$2 : null;
}

function e7Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : (("a " + host.props.bar4) + " b")));
}

function e8Attrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "foo", (host.props.cond ? host.props.baz : undefined));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = appendChild(target$0, elem("e1"));
	setAttribute(e1$0, "foo", "bar1");
	setAttribute(e1$0, "enabled", "");
	const e2$0 = appendChild(target$0, elem("e2"));
	const inj$0 = createInjector(e2$0);
	setAttribute(e2$0, "foo", "bar2");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const e3$0 = scope.e3$0 = appendChild(target$0, elem("e3"));
	const attrSet$0 = scope.attrSet$0 = obj();
	e3Attrs$0(e3$0, attrSet$0, host);
	const e4$0 = scope.e4$0 = appendChild(target$0, elem("e4"));
	const inj$1 = createInjector(e4$0);
	const attrSet$1 = scope.attrSet$1 = obj();
	e4Attrs$0(e4$0, attrSet$1, host);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	const e5$0 = scope.e5$0 = appendChild(target$0, elem("e5"));
	const attrSet$2 = scope.attrSet$2 = obj();
	e5Attrs$0(e5$0, attrSet$2, host);
	const e6$0 = scope.e6$0 = appendChild(target$0, elem("e6"));
	const inj$2 = createInjector(e6$0);
	const attrSet$3 = scope.attrSet$3 = obj();
	e6Attrs$0(e6$0, attrSet$3, host);
	scope.if$2 = mountBlock(host, inj$2, ifEntry$2);
	const e7$0 = scope.e7$0 = appendChild(target$0, elem("e7"));
	const attrSet$4 = scope.attrSet$4 = obj();
	e7Attrs$0(e7$0, attrSet$4, host);
	const e8$0 = scope.e8$0 = appendChild(target$0, elem("e8"));
	const attrSet$5 = scope.attrSet$5 = obj();
	e8Attrs$0(e8$0, attrSet$5, host);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	e3Attrs$0(scope.e3$0, scope.attrSet$0, host);
	e4Attrs$0(scope.e4$0, scope.attrSet$1, host);
	updateBlock(scope.if$1);
	e5Attrs$0(scope.e5$0, scope.attrSet$2, host);
	e6Attrs$0(scope.e6$0, scope.attrSet$3, host);
	updateBlock(scope.if$2);
	e7Attrs$0(scope.e7$0, scope.attrSet$4, host);
	e8Attrs$0(scope.e8$0, scope.attrSet$5, host);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.if$2 = unmountBlock(scope.if$2);
}