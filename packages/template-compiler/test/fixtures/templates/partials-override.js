import { elemWithText, setAttribute, createComponent, mountComponent, unmountComponent, updateComponent, assign, subscribeStore, elem, createInjector, text, updateText, finalizeAttributes, insert } from "endorphin";
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
	target$0.appendChild(elemWithText("h2", "Default partials"));
	const innerComponent$0 = scope.innerComponent$0 = target$0.appendChild(createComponent("inner-component", InnerComponent, host));
	const inj$0 = scope.inj$0 = innerComponent$0.componentModel.input;
	setAttribute(inj$0, "items", host.store.data.items1);
	mountComponent(innerComponent$0);
	target$0.appendChild(elemWithText("h2", "Override partials"));
	const innerComponent$1 = scope.innerComponent$1 = target$0.appendChild(createComponent("inner-component", InnerComponent, host));
	const inj$1 = scope.inj$1 = innerComponent$1.componentModel.input;
	setAttribute(inj$1, "items", host.store.data.items2);
	mountComponent(innerComponent$1, {
		"partial:item": assign({ host }, partials["my-item"])
	});
	subscribeStore(host, ["items1", "items2"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	setAttribute(scope.inj$0, "items", host.store.data.items1);
	updateComponent(scope.innerComponent$0);
	setAttribute(scope.inj$1, "items", host.store.data.items2);
	updateComponent(scope.innerComponent$1);
}

function template$0Unmount(scope) {
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.innerComponent$1 = unmountComponent(scope.innerComponent$1);
	scope.inj$0 = scope.inj$1 = null;
}

function partialMyItem$0(host, injector, scope) {
	const div$0 = insert(injector, elem("div"));
	const span$0 = div$0.appendChild(elem("span"));
	const inj$2 = scope.inj$2 = createInjector(span$0);
	setAttribute(inj$2, "value", host.store.data.pos);
	scope.text$0 = span$0.appendChild(text(host.store.data.item));
	finalizeAttributes(inj$2);
	return partialMyItem$0Update;
}

partialMyItem$0.dispose = partialMyItem$0Unmount;

function partialMyItem$0Update(host, injector, scope) {
	const { inj$2 } = scope;
	setAttribute(inj$2, "value", host.store.data.pos);
	updateText(scope.text$0, host.store.data.item);
	finalizeAttributes(inj$2);
}

function partialMyItem$0Unmount(scope) {
	scope.inj$2 = scope.text$0 = null;
}