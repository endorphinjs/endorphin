import { elemWithText, insert, addStaticEvent, animateIn, animateOut, addDisposeCallback, mountBlock, updateBlock, unmountBlock, createComponent, mountComponent, updateComponent, createInjector } from "../../../src/runtime";
import * as SubComponent from "./sub-component.js";

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	const injector0 = createInjector(target0);
	insert(injector0, elemWithText("h1", "Animation sample"));
	const button0 = insert(injector0, elemWithText("button", "Toggle div"));
	function handler0(event) {
		if (!host.componentModel) { return; }
		host.componentModel.definition.toggle(host, event, this);
	}
	addStaticEvent(button0, "click", handler0);
	const button1 = insert(injector0, elemWithText("button", "Toggle component"));
	function handler1(event) {
		if (!host.componentModel) { return; }
		host.componentModel.definition.toggle2(host, event, this);
	}
	addStaticEvent(button1, "click", handler1);
	scope.$_block0 = mountBlock(host, injector0, $$conditionEntry0);
	scope.$_block1 = mountBlock(host, injector0, $$conditionEntry1);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateBlock(scope.$_block0);
	updateBlock(scope.$_block1);
}

function $$template0Unmount(scope) {
	scope.$_block0 = unmountBlock(scope.$_block0);
	scope.$_block1 = unmountBlock(scope.$_block1);
}

function $$conditionContent0(host, injector, scope) {
	const div0 = scope.$_div0 = insert(injector, elemWithText("div", "\n\t\tBlock!\n\t"));
	div0.setAttribute("class", "block");
	animateIn(div0, "show 0.5s ease-out");
	addDisposeCallback(injector, $$conditionContent0Unmount);
}

function $$conditionContent0Unmount(scope) {
	scope.$_div0 = animateOut(scope.$_div0, "hide 0.5s ease-in");
}

function $$conditionEntry0(host) {
	if (host.state.active) {
		return $$conditionContent0;
	}
}

function $$conditionContent1(host, injector, scope) {
	const subComponent0 = scope.$_subComponent0 = insert(injector, createComponent("sub-component", SubComponent, host));
	animateIn(subComponent0, "show 0.5s ease-out");
	mountComponent(subComponent0);
	addDisposeCallback(injector, $$conditionContent1Unmount);
	return $$conditionContent1Update;
}

function $$conditionContent1Update(host, injector, scope) {
	updateComponent(scope.$_subComponent0);
	return 0;
}

function $$conditionContent1Unmount(scope) {
	scope.$_subComponent0 = animateOut(scope.$_subComponent0, "hide 0.5s ease-in");
}

function $$conditionEntry1(host) {
	if (host.state.active2) {
		return $$conditionContent1;
	}
}


export function toggle(component) {
	component.setState({ active: !component.state.active });
}

export function toggle2(component) {
	component.setState({ active2: !component.state.active2 });
}

