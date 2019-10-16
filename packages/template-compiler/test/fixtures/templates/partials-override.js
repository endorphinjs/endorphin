import { appendChild, assign, createComponent, elem, elemWithText, insert, mountComponent, obj, subscribeStore, text, unmountComponent, updateAttribute, updateComponent, updateText } from "endorphin";
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
	updateAttribute(elem, prev, "items", host.store.data.items1);
}

function innerComponentAttrs$1(elem, prev, host) {
	updateAttribute(elem, prev, "items", host.store.data.items2);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	appendChild(target$0, elemWithText("h2", "Default partials"));
	const innerComponent$0 = scope.innerComponent$0 = appendChild(target$0, createComponent("inner-component", InnerComponent, host));
	const attrSet$0 = scope.attrSet$0 = obj();
	innerComponentAttrs$0(innerComponent$0, attrSet$0, host);
	mountComponent(innerComponent$0, attrSet$0);
	appendChild(target$0, elemWithText("h2", "Override partials"));
	const innerComponent$1 = scope.innerComponent$1 = appendChild(target$0, createComponent("inner-component", InnerComponent, host));
	const attrSet$1 = scope.attrSet$1 = obj();
	innerComponentAttrs$1(innerComponent$1, attrSet$1, host);
	attrSet$1["partial:item"] = assign({ host }, partials["my-item"]);
	mountComponent(innerComponent$1, attrSet$1);
	subscribeStore(host, ["items1", "items2"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { innerComponent$0, attrSet$0, innerComponent$1, attrSet$1 } = scope;
	innerComponentAttrs$0(innerComponent$0, attrSet$0, host);
	updateComponent(innerComponent$0, attrSet$0);
	innerComponentAttrs$1(innerComponent$1, attrSet$1, host);
	updateComponent(innerComponent$1, attrSet$1);
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
	const attrSet$2 = scope.attrSet$2 = obj();
	spanAttrs$0(span$0, attrSet$2, host);
	scope.text$0 = appendChild(span$0, text(host.store.data.item));
	return partialMyItem$0Update;
}

partialMyItem$0.dispose = partialMyItem$0Unmount;

function partialMyItem$0Update(host, scope) {
	spanAttrs$0(scope.span$0, scope.attrSet$2, host);
	updateText(scope.text$0, host.store.data.item);
}

function partialMyItem$0Unmount(scope) {
	scope.attrSet$2 = scope.text$0 = scope.span$0 = null;
}