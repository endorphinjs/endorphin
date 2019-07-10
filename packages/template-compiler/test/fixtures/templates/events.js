import { addEvent, detachPendingEvents, elem, finalizePendingEvents, get, pendingEvents, removeEvent, setPendingEvent } from "endorphin";
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

function ifAttr$0(host, scope) {
	if (host.props.c1) {
		setPendingEvent(scope.events$0, "click", onClick$1, scope);
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = target$0.appendChild(elem("main"));
	const events$0 = scope.events$0 = pendingEvents(host, main$0);
	setPendingEvent(events$0, "click", onClick$0, scope);
	scope.mouseenter$0 = addEvent(main$0, "mouseenter", onMouseenter$0, host, scope);
	scope.mouseleave$0 = addEvent(main$0, "mouseleave", onMouseleave$0, host, scope);
	scope.keypress$0 = addEvent(main$0, "keypress", onKeypress$0, host, scope);
	scope.mousedown$0 = addEvent(main$0, "mousedown", onMousedown$0, host, scope);
	scope.event2$0 = addEvent(main$0, "event2", onEvent2$0, host, scope);
	ifAttr$0(host, scope);
	finalizePendingEvents(events$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { events$0 } = scope;
	setPendingEvent(events$0, "click", onClick$0, scope);
	ifAttr$0(host, scope);
	finalizePendingEvents(events$0);
}

function template$0Unmount(scope) {
	scope.events$0 = detachPendingEvents(scope.events$0);
	scope.mouseenter$0 = removeEvent("mouseenter", scope.mouseenter$0);
	scope.mouseleave$0 = removeEvent("mouseleave", scope.mouseleave$0);
	scope.keypress$0 = removeEvent("keypress", scope.keypress$0);
	scope.mousedown$0 = removeEvent("mousedown", scope.mousedown$0);
	scope.event2$0 = removeEvent("event2", scope.event2$0);
}