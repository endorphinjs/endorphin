import { elem, mountPartial, updatePartial, unmountPartial, addDisposeCallback, createInjector, mountIterator, updateIterator, unmountIterator, finalizeAttributes, finalizeEvents, finalizeRefs, addClass, text, updateText, insert } from "endorphin";

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
	scope.partial$0 = mountPartial(host, injector, host.props['partial:button'] || partials.button, {
		item: scope.item,
		enabled: (scope.index !== 1),
		"dashed-name": "bar"
	});
	addDisposeCallback(host, forContent$0Unmount);
	return forContent$0Update;
}

function forContent$0Update(host, injector, scope) {
	updatePartial(scope.partial$0, host.props['partial:button'] || partials.button, {
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
	const ul$0 = target$0.appendChild(elem("ul"));
	const inj$0 = scope.inj$0 = createInjector(ul$0);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	finalizeAttributes(inj$0);
	finalizeEvents(inj$0);
	finalizeRefs(host);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	const { inj$0 } = scope;
	updateIterator(scope.for$0);
	finalizeAttributes(inj$0);
	finalizeEvents(inj$0);
	finalizeRefs(host);
}

function template$0Unmount(scope) {
	scope.for$0 = unmountIterator(scope.for$0);
	scope.inj$0 = null;
}

function ifAttr$0(host, injector, scope) {
	if (scope.enabled) {
		addClass(injector, "enabled");
	}
	return 0;
}

function partialButton$0(host, injector, scope) {
	const li$0 = insert(injector, elem("li"));
	const inj$1 = scope.inj$1 = createInjector(li$0);
	ifAttr$0(host, inj$1, scope);
	scope.text$0 = insert(inj$1, text(scope.item));
	finalizeAttributes(inj$1);
	addDisposeCallback(host, partialButton$0Unmount);
	return partialButton$0Update;
}

function partialButton$0Update(host, injector, scope) {
	const { inj$1 } = scope;
	ifAttr$0(host, inj$1, scope);
	updateText(scope.text$0, scope.item);
	finalizeAttributes(inj$1);
}

function partialButton$0Unmount(scope) {
	scope.inj$1 = scope.text$0 = null;
}