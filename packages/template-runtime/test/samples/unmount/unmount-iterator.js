import { elemWithText, insert, elem, createComponent, setAttribute, mountComponent, updateComponent, unmountComponent, addDisposeCallback, markSlotUpdate, mountIterator, updateIterator, unmountIterator, createInjector } from "../../../src/runtime";
import * as UnmountBeacon from "./unmount-beacon.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const injector0 = createInjector(target0);
	insert(injector0, elemWithText("p", "Unmount iterator"));
	scope.$_iter0 = mountIterator(host, injector0, $$iteratorExpr0, $$iteratorBlock0);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateIterator(scope.$_iter0);
}

function $$template0Unmount(scope) {
	scope.$_iter0 = unmountIterator(scope.$_iter0);
}

function $$iteratorExpr0(host) {
	return host.props.items;
}

function $$iteratorBlock0(host, injector, scope) {
	const div0 = insert(injector, elem("div"));
	const unmountBeacon0 = scope.$_unmountBeacon0 = div0.appendChild(createComponent("unmount-beacon", UnmountBeacon, host));
	const injector0 = scope.$_injector0 = unmountBeacon0.componentModel.input;
	setAttribute(injector0, "id", scope.value);
	mountComponent(unmountBeacon0);
	addDisposeCallback(injector, $$iteratorBlock0Unmount);
	return $$iteratorBlock0Update;
}

function $$iteratorBlock0Update(host, injector, scope) {
	const injector0 = scope.$_injector0;
	let s__unmountBeacon0 = 0;
	s__unmountBeacon0 |= setAttribute(injector0, "id", scope.value);
	markSlotUpdate(scope.$_unmountBeacon0, "", s__unmountBeacon0);
	updateComponent(scope.$_unmountBeacon0);
	return s__unmountBeacon0;
}

function $$iteratorBlock0Unmount(scope) {
	scope.$_unmountBeacon0 = unmountComponent(scope.$_unmountBeacon0);
	scope.$_injector0 = null;
}
