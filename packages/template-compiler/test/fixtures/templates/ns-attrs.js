import { appendChild, attributeSet, elemNS, finalizeAttributes, finalizeAttributesNS, setAttribute, setPendingAttribute, setPendingAttributeNS } from "endorphin";
const ns$0 = "http://www.w3.org/2000/svg";
const ns$1 = "http://www.w3.org/1999/xlink";

function ifAttr$0(host, scope) {
	if (host.props.cond) {
		setPendingAttributeNS(scope.attrSet$0, ns$1, "href", host.state.url2);
	}
}

function ifAttr$1(host, scope) {
	const { attrSet$1 } = scope;
	if (host.props.cond) {
		setPendingAttributeNS(attrSet$1, ns$1, "href", host.state.url2);
		setPendingAttribute(attrSet$1, "title", "foo");
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const svg$0 = appendChild(target$0, elemNS("svg", ns$0));
	setAttribute(svg$0, "viewBox", "0 0 16 16");
	setAttribute(svg$0, "version", "1.1");
	setAttribute(svg$0, "xmlns", "http://www.w3.org/2000/svg");
	setAttribute(svg$0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
	const path$0 = appendChild(svg$0, elemNS("path", ns$0));
	setAttribute(path$0, "class", "svg-fill");
	setAttribute(path$0, "d", "M8 11.5c.83z");
	const image$0 = appendChild(svg$0, elemNS("image", ns$0));
	const attrSet$0 = scope.attrSet$0 = attributeSet(image$0);
	setPendingAttributeNS(attrSet$0, ns$1, "href", host.state.url);
	ifAttr$0(host, scope);
	finalizeAttributesNS(attrSet$0);
	const image2$0 = appendChild(svg$0, elemNS("image2", ns$0));
	const attrSet$1 = scope.attrSet$1 = attributeSet(image2$0);
	setPendingAttributeNS(attrSet$1, ns$1, "href", host.state.url);
	ifAttr$1(host, scope);
	finalizeAttributes(attrSet$1) | finalizeAttributesNS(attrSet$1);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0, attrSet$1 } = scope;
	setPendingAttributeNS(attrSet$0, ns$1, "href", host.state.url);
	ifAttr$0(host, scope);
	finalizeAttributesNS(attrSet$0);
	setPendingAttributeNS(attrSet$1, ns$1, "href", host.state.url);
	ifAttr$1(host, scope);
	finalizeAttributes(attrSet$1) | finalizeAttributesNS(attrSet$1);
}

function template$0Unmount(scope) {
	scope.attrSet$0 = scope.attrSet$1 = null;
}