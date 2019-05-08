import { createComponent, mountComponent, updateComponent, unmountComponent, addDisposeCallback } from "endorphin";
import * as MyComponent from "./my-component/";
import * as MyComponent2 from "./my-component2/index.html";
import * as OtherComponent from "./some-component.html";
import * as SomeComponent2 from "./some-component2.html";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComponent$0 = scope.myComponent$0 = target$0.appendChild(createComponent("my-component", MyComponent, host));
	mountComponent(myComponent$0);
	const myComponent2$0 = scope.myComponent2$0 = target$0.appendChild(createComponent("my-component2", MyComponent2, host));
	mountComponent(myComponent2$0);
	const otherComponent$0 = scope.otherComponent$0 = target$0.appendChild(createComponent("other-component", OtherComponent, host));
	mountComponent(otherComponent$0);
	const someComponent2$0 = scope.someComponent2$0 = target$0.appendChild(createComponent("some-component2", SomeComponent2, host));
	mountComponent(someComponent2$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateComponent(scope.myComponent$0);
	updateComponent(scope.myComponent2$0);
	updateComponent(scope.otherComponent$0);
	updateComponent(scope.someComponent2$0);
}

function template$0Unmount(scope) {
	scope.myComponent$0 = unmountComponent(scope.myComponent$0);
	scope.myComponent2$0 = unmountComponent(scope.myComponent2$0);
	scope.otherComponent$0 = unmountComponent(scope.otherComponent$0);
	scope.someComponent2$0 = unmountComponent(scope.someComponent2$0);
}