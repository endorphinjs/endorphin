import { appendChild, elem, setAttributeExpression, text, updateAttributeExpression, updateText } from "endorphin";

function setVars$0(host, scope) {
	scope.v1 = "bar";
	scope.v2 = (1 + 2);
	scope.v3 = "foo " + host.props.v1;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	scope.classAttr$0 = setAttributeExpression(div$0, "class", scope.v1);
	scope.titleAttr$0 = setAttributeExpression(div$0, "title", host.props.v3);
	appendChild(div$0, text("Sum: "));
	scope.text$1 = appendChild(div$0, text(scope.v2));
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { div$0 } = scope;
	setVars$0(host, scope);
	scope.classAttr$0 = updateAttributeExpression(div$0, "class", scope.v1, scope.classAttr$0);
	scope.titleAttr$0 = updateAttributeExpression(div$0, "title", host.props.v3, scope.titleAttr$0);
	updateText(scope.text$1, scope.v2);
}

function template$0Unmount(scope) {
	scope.classAttr$0 = scope.titleAttr$0 = scope.text$1 = scope.div$0 = null;
}