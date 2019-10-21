import { appendChild, elem, obj, text, updateAttribute, updateClass, updateText } from "endorphin";
let __v1, __v2, __v3;

function setVars$0(host) {
	__v1 = "bar";
	__v2 = (1 + 2);
	__v3 = "foo " + host.props.v1;
}

function divAttrs$0(elem, prev) {
	updateClass(elem, prev, __v1);
	updateAttribute(elem, prev, "title", __v3);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host);
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	const attrSet$0 = scope.attrSet$0 = obj();
	divAttrs$0(div$0, attrSet$0);
	appendChild(div$0, text("Sum: "));
	scope.text$1 = appendChild(div$0, text(__v2));
	return template$0Update;
}

function template$0Update(host, scope) {
	setVars$0(host);
	divAttrs$0(scope.div$0, scope.attrSet$0);
	updateText(scope.text$1, __v2);
}