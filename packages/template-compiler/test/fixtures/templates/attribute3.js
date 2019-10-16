import { addPendingClass, appendChild, createInjector, elem, finalizeAttributes, get, insert, mountIterator, obj, text, unmountIterator, updateAttribute, updateIterator, updateText } from "endorphin";

function mainAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "a1", host.props.id);
	updateAttribute(elem, prev, "a2", (host.props.c1 ? "1" : "0"));
}

function mainPreparePending$0(pending, host) {
	pending.class = "foo";
	pending.title = null;
}

function forSelect$0(host) {
	return host.props.items;
}

function setVars$0(host, scope) {
	scope.__if0 = get(scope.value, "enabled");
	scope.__if1 = get(scope.value, "color");
}

function mainPendingAttrs$0(pending, host, scope) {
	pending.title = (scope.__if0 ? get(scope.value, "title") : null);
}

function addPendingClass$0(pending, host, scope) {
	addPendingClass(pending, ((scope.__if1 ? ("cl-" + get(scope.value, "color")) : "")) + " has-item" + ((scope.__if0 ? " enabled" : "")));
}

function forContent$0(host, injector, scope) {
	const { attrSet$0 } = scope;
	setVars$0(host, scope);
	mainPendingAttrs$0(attrSet$0, host, scope);
	addPendingClass$0(attrSet$0, host, scope);
	const div$0 = insert(injector, elem("div"));
	scope.text$0 = appendChild(div$0, text(get(scope.value, "title")));
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	const { attrSet$0 } = scope;
	setVars$0(host, scope);
	mainPendingAttrs$0(attrSet$0, host, scope);
	addPendingClass$0(attrSet$0, host, scope);
	updateText(scope.text$0, get(scope.value, "title"));
}

function forContent$0Unmount(scope) {
	scope.text$0 = null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const inj$0 = createInjector(main$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	const prevPending$0 = scope.prevPending$0 = obj();
	mainAttrs$0(main$0, attrSet$0, host);
	mainPreparePending$0(attrSet$0, host);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	finalizeAttributes(main$0, attrSet$0, prevPending$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { main$0, attrSet$0 } = scope;
	mainAttrs$0(main$0, attrSet$0, host);
	mainPreparePending$0(attrSet$0, host);
	updateIterator(scope.for$0);
	finalizeAttributes(main$0, attrSet$0, scope.prevPending$0);
}

function template$0Unmount(scope) {
	scope.for$0 = unmountIterator(scope.for$0);
}