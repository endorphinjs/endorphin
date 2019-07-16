import { appendChild, assign, createComponent, elem, elemWithText, insert, mountComponent, propsSet, setAttributeExpression, subscribeStore, text, unmountComponent, updateAttributeExpression, updateComponent, updateText } from "endorphin";
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

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	appendChild(target$0, elemWithText("h2", "Default partials"));
	const innerComponent$0 = scope.innerComponent$0 = appendChild(target$0, createComponent("inner-component", InnerComponent, host));
	const _p$0 = scope._p$0 = propsSet(innerComponent$0);
	_p$0.c.items = host.store.data.items1;
	mountComponent(innerComponent$0, _p$0.c);
	appendChild(target$0, elemWithText("h2", "Override partials"));
	const innerComponent$1 = scope.innerComponent$1 = appendChild(target$0, createComponent("inner-component", InnerComponent, host));
	const _p$1 = scope._p$1 = propsSet(innerComponent$1);
	_p$1.c.items = host.store.data.items2;
	_p$1.c["partial:item"] = assign({ host }, partials["my-item"]);
	mountComponent(innerComponent$1, _p$1.c);
	subscribeStore(host, ["items1", "items2"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _p$0, _p$1 } = scope;
	_p$0.c.items = host.store.data.items1;
	updateComponent(scope.innerComponent$0, _p$0.c);
	_p$1.c.items = host.store.data.items2;
	updateComponent(scope.innerComponent$1, _p$1.c);
}

function template$0Unmount(scope) {
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.innerComponent$1 = unmountComponent(scope.innerComponent$1);
	scope._p$0 = scope._p$1 = null;
}

function partialMyItem$0(host, injector, scope) {
	const div$0 = insert(injector, elem("div"));
	const span$0 = scope.span$0 = appendChild(div$0, elem("span"));
	scope.valueAttr$0 = setAttributeExpression(span$0, "value", host.store.data.pos);
	scope.text$0 = appendChild(span$0, text(host.store.data.item));
	return partialMyItem$0Update;
}

partialMyItem$0.dispose = partialMyItem$0Unmount;

function partialMyItem$0Update(host, scope) {
	scope.valueAttr$0 = updateAttributeExpression(scope.span$0, "value", host.store.data.pos, scope.valueAttr$0);
	updateText(scope.text$0, host.store.data.item);
}

function partialMyItem$0Unmount(scope) {
	scope.valueAttr$0 = scope.text$0 = scope.span$0 = null;
}