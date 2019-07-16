import { addPendingClass, appendChild, attributeSet, createInjector, elem, finalizeAttributes, mountBlock, unmountBlock, updateBlock } from "endorphin";

function ifAttr$0(host, scope) {
	if (((host.state.customBg && (host.state.customBg !== "default")) && !scope["pro-mode"])) {
		addPendingClass(scope._a$0, "__bg __" + host.state.customBg);
	}
}

function ifBody$0(host, injector, scope) {
	scope._a$0.c.style = host.state.css;
	ifAttr$0(host, scope);
	return ifBody$0Update;
}

function ifBody$0Update(host, scope) {
	scope._a$0.c.style = host.state.css;
	ifAttr$0(host, scope);
}

function ifEntry$0(host) {
	if ((host.state.foo === "bar")) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const inj$0 = createInjector(main$0);
	const _a$0 = scope._a$0 = attributeSet();
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	finalizeAttributes(main$0, _a$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
	finalizeAttributes(scope.main$0, scope._a$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope._a$0 = scope.main$0 = null;
}