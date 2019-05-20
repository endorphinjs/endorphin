import { elem, text, updateText, createComponent, createInjector, insert, addDisposeCallback, mountBlock, updateBlock, unmountBlock, elemWithText, markSlotUpdate, mountComponent, updateComponent, unmountComponent } from "endorphin";
import * as SlotInner from "./slot-inner.js";

function ifBody$0(host, injector, scope) {
	const p$0 = insert(injector, elem("p"), "");
	scope.text$2 = p$0.appendChild(text(host.props.content2));
	addDisposeCallback(injector, ifBody$0Unmount);
	return ifBody$0Update;
}

function ifBody$0Update(host, injector, scope) {
	let su$0 = 0;
	su$0 |= updateText(scope.text$2, host.props.content2);
	return su$0;
}

function ifBody$0Unmount(scope) {
	scope.text$2 = null;
}

function ifEntry$0(host) {
	if (host.props.enabled) {
		return ifBody$0;
	}
}

function ifBody$1(host, injector) {
	insert(injector, elemWithText("div", "Branching footer"), "");
}

function ifEntry$1(host) {
	if (host.props.active) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const header$0 = target$0.appendChild(elem("header"));
	scope.text$0 = header$0.appendChild(text(host.props.header));
	const slotInner$0 = scope.slotInner$0 = target$0.appendChild(createComponent("slot-inner", SlotInner, host));
	const inj$2 = slotInner$0.componentModel.input;
	const div$0 = insert(inj$2, elem("div"), "");
	const inj$0 = createInjector(div$0);
	scope.text$1 = insert(inj$0, text(host.props.content), "");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const footer$0 = insert(inj$2, elem("footer"), "footer");
	const inj$1 = createInjector(footer$0);
	footer$0.setAttribute("slot", "footer");
	scope.text$3 = insert(inj$1, text(host.props.footer), "");
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	mountComponent(slotInner$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	let su$0 = 0, su$1 = 0;
	const { slotInner$0 } = scope;
	updateText(scope.text$0, host.props.header);
	su$0 |= updateText(scope.text$1, host.props.content);
	su$0 |= updateBlock(scope.if$0);
	su$1 |= updateText(scope.text$3, host.props.footer);
	su$1 |= updateBlock(scope.if$1);
	markSlotUpdate(slotInner$0, "", su$0);
	markSlotUpdate(slotInner$0, "footer", su$1);
	updateComponent(slotInner$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.slotInner$0 = unmountComponent(scope.slotInner$0);
	scope.text$0 = scope.text$1 = scope.text$3 = null;
}