import { addClassIf, animate, attributeSet, createInjector, detachPendingEvents, domRemove, elem, finalizeAttributes, finalizeAttributesNS, finalizePendingEvents, finalizePendingRefs, getPartial, insert, mountBlock, mountPartial, obj, pendingEvents, setAttributeExpression, setPendingRef, stopAnimation, toggleClassIf, unmountBlock, unmountPartial, updateAttributeExpression, updateBlock, updatePartial } from "endorphin";
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

function ifBody$0(host, injector, scope) {
	scope.partial$0 = mountPartial(host, injector, getPartial(host, "button", partials), {
		action: "more",
		icon: "menu",
		$$_attrs: scope._a$0,
		$$_events: scope._e$0
	});
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, scope) {
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		action: "more",
		icon: "menu"
	});
}

function ifBody$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

function ifEntry$0(host) {
	if ((count(host, host.state.actions) > 1)) {
		return ifBody$0;
	}
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
	if (host.state.showMenu) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$1 = createInjector(target$0);
	const refs$0 = scope.refs$0 = obj();
	const main$0 = scope.main$0 = insert(inj$1, elem("main"));
	const inj$0 = createInjector(main$0);
	const _a$0 = scope._a$0 = attributeSet();
	const _e$0 = scope._e$0 = pendingEvents(host, main$0);
	scope.class$0 = addClassIf(main$0, "is-mine", scope["is-mine"]);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	finalizePendingEvents(_e$0);
	finalizeAttributes(main$0, _a$0) | finalizeAttributesNS(main$0, _a$0);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	finalizePendingRefs(host, refs$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0, main$0 } = scope;
	scope.class$0 = toggleClassIf(main$0, "is-mine", scope["is-mine"], scope.class$0);
	updateBlock(scope.if$0);
	finalizePendingEvents(scope._e$0);
	finalizeAttributes(main$0, _a$0) | finalizeAttributesNS(main$0, _a$0);
	updateBlock(scope.if$1);
	finalizePendingRefs(host, scope.refs$0);
}

function template$0Unmount(scope) {
	scope._e$0 = detachPendingEvents(scope._e$0);
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.refs$0 = scope._a$0 = scope.class$0 = scope.main$0 = null;
}

function partialButton$0(host, injector, scope) {
	const msgButton$0 = scope.msgButton$0 = insert(injector, elem("msg-button"));
	scope.classAttr$0 = setAttributeExpression(msgButton$0, "class", scope.class);
	return partialButton$0Update;
}

partialButton$0.dispose = partialButton$0Unmount;

function partialButton$0Update(host, scope) {
	scope.classAttr$0 = updateAttributeExpression(scope.msgButton$0, "class", scope.class, scope.classAttr$0);
}

function partialButton$0Unmount(scope) {
	scope.classAttr$0 = scope.msgButton$0 = null;
}