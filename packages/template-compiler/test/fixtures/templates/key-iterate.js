import { clearBlock, createInjector, elem, elemWithText, get, insert, mountBlock, mountKeyIterator, obj, text, unmountBlock, unmountKeyIterator, updateAttribute, updateBlock, updateKeyIterator } from "endorphin";

function forSelect$0(host) {
	return host.props.items;
}

function forKey$0(host) {
	return host.props.id;
}

function liAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "id", host.props.id);
}

function ifBody$1(host, injector) {
	insert(injector, elemWithText("strong", "*"));
}

function ifEntry$1(host, scope) {
	return get(scope.value, "marked") ? ifBody$1 : null;
}

function forContent$0(host, injector, scope) {
	const li$0 = scope.li$0 = insert(injector, elem("li"));
	const inj$0 = createInjector(li$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	liAttrs$0(li$0, attrSet$0, host);
	insert(inj$0, text("\n                    item\n                    "));
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	liAttrs$0(scope.li$0, scope.attrSet$0, host);
	updateBlock(scope.if$1);
}

function forContent$0Unmount(scope) {
	scope.if$1 = unmountBlock(scope.if$1);
	scope.attrSet$0 = scope.li$0 = null;
}

function ifBody$0(host, injector, scope) {
	insert(injector, elemWithText("p", "will iterate"));
	const ul$0 = insert(injector, elem("ul"));
	const inj$1 = createInjector(ul$0);
	scope.for$0 = mountKeyIterator(host, inj$1, forSelect$0, forKey$0, forContent$0);
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	updateKeyIterator(scope.for$0);
}

function ifBody$0Unmount(scope) {
	scope.for$0 = unmountKeyIterator(scope.for$0);
}

function ifEntry$0(host) {
	return host.props.items ? ifBody$0 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$2 = createInjector(target$0);
	insert(inj$2, elemWithText("h1", "Hello world"));
	scope.if$0 = mountBlock(host, inj$2, ifEntry$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.if$0 = clearBlock(scope.if$0);
}