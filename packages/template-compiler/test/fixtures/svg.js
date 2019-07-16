import { appendChild, elemNS, elemWithText, setAttribute, setAttributeExpressionNS, updateAttributeExpressionNS } from "endorphin";
const ns$0 = "http://www.w3.org/2000/svg";
const ns$1 = "http://www.w3.org/1999/xlink";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	appendChild(target$0, elemWithText("header", "Header"));
	const svg$0 = appendChild(target$0, elemNS("svg", ns$0));
	setAttribute(svg$0, "width", "16");
	setAttribute(svg$0, "height", "16");
	setAttribute(svg$0, "viewBox", "0 0 16 16");
	setAttribute(svg$0, "version", "1.1");
	setAttribute(svg$0, "xmlns", "http://www.w3.org/2000/svg");
	setAttribute(svg$0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
	const path$0 = appendChild(svg$0, elemNS("path", ns$0));
	setAttribute(path$0, "class", "svg-fill");
	setAttribute(path$0, "d", "M8 11.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-5c.83 0 1.5.67 1.5 1.5S8.83 9.5 8 9.5 6.5 8.83 6.5 8 7.17 6.5 8 6.5zm0-5c.83 0 1.5.67 1.5 1.5S8.83 4.5 8 4.5 6.5 3.83 6.5 3 7.17 1.5 8 1.5z");
	const image$0 = scope.image$0 = appendChild(svg$0, elemNS("image", ns$0));
	scope.xlink_hrefAttr$0 = setAttributeExpressionNS(image$0, ns$1, "href", host.state.url);
	setAttribute(image$0, "height", "100px");
	setAttribute(image$0, "width", "100px");
	appendChild(target$0, elemWithText("footer", "Footer"));
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	scope.xlink_hrefAttr$0 = updateAttributeExpressionNS(scope.image$0, ns$1, "href", host.state.url, scope.xlink_hrefAttr$0);
}

function template$0Unmount(scope) {
	scope.xlink_hrefAttr$0 = scope.image$0 = null;
}