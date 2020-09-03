import { animate, appendChild, createComponent, createInjector, domRemove, elem, insert, mountBlock, mountComponent, mountIterator, setAttribute, setClass, unmountBlock, unmountComponent, unmountIterator, updateBlock, updateIncomingSlot, updateIterator } from "endorphin";
import * as MyComponent from "my-component.html";

let slots = [0];
const slotsStack = [];

function enterSlots() {
	slotsStack.push(slots);
	slots = [0];
}

function exitSlots() {
	slots = slotsStack.pop();
}

function forSelect$0(host) {
	return host.props.items;
}

function animatedDiv$0(host, injector, scope) {
	scope.div$1 = insert(injector, elem("div"));
	slots[0] = 1;
}

function animatedDiv$0Unmount(scope) {
	scope.div$1 = domRemove(scope.div$1);
	slots[0] = 1;
}

function forContent$0(host, injector, scope) {
	!scope.div$1 && animatedDiv$0(host, injector, scope);
	animate(scope.div$1, "appear 0.2s backwards");
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Unmount(scope, host) {
	animate(scope.div$1, "disappear 0.2s forwards", () => {enterSlots();animatedDiv$0Unmount(scope, host);updateIncomingSlot(scope.myComponent$0, "title", slots[0]);exitSlots();});
}

function ifBody$0(host, injector, scope) {
	const div$0 = insert(injector, elem("div"));
	const inj$0 = createInjector(div$0);
	setClass(div$0, "preview");
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	slots[0] = 1;
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	updateIterator(scope.for$0);
}

function ifBody$0Unmount(scope) {
	scope.for$0 = unmountIterator(scope.for$0);
	slots[0] = 1;
}

function ifEntry$0(host) {
	return host.props.enabled ? ifBody$0 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	enterSlots();
	const myComponent$0 = scope.myComponent$0 = appendChild(target$0, createComponent("my-component", MyComponent, host));
	const inj$2 = myComponent$0.componentModel.input;
	const h4$0 = insert(inj$2, elem("h4"), "title");
	const inj$1 = createInjector(h4$0);
	setAttribute(h4$0, "slot", "title");
	scope.if$0 = mountBlock(host, inj$1, ifEntry$0);
	mountComponent(myComponent$0);
	exitSlots();
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	enterSlots();
	updateBlock(scope.if$0);
	updateIncomingSlot(scope.myComponent$0, "title", slots[0]);
	exitSlots();
}

function template$0Unmount(scope) {
	enterSlots();
	scope.if$0 = unmountBlock(scope.if$0);
	scope.myComponent$0 = unmountComponent(scope.myComponent$0);
	exitSlots();
}