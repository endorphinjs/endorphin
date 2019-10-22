import { appendChild, elem, obj, text, updateAttribute, updateClass, updateText } from "endorphin";

function setVars$0(host, scope) {
	scope.v1 = "bar";
	scope.v2 = (1 + 2);
	scope.v3 = "foo " + host.props.v1;
}

function divAttrs$0(elem, prev, host, scope) {
	updateClass(elem, prev, scope.v1);
	updateAttribute(elem, prev, "title", scope.v3);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	const attrSet$0 = scope.attrSet$0 = obj();
	divAttrs$0(div$0, attrSet$0, host, scope);
	appendChild(div$0, text("Sum: "));
	scope.text$1 = appendChild(div$0, text(scope.v2));
	return template$0Update;
}

function template$0Update(host, scope) {
	setVars$0(host, scope);
	divAttrs$0(scope.div$0, scope.attrSet$0, host, scope);
	updateText(scope.text$1, scope.v2);
}