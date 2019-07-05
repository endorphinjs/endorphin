import { addClass, addClassIf, addPendingClass, addPendingClassIf, changeSet, createInjector, elem, finalizeAttributes, insert, mountBlock, setPendingAttribute, toggleClassIf, unmountBlock, updateBlock } from "endorphin";

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

function ifBody$1(host, injector) {
	ifAttr$2(host);
	insert(injector, elem("br"));
	return ifBody$1Update;
}

function ifBody$1Update(host) {
	ifAttr$2(host);
}

function ifEntry$1(host) {
	if (host.props.cond2) {
		return ifBody$1;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = scope.e1$0 = target$0.appendChild(elem("e1"));
	scope.class$0 = addClassIf(e1$0, "foo", host.props.enabled);
	addClass(e1$0, "bar");
	const e2$0 = scope.e2$0 = target$0.appendChild(elem("e2"));
	const attrSet$0 = scope.attrSet$0 = changeSet();
	addPendingClass(attrSet$0, "foo");
	ifAttr$0(host);
	finalizeAttributes(e2$0, attrSet$0);
	const e3$0 = scope.e3$0 = target$0.appendChild(elem("e3"));
	const attrSet$1 = scope.attrSet$1 = changeSet();
	setPendingAttribute(attrSet$1, "class", "test");
	addPendingClass(attrSet$1, "foo");
	ifAttr$1(host);
	finalizeAttributes(e3$0, attrSet$1);
	const e4$0 = scope.e4$0 = target$0.appendChild(elem("e4"));
	const inj$0 = createInjector(e4$0);
	const attrSet$2 = scope.attrSet$2 = changeSet();
	setPendingAttribute(attrSet$2, "class", "test");
	scope.if$2 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$3 = mountBlock(host, inj$0, ifEntry$1);
	finalizeAttributes(e4$0, attrSet$2);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0, attrSet$1, attrSet$2 } = scope;
	scope.class$0 = toggleClassIf(scope.e1$0, "foo", host.props.enabled, scope.class$0);
	addPendingClass(attrSet$0, "foo");
	ifAttr$0(host);
	finalizeAttributes(scope.e2$0, attrSet$0);
	setPendingAttribute(attrSet$1, "class", "test");
	addPendingClass(attrSet$1, "foo");
	ifAttr$1(host);
	finalizeAttributes(scope.e3$0, attrSet$1);
	setPendingAttribute(attrSet$2, "class", "test");
	updateBlock(scope.if$2);
	updateBlock(scope.if$3);
	finalizeAttributes(scope.e4$0, attrSet$2);
}

function template$0Unmount(scope) {
	scope.if$2 = unmountBlock(scope.if$2);
	scope.if$3 = unmountBlock(scope.if$3);
	scope.class$0 = scope.e1$0 = scope.attrSet$0 = scope.e2$0 = scope.attrSet$1 = scope.e3$0 = scope.attrSet$2 = scope.e4$0 = null;
}