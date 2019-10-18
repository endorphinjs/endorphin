import { appendChild, elem, obj, updateAttribute } from "endorphin";
import { count } from "main";

function divAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "a", host.props.count);
	updateAttribute(elem, prev, "b", count(host, host.props.items));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	const attrSet$0 = scope.attrSet$0 = obj();
	divAttrs$0(div$0, attrSet$0, host);
	return template$0Update;
}

function template$0Update(host, scope) {
	divAttrs$0(scope.div$0, scope.attrSet$0, host);
}