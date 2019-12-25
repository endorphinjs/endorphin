import { appendChild, assign, createComponent, elem, elemWithText, insert, mountComponent, obj, propsSet, subscribeStore, text, unmountComponent, updateAttribute, updateComponent, updateText } from "endorphin";
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
	subscribeStore(host, ["items1", "items2"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { innerComponent$0, propSet$0, innerComponent$1, propSet$1 } = scope;
	innerComponentAttrs$0(innerComponent$0, propSet$0, host);
	updateComponent(innerComponent$0, propSet$0);
	innerComponentAttrs$1(innerComponent$1, propSet$1, host);
	updateComponent(innerComponent$1, propSet$1);
}

function template$0Unmount(scope) {
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.innerComponent$1 = unmountComponent(scope.innerComponent$1);
}

function spanAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "value", host.store.data.pos);
}

function partialMyItem$0(host, injector, scope) {
	const div$0 = insert(injector, elem("div"));
	const span$0 = scope.span$0 = appendChild(div$0, elem("span"));
	const attrSet$0 = scope.attrSet$0 = obj();
	spanAttrs$0(span$0, attrSet$0, host);
	scope.text$0 = appendChild(span$0, text(host.store.data.item));
	return partialMyItem$0Update;
}

partialMyItem$0.dispose = partialMyItem$0Unmount;

function partialMyItem$0Update(host, scope) {
	spanAttrs$0(scope.span$0, scope.attrSet$0, host);
	updateText(scope.text$0, host.store.data.item);
}

function partialMyItem$0Unmount(scope) {
	scope.attrSet$0 = scope.text$0 = scope.span$0 = null;
}