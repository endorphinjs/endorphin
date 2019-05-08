import { elem, addStaticEvent, removeStaticEvent, elemWithText, insert, addDisposeCallback, createInjector, mountIterator, updateIterator, unmountIterator } from "endorphin";

function setVars$0(host, scope) {
	scope.foo = 1;
}

function forSelect$0(host) {
	return host.props.items;
}

function setVars$1(host, scope) {
	scope.bar = scope.foo;
}

function onClick$0(evt) {
	this.host.componentModel.definition.handleClick(this.scope.index, this.scope.foo, this.scope.bar, this.host, evt, this.target);
}

function forContent$0(host, injector, scope) {
	setVars$1(host, scope);
	const li$0 = insert(injector, elemWithText("li", "item"));
	scope.click$0 = addStaticEvent(li$0, "click", onClick$0, host, scope);
	addDisposeCallback(host, forContent$0Unmount);
	return forContent$0Update;
}

function forContent$0Update(host, injector, scope) {
	setVars$1(host, scope);
}

function forContent$0Unmount(scope) {
	scope.click$0 = removeStaticEvent(scope.click$0);
}

function setVars$2(host, scope) {
	scope.foo = 2;
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const ul$0 = target$0.appendChild(elem("ul"));
	const inj$0 = createInjector(ul$0);
	setVars$0(host, scope);
	scope.for$0 = mountIterator(host, inj$0, forSelect$0, forContent$0);
	setVars$2(host, scope);
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	setVars$0(host, scope);
	updateIterator(scope.for$0);
	setVars$2(host, scope);
}

function template$0Unmount(scope) {
	scope.for$0 = unmountIterator(scope.for$0);
}