import { appendChild, createComponent, mountComponent, unmountComponent } from "endorphin";
import * as MyComponent from "./my-component.html";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComponent$0 = scope.myComponent$0 = appendChild(target$0, createComponent("foo-bar", MyComponent, host));
	mountComponent(myComponent$0);
	const myComponent$1 = scope.myComponent$1 = appendChild(target$0, createComponent((host.props.prop + "-name"), MyComponent, host));
	mountComponent(myComponent$1);
}

template$0.dispose = template$0Unmount;

function template$0Unmount(scope) {
	scope.myComponent$0 = unmountComponent(scope.myComponent$0);
	scope.myComponent$1 = unmountComponent(scope.myComponent$1);
}