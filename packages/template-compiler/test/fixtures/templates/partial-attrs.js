import { appendChild, attributeSet, createInjector, detachPendingEvents, elem, elemWithText, finalizeAttributes, finalizeAttributesNS, finalizePendingEvents, finalizePendingRefs, getPartial, insert, mountPartial, obj, pendingEvents, unmountPartial, updatePartial } from "endorphin";

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
	const refs$0 = scope.refs$0 = obj();
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	const inj$0 = createInjector(div$0);
	const _a$0 = scope._a$0 = attributeSet();
	const _e$0 = scope._e$0 = pendingEvents(host, div$0);
	scope.partial$0 = mountPartial(host, inj$0, getPartial(host, "button", partials), {
		enabled: true,
		$$_attrs: _a$0,
		$$_events: _e$0
	});
	finalizePendingEvents(_e$0);
	finalizeAttributes(div$0, _a$0) | finalizeAttributesNS(div$0, _a$0);
	finalizePendingRefs(host, refs$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0, div$0 } = scope;
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		enabled: true
	});
	finalizePendingEvents(scope._e$0);
	finalizeAttributes(div$0, _a$0) | finalizeAttributesNS(div$0, _a$0);
	finalizePendingRefs(host, scope.refs$0);
}

function template$0Unmount(scope) {
	scope._e$0 = detachPendingEvents(scope._e$0);
	scope.partial$0 = unmountPartial(scope.partial$0);
	scope.refs$0 = scope._a$0 = scope.div$0 = null;
}

function ifAttr$0(host, scope) {
	if (scope.enabled) {
		scope.$$_attrs.c.foo2 = "bar2";
	}
}

function partialButton$0(host, injector, scope) {
	scope.$$_attrs.c.foo = "bar";
	ifAttr$0(host, scope);
	insert(injector, elemWithText("span", "inner"));
	return partialButton$0Update;
}

function partialButton$0Update(host, scope) {
	scope.$$_attrs.c.foo = "bar";
	ifAttr$0(host, scope);
}