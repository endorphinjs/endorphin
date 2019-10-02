import { appendChild, createInjector, elem, mountInnerHTML, setAttributeExpression, unmountInnerHTML, updateAttributeExpression, updateInnerHTML } from "endorphin";
import { count } from "main";

function html$0(host) {
	return count(host, host.props.items);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	scope.aAttr$0 = setAttributeExpression(div$0, "a", host.props.count);
	scope.bAttr$0 = setAttributeExpression(div$0, "b", count(host, host.props.items));
	scope.html$0 = mountInnerHTML(host, inj$0, html$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { div$0 } = scope;
	scope.aAttr$0 = updateAttributeExpression(div$0, "a", host.props.count, scope.aAttr$0);
	scope.bAttr$0 = updateAttributeExpression(div$0, "b", count(host, host.props.items), scope.bAttr$0);
	updateInnerHTML(scope.html$0);
}

function template$0Unmount(scope) {
	scope.html$0 = unmountInnerHTML(scope.html$0);
	scope.aAttr$0 = scope.bAttr$0 = scope.div$0 = null;
}