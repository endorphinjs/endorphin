import { appendChild, createInjector, createSlot, elem, elemWithText, insert, mountBlock, mountSlot, setAttribute, unmountBlock, unmountSlot, updateBlock, updateDefaultSlot } from "endorphin";

function defaultSlotHeader$0(host, injector) {
	insert(injector, elemWithText("h2", "Default header"), "header");
}

function ifBody$0(host, injector, scope) {
	insert(injector, createSlot(host, "error"));
	scope.slot$5 = mountSlot(host, "error");
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope) {
	scope.slot$5 = unmountSlot(scope.slot$5);
}

function ifEntry$0(host) {
	if (host.props.showError) {
		return ifBody$0;
	}
}

function defaultSlotFooter$0(host, injector) {
	insert(injector, elemWithText("footer", "Default footer"), "footer");
}

function ifBody$1(host, injector, scope) {
	insert(injector, createSlot(host, "footer"));
	scope.slot$7 = mountSlot(host, "footer", defaultSlotFooter$0);
	return ifBody$1Update;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Update(host, scope) {
	updateDefaultSlot(scope.slot$7);
}

function ifBody$1Unmount(scope) {
	scope.slot$7 = unmountSlot(scope.slot$7);
}

function ifEntry$1(host) {
	if (host.props.showFooter) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = appendChild(target$0, elem("div"));
	const inj$0 = createInjector(div$0);
	setAttribute(div$0, "class", "container");
	insert(inj$0, createSlot(host, "header"));
	scope.slot$1 = mountSlot(host, "header", defaultSlotHeader$0);
	insert(inj$0, elemWithText("p", "content"));
	insert(inj$0, createSlot(host, ""));
	scope.slot$3 = mountSlot(host, "");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateDefaultSlot(scope.slot$1);
	updateBlock(scope.if$0);
	updateBlock(scope.if$1);
}

function template$0Unmount(scope) {
	scope.slot$1 = unmountSlot(scope.slot$1);
	scope.slot$3 = unmountSlot(scope.slot$3);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
}