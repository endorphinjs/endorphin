import { appendChild, elemNS, obj, setAttribute, updateAttribute, updateAttributeNS } from "endorphin";
const ns$0 = "http://www.w3.org/2000/svg";
const ns$1 = "http://www.w3.org/1999/xlink";

function imageAttrs$0(elem, prev, host) {
	updateAttributeNS(elem, prev, ns$1, "href", (host.props.cond ? host.state.url2 : host.state.url));
}

function image2Attrs$0(elem, prev, host) {
	updateAttributeNS(elem, prev, ns$1, "href", (host.props.cond ? host.state.url2 : host.state.url));
	updateAttribute(elem, prev, "title", (host.props.cond ? "foo" : null));
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
	const attrSet$0 = scope.attrSet$0 = obj();
	imageAttrs$0(image$0, attrSet$0, host);
	const image2$0 = scope.image2$0 = appendChild(svg$0, elemNS("image2", ns$0));
	const attrSet$1 = scope.attrSet$1 = obj();
	image2Attrs$0(image2$0, attrSet$1, host);
	return template$0Update;
}

function template$0Update(host, scope) {
	imageAttrs$0(scope.image$0, scope.attrSet$0, host);
	image2Attrs$0(scope.image2$0, scope.attrSet$1, host);
}