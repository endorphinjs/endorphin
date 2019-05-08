import { createInjector, text, insert, mountBlock, updateBlock, unmountBlock, addDisposeCallback } from "endorphin";

function ifBody$2(host, injector) {
	insert(injector, text("\n                test\n            "));
}

function ifEntry$2(host) {
	if (host.props.expr3) {
		return ifBody$2;
	}
}

function ifBody$1(host, injector, scope) {
	scope.if$2 = mountBlock(host, injector, ifEntry$2);
	addDisposeCallback(host, ifBody$1Unmount);
	return ifBody$1Update;
}

function ifBody$1Update(host, injector, scope) {
	updateBlock(scope.if$2);
}

function ifBody$1Unmount(scope) {
	scope.if$2 = unmountBlock(scope.if$2);
}

function ifEntry$1(host) {
	if (host.props.expr2) {
		return ifBody$1;
	}
}

function ifBody$0(host, injector, scope) {
	scope.if$1 = mountBlock(host, injector, ifEntry$1);
	addDisposeCallback(host, ifBody$0Unmount);
	return ifBody$0Update;
}

function ifBody$0Update(host, injector, scope) {
	updateBlock(scope.if$1);
}

function ifBody$0Unmount(scope) {
	scope.if$1 = unmountBlock(scope.if$1);
}

function ifEntry$0(host) {
	if (host.props.expr1) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
}