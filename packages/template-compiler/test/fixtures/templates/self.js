import { createComponent, createInjector, elem, elemWithText, get, insert, mountBlock, mountComponent, setAttribute, unmountBlock, unmountComponent, updateBlock, updateComponent } from "endorphin";

function chooseBody$0(host, injector, scope) {
	const e_self$0 = scope.e_self$0 = insert(injector, createComponent(host.nodeName, host.componentModel.definition, host));
	const inj$1 = scope.inj$1 = e_self$0.componentModel.input;
	setAttribute(inj$1, "item", host.props.link);
	mountComponent(e_self$0);
	return chooseBody$0Update;
}

chooseBody$0.dispose = chooseBody$0Unmount;

function chooseBody$0Update(host, injector, scope) {
	setAttribute(scope.inj$1, "item", host.props.link);
	updateComponent(scope.e_self$0);
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
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.choose$0);
}

function template$0Unmount(scope) {
	scope.choose$0 = unmountBlock(scope.choose$0);
}