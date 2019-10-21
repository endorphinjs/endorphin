import { appendChild, elem, obj, updateAttribute, updateClass } from "endorphin";
let __ifExpr, __proMode, __ifExpr_1;

function setVars$0(host) {
	__ifExpr = (host.state.foo === "bar");
	__proMode = undefined;
	__ifExpr_1 = (__ifExpr && ((host.state.customBg && (host.state.customBg !== "default")) && !__proMode));
}

function mainAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "style", (__ifExpr ? host.state.css : undefined));
	updateClass(elem, prev, (__ifExpr_1 ? ("__bg __" + host.state.customBg) : ""));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host);
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const attrSet$0 = scope.attrSet$0 = obj();
	mainAttrs$0(main$0, attrSet$0, host);
	return template$0Update;
}

function template$0Update(host, scope) {
	setVars$0(host);
	mainAttrs$0(scope.main$0, scope.attrSet$0, host);
}