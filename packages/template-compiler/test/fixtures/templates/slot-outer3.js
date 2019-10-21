import { appendChild, createComponent, elem, insert, mountBlock, mountComponent, propsSet, setAttribute, unmountBlock, unmountComponent, updateBlock, updateIncomingSlot } from "endorphin";
import * as SlotInner from "./slot-inner.js";

function ifBody$0(host, injector, scope) {
	const slotInner$1 = scope.slotInner$1 = insert(injector, createComponent("slot-inner", SlotInner, host), "");
	mountComponent(slotInner$1, propsSet(slotInner$1, {a: 1}));
	const div$0 = insert(injector, elem("div"), "inner");
	setAttribute(div$0, "slot", "inner");
	const slotInner$2 = scope.slotInner$2 = appendChild(div$0, createComponent("slot-inner", SlotInner, host));
	mountComponent(slotInner$2, propsSet(slotInner$2, {a: 2}));
	scope.su$0 = scope.su$1 = 1;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Unmount(scope) {
	scope.slotInner$1 = unmountComponent(scope.slotInner$1);
	scope.slotInner$2 = unmountComponent(scope.slotInner$2);
	scope.su$0 = scope.su$1 = 1;
}

function ifEntry$0(host) {
	return host.props.cond ? ifBody$0 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const slotInner$0 = scope.slotInner$0 = appendChild(target$0, createComponent("slot-inner", SlotInner, host));
	const inj$0 = slotInner$0.componentModel.input;
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	mountComponent(slotInner$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { slotInner$0 } = scope;
	scope.su$0 = scope.su$1 = 0;
	updateBlock(scope.if$0);
	updateIncomingSlot(slotInner$0, "", scope.su$0);
	updateIncomingSlot(slotInner$0, "inner", scope.su$1);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.slotInner$0 = unmountComponent(scope.slotInner$0);
}