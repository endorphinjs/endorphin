import { elemWithText, insert, createComponent, mountComponent, updateComponent, unmountComponent, addDisposeCallback, mountBlock, updateBlock, unmountBlock, createInjector } from "../../../src/runtime";
import * as UnmountBeacon from "./unmount-beacon.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const injector0 = createInjector(target0);
	insert(injector0, elemWithText("p", "Unmount test"));
	const unmountBeacon0 = scope.$_unmountBeacon0 = insert(injector0, createComponent("unmount-beacon", UnmountBeacon, host));
	mountComponent(unmountBeacon0, {
		id: 1
	});
	scope.$_block1 = mountBlock(host, injector0, $$conditionEntry0);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateComponent(scope.$_unmountBeacon0);
	updateBlock(scope.$_block1);
	return 0;
}

function $$template0Unmount(scope) {
	scope.$_unmountBeacon0 = unmountComponent(scope.$_unmountBeacon0);
	scope.$_block1 = unmountBlock(scope.$_block1);
}

function $$conditionContent1(host, injector, scope) {
	const unmountBeacon0 = scope.$_unmountBeacon2 = insert(injector, createComponent("unmount-beacon", UnmountBeacon, host));
	mountComponent(unmountBeacon0, {
		id: 3
	});
	addDisposeCallback(injector, $$conditionContent1Unmount);
	return $$conditionContent1Update;
}

function $$conditionContent1Update(host, injector, scope) {
	updateComponent(scope.$_unmountBeacon2);
	return 0;
}

function $$conditionContent1Unmount(scope) {
	scope.$_unmountBeacon2 = unmountComponent(scope.$_unmountBeacon2);
}

function $$conditionContent2(host, injector, scope) {
	const unmountBeacon0 = scope.$_unmountBeacon3 = insert(injector, createComponent("unmount-beacon", UnmountBeacon, host));
	mountComponent(unmountBeacon0, {
		id: 4
	});
	addDisposeCallback(injector, $$conditionContent2Unmount);
	return $$conditionContent2Update;
}

function $$conditionContent2Update(host, injector, scope) {
	updateComponent(scope.$_unmountBeacon3);
	return 0;
}

function $$conditionContent2Unmount(scope) {
	scope.$_unmountBeacon3 = unmountComponent(scope.$_unmountBeacon3);
}

function $$conditionEntry1(host) {
	if (host.props.alt) {
		return $$conditionContent1;
	} else {
		return $$conditionContent2;
	}
}

function $$conditionContent0(host, injector, scope) {
	const unmountBeacon0 = scope.$_unmountBeacon1 = insert(injector, createComponent("unmount-beacon", UnmountBeacon, host));
	mountComponent(unmountBeacon0, {
		id: 2
	});
	scope.$_block0 = mountBlock(host, injector, $$conditionEntry1);
	addDisposeCallback(injector, $$conditionContent0Unmount);
	return $$conditionContent0Update;
}

function $$conditionContent0Update(host, injector, scope) {
	updateComponent(scope.$_unmountBeacon1);
	updateBlock(scope.$_block0);
	return 0;
}

function $$conditionContent0Unmount(scope) {
	scope.$_unmountBeacon1 = unmountComponent(scope.$_unmountBeacon1);
	scope.$_block0 = unmountBlock(scope.$_block0);
}

function $$conditionEntry0(host) {
	if (host.props.enabled) {
		return $$conditionContent0;
	}
}
