import { elem, text, insert, mountSlot, unmountSlot, addDisposeCallback } from "../../../dist/runtime.es.js";

export function props() {
	return { a: 0 };
}

export function willUnmount(component) {
	console.log('component %d will unmount', component.props.a);
}


function defaultSlot$0(host, injector) {
	insert(injector, text("Sub component"));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const slot$0 = target$0.appendChild(elem("slot"));
	scope.slot$1 = mountSlot(host, "", slot$0, defaultSlot$0);
	addDisposeCallback(host, template$0Unmount);
}

function template$0Unmount(scope) {
	scope.slot$1 = unmountSlot(scope.slot$1);
}

