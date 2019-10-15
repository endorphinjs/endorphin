import { appendChild, elem, obj, updateAttribute } from "endorphin";

function mainAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "a1", host.props.id);
	updateAttribute(elem, prev, "a2", (host.props.c1 ? "1" : "0"));
	updateAttribute(elem, prev, "class", ((host.props.c3 ? ("bam" + host.props.id) : ("foo" + (host.props.c2 ? " foo bar" : "")))) + " baz");
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const attrSet$0 = scope.attrSet$0 = obj();
	mainAttrs$0(main$0, attrSet$0, host);
	return template$0Update;
}

function template$0Update(host, scope) {
	mainAttrs$0(scope.main$0, scope.attrSet$0, host);
}