import { createComponent, setAttribute, insert, mountComponent, updateComponent, unmountComponent, addDisposeCallback, mountBlock, updateBlock, unmountBlock, markSlotUpdate } from "../../../src/runtime";
import * as UnmountBeacon from "./unmount-beacon.js";
import * as UnmountSlotInner from "./unmount-slot-inner.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const unmountSlotInner0 = scope.$_unmountSlotInner0 = target0.appendChild(createComponent("unmount-slot-inner", UnmountSlotInner, host));
	const injector0 = scope.$_injector0 = unmountSlotInner0.componentModel.input;
	setAttribute(injector0, "inner", host.props.inner);
	scope.$_block0 = mountBlock(host, injector0, $$conditionEntry0);
	mountComponent(unmountSlotInner0);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	const injector0 = scope.$_injector0;
	let s__unmountSlotInner0 = 0;
	s__unmountSlotInner0 |= setAttribute(injector0, "inner", host.props.inner);
	s__unmountSlotInner0 |= updateBlock(scope.$_block0);
	markSlotUpdate(scope.$_unmountSlotInner0, "", s__unmountSlotInner0);
	updateComponent(scope.$_unmountSlotInner0);
	return s__unmountSlotInner0;
}

function $$template0Unmount(scope) {
	scope.$_block0 = unmountBlock(scope.$_block0);
	scope.$_unmountSlotInner0 = unmountComponent(scope.$_unmountSlotInner0);
	scope.$_injector0 = null;
}

function $$conditionContent0(host, injector, scope) {
	const unmountBeacon0 = scope.$_unmountBeacon0 = insert(injector, createComponent("unmount-beacon", UnmountBeacon, host), "footer");
	mountComponent(unmountBeacon0, {
		slot: "footer",
		id: "outer"
	});
	addDisposeCallback(injector, $$conditionContent0Unmount);
	return $$conditionContent0Update;
}

function $$conditionContent0Update(host, injector, scope) {
	updateComponent(scope.$_unmountBeacon0);
	return 0;
}

function $$conditionContent0Unmount(scope) {
	scope.$_unmountBeacon0 = unmountComponent(scope.$_unmountBeacon0);
}

function $$conditionEntry0(host) {
	if (host.props.outer) {
		return $$conditionContent0;
	}
}
