import { animate, appendChild, clearBlock, createComponent, createInjector, domRemove, elem, insert, mountBlock, mountComponent, mountUse, setAttribute, stopAnimation, unmountBlock, unmountComponent, unmountUse, updateBlock, updateUse } from "endorphin";
import * as SlotInner from "./slot-inner.html";

export function dir1() {}
export function dir2() {}
export function dir3() {}
export function dir4() {}


function ifBody$0(host, injector, scope) {
	const main$0 = insert(injector, elem("main"));
	scope.use$0 = mountUse(host, main$0, dir1, host.props.prop1);
	const img$0 = appendChild(main$0, elem("img"));
	setAttribute(img$0, "src", "my-image.png");
	setAttribute(img$0, "alt", "");
	scope.use$1 = mountUse(host, img$0, dir2);
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	updateUse(scope.use$0, host.props.prop1);
}

function ifBody$0Unmount(scope) {
	scope.use$0 = unmountUse(scope.use$0);
	scope.use$1 = unmountUse(scope.use$1);
}

function ifEntry$0(host) {
	return host.props.cond1 ? ifBody$0 : null;
}

function animatedSlotInner$0(host, injector, scope) {
	const slotInner$1 = scope.slotInner$1 = insert(injector, createComponent("slot-inner", SlotInner, host));
	scope.use$3 = mountUse(host, slotInner$1, dir4);
	mountComponent(slotInner$1);
}

function animatedSlotInner$0Unmount(scope) {
	const { slotInner$1 } = scope;
	scope.use$3 = unmountUse(scope.use$3);
	scope.slotInner$1 = unmountComponent(slotInner$1);
	domRemove(slotInner$1);
}

function ifBody$1(host, injector, scope) {
	!scope.slotInner$1 && animatedSlotInner$0(host, injector, scope);
	stopAnimation(scope.slotInner$1, true);
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Unmount(scope, host) {
	animate(scope.slotInner$1, "anim-out 2s", () => animatedSlotInner$0Unmount(scope, host));
}

function ifEntry$1(host) {
	return host.props.cond2 ? ifBody$1 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$1 = createInjector(target$0);
	const div$0 = insert(inj$1, elem("div"));
	const inj$0 = createInjector(div$0);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const slotInner$0 = scope.slotInner$0 = insert(inj$1, createComponent("slot-inner", SlotInner, host));
	scope.use$2 = mountUse(host, slotInner$0, dir3, host.state.state2);
	mountComponent(slotInner$0);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	updateUse(scope.use$2, host.state.state2);
	updateBlock(scope.if$1);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.use$2 = unmountUse(scope.use$2);
	scope.slotInner$0 = unmountComponent(scope.slotInner$0);
	scope.if$1 = clearBlock(scope.if$1);
}