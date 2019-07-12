import { appendChild, attributeSet, createInjector, detachPendingEvents, elem, elemWithText, finalizeAttributes, finalizeAttributesNS, finalizePendingEvents, getPartial, insert, mountPartial, pendingEvents, unmountPartial, updatePartial } from "endorphin";

export const partials = {
	button: {
		body: partialButton$0,
		defaults: {
			enabled: null
		}
	}
};

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = appendChild(target$0, elem("div"));
	const inj$0 = createInjector(div$0);
	const attrSet$0 = scope.attrSet$0 = attributeSet(div$0);
	const events$0 = scope.events$0 = pendingEvents(host, div$0);
	scope.partial$0 = mountPartial(host, inj$0, getPartial(host, "button", partials), {
		enabled: true,
		$$_attrs: attrSet$0.cur,
		$$_events: events$0
	});
	finalizePendingEvents(events$0);
	finalizeAttributes(attrSet$0) | finalizeAttributesNS(attrSet$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0 } = scope;
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		enabled: true
	});
	finalizePendingEvents(scope.events$0);
	finalizeAttributes(attrSet$0) | finalizeAttributesNS(attrSet$0);
}

function template$0Unmount(scope) {
	scope.events$0 = detachPendingEvents(scope.events$0);
	scope.partial$0 = unmountPartial(scope.partial$0);
	scope.attrSet$0 = null;
}

function ifAttr$0(host, scope) {
	if (scope.enabled) {
		scope.$$_attrs.foo2 = "bar2";
	}
}

function partialButton$0(host, injector, scope) {
	scope.$$_attrs.foo = "bar";
	ifAttr$0(host, scope);
	insert(injector, elemWithText("span", "inner"));
	return partialButton$0Update;
}

function partialButton$0Update(host, scope) {
	scope.$$_attrs.foo = "bar";
	ifAttr$0(host, scope);
}