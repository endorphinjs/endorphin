import { appendChild, assign, createComponent, elem, elemWithText, insert, mountBlock, mountComponent, obj, propsSet, subscribeStore, text, unmountBlock, unmountComponent, updateAttribute, updateBlock, updateComponent, updateText } from "endorphin";
import * as InnerComponent from "./inner-component.js";

export const partials = {
	"my-item": {
		body: partialMyItem$0,
		defaults: {
			item: null,
			pos: 0
		}
	}
};

function innerComponentAttrs$0(elem, prev, host) {
	prev.items = host.store.data.items1;
}

function innerComponentAttrs$1(elem, prev, host) {
	prev.items = host.store.data.items2;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	appendChild(target$0, elemWithText("h2", "Default partials"));
	const innerComponent$0 = scope.innerComponent$0 = appendChild(target$0, createComponent("inner-component", InnerComponent, host));
	const propSet$0 = scope.propSet$0 = propsSet(innerComponent$0);
	innerComponentAttrs$0(innerComponent$0, propSet$0, host);
	mountComponent(innerComponent$0, propSet$0);
	appendChild(target$0, elemWithText("h2", "Override partials"));
	const innerComponent$1 = scope.innerComponent$1 = appendChild(target$0, createComponent("inner-component", InnerComponent, host));
	const propSet$1 = scope.propSet$1 = propsSet(innerComponent$1);
	innerComponentAttrs$1(innerComponent$1, propSet$1, host);
	propSet$1["partial:item"] = assign({ host }, partials["my-item"]);
	mountComponent(innerComponent$1, propSet$1);
	subscribeStore(host, ["items1", "items2", "comment", "pos", "item"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { innerComponent$0, propSet$0, innerComponent$1, propSet$1 } = scope;
	innerComponentAttrs$0(innerComponent$0, propSet$0, host);
	updateComponent(innerComponent$0, propSet$0);
	innerComponentAttrs$1(innerComponent$1, propSet$1, host);
	updateComponent(innerComponent$1, propSet$1, [host.props.title, host.state.tooltip, host.store.data.comment, host.store.data.pos, host.store.data.item]);
}

function template$0Unmount(scope) {
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.innerComponent$1 = unmountComponent(scope.innerComponent$1);
}

function divAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "title", host.props.title);
	updateAttribute(elem, prev, "tooltip", host.state.tooltip);
	updateAttribute(elem, prev, "comment", host.store.data.comment);
}

function spanAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "value", host.store.data.pos);
}

function chooseBody$0(host, injector, scope) {
	const p$0 = insert(injector, elem("p"));
	appendChild(p$0, text("Has title "));
	scope.text$2 = appendChild(p$0, text(host.props.title));
	return chooseBody$0Update;
}

chooseBody$0.dispose = chooseBody$0Unmount;

function chooseBody$0Update(host, scope) {
	updateText(scope.text$2, host.props.title);
}

function chooseBody$0Unmount(scope) {
	scope.text$2 = null;
}

function chooseBody$1(host, injector) {
	insert(injector, elemWithText("p", "No title"));
}

function chooseEntry$0(host) {
	return host.props.title ? chooseBody$0 : chooseBody$1;
}

function partialMyItem$0(host, injector, scope) {
	const div$0 = scope.div$0 = insert(injector, elem("div"));
	const attrSet$0 = scope.attrSet$0 = obj();
	divAttrs$0(div$0, attrSet$0, host);
	const span$0 = scope.span$0 = appendChild(div$0, elem("span"));
	const attrSet$1 = scope.attrSet$1 = obj();
	spanAttrs$0(span$0, attrSet$1, host);
	scope.text$0 = appendChild(span$0, text(host.store.data.item));
	scope.choose$0 = mountBlock(host, injector, chooseEntry$0);
	return partialMyItem$0Update;
}

partialMyItem$0.dispose = partialMyItem$0Unmount;

function partialMyItem$0Update(host, scope) {
	divAttrs$0(scope.div$0, scope.attrSet$0, host);
	spanAttrs$0(scope.span$0, scope.attrSet$1, host);
	updateText(scope.text$0, host.store.data.item);
	updateBlock(scope.choose$0);
}

function partialMyItem$0Unmount(scope) {
	scope.choose$0 = unmountBlock(scope.choose$0);
	scope.attrSet$0 = scope.attrSet$1 = scope.text$0 = scope.span$0 = scope.div$0 = null;
}