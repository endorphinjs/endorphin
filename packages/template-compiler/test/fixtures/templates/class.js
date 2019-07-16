import { addClass, addClassIf, addPendingClass, addPendingClassIf, appendChild, attributeSet, createInjector, elem, finalizeAttributes, insert, mountBlock, toggleClassIf, unmountBlock, updateBlock } from "endorphin";

function ifAttr$0(host, scope) {
	const { _a$0 } = scope;
	if (host.props.cond) {
		addPendingClassIf(_a$0, "foo", host.props.foo);
		addPendingClass(_a$0, "bar");
	}
}

function ifAttr$1(host, scope) {
	if (host.props.cond2) {
		scope._a$1.c.class = "override";
	}
}

function ifBody$0(host, injector, scope) {
	const { _a$2 } = scope;
	addPendingClassIf(_a$2, "foo", host.props.foo);
	addPendingClass(_a$2, "bar");
	insert(injector, elem("img"));
	return ifBody$0Update;
}

function ifBody$0Update(host, scope) {
	const { _a$2 } = scope;
	addPendingClassIf(_a$2, "foo", host.props.foo);
	addPendingClass(_a$2, "bar");
}

function ifEntry$0(host) {
	if (host.props.cond1) {
		return ifBody$0;
	}
}

function ifAttr$2(host, scope) {
	if (host.props.cond2) {
		scope._a$2.c.class = "override";
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
	const e2$0 = scope.e2$0 = appendChild(target$0, elem("e2"));
	const _a$0 = scope._a$0 = attributeSet();
	addPendingClass(_a$0, "foo");
	ifAttr$0(host, scope);
	finalizeAttributes(e2$0, _a$0);
	const e3$0 = scope.e3$0 = appendChild(target$0, elem("e3"));
	const _a$1 = scope._a$1 = attributeSet();
	_a$1.c.class = "test";
	addPendingClass(_a$1, "foo");
	ifAttr$1(host, scope);
	finalizeAttributes(e3$0, _a$1);
	const e4$0 = scope.e4$0 = appendChild(target$0, elem("e4"));
	const inj$0 = createInjector(e4$0);
	const _a$2 = scope._a$2 = attributeSet();
	_a$2.c.class = "test";
	scope.if$2 = mountBlock(host, inj$0, ifEntry$0);
	scope.if$3 = mountBlock(host, inj$0, ifEntry$1);
	finalizeAttributes(e4$0, _a$2);
	const e5$0 = scope.e5$0 = appendChild(target$0, elem("e5"));
	const _a$3 = scope._a$3 = attributeSet();
	_a$3.c.class = "foo";
	addPendingClass(_a$3, "bar");
	addPendingClass(_a$3, "foo " + host.props.bar);
	finalizeAttributes(e5$0, _a$3);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0, _a$1, _a$2, _a$3 } = scope;
	scope.class$0 = toggleClassIf(scope.e1$0, "foo", host.props.enabled, scope.class$0);
	addPendingClass(_a$0, "foo");
	ifAttr$0(host, scope);
	finalizeAttributes(scope.e2$0, _a$0);
	_a$1.c.class = "test";
	addPendingClass(_a$1, "foo");
	ifAttr$1(host, scope);
	finalizeAttributes(scope.e3$0, _a$1);
	_a$2.c.class = "test";
	updateBlock(scope.if$2);
	updateBlock(scope.if$3);
	finalizeAttributes(scope.e4$0, _a$2);
	_a$3.c.class = "foo";
	addPendingClass(_a$3, "bar");
	addPendingClass(_a$3, "foo " + host.props.bar);
	finalizeAttributes(scope.e5$0, _a$3);
}

function template$0Unmount(scope) {
	scope.if$2 = unmountBlock(scope.if$2);
	scope.if$3 = unmountBlock(scope.if$3);
	scope.class$0 = scope.e1$0 = scope._a$0 = scope.e2$0 = scope._a$1 = scope.e3$0 = scope._a$2 = scope.e4$0 = scope._a$3 = scope.e5$0 = null;
}