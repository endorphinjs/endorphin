import { createComponent, mountComponent, unmountComponent, insert, addDisposeCallback } from "endorphin";
import * as MyComponent1 from "./my-component1.html";
import * as MyComponent2 from "./my-component2.html";
import * as InnerComponent from "./inner-component.html";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComponent1$0 = scope.myComponent1$0 = target$0.appendChild(createComponent("my-component1", MyComponent1, host));
	const inj$1 = myComponent1$0.componentModel.input;
	const myComponent2$0 = scope.myComponent2$0 = insert(inj$1, createComponent("my-component2", MyComponent2, host), "header");
	const inj$0 = myComponent2$0.componentModel.input;
	const innerComponent$0 = scope.innerComponent$0 = insert(inj$0, createComponent("inner-component", InnerComponent, host), "");
	mountComponent(innerComponent$0);
	mountComponent(myComponent2$0, {
		slot: "header"
	});
	mountComponent(myComponent1$0);
	addDisposeCallback(host, template$0Unmount);
}

function template$0Unmount(scope) {
	scope.innerComponent$0 = unmountComponent(scope.innerComponent$0);
	scope.myComponent2$0 = unmountComponent(scope.myComponent2$0);
	scope.myComponent1$0 = unmountComponent(scope.myComponent1$0);
}