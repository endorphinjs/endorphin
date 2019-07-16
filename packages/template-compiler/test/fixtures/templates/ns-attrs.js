import { appendChild, attributeSet, elemNS, finalizeAttributes, finalizeAttributesNS, setAttribute, setPendingAttributeNS } from "endorphin";
const ns$0 = "http://www.w3.org/2000/svg";
const ns$1 = "http://www.w3.org/1999/xlink";

function ifAttr$0(host, scope) {
	if (host.props.cond) {
		setPendingAttributeNS(scope._a$0, ns$1, "href", host.state.url2);
	}
}

function ifAttr$1(host, scope) {
	const { _a$1 } = scope;
	if (host.props.cond) {
		setPendingAttributeNS(_a$1, ns$1, "href", host.state.url2);
		_a$1.c.title = "foo";
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
	const image$0 = scope.image$0 = appendChild(svg$0, elemNS("image", ns$0));
	const _a$0 = scope._a$0 = attributeSet();
	setPendingAttributeNS(_a$0, ns$1, "href", host.state.url);
	ifAttr$0(host, scope);
	finalizeAttributesNS(image$0, _a$0);
	const image2$0 = scope.image2$0 = appendChild(svg$0, elemNS("image2", ns$0));
	const _a$1 = scope._a$1 = attributeSet();
	setPendingAttributeNS(_a$1, ns$1, "href", host.state.url);
	ifAttr$1(host, scope);
	finalizeAttributes(image2$0, _a$1) | finalizeAttributesNS(image2$0, _a$1);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0, _a$1, image2$0 } = scope;
	setPendingAttributeNS(_a$0, ns$1, "href", host.state.url);
	ifAttr$0(host, scope);
	finalizeAttributesNS(scope.image$0, _a$0);
	setPendingAttributeNS(_a$1, ns$1, "href", host.state.url);
	ifAttr$1(host, scope);
	finalizeAttributes(image2$0, _a$1) | finalizeAttributesNS(image2$0, _a$1);
}

function template$0Unmount(scope) {
	scope._a$0 = scope.image$0 = scope._a$1 = scope.image2$0 = null;
}