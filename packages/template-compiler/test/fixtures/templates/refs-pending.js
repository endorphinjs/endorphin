import { animate, clearBlock, createInjector, detachPendingEvents, domRemove, elem, finalizeAttributes, finalizePendingEvents, finalizePendingRefs, getPartial, insert, mountBlock, mountPartial, obj, pendingEvents, setPendingRef, stopAnimation, unmountBlock, unmountPartial, updateBlock, updateClass, updatePartial } from "endorphin";
import { count } from "main";

export const partials = {
	button: {
		body: partialButton$0,
		defaults: {
			action: null,
			icon: null,
			class: null,
			tsid: null
		}
	}
};

function setVars$0(host, scope) {
	scope.isMine = undefined;
}

function mainPreparePending$0(pending, host, scope) {
	pending.class = (scope.isMine ? "is-mine" : "");
}

function ifBody$0(host, injector, scope) {
	scope.partial$0 = mountPartial(host, injector, getPartial(host, "button", partials), {
		action: "more",
		icon: "menu",
		":a": scope.attrSet$0,
		":e": scope.eventSet$0
	});
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		action: "more",
		icon: "menu",
		":a": scope.attrSet$0,
		":e": scope.eventSet$0
	});
}

function ifBody$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

function ifEntry$0(host) {
	return (count(host, host.state.actions) > 1) ? ifBody$0 : null;
}

function animatedMsgMenu$0(host, injector, scope) {
	const msgMenu$0 = scope.msgMenu$0 = insert(injector, elem("msg-menu"));
	setPendingRef(scope.refs$0, "menu", msgMenu$0);
}

function animatedMsgMenu$0Update(host, scope) {
	setPendingRef(scope.refs$0, "menu", scope.msgMenu$0);
}

function animatedMsgMenu$0Unmount(scope) {
	scope.msgMenu$0 = domRemove(scope.msgMenu$0);
}

function ifBody$1(host, injector, scope) {
	scope.msgMenu$0 ? animatedMsgMenu$0Update(host, scope) : animatedMsgMenu$0(host, injector, scope);
	stopAnimation(scope.msgMenu$0, true);
	return ifBody$1Update;
}

ifBody$1.dispose = ifBody$1Unmount;

function ifBody$1Update(host, scope) {
	animatedMsgMenu$0Update(host, scope);
}

function ifBody$1Unmount(scope, host) {
	animate(scope.msgMenu$0, "global:msg-pop-out 0.15s ease-in", () => animatedMsgMenu$0Unmount(scope, host));
}

function ifEntry$1(host) {
	return host.state.showMenu ? ifBody$1 : null;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$1 = createInjector(target$0);
	const refs$0 = scope.refs$0 = obj();
	setVars$0(host, scope);
	const main$0 = scope.main$0 = insert(inj$1, elem("main"));
	const inj$0 = createInjector(main$0);
	const eventSet$0 = scope.eventSet$0 = pendingEvents(host, main$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	const prevPending$0 = scope.prevPending$0 = obj();
	mainPreparePending$0(attrSet$0, host, scope);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	finalizePendingEvents(eventSet$0);
	finalizeAttributes(main$0, attrSet$0, prevPending$0);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	finalizePendingRefs(host, refs$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0 } = scope;
	setVars$0(host, scope);
	mainPreparePending$0(attrSet$0, host, scope);
	updateBlock(scope.if$0);
	finalizePendingEvents(scope.eventSet$0);
	finalizeAttributes(scope.main$0, attrSet$0, scope.prevPending$0);
	updateBlock(scope.if$1);
	finalizePendingRefs(host, scope.refs$0);
}

function template$0Unmount(scope) {
	scope.eventSet$0 = detachPendingEvents(scope.eventSet$0);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = clearBlock(scope.if$1);
}

function msgButtonAttrs$0(elem, prev, host, scope) {
	updateClass(elem, prev, scope.class);
}

function partialButton$0(host, injector, scope) {
	const msgButton$0 = scope.msgButton$0 = insert(injector, elem("msg-button"));
	const attrSet$1 = scope.attrSet$1 = obj();
	msgButtonAttrs$0(msgButton$0, attrSet$1, host, scope);
	return partialButton$0Update;
}

partialButton$0.dispose = partialButton$0Unmount;

function partialButton$0Update(host, scope) {
	msgButtonAttrs$0(scope.msgButton$0, scope.attrSet$1, host, scope);
}

function partialButton$0Unmount(scope) {
	scope.attrSet$1 = scope.msgButton$0 = null;
}