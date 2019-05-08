import {
	createInjector, elem, getProp, finalizeAttributes, setAttribute
} from '../../src/runtime';

export default function(host, scope) {
	const target = host.componentView;
	const elem1 = target.appendChild(elem('main'));

	const injector = scope.injector = createInjector(elem1);
	setAttribute(injector, 'a1', attrValue1(host));
	setAttribute(injector, 'a2', 0);
	ifAttr1(host, injector);
	ifAttr2(host, injector);
	ifAttr3(host, injector);
	setAttribute(injector, 'a3', '4');
	finalizeAttributes(injector);

	return updateComponent;
}

function updateComponent(host, scope) {
	const { injector } = scope;
	setAttribute(injector, 'a1', attrValue1(host));
	setAttribute(injector, 'a2', 0);
	ifAttr1(host, injector);
	ifAttr2(host, injector);
	ifAttr3(host, injector);
	setAttribute(injector, 'a3', '4');
	finalizeAttributes(injector);
}

function ifAttr1(host, injector) {
	if (getProp(host, 'c1')) {
		setAttribute(injector, 'a2', '1');
	}
}

function ifAttr2(host, injector) {
	if (getProp(host, 'c2')) {
		setAttribute(injector, 'a2', '2');
	}
}

function ifAttr3(host, injector) {
	if (getProp(host, 'c3')) {
		setAttribute(injector, 'a2', '3');
		setAttribute(injector, 'a1', '3');
		setAttribute(injector, 'a3', '3');
	}
}

function attrValue1(host) {
	return getProp(host, 'id');
}
