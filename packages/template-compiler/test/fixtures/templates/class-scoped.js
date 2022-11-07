import { appendChild, createInjector, elem, insert, mountBlock, obj, unmountBlock, updateBlock, updateClass } from "endorphin";
export const cssScope = "ecls";

function setVars$0(host, scope) {
	scope.ifExpr = (host.props.cond2 && host.props.cond2);
}

function e1Attrs$0(elem, prev, host) {
	updateClass(elem, prev, ((host.props.enabled ? "foo_ecls" : "")) + " bar_ecls");
}

function e2Attrs$0(elem, prev, host) {
	updateClass(elem, prev, "foo_ecls" + ((host.props.cond ? " bar_ecls" : "")));
}

function e3Attrs$0(elem, prev, host) {
	updateClass(elem, prev, ((host.props.cond2 ? "override_ecls" : "test_ecls")) + " foo_ecls");
}

function e4Attrs$0(elem, prev, host, scope) {
	updateClass(elem, prev, ((scope.ifExpr ? "override_ecls" : "test_ecls")) + (((host.props.cond1 && host.props.foo) ? " foo_ecls" : "")) + ((host.props.cond1 ? " bar_ecls" : "")));
}

function ifBody$0(host, injector) {
	insert(injector, elem("img", cssScope));
}

function ifEntry$0(host) {
	return host.props.cond1 ? ifBody$0 : null;
}

function ifBody$1(host, injector) {
	insert(injector, elem("br", cssScope));
}

function ifEntry$1(host) {
	return host.props.cond2 ? ifBody$1 : null;
}

function e5Attrs$0(elem, prev, host) {
	updateClass(elem, prev, "foo_ecls" + ((" foo_ecls " + host.props.bar)) + " bar_ecls");
}

function e6Attrs$0(elem, prev, host) {
	updateClass(elem, prev, "bubble_ecls __x-" + (host.state.xAxis) + " __y-" + (host.state.yAxis) + " " + ((host.state.active ? "__active" : "")));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const e1$0 = scope.e1$0 = appendChild(target$0, elem("e1", cssScope));
	const attrSet$0 = scope.attrSet$0 = obj();
	e1Attrs$0(e1$0, attrSet$0, host);
	const e2$0 = scope.e2$0 = appendChild(target$0, elem("e2", cssScope));
	const attrSet$1 = scope.attrSet$1 = obj();
	e2Attrs$0(e2$0, attrSet$1, host);
	const e3$0 = scope.e3$0 = appendChild(target$0, elem("e3", cssScope));
	const attrSet$2 = scope.attrSet$2 = obj();
	e3Attrs$0(e3$0, attrSet$2, host);
	const e4$0 = scope.e4$0 = appendChild(target$0, elem("e4", cssScope));
	const inj$0 = createInjector(e4$0);
	const attrSet$3 = scope.attrSet$3 = obj();
	e4Attrs$0(e4$0, attrSet$3, host, scope);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	const e5$0 = scope.e5$0 = appendChild(target$0, elem("e5", cssScope));
	const attrSet$4 = scope.attrSet$4 = obj();
	e5Attrs$0(e5$0, attrSet$4, host);
	const e6$0 = scope.e6$0 = appendChild(target$0, elem("e6", cssScope));
	const attrSet$5 = scope.attrSet$5 = obj();
	e6Attrs$0(e6$0, attrSet$5, host);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	setVars$0(host, scope);
	e1Attrs$0(scope.e1$0, scope.attrSet$0, host);
	e2Attrs$0(scope.e2$0, scope.attrSet$1, host);
	e3Attrs$0(scope.e3$0, scope.attrSet$2, host);
	e4Attrs$0(scope.e4$0, scope.attrSet$3, host, scope);
	updateBlock(scope.if$0);
	updateBlock(scope.if$1);
	e5Attrs$0(scope.e5$0, scope.attrSet$4, host);
	e6Attrs$0(scope.e6$0, scope.attrSet$5, host);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
}