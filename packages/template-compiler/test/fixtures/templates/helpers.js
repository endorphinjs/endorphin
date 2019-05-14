import { createInjector, setAttribute, elem, finalizeAttributes, addDisposeCallback } from "endorphin";
import { count } from "main";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = target$0.appendChild(elem("div"));
	const inj$0 = scope.inj$0 = createInjector(div$0);
	setAttribute(inj$0, "a", host.props.count);
	setAttribute(inj$0, "b", count(host, host.props.items));
	finalizeAttributes(inj$0);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	const { inj$0 } = scope;
	setAttribute(inj$0, "a", host.props.count);
	setAttribute(inj$0, "b", count(host, host.props.items));
	finalizeAttributes(inj$0);
}

function template$0Unmount(scope) {
	scope.inj$0 = null;
}