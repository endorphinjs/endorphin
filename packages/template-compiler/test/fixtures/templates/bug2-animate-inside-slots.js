import { animate, appendChild, createComponent, domRemove, elem, elemWithText, insert, mountBlock, mountComponent, unmountBlock, unmountComponent, updateBlock, updateIncomingSlot } from "endorphin";
import * as SlottedInside from "./basic1.html";

let slots = null;
const slotsStack = [];

function enterSlots() {
	slotsStack.push(slots);
	slots = [0];
}

function exitSlots() {
	slots = slotsStack.pop();
}

function animatedDiv$0(host, injector, scope) {
	scope.div$1 = insert(injector, elem("div"), "");
	slots[0] = 1;
}

function animatedDiv$0Unmount(scope) {
	scope.div$1 = domRemove(scope.div$1);
	slots[0] = 1;
}

function ifBody$0(host, injector, scope) {
	!scope.div$1 && animatedDiv$0(host, injector, scope);
	animate(scope.div$1, "in 0.3s");
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope, host) {
	animate(scope.div$1, "in 0.1s ease-out reverse", () => {enterSlots();animatedDiv$0Unmount(scope, host);updateIncomingSlot(scope.slottedInside$0, "", slots[0]);exitSlots();});
}

function ifEntry$0(host) {
	return host.state.show ? ifBody$0 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	enterSlots();
	appendChild(target$0, elemWithText("h1", "Animation inside slot unmount bug"));
	const slottedInside$0 = scope.slottedInside$0 = appendChild(target$0, createComponent("slotted-inside", SlottedInside, host));
	const inj$0 = slottedInside$0.componentModel.input;
	insert(inj$0, elem("div"), "");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	mountComponent(slottedInside$0);
	exitSlots();
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	enterSlots();
	updateBlock(scope.if$0);
	updateIncomingSlot(scope.slottedInside$0, "", slots[0]);
	exitSlots();
}

function template$0Unmount(scope) {
	enterSlots();
	scope.if$0 = unmountBlock(scope.if$0);
	scope.slottedInside$0 = unmountComponent(scope.slottedInside$0);
	exitSlots();
}