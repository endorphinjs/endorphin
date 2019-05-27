import { setRef, elem, createInjector, insert, mountBlock, updateBlock, unmountBlock, createComponent, mountComponent, unmountComponent, finalizeRefs } from "endorphin";
import * as SlotInner from "./slot-inner.html";

function ifBody$0(host, injector, scope) {
	const span$0 = scope.span$0 = insert(injector, elem("span"));
	setRef(host, "header", span$0);
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, injector, scope) {
	setRef(host, "header", scope.span$0);
}

function ifBody$0Unmount(scope) {
	scope.span$0 = null;
}

function ifEntry$0(host) {
	if (host.props.c1) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = target$0.appendChild(elem("main"));
	const inj$0 = createInjector(main$0);
	setRef(host, "main", main$0);
	const div$0 = scope.div$0 = insert(inj$0, elem("div"));
	setRef(host, "header", div$0);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const slotInner$0 = scope.slotInner$0 = insert(inj$0, createComponent("slot-inner", SlotInner, host));
	setRef(host, "addon", slotInner$0);
	mountComponent(slotInner$0);
	finalizeRefs(host);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	setRef(host, "main", scope.main$0);
	setRef(host, "header", scope.div$0);
	updateBlock(scope.if$0);
	setRef(host, "addon", scope.slotInner$0);
	finalizeRefs(host);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.slotInner$0 = unmountComponent(scope.slotInner$0);
	scope.div$0 = scope.main$0 = null;
}