import { elem, text, updateText, createComponent, insert, updateBlock, mountBlock, mountComponent, updateComponent, markSlotUpdate } from "../../../src/runtime";
import * as InnerComponent from "./inner-component.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const header0 = target0.appendChild(elem("header"));
	scope.$_text0 = header0.appendChild(text(host.props.header));
	const innerComponent0 = scope.$_innerComponent0 = target0.appendChild(createComponent("inner-component", InnerComponent, host));
	const injector0 = innerComponent0.componentModel.input;
	const div0 = insert(injector0, elem("div"));
	scope.$_text1 = div0.appendChild(text(host.props.content));
	scope.$_block0 = mountBlock(host, injector0, $$conditionEntry0);
	mountComponent(innerComponent0);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateText(scope.$_text0, host.props.header);
	let s__innerComponent0 = 0;
	s__innerComponent0 |= updateText(scope.$_text1, host.props.content);
	s__innerComponent0 |= updateBlock(scope.$_block0);
	markSlotUpdate(scope.$_innerComponent0, "", s__innerComponent0);
	updateComponent(scope.$_innerComponent0);
	return s__innerComponent0;
}

function $$conditionContent0(host, injector, scope) {
	const p0 = insert(injector, elem("p"));
	scope.$_text2 = p0.appendChild(text(host.props.content2));
	return $$conditionContent0Update;
}

function $$conditionContent0Update(host, injector, scope) {
	updateText(scope.$_text2, host.props.content2);
}

function $$conditionEntry0(host) {
	if (host.props.enabled) {
		return $$conditionContent0;
	}
}
