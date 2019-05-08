import { elem, text, updateText, createComponent, insert, updateBlock, mountBlock, createInjector, elemWithText, mountComponent, updateComponent, markSlotUpdate } from "../../../src/runtime";
import * as InnerComponent from "./inner-component.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const header0 = target0.appendChild(elem("header"));
	scope.$_text0 = header0.appendChild(text(host.props.header));
	const innerComponent0 = scope.$_innerComponent0 = target0.appendChild(createComponent("inner-component", InnerComponent, host));
	const injector0 = innerComponent0.componentModel.input;
	const div0 = insert(injector0, elem("div"));
	const injector1 = createInjector(div0);
	insert(injector1, text("\n\t\t\t"));
	scope.$_text1 = insert(injector1, text(host.props.content));
	insert(injector1, text("\n\t\t\t"));
	scope.$_block0 = mountBlock(host, injector1, $$conditionEntry0);
	const footer0 = insert(injector0, elem("footer"), "footer");
	const injector2 = createInjector(footer0);
	footer0.setAttribute("slot", "footer");
	insert(injector2, text("\n\t\t\t"));
	scope.$_text3 = insert(injector2, text(host.props.footer));
	insert(injector2, text("\n\t\t\t"));
	scope.$_block1 = mountBlock(host, injector2, $$conditionEntry1);
	mountComponent(innerComponent0);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateText(scope.$_text0, host.props.header);
	let s__innerComponent0 = 0;
	s__innerComponent0 |= updateText(scope.$_text1, host.props.content);
	s__innerComponent0 |= updateBlock(scope.$_block0);
	let s_footer_innerComponent0 = 0;
	s_footer_innerComponent0 |= updateText(scope.$_text3, host.props.footer);
	s_footer_innerComponent0 |= updateBlock(scope.$_block1);
	markSlotUpdate(scope.$_innerComponent0, "footer", s_footer_innerComponent0);
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

function $$conditionContent1(host, injector) {
	insert(injector, elemWithText("div", "Branching footer"));
}

function $$conditionEntry1(host) {
	if (host.props.active) {
		return $$conditionContent1;
	}
}
