import { elem, elemWithText, insert, mountSlot, unmountSlot, createInjector, addDisposeCallback, mountBlock, updateBlock, unmountBlock } from "endorphin";

function defaultSlotHeader$0(host, injector) {
	insert(injector, elemWithText("h2", "Default header"));
}

function ifBody$0(host, injector, scope) {
	const slot$4 = insert(injector, elem("slot"));
	slot$4.setAttribute("name", "error");
	scope.slot$5 = mountSlot(host, "error", slot$4);
	addDisposeCallback(injector, ifBody$0Unmount);
}

function ifBody$0Unmount(scope) {
	scope.slot$5 = unmountSlot(scope.slot$5);
}

function ifEntry$0(host) {
	if (host.props.showError) {
		return ifBody$0;
	}
}

function defaultSlotFooter$0(host, injector) {
	insert(injector, elemWithText("footer", "Default footer"));
}

function ifBody$1(host, injector, scope) {
	const slot$6 = insert(injector, elem("slot"));
	slot$6.setAttribute("name", "footer");
	scope.slot$7 = mountSlot(host, "footer", slot$6, defaultSlotFooter$0);
	addDisposeCallback(injector, ifBody$1Unmount);
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
	const div$0 = target$0.appendChild(elem("div"));
	const inj$0 = createInjector(div$0);
	div$0.setAttribute("class", "container");
	const slot$0 = insert(inj$0, elem("slot"));
	slot$0.setAttribute("name", "header");
	scope.slot$1 = mountSlot(host, "header", slot$0, defaultSlotHeader$0);
	insert(inj$0, elemWithText("p", "content"));
	const slot$2 = insert(inj$0, elem("slot"));
	scope.slot$3 = mountSlot(host, "", slot$2);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateBlock(scope.if$1);
}

function template$0Unmount(scope) {
	scope.slot$1 = unmountSlot(scope.slot$1);
	scope.slot$3 = unmountSlot(scope.slot$3);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
}