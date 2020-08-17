import { appendChild, createComponent, createInjector, elem, elemWithText, insert, mountBlock, mountComponent, setAttribute, text, unmountBlock, unmountComponent, updateBlock, updateIncomingSlot, updateText } from "endorphin";
import * as SlotInner from "./slot-inner.js";

let slots = [0, 0];
const slotsStack = [];

function enterSlots() {
	slotsStack.push(slots);
	slots = [0, 0];
}

function exitSlots() {
	slots = slotsStack.pop();
}

function ifBody$0(host, injector, scope) {
	const p$0 = insert(injector, elem("p"));
	scope.text$2 = appendChild(p$0, text(host.props.content2));
	slots[0] = 1;
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	slots[0] |= updateText(scope.text$2, host.props.content2);
}

function ifBody$0Unmount(scope) {
	scope.text$2 = null;
	slots[0] = 1;
}

function ifEntry$0(host) {
	return host.props.enabled ? ifBody$0 : null;
}

function ifBody$1(host, injector) {
	insert(injector, elemWithText("div", "Branching footer"));
	slots[1] = 1;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Unmount() {
	slots[1] = 1;
}

function ifEntry$1(host) {
	return host.props.active ? ifBody$1 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	enterSlots();
	const header$0 = appendChild(target$0, elem("header"));
	scope.text$0 = appendChild(header$0, text(host.props.header));
	const slotInner$0 = scope.slotInner$0 = appendChild(target$0, createComponent("slot-inner", SlotInner, host));
	const inj$2 = slotInner$0.componentModel.input;
	const div$0 = insert(inj$2, elem("div"), "");
	const inj$0 = createInjector(div$0);
	scope.text$1 = insert(inj$0, text(host.props.content));
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const footer$0 = insert(inj$2, elem("footer"), "footer");
	const inj$1 = createInjector(footer$0);
	setAttribute(footer$0, "slot", "footer");
	scope.text$3 = insert(inj$1, text(host.props.footer));
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	mountComponent(slotInner$0);
	exitSlots();
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { slotInner$0 } = scope;
	enterSlots();
	updateText(scope.text$0, host.props.header);
	slots[0] |= updateText(scope.text$1, host.props.content);
	updateBlock(scope.if$0);
	slots[1] |= updateText(scope.text$3, host.props.footer);
	updateBlock(scope.if$1);
	updateIncomingSlot(slotInner$0, "", slots[0]);
	updateIncomingSlot(slotInner$0, "footer", slots[1]);
	exitSlots();
}

function template$0Unmount(scope) {
	enterSlots();
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.slotInner$0 = unmountComponent(scope.slotInner$0);
	exitSlots();
}