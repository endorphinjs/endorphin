import { appendChild, elem, obj, updateAttribute, updateClass } from "endorphin";

function setVars$0(host, scope) {
	scope.__if0 = (host.state.foo === "bar");
	scope.__if1 = (scope.__if0 && ((host.state.customBg && (host.state.customBg !== "default")) && !scope["pro-mode"]));
}

function mainAttrs$0(elem, prev, host, scope) {
	updateAttribute(elem, prev, "style", (scope.__if0 ? host.state.css : undefined));
	updateClass(elem, prev, (scope.__if1 ? ("__bg __" + host.state.customBg) : ""));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const attrSet$0 = scope.attrSet$0 = obj();
	mainAttrs$0(main$0, attrSet$0, host, scope);
	return template$0Update;
}

function template$0Update(host, scope) {
	setVars$0(host, scope);
	mainAttrs$0(scope.main$0, scope.attrSet$0, host, scope);
}