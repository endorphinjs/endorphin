import { appendChild, elem, obj, setAttribute, updateAttribute } from "endorphin";

function mainAttrs$0(elem, prev, host) {
	updateAttribute(elem, "a1", (host.props.c3 ? "3" : host.props.id), prev);
	updateAttribute(elem, "a2", (host.props.c3 ? 3 : (host.props.c2 ? 2 : (host.props.c1 ? "1" : "0"))), prev);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	setAttribute(main$0, "a3", "4");
	const attrSet$0 = scope.attrSet$0 = obj();
	mainAttrs$0(main$0, attrSet$0, host);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	mainAttrs$0(scope.main$0, scope.attrSet$0, host);
}

function template$0Unmount(scope) {
	scope.attrSet$0 = scope.main$0 = null;
}