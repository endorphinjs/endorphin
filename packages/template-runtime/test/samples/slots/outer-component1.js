import { elem, text, updateText, createComponent, insert, mountComponent, updateComponent, markSlotUpdate } from "../../../src/runtime";
import * as InnerComponent from "./inner-component.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const header0 = target0.appendChild(elem("header"));
	scope.$_text0 = header0.appendChild(text(host.props.header));
	const innerComponent0 = scope.$_innerComponent0 = target0.appendChild(createComponent("inner-component", InnerComponent, host));
	const injector0 = innerComponent0.componentModel.input;
	scope.$_text1 = insert(injector0, text(host.props.content));
	mountComponent(innerComponent0);
	const footer0 = target0.appendChild(elem("footer"));
	scope.$_text2 = footer0.appendChild(text(host.props.footer));
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateText(scope.$_text0, host.props.header);
	let s__innerComponent0 = 0;
	s__innerComponent0 |= updateText(scope.$_text1, host.props.content);
	markSlotUpdate(scope.$_innerComponent0, "", s__innerComponent0);
	updateComponent(scope.$_innerComponent0);
	updateText(scope.$_text2, host.props.footer);
	return s__innerComponent0;
}
