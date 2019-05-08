import { elem, insert, text, mountSlot, unmountSlot, addDisposeCallback } from "../../../dist/runtime.es.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const slot0 = target0.appendChild(elem("slot"));
	scope.$_slot0 = mountSlot(host, "", slot0, $$slotDefaultContent0);
	addDisposeCallback(host, $$template0Unmount);
}

function $$template0Unmount(scope) {
	scope.$_slot0 = unmountSlot(scope.$_slot0);
}

function $$slotDefaultContent0(host, injector) {
	insert(injector, text("Sub component"));
}


export function willUnmount(component) {
	console.log('component unmounted');
}

