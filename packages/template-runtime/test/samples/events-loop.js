import {
	createInjector, elem, elemWithText, getProp, addStaticEvent,
	mountIterator, updateIterator, insert
} from '../../src/runtime';

export default function template(host, scope) {
	const target = host.componentView;
	const elem1 = target.appendChild(elem('ul'));
	const injector = createInjector(elem1);

	scope.foo = 1;
	scope.iter1 = mountIterator(host, injector, forEachExpr1, forEachBody1);
	scope.foo = 2;

	return updateTemplate;
}

function updateTemplate(host, scope) {
	scope.foo = 1;
	updateIterator(scope.iter1);
	scope.foo = 2;
}

function forEachExpr1(host) {
	return getProp(host, 'items');
}

function forEachBody1(host, injector, scope) {
	const elem1 = insert(injector, elemWithText('li', 'item'));
	scope.bar = scope.foo;
	addStaticEvent(elem1, 'click', onClick, host, scope);

	return forEachBody1Update;
}

function forEachBody1Update(host, injector, scope) {
	// NB in iterators, we should update scope since it’s re-created on each iteration
	scope.bar = scope.foo;
}

function onClick(evt) {
	this.host.componentModel.definition.handleClick(this.scope.index, this.scope.foo, this.scope.bar, this.host, evt, this.target);
}
