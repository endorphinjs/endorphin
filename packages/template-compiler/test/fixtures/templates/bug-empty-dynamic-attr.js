import { appendChild, elem, setAttribute } from "endorphin";

function setVars$0(host, scope) {
	scope.ifExpr = (true || true);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const main$0 = appendChild(target$0, elem("main"));
	const button$0 = appendChild(main$0, elem("button"));
	setAttribute(button$0, "disabled", "");
	return template$0Update;
}

function template$0Update(host, scope) {
	setVars$0(host, scope);
}
