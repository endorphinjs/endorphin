import { setAttribute, createComponent, mountComponent, unmountComponent, updateComponent, addDisposeCallback } from "endorphin";
import * as SubComponent from "./sub-component.html";

function ifAttr$0(host, injector) {
	if (host.props.c1) {
		setAttribute(injector, "p2", "2");
	}
	return 0;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const subComponent$0 = scope.subComponent$0 = target$0.appendChild(createComponent("sub-component", SubComponent, host));
	const inj$0 = scope.inj$0 = subComponent$0.componentModel.input;
	setAttribute(inj$0, "id", host.props.id);
	ifAttr$0(host, inj$0);
	setAttribute(inj$0, "p3", 3);
	mountComponent(subComponent$0, {
		p1: "1"
	});
	const subComponent$1 = scope.subComponent$1 = target$0.appendChild(createComponent("sub-component", SubComponent, host));
	mountComponent(subComponent$1, {
		enabled: true
	});
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	const { inj$0 } = scope;
	setAttribute(inj$0, "id", host.props.id);
	ifAttr$0(host, inj$0);
	setAttribute(inj$0, "p3", 3);
	updateComponent(scope.subComponent$0);
}

function template$0Unmount(scope) {
	scope.subComponent$0 = unmountComponent(scope.subComponent$0);
	scope.subComponent$1 = unmountComponent(scope.subComponent$1);
	scope.inj$0 = null;
}