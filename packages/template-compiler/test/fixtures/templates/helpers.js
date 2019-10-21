import { appendChild, createInjector, elem, mountInnerHTML, obj, unmountInnerHTML, updateAttribute, updateInnerHTML } from "endorphin";
import { count } from "main";

function divAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "a", host.props.count);
	updateAttribute(elem, prev, "b", count(host, host.props.items));
}

function html$0(host) {
	return count(host, host.props.items);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	const attrSet$0 = scope.attrSet$0 = obj();
	divAttrs$0(div$0, attrSet$0, host);
	scope.html$0 = mountInnerHTML(host, inj$0, html$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	divAttrs$0(scope.div$0, scope.attrSet$0, host);
	updateInnerHTML(scope.html$0);
}

function template$0Unmount(scope) {
	scope.html$0 = unmountInnerHTML(scope.html$0);
}