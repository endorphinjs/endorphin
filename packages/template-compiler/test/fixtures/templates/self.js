import { appendChild, createComponent, createInjector, elem, elemWithText, get, insert, mountBlock, mountComponent, propsSet, unmountBlock, unmountComponent, updateAttribute, updateBlock, updateComponent } from "endorphin";

function e_selfAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "item", host.props.link);
}

function chooseBody$0(host, injector, scope) {
	const e_self$0 = scope.e_self$0 = insert(injector, createComponent(host.nodeName, host.componentModel.definition, host));
	const propSet$0 = scope.propSet$0 = propsSet(e_self$0);
	e_selfAttrs$0(e_self$0, propSet$0, host);
	mountComponent(e_self$0, propSet$0);
	return chooseBody$0Update;
}

chooseBody$0.dispose = chooseBody$0Unmount;

function chooseBody$0Update(host, scope) {
	const { e_self$0, propSet$0 } = scope;
	e_selfAttrs$0(e_self$0, propSet$0, host);
	updateComponent(e_self$0, propSet$0);
}

function chooseBody$0Unmount(scope) {
	scope.e_self$0 = unmountComponent(scope.e_self$0);
	scope.propSet$0 = null;
}

function chooseBody$1(host, injector) {
	insert(injector, elemWithText("div", "Content"));
}

function chooseEntry$0(host) {
	return get(host.props.item, "link") ? chooseBody$0 : chooseBody$1;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = appendChild(target$0, elem("div"));
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