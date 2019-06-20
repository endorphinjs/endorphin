import { addEvent, addStaticEvent, createInjector, elem, finalizeEvents, get, mountBlock, removeStaticEvent, unmountBlock, updateBlock } from "endorphin";
import { emit } from "endorphin/helpers";

function onClick$0(evt) {
	this.host.componentModel.definition.method1(this.host.props.foo, this.host.props.bar, this.host, evt, this.target);
}

function onMouseenter$0() {
	emit(this.host, "hover");
}

function onMouseleave$0(evt) {
	this.host.componentModel.definition.onLeave(this.host, evt, evt.currentTarget, this.host, evt, this.target);
}

function onKeypress$0(evt) {
	evt.stopPropagation();
}

function onMousedown$0(e) {
	e.preventDefault();
	emit(this.host, "down", get(e, "pageX"), get(e, "pageY"));
}

function onEvent2$0() {
	emit(this.host, "update", { [this.host.props.name]: !this.host.props.open, key: this.host.props.value });
}

function onClick$1(evt) {
	this.host.componentModel.definition.method2(this.host.props.foo, this.host.props.bar, this.host, evt, this.target);
}

function ifBody$0(host, injector, scope) {
	addEvent(injector, "click", onClick$1, host, scope);
	return ifBody$0Update;
}

function ifBody$0Update(host, injector, scope) {
	addEvent(injector, "click", onClick$1, host, scope);
}

function ifEntry$0(host) {
	if (host.props.c1) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = target$0.appendChild(elem("main"));
	const inj$0 = scope.inj$0 = createInjector(main$0);
	addEvent(inj$0, "click", onClick$0, host, scope);
	scope.mouseenter$0 = addStaticEvent(main$0, "mouseenter", onMouseenter$0, host, scope);
	scope.mouseleave$0 = addStaticEvent(main$0, "mouseleave", onMouseleave$0, host, scope);
	scope.keypress$0 = addStaticEvent(main$0, "keypress", onKeypress$0, host, scope);
	scope.mousedown$0 = addStaticEvent(main$0, "mousedown", onMousedown$0, host, scope);
	scope.event2$0 = addStaticEvent(main$0, "event2", onEvent2$0, host, scope);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	finalizeEvents(inj$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { inj$0 } = scope;
	addEvent(inj$0, "click", onClick$0, host, scope);
	updateBlock(scope.if$0);
	finalizeEvents(inj$0);
}

function template$0Unmount(scope) {
	scope.mouseenter$0 = removeStaticEvent(scope.mouseenter$0);
	scope.mouseleave$0 = removeStaticEvent(scope.mouseleave$0);
	scope.keypress$0 = removeStaticEvent(scope.keypress$0);
	scope.mousedown$0 = removeStaticEvent(scope.mousedown$0);
	scope.event2$0 = removeStaticEvent(scope.event2$0);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.inj$0 = null;
}