import { elem, createInjector, get, setAttribute, createComponent, markSlotUpdate, mountComponent, updateComponent, unmountComponent, insert, addDisposeCallback, elemWithText, mountBlock, updateBlock, unmountBlock } from "endorphin";

function chooseBody$0(host, injector, scope) {
	const e_self$0 = scope.e_self$0 = insert(injector, createComponent(host.nodeName, host.componentModel.definition, host));
	const inj$1 = scope.inj$1 = e_self$0.componentModel.input;
	setAttribute(inj$1, "item", host.props.link);
	mountComponent(e_self$0);
	addDisposeCallback(host, chooseBody$0Unmount);
	return chooseBody$0Update;
}

function chooseBody$0Update(host, injector, scope) {
	let su$0 = 0;
	const { e_self$0 } = scope;
	su$0 |= setAttribute(scope.inj$1, "item", host.props.link);
	markSlotUpdate(e_self$0, "", su$0);
	updateComponent(e_self$0);
	return su$0;
}

function chooseBody$0Unmount(scope) {
	scope.e_self$0 = unmountComponent(scope.e_self$0);
	scope.inj$1 = null;
}

function chooseBody$1(host, injector) {
	insert(injector, elemWithText("div", "Content"));
}

function chooseEntry$0(host) {
	if (get(host.props.item, "link")) {
		return chooseBody$0;
	} else {
		return chooseBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = target$0.appendChild(elem("div"));
	const inj$0 = createInjector(div$0);
	scope.choose$0 = mountBlock(host, inj$0, chooseEntry$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateBlock(scope.choose$0);
}

function template$0Unmount(scope) {
	scope.choose$0 = unmountBlock(scope.choose$0);
}