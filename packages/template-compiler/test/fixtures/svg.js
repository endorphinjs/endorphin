import { elemWithText, elemNS, createInjector, setAttributeNS, finalizeAttributes, addDisposeCallback } from "endorphin";
const ns$0 = "http://www.w3.org/2000/svg";
const ns$1 = "http://www.w3.org/1999/xlink";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	target$0.appendChild(elemWithText("header", "Header"));
	const svg$0 = target$0.appendChild(elemNS("svg", ns$0));
	svg$0.setAttribute("width", "16");
	svg$0.setAttribute("height", "16");
	svg$0.setAttribute("viewBox", "0 0 16 16");
	svg$0.setAttribute("version", "1.1");
	svg$0.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	svg$0.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
	const path$0 = svg$0.appendChild(elemNS("path", ns$0));
	path$0.setAttribute("class", "svg-fill");
	path$0.setAttribute("d", "M8 11.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-5c.83 0 1.5.67 1.5 1.5S8.83 9.5 8 9.5 6.5 8.83 6.5 8 7.17 6.5 8 6.5zm0-5c.83 0 1.5.67 1.5 1.5S8.83 4.5 8 4.5 6.5 3.83 6.5 3 7.17 1.5 8 1.5z");
	const image$0 = svg$0.appendChild(elemNS("image", ns$0));
	const inj$0 = scope.inj$0 = createInjector(image$0);
	setAttributeNS(inj$0, ns$1, "href", host.state.url);
	image$0.setAttribute("height", "100px");
	image$0.setAttribute("width", "100px");
	finalizeAttributes(inj$0);
	target$0.appendChild(elemWithText("footer", "Footer"));
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	const { inj$0 } = scope;
	setAttributeNS(inj$0, ns$1, "href", host.state.url);
	finalizeAttributes(inj$0);
}

function template$0Unmount(scope) {
	scope.inj$0 = null;
}