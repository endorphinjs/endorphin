import { appendChild, createInjector, detachPendingEvents, elem, finalizeAttributes, finalizePendingEvents, finalizePendingRefs, getPartial, insert, mountIterator, mountPartial, obj, pendingEvents, text, unmountIterator, unmountPartial, updateClass, updateIterator, updatePartial, updateText } from "endorphin";

export const partials = {
	button: {
		body: partialButton$0,
		defaults: {
			item: null,
			enabled: true,
			"dashed-name": "foo",
			pos: 0
		}
	}
};

function forSelect$0(host) {
	return host.props.items;
}

function forContent$0(host, injector, scope) {
	scope.partial$0 = mountPartial(host, injector, getPartial(host, "button", partials), {
		item: scope.item,
		enabled: (scope.index !== 1),
		"dashed-name": "bar",
		":a": scope.attrSet$0,
		":e": scope.eventSet$0
	});
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		item: scope.item,
		enabled: (scope.index !== 1),
		"dashed-name": "bar",
		":a": scope.attrSet$0,
		":e": scope.eventSet$0
	});
}

function forContent$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const refs$0 = scope.refs$0 = obj();
	const ul$0 = scope.ul$0 = appendChild(target$0, elem("ul"));
	const inj$0 = createInjector(ul$0);
	const eventSet$0 = scope.eventSet$0 = pendingEvents(host, ul$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	const prevPending$0 = scope.prevPending$0 = obj();
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	finalizePendingEvents(eventSet$0);
	finalizeAttributes(ul$0, attrSet$0, prevPending$0);
	finalizePendingRefs(host, refs$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateIterator(scope.for$0);
	finalizePendingEvents(scope.eventSet$0);
	finalizeAttributes(scope.ul$0, scope.attrSet$0, scope.prevPending$0);
	finalizePendingRefs(host, scope.refs$0);
}

function template$0Unmount(scope) {
	scope.eventSet$0 = detachPendingEvents(scope.eventSet$0);
	scope.for$0 = unmountIterator(scope.for$0);
}

function liAttrs$0(elem, prev, host, scope) {
	updateClass(elem, prev, (scope.enabled ? "enabled" : ""));
}

function partialButton$0(host, injector, scope) {
	const li$0 = scope.li$0 = insert(injector, elem("li"));
	const attrSet$1 = scope.attrSet$1 = obj();
	liAttrs$0(li$0, attrSet$1, host, scope);
	scope.text$0 = appendChild(li$0, text(scope.item));
	return partialButton$0Update;
}

partialButton$0.dispose = partialButton$0Unmount;

function partialButton$0Update(host, scope) {
	liAttrs$0(scope.li$0, scope.attrSet$1, host, scope);
	updateText(scope.text$0, scope.item);
}

function partialButton$0Unmount(scope) {
	scope.attrSet$1 = scope.text$0 = scope.li$0 = null;
}