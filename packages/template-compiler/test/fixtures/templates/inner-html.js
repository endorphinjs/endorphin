import { createInjector, elemWithText, insert, mountBlock, mountInnerHTML, unmountBlock, unmountInnerHTML, updateBlock, updateInnerHTML } from "endorphin";

function ifBody$0(host, injector) {
	insert(injector, elemWithText("div", "foo"));
}

function ifEntry$0(host) {
	if (host.props.c1) {
		return ifBody$0;
	}
}

function html$0(host) {
	return host.props.html;
}

function ifBody$1(host, injector) {
	insert(injector, elemWithText("p", "bar"));
}

function ifEntry$1(host) {
	if (host.props.c2) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	insert(inj$0, elemWithText("p", "test"));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.html$0 = mountInnerHTML(host, inj$0, html$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateInnerHTML(scope.html$0);
	updateBlock(scope.if$1);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.html$0 = unmountInnerHTML(scope.html$0);
	scope.if$1 = unmountBlock(scope.if$1);
}