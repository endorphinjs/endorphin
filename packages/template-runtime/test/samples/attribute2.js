import {
	createInjector, elem, getProp, finalizeAttributes, setAttribute, addClass
} from '../../src/runtime';

export default function(host, scope) {
	const target = host.componentView;
	const elem1 = target.appendChild(elem('main'));
	const injector = scope.injector = createInjector(elem1);

	setAttribute(injector, 'a1', attrValue1(host));
	elem1.setAttribute('a2', '0');

	// TODO should set class attribute once, all `addClass()` calls should
	// only add/remove class names, not replace entire class attribute
	setAttribute(injector, 'class', 'foo');

	ifAttr1(host, injector);
	ifAttr2(host, injector);
	ifAttr3(host, injector);

	addClass(injector, attrValue2(host));

	finalizeAttributes(injector);

	return updateTemplate;
}

function updateTemplate(host, scope) {
	const { injector } = scope;
	setAttribute(injector, 'a1', attrValue1(host));
	setAttribute(injector, 'class', 'foo');

	ifAttr1(host, injector);
	ifAttr2(host, injector);
	ifAttr3(host, injector);

	addClass(injector, attrValue2(host));
	finalizeAttributes(injector);
}

function ifAttr1(host, injector) {
	if (getProp(host, 'c1')) {
		setAttribute(injector, 'a2', '1');
	}
}

function ifAttr2(host, injector) {
	if (getProp(host, 'c2')) {
		addClass(injector, 'foo bar');
	}
}

function ifAttr3(host, injector) {
	if (getProp(host, 'c3')) {
		setAttribute(injector, 'class', attrValue3(host));
	}
}

function attrValue1(host) {
	return getProp(host, 'id');
}

function attrValue2(host) {
	return getProp(host, 'classAddon');
}

function attrValue3(host) {
	return 'bam ' + getProp(host, 'id');
}
