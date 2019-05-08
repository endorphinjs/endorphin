import { elem, insert, createComponent, mountComponent, updateComponent, unmountComponent, addDisposeCallback, mountSlot, unmountSlot, mountBlock, updateBlock, unmountBlock, createInjector } from "../../../src/runtime";
import * as UnmountBeacon from "./unmount-beacon.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const injector0 = createInjector(target0);
	scope.$_block0 = mountBlock(host, injector0, $$conditionEntry0);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateBlock(scope.$_block0);
}

function $$template0Unmount(scope) {
	scope.$_block0 = unmountBlock(scope.$_block0);
}

function $$slotFooterContent0(host, injector, scope) {
	const unmountBeacon0 = scope.$_unmountBeacon0 = insert(injector, createComponent("unmount-beacon", UnmountBeacon, host));
	mountComponent(unmountBeacon0, {
		id: "inner"
	});
	addDisposeCallback(injector, $$slotFooterContent0Unmount);
	return $$slotFooterContent0Update;
}

function $$slotFooterContent0Update(host, injector, scope) {
	updateComponent(scope.$_unmountBeacon0);
	return 0;
}

function $$slotFooterContent0Unmount(scope) {
	scope.$_unmountBeacon0 = unmountComponent(scope.$_unmountBeacon0);
}

function $$conditionContent0(host, injector, scope) {
	const slot0 = insert(injector, elem("slot"));
	slot0.setAttribute("name", "footer");
	scope.$_slot0 = mountSlot(host, "footer", slot0, $$slotFooterContent0);
	addDisposeCallback(injector, $$conditionContent0Unmount);
}

function $$conditionContent0Unmount(scope) {
	scope.$_slot0 = unmountSlot(scope.$_slot0);
}

function $$conditionEntry0(host) {
	if (host.props.inner) {
		return $$conditionContent0;
	}
}
