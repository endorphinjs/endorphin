import { createInjector, insert, mountBlock, text, unmountBlock, updateBlock } from "endorphin";

function ifBody$2(host, injector) {
	insert(injector, text("\n                test\n            "));
}

function ifEntry$2(host) {
	return host.props.expr3 ? ifBody$2 : null;
}

function ifBody$1(host, injector, scope) {
	scope.if$2 = mountBlock(host, injector, ifEntry$2);
	return ifBody$1Update;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Update(host, scope) {
	updateBlock(scope.if$2);
}

function ifBody$1Unmount(scope) {
	scope.if$2 = unmountBlock(scope.if$2);
}

function ifEntry$1(host) {
	return host.props.expr2 ? ifBody$1 : null;
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
	return host.props.expr1 ? ifBody$0 : null;
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