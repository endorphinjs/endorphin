import {
	createInjector, elem, text, insert, getProp, mountIterator, updateIterator,
	getVar, updateText, addClass, finalizeAttributes, mountPartial, updatePartial
} from '../../src/runtime';

export default function partialsTemplate(host) {
	const target = host.componentView;

	const ul = target.appendChild(elem('ul'));
	const injector2 = createInjector(ul);
	const iter1 = mountIterator(host, injector2, forEachExpr1, forEachBody1);

	return function partialsTemplateUpdate() {
		updateIterator(iter1);
	};
}

export const $partials = {
	button: {
		defaults: {
			enabled: true,
			pos: 0,
			item: null
		},
		body: partialButton
	}
};

function partialButton(host, injector, scope) {
	const li = insert(injector, elem('li'));
	scope.injector2 = createInjector(li);
	ifAttr1(host, scope.injector2);
	scope.text1 = insert(scope.injector2, text(scope.item));
	finalizeAttributes(scope.injector2);

	return partialButtonUpdate;
}

function partialButtonUpdate(host, injector, scope) {
	ifAttr1(host, scope.injector2);
	updateText(scope.text1, scope.item);
	finalizeAttributes(scope.injector2);
}

function ifAttr1(host, injector) {
	if (getVar(host, 'enabled')) {
		addClass(injector, 'enabled');
	}
}

function forEachExpr1(host) {
	return getProp(host, 'items');
}

function forEachBody1(host, injector, scope) {
	scope.partial1 = mountPartial(host, injector, host.props['partial:button'] || $partials['button'], {
		item: scope.value,
		enabled: scope.index !== 1
	});

	return forEachBody1Update;
}

function forEachBody1Update(host, injector, scope) {
	updatePartial(scope.partial1, host.props['partial:button'] || $partials['button'], {
		item: scope.value,
		enabled: scope.index !== 1
	});
}
