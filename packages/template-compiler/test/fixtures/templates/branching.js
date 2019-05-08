import { elemWithText, createInjector, elem, insert, mountBlock, updateBlock, unmountBlock, text, addDisposeCallback } from "endorphin";

function ifBody$1(host, injector) {
	insert(injector, elemWithText("div", "top 2"));
}

function ifEntry$1(host) {
	if (host.props.expr2) {
		return ifBody$1;
	}
}

function ifBody$2(host, injector) {
	insert(injector, elemWithText("div", "top 3"));
	insert(injector, text("\n            top 3.1\n        "));
}

function ifEntry$2(host) {
	if (host.props.expr3) {
		return ifBody$2;
	}
}

function ifBody$0(host, injector, scope) {
	const p$0 = insert(injector, elem("p"));
	p$0.appendChild(elemWithText("strong", "top 1"));
	scope.if$1 = mountBlock(host, injector, ifEntry$1);
	scope.if$2 = mountBlock(host, injector, ifEntry$2);
	addDisposeCallback(injector, ifBody$0Unmount);
	return ifBody$0Update;
}

function ifBody$0Update(host, injector, scope) {
	updateBlock(scope.if$1);
	updateBlock(scope.if$2);
}

function ifBody$0Unmount(scope) {
	scope.if$1 = unmountBlock(scope.if$1);
	scope.if$2 = unmountBlock(scope.if$2);
}

function ifEntry$0(host) {
	if (host.props.expr1) {
		return ifBody$0;
	}
}

function chooseBody$0(host, injector) {
	insert(injector, elemWithText("div", "sub 1"));
}

function chooseBody$1(host, injector) {
	insert(injector, elemWithText("div", "sub 2"));
}

function chooseBody$2(host, injector) {
	insert(injector, elemWithText("div", "sub 3"));
}

function chooseEntry$0(host) {
	if ((host.props.expr1 === 1)) {
		return chooseBody$0;
	} else if ((host.props.expr1 === 2)) {
		return chooseBody$1;
	} else {
		return chooseBody$2;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	insert(inj$0, elemWithText("h1", "Hello world"));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const blockquote$0 = insert(inj$0, elem("blockquote"));
	const inj$1 = createInjector(blockquote$0);
	insert(inj$1, elemWithText("p", "Lorem ipsum 1"));
	scope.choose$0 = mountBlock(host, inj$1, chooseEntry$0);
	insert(inj$1, elemWithText("p", "Lorem ipsum 2"));
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateBlock(scope.choose$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.choose$0 = unmountBlock(scope.choose$0);
}