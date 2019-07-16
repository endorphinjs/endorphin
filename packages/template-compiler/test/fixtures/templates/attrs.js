import { appendChild, attributeSet, createInjector, elem, finalizeAttributes, insert, mountBlock, setAttribute, setAttributeExpression, text, unmountBlock, updateAttributeExpression, updateBlock } from "endorphin";

function ifBody$0(host, injector) {
	insert(injector, text("aaa"));
}

function ifEntry$0(host) {
	if (host.props.cond) {
		return ifBody$0;
	}
}

function ifBody$1(host, injector) {
	insert(injector, text("aaa"));
}

function ifEntry$1(host) {
	if (host.props.cond) {
		return ifBody$1;
	}
}

function ifAttr$0(host, scope) {
	if (host.props.cond) {
		scope._a$0.c.foo = host.props.baz;
	}
}

function ifBody$2(host, injector, scope) {
	scope._a$1.c.foo = host.props.baz;
	insert(injector, elem("br"));
	return ifBody$2Update;
}

function ifBody$2Update(host, scope) {
	scope._a$1.c.foo = host.props.baz;
}

function ifEntry$2(host) {
	if (host.props.cond) {
		return ifBody$2;
	}
}

function attrValue$0(host) {
	return "a " + (host.props.bar4) + " b";
}

function ifAttr$1(host, scope) {
	if (host.props.cond) {
		scope._a$2.c.foo = host.props.baz;
	}
}

function ifAttr$2(host, scope) {
	if (host.props.cond) {
		scope._a$3.c.foo = host.props.baz;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = appendChild(target$0, elem("e1"));
	setAttribute(e1$0, "foo", "bar1");
	setAttribute(e1$0, "enabled", "");
	const e2$0 = appendChild(target$0, elem("e2"));
	const inj$0 = createInjector(e2$0);
	setAttribute(e2$0, "foo", "bar2");
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	const e3$0 = scope.e3$0 = appendChild(target$0, elem("e3"));
	scope.fooAttr$2 = setAttributeExpression(e3$0, "foo", host.props.bar3);
	const e4$0 = scope.e4$0 = appendChild(target$0, elem("e4"));
	const inj$1 = createInjector(e4$0);
	scope.fooAttr$3 = setAttributeExpression(e4$0, "foo", host.props.bar4);
	scope.if$1 = mountBlock(host, inj$1, ifEntry$1);
	const e5$0 = scope.e5$0 = appendChild(target$0, elem("e5"));
	const _a$0 = scope._a$0 = attributeSet();
	_a$0.c.foo = host.props.bar4;
	ifAttr$0(host, scope);
	finalizeAttributes(e5$0, _a$0);
	const e6$0 = scope.e6$0 = appendChild(target$0, elem("e6"));
	const inj$2 = createInjector(e6$0);
	const _a$1 = scope._a$1 = attributeSet();
	_a$1.c.foo = host.props.bar4;
	scope.if$3 = mountBlock(host, inj$2, ifEntry$2);
	finalizeAttributes(e6$0, _a$1);
	const e7$0 = scope.e7$0 = appendChild(target$0, elem("e7"));
	const _a$2 = scope._a$2 = attributeSet();
	_a$2.c.foo = attrValue$0(host, scope);
	ifAttr$1(host, scope);
	finalizeAttributes(e7$0, _a$2);
	const e8$0 = scope.e8$0 = appendChild(target$0, elem("e8"));
	const _a$3 = scope._a$3 = attributeSet();
	ifAttr$2(host, scope);
	finalizeAttributes(e8$0, _a$3);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0, _a$1, _a$2 } = scope;
	updateBlock(scope.if$0);
	scope.fooAttr$2 = updateAttributeExpression(scope.e3$0, "foo", host.props.bar3, scope.fooAttr$2);
	scope.fooAttr$3 = updateAttributeExpression(scope.e4$0, "foo", host.props.bar4, scope.fooAttr$3);
	updateBlock(scope.if$1);
	_a$0.c.foo = host.props.bar4;
	ifAttr$0(host, scope);
	finalizeAttributes(scope.e5$0, _a$0);
	_a$1.c.foo = host.props.bar4;
	updateBlock(scope.if$3);
	finalizeAttributes(scope.e6$0, _a$1);
	_a$2.c.foo = attrValue$0(host, scope);
	ifAttr$1(host, scope);
	finalizeAttributes(scope.e7$0, _a$2);
	ifAttr$2(host, scope);
	finalizeAttributes(scope.e8$0, scope._a$3);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.if$3 = unmountBlock(scope.if$3);
	scope.fooAttr$2 = scope.e3$0 = scope.fooAttr$3 = scope.e4$0 = scope._a$0 = scope.e5$0 = scope._a$1 = scope.e6$0 = scope._a$2 = scope.e7$0 = scope._a$3 = scope.e8$0 = null;
}