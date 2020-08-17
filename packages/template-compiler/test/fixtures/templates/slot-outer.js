import { appendChild, createComponent, elemWithText, insert, mountBlock, mountComponent, mountIterator, propsSet, setAttribute, unmountBlock, unmountComponent, unmountIterator, updateBlock, updateComponent, updateIncomingSlot, updateIterator } from "endorphin";
import * as SubComponent from "./slot-inner.html";

let slots = [0, 0, 0, 0];
const slotsStack = [];

function enterSlots() {
	slotsStack.push(slots);
	slots = [0, 0, 0, 0];
}

function exitSlots() {
	slots = slotsStack.pop();
}

function subComponentAttrs$0(elem, prev, host) {
	prev.id = host.props.id;
}

function ifBody$0(host, injector) {
	insert(injector, elemWithText("p", "bar"), "");
	slots[0] = 1;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount() {
	slots[0] = 1;
}

function ifEntry$0(host) {
	return host.props.c1 ? ifBody$0 : null;
}

function ifBody$1(host, injector) {
	const p$1 = insert(injector, elemWithText("p", "bar"), "header");
	setAttribute(p$1, "slot", "header");
	slots[1] = 1;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Unmount() {
	slots[1] = 1;
}

function ifEntry$1(host) {
	return host.props.c2 ? ifBody$1 : null;
}

function forSelect$0(host) {
	return host.props.items;
}

function forContent$0(host, injector) {
	insert(injector, elemWithText("div", "item"), "");
	const div$2 = insert(injector, elemWithText("div", "item footer"), "footer");
	setAttribute(div$2, "slot", "footer");
	slots[0] = slots[2] = 1;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Unmount() {
	slots[0] = slots[2] = 1;
}

function ifBody$2(host, injector) {
	const div$3 = insert(injector, elemWithText("div", "Got error"), "error");
	setAttribute(div$3, "slot", "error");
	slots[3] = 1;
}

ifBody$2.dispose = ifBody$2Unmount;

function ifBody$2Unmount() {
	slots[3] = 1;
}

function ifEntry$2(host) {
	return host.props.error ? ifBody$2 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	enterSlots();
	appendChild(target$0, elemWithText("h1", "Hello world"));
	const subComponent$0 = scope.subComponent$0 = appendChild(target$0, createComponent("sub-component", SubComponent, host));
	const inj$0 = subComponent$0.componentModel.input;
	const propSet$0 = scope.propSet$0 = propsSet(subComponent$0);
	subComponentAttrs$0(subComponent$0, propSet$0, host);
	insert(inj$0, elemWithText("div", "foo"), "");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$1 = mountBlock(host, inj$0, ifEntry$1);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	scope.if$2 = mountBlock(host, inj$0, ifEntry$2);
	mountComponent(subComponent$0, propSet$0);
	exitSlots();
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { subComponent$0, propSet$0 } = scope;
	enterSlots();
	subComponentAttrs$0(subComponent$0, propSet$0, host);
	updateBlock(scope.if$0);
	updateBlock(scope.if$1);
	updateIterator(scope.for$0);
	updateBlock(scope.if$2);
	updateIncomingSlot(subComponent$0, "", slots[0]);
	updateIncomingSlot(subComponent$0, "header", slots[1]);
	updateIncomingSlot(subComponent$0, "footer", slots[2]);
	updateIncomingSlot(subComponent$0, "error", slots[3]);
	updateComponent(subComponent$0, propSet$0);
	exitSlots();
}

function template$0Unmount(scope) {
	enterSlots();
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.for$0 = unmountIterator(scope.for$0);
	scope.if$2 = unmountBlock(scope.if$2);
	scope.subComponent$0 = unmountComponent(scope.subComponent$0);
	exitSlots();
}