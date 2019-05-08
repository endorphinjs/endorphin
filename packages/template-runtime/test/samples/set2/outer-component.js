import { elemWithText, createComponent, setAttribute, mountComponent, updateComponent, unmountComponent, assign, addDisposeCallback, markSlotUpdate, elem, insert, text, updateText, finalizeAttributes, createInjector } from '../../../src/runtime';
import * as InnerComponent from './inner-component.js';

export const partials = {
	'my-item': {
		body: $$partialMyItem0,
		defaults: {
			item: true,
			pos: 0
		}
	}
};

function $$partialMyItem0(host, injector, scope) {
	const div0 = insert(injector, elem('div'));
	const span0 = div0.appendChild(elem('span'));
	const injector0 = scope.$_injector2 = createInjector(span0);
	setAttribute(injector0, 'value', scope.pos);
	scope.$_text0 = span0.appendChild(text(scope.item));
	finalizeAttributes(injector0);
	addDisposeCallback(injector, $$partialMyItem0Unmount);
	return $$partialMyItem0Update;
}

function $$partialMyItem0Update(host, injector, scope) {
	const injector0 = scope.$_injector2;
	setAttribute(injector0, 'value', scope.pos);
	updateText(scope.$_text0, scope.item);
	finalizeAttributes(injector0);
}

function $$partialMyItem0Unmount(scope) {
	scope.$_text0 = null;
	scope.$_injector2 = null;
}

export default function $$template0(host, scope) {
	const target0 = host.componentView;
	target0.appendChild(elemWithText('h2', 'Default partials'));
	const innerComponent0 = scope.$_innerComponent0 = target0.appendChild(createComponent('inner-component', InnerComponent, host));
	const injector0 = scope.$_injector0 = innerComponent0.componentModel.input;
	setAttribute(injector0, 'items', host.props.items1);
	mountComponent(innerComponent0);
	target0.appendChild(elemWithText('h2', 'Override partials'));
	const innerComponent1 = scope.$_innerComponent1 = target0.appendChild(createComponent('inner-component', InnerComponent, host));
	const injector1 = scope.$_injector1 = innerComponent1.componentModel.input;
	setAttribute(injector1, 'items', host.props.items2);
	mountComponent(innerComponent1, {
		'partial:item': assign({ host }, partials['my-item'])
	});
	addDisposeCallback(host, $$template0Unmount);
	return $$template0Update;
}

function $$template0Update(host, scope) {
	const injector1 = scope.$_injector1;
	const injector0 = scope.$_injector0;
	let s__innerComponent0 = 0;
	s__innerComponent0 |= setAttribute(injector0, 'items', host.props.items1);
	markSlotUpdate(scope.$_innerComponent0, '', s__innerComponent0);
	updateComponent(scope.$_innerComponent0);
	let s__innerComponent1 = 0;
	s__innerComponent1 |= setAttribute(injector1, 'items', host.props.items2);
	markSlotUpdate(scope.$_innerComponent1, '', s__innerComponent1);
	updateComponent(scope.$_innerComponent1);
	return s__innerComponent0;
}

function $$template0Unmount(scope) {
	scope.$_innerComponent0 = unmountComponent(scope.$_innerComponent0);
	scope.$_injector0 = null;
	scope.$_innerComponent1 = unmountComponent(scope.$_innerComponent1);
	scope.$_injector1 = null;
}
