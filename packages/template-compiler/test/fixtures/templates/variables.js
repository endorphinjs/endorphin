import { createInjector, setAttribute, elem, text, updateText, finalizeAttributes } from "endorphin";

function setVars$0(host, scope) {
	scope.v1 = "bar";
	scope.v2 = (1 + 2);
	scope.v3 = "foo " + host.props.v1;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const div$0 = target$0.appendChild(elem("div"));
	const inj$0 = scope.inj$0 = createInjector(div$0);
	setAttribute(inj$0, "class", scope.v1);
	setAttribute(inj$0, "title", host.props.v3);
	div$0.appendChild(text("Sum: "));
	scope.text$1 = div$0.appendChild(text(scope.v2));
	finalizeAttributes(inj$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { inj$0 } = scope;
	setVars$0(host, scope);
	setAttribute(inj$0, "class", scope.v1);
	setAttribute(inj$0, "title", host.props.v3);
	updateText(scope.text$1, scope.v2);
	finalizeAttributes(inj$0);
}

function template$0Unmount(scope) {
	scope.inj$0 = scope.text$1 = null;
}