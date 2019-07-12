import { appendChild, attributeSet, createInjector, elem, finalizeAttributes, insert, mountBlock, setAttribute, setAttributeExpression, setPendingAttribute, text, unmountBlock, updateAttributeExpression, updateBlock } from "endorphin";

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
		setPendingAttribute(scope.attrSet$0, "foo", host.props.baz);
	}
}

function ifBody$2(host, injector, scope) {
	setPendingAttribute(scope.attrSet$1, "foo", host.props.baz);
	insert(injector, elem("br"));
	return ifBody$2Update;
}

function ifBody$2Update(host, scope) {
	setPendingAttribute(scope.attrSet$1, "foo", host.props.baz);
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
		setPendingAttribute(scope.attrSet$2, "foo", host.props.baz);
	}
}

function ifAttr$2(host, scope) {
	if (host.props.cond) {
		setPendingAttribute(scope.attrSet$3, "foo", host.props.baz);
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const e1$0 = appendChild(target$0, elem("e1"));
	setAttribute(e1$0, "foo", "bar1");
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
	const e5$0 = appendChild(target$0, elem("e5"));
	const attrSet$0 = scope.attrSet$0 = attributeSet(e5$0);
	setPendingAttribute(attrSet$0, "foo", host.props.bar4);
	ifAttr$0(host, scope);
	finalizeAttributes(attrSet$0);
	const e6$0 = appendChild(target$0, elem("e6"));
	const inj$2 = createInjector(e6$0);
	const attrSet$1 = scope.attrSet$1 = attributeSet(e6$0);
	setPendingAttribute(attrSet$1, "foo", host.props.bar4);
	scope.if$3 = mountBlock(host, inj$2, ifEntry$2);
	finalizeAttributes(attrSet$1);
	const e7$0 = appendChild(target$0, elem("e7"));
	const attrSet$2 = scope.attrSet$2 = attributeSet(e7$0);
	setPendingAttribute(attrSet$2, "foo", attrValue$0(host, scope));
	ifAttr$1(host, scope);
	finalizeAttributes(attrSet$2);
	const e8$0 = appendChild(target$0, elem("e8"));
	const attrSet$3 = scope.attrSet$3 = attributeSet(e8$0);
	ifAttr$2(host, scope);
	finalizeAttributes(attrSet$3);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0, attrSet$1, attrSet$2 } = scope;
	updateBlock(scope.if$0);
	scope.fooAttr$2 = updateAttributeExpression(scope.e3$0, "foo", host.props.bar3, scope.fooAttr$2);
	scope.fooAttr$3 = updateAttributeExpression(scope.e4$0, "foo", host.props.bar4, scope.fooAttr$3);
	updateBlock(scope.if$1);
	setPendingAttribute(attrSet$0, "foo", host.props.bar4);
	ifAttr$0(host, scope);
	finalizeAttributes(attrSet$0);
	setPendingAttribute(attrSet$1, "foo", host.props.bar4);
	updateBlock(scope.if$3);
	finalizeAttributes(attrSet$1);
	setPendingAttribute(attrSet$2, "foo", attrValue$0(host, scope));
	ifAttr$1(host, scope);
	finalizeAttributes(attrSet$2);
	ifAttr$2(host, scope);
	finalizeAttributes(scope.attrSet$3);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
	scope.if$1 = unmountBlock(scope.if$1);
	scope.if$3 = unmountBlock(scope.if$3);
	scope.fooAttr$2 = scope.e3$0 = scope.fooAttr$3 = scope.e4$0 = scope.attrSet$0 = scope.attrSet$1 = scope.attrSet$2 = scope.attrSet$3 = null;
}