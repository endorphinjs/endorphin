import { elemWithText, elem, mountPartial, updatePartial, unmountPartial, addDisposeCallback, mountIterator, updateIterator, unmountIterator, createInjector, finalizeRefs, insert, setAttribute, text, updateText, finalizeAttributes } from '../../../src/runtime';

export const partials = {
	item: {
		body: $$partialItem0,
		defaults: {
			item: true,
			pos: 0
		}
	}
};

function $$partialItem0(host, injector, scope) {
	const li0 = insert(injector, elem('li'));
	const injector0 = scope.$_injector0 = createInjector(li0);
	setAttribute(injector0, 'pos', scope.pos);
	scope.$_text0 = li0.appendChild(text(scope.item));
	finalizeAttributes(injector0);
	addDisposeCallback(injector, $$partialItem0Unmount);
	return $$partialItem0Update;
}

function $$partialItem0Update(host, injector, scope) {
	const injector0 = scope.$_injector0;
	setAttribute(injector0, 'pos', scope.pos);
	updateText(scope.$_text0, scope.item);
	finalizeAttributes(injector0);
}

function $$partialItem0Unmount(scope) {
	scope.$_text0 = null;
	scope.$_injector0 = null;
}

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	target0.appendChild(elemWithText('h3', 'Inner component'));
	const ul0 = target0.appendChild(elem('ul'));
	const injector0 = createInjector(ul0);
	scope.$_iter0 = mountIterator(host, injector0, $$iteratorExpr0, $$iteratorBlock0);
	finalizeRefs(host);
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	updateIterator(scope.$_iter0);
	finalizeRefs(host);
}

function $$template0Unmount(scope) {
	scope.$_iter0 = unmountIterator(scope.$_iter0);
}

function $$iteratorExpr0(host) {
	return host.props.items;
}

function $$iteratorBlock0(host, injector, scope) {
	scope.$_partial0 = mountPartial(host, injector, host.props['partial:item'] || partials.item, {
		item: scope.value,
		pos: scope.index
	});
	addDisposeCallback(injector, $$iteratorBlock0Unmount);
	return $$iteratorBlock0Update;
}

function $$iteratorBlock0Update(host, injector, scope) {
	updatePartial(scope.$_partial0, host.props['partial:item'] || partials.item, {
		item: scope.value,
		pos: scope.index
	});
}

function $$iteratorBlock0Unmount(scope) {
	scope.$_partial0 = unmountPartial(scope.$_partial0);
}
