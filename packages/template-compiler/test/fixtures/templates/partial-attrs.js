import { addPendingClass, appendChild, createInjector, elem, elemWithText, finalizeAttributes, finalizePendingRefs, getPartial, insert, mountPartial, obj, unmountPartial, updatePartial, updatePendingAttribute } from "endorphin";

export const partials = {
	button: {
		body: partialButton$0,
		defaults: {
			enabled: null
		}
	}
};

function divPreparePending$0(pending, host) {
	pending.foo = "bar";
	pending.a = "1";
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const refs$0 = scope.refs$0 = obj();
	const div$0 = scope.div$0 = appendChild(target$0, elem("div"));
	const inj$0 = createInjector(div$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	const prevPending$0 = scope.prevPending$0 = obj();
	divPreparePending$0(attrSet$0, host);
	scope.partial$0 = mountPartial(host, inj$0, getPartial(host, "button", partials), {
		enabled: true,
		":a": attrSet$0
	});
	finalizeAttributes(div$0, attrSet$0, prevPending$0);
	finalizePendingRefs(host, refs$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0 } = scope;
	divPreparePending$0(attrSet$0, host);
	updatePartial(scope.partial$0, getPartial(host, "button", partials), {
		enabled: true,
		":a": attrSet$0
	});
	finalizeAttributes(scope.div$0, attrSet$0, scope.prevPending$0);
	finalizePendingRefs(host, scope.refs$0);
}

function template$0Unmount(scope) {
	scope.partial$0 = unmountPartial(scope.partial$0);
}

function setPendingAttrs$0(pending, host, scope) {
	updatePendingAttribute(pending, "foo", "baz");
	updatePendingAttribute(pending, "foo2", (scope.enabled ? "bar2" : null));
}

function addPendingClass$0(pending, host, scope) {
	addPendingClass(pending, (scope.enabled ? "baz" : ""));
}

function partialButton$0(host, injector, scope) {
	setPendingAttrs$0(scope[":a"], host, scope);
	addPendingClass$0(scope[":a"], host, scope);
	insert(injector, elemWithText("span", "inner"));
	return partialButton$0Update;
}

function partialButton$0Update(host, scope) {
	setPendingAttrs$0(scope[":a"], host, scope);
	addPendingClass$0(scope[":a"], host, scope);
}