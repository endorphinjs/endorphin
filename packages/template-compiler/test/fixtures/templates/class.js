import { addClass, addClassIf, addPendingClass, addPendingClassIf, appendChild, attributeSet, createInjector, elem, finalizeAttributes, insert, mountBlock, setPendingAttribute, toggleClassIf, unmountBlock, updateBlock } from "endorphin";

function ifAttr$0(host, scope) {
	const { attrSet$0 } = scope;
	if (host.props.cond) {
		addPendingClassIf(attrSet$0, "foo", host.props.foo);
		addPendingClass(attrSet$0, "bar");
	}
}

function ifAttr$1(host, scope) {
	if (host.props.cond2) {
		setPendingAttribute(scope.attrSet$1, "class", "override");
	}
}

function ifBody$0(host, injector, scope) {
	const { attrSet$2 } = scope;
	addPendingClassIf(attrSet$2, "foo", host.props.foo);
	addPendingClass(attrSet$2, "bar");
	insert(injector, elem("img"));
	return ifBody$0Update;
}

function ifBody$0Update(host, scope) {
	const { attrSet$2 } = scope;
	addPendingClassIf(attrSet$2, "foo", host.props.foo);
	addPendingClass(attrSet$2, "bar");
}

function ifEntry$0(host) {
	if (host.props.cond1) {
		return ifBody$0;
	}
}

function ifAttr$2(host, scope) {
	if (host.props.cond2) {
		setPendingAttribute(scope.attrSet$2, "class", "override");
	}
}

function ifBody$1(host, injector, scope) {
	ifAttr$2(host, scope);
	insert(injector, elem("br"));
	return ifBody$1Update;
}

function ifBody$1Update(host, scope) {
	ifAttr$2(host, scope);
}

function ifEntry$1(host) {
	if (host.props.cond2) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = scope.e1$0 = appendChild(target$0, elem("e1"));
	scope.class$0 = addClassIf(e1$0, "foo", host.props.enabled);
	addClass(e1$0, "bar");
	const e2$0 = appendChild(target$0, elem("e2"));
	const attrSet$0 = scope.attrSet$0 = attributeSet(e2$0);
	addPendingClass(attrSet$0, "foo");
	ifAttr$0(host, scope);
	finalizeAttributes(attrSet$0);
	const e3$0 = appendChild(target$0, elem("e3"));
	const attrSet$1 = scope.attrSet$1 = attributeSet(e3$0);
	setPendingAttribute(attrSet$1, "class", "test");
	addPendingClass(attrSet$1, "foo");
	ifAttr$1(host, scope);
	finalizeAttributes(attrSet$1);
	const e4$0 = appendChild(target$0, elem("e4"));
	const inj$0 = createInjector(e4$0);
	const attrSet$2 = scope.attrSet$2 = attributeSet(e4$0);
	setPendingAttribute(attrSet$2, "class", "test");
	scope.if$2 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$3 = mountBlock(host, inj$0, ifEntry$1);
	finalizeAttributes(attrSet$2);
	const e5$0 = appendChild(target$0, elem("e5"));
	const attrSet$3 = scope.attrSet$3 = attributeSet(e5$0);
	setPendingAttribute(attrSet$3, "class", "foo");
	addPendingClass(attrSet$3, "bar");
	addPendingClass(attrSet$3, "foo " + host.props.bar);
	finalizeAttributes(attrSet$3);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0, attrSet$1, attrSet$2, attrSet$3 } = scope;
	scope.class$0 = toggleClassIf(scope.e1$0, "foo", host.props.enabled, scope.class$0);
	addPendingClass(attrSet$0, "foo");
	ifAttr$0(host, scope);
	finalizeAttributes(attrSet$0);
	setPendingAttribute(attrSet$1, "class", "test");
	addPendingClass(attrSet$1, "foo");
	ifAttr$1(host, scope);
	finalizeAttributes(attrSet$1);
	setPendingAttribute(attrSet$2, "class", "test");
	updateBlock(scope.if$2);
	updateBlock(scope.if$3);
	finalizeAttributes(attrSet$2);
	setPendingAttribute(attrSet$3, "class", "foo");
	addPendingClass(attrSet$3, "bar");
	addPendingClass(attrSet$3, "foo " + host.props.bar);
	finalizeAttributes(attrSet$3);
}

function template$0Unmount(scope) {
	scope.if$2 = unmountBlock(scope.if$2);
	scope.if$3 = unmountBlock(scope.if$3);
	scope.class$0 = scope.e1$0 = scope.attrSet$0 = scope.attrSet$1 = scope.attrSet$2 = scope.attrSet$3 = null;
}