import { addClassIf, appendChild, attributeSet, createInjector, detachPendingEvents, elem, finalizeAttributes, finalizeAttributesNS, finalizePendingEvents, getPartial, insert, mountIterator, mountPartial, pendingEvents, text, toggleClassIf, unmountIterator, unmountPartial, updateIterator, updatePartial, updateText } from "endorphin";

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
		$$_attrs: scope.attrSet$0.cur,
		$$_events: scope.events$0
	});
	return forContent$0Update;
}

forContent$0.dispose = forContent$0Unmount;

function forContent$0Update(host, scope) {
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		item: scope.item,
		enabled: (scope.index !== 1),
		"dashed-name": "bar"
	});
}

function forContent$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const ul$0 = appendChild(target$0, elem("ul"));
	const inj$0 = createInjector(ul$0);
	const attrSet$0 = scope.attrSet$0 = attributeSet(ul$0);
	const events$0 = scope.events$0 = pendingEvents(host, ul$0);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	finalizePendingEvents(events$0);
	finalizeAttributes(attrSet$0) | finalizeAttributesNS(attrSet$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0 } = scope;
	updateIterator(scope.for$0);
	finalizePendingEvents(scope.events$0);
	finalizeAttributes(attrSet$0) | finalizeAttributesNS(attrSet$0);
}

function template$0Unmount(scope) {
	scope.events$0 = detachPendingEvents(scope.events$0);
	scope.for$0 = unmountIterator(scope.for$0);
	scope.attrSet$0 = null;
}

function partialButton$0(host, injector, scope) {
	const li$0 = scope.li$0 = insert(injector, elem("li"));
	scope.class$0 = addClassIf(li$0, "enabled", scope.enabled);
	scope.text$0 = appendChild(li$0, text(scope.item));
	return partialButton$0Update;
}

partialButton$0.dispose = partialButton$0Unmount;

function partialButton$0Update(host, scope) {
	scope.class$0 = toggleClassIf(scope.li$0, "enabled", scope.enabled, scope.class$0);
	updateText(scope.text$0, scope.item);
}

function partialButton$0Unmount(scope) {
	scope.class$0 = scope.text$0 = scope.li$0 = null;
}