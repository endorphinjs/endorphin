import { addEvent, appendChild, detachPendingEvents, elem, finalizePendingEvents, pendingEvents, removeEvent, setPendingEvent } from "endorphin";
import { emit } from "endorphin/helpers";

export function method1() {}
export function method2() {}
export function onLeave() {}


function onClick$0(host, evt, target) {
	method1(host.props.foo, host.props.bar, host, evt, target);
}

function onMouseenter$0(host) {
	emit(host, "hover");
}

function onKeypress$0(host, evt) {
	evt.stopPropagation();
}

function onMousedown$0(host, e) {
	e.preventDefault();
	emit(host, "down", e.pageX, e.pageY);
}

function onEvent2$0(host) {
	emit(host, "update", { [host.props.name]: !host.props.open, key: host.props.value });
}

function onClick$1(host, evt, target) {
	method2(host.props.foo, host.props.bar, host, evt, target);
}

function ifAttr$0(host, scope) {
	if (host.props.c1) {
		setPendingEvent(scope.eventSet$0, "click", onClick$1, scope);
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = appendChild(target$0, elem("main"));
	const eventSet$0 = scope.eventSet$0 = pendingEvents(host, main$0);
	setPendingEvent(eventSet$0, "click", onClick$0, scope);
	scope.mouseenter$0 = addEvent(main$0, "mouseenter", onMouseenter$0, host, scope);
	scope.mouseleave$0 = addEvent(main$0, "mouseleave", onLeave, host, scope);
	scope.keypress$0 = addEvent(main$0, "keypress", onKeypress$0, host, scope);
	scope.mousedown$0 = addEvent(main$0, "mousedown", onMousedown$0, host, scope);
	scope.event2$0 = addEvent(main$0, "event2", onEvent2$0, host, scope);
	ifAttr$0(host, scope);
	finalizePendingEvents(eventSet$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { eventSet$0 } = scope;
	setPendingEvent(eventSet$0, "click", onClick$0, scope);
	ifAttr$0(host, scope);
	finalizePendingEvents(eventSet$0);
}

function template$0Unmount(scope) {
	scope.eventSet$0 = detachPendingEvents(scope.eventSet$0);
	scope.mouseenter$0 = removeEvent("mouseenter", scope.mouseenter$0);
	scope.mouseleave$0 = removeEvent("mouseleave", scope.mouseleave$0);
	scope.keypress$0 = removeEvent("keypress", scope.keypress$0);
	scope.mousedown$0 = removeEvent("mousedown", scope.mousedown$0);
	scope.event2$0 = removeEvent("event2", scope.event2$0);
}