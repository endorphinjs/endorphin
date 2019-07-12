import { addPendingClass, appendChild, attributeSet, elem, finalizeAttributes, setAttributeExpression, setPendingAttribute, updateAttributeExpression } from "endorphin";

function ifAttr$0(host, scope) {
	if (host.props.c1) {
		setPendingAttribute(scope.attrSet$0, "a2", "1");
	}
}

function ifAttr$1(host, scope) {
	if (host.props.c2) {
		addPendingClass(scope.attrSet$0, "foo bar");
	}
}

function ifAttr$2(host, scope) {
	if (host.props.c3) {
		setPendingAttribute(scope.attrSet$0, "class", ("bam" + host.props.id));
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const attrSet$0 = scope.attrSet$0 = attributeSet(main$0);
	scope.a1Attr$0 = setAttributeExpression(main$0, "a1", host.props.id);
	setPendingAttribute(attrSet$0, "a2", "0");
	setPendingAttribute(attrSet$0, "class", "foo");
	ifAttr$0(host, scope);
	ifAttr$1(host, scope);
	ifAttr$2(host, scope);
	addPendingClass(attrSet$0, "baz");
	finalizeAttributes(attrSet$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0 } = scope;
	scope.a1Attr$0 = updateAttributeExpression(scope.main$0, "a1", host.props.id, scope.a1Attr$0);
	setPendingAttribute(attrSet$0, "a2", "0");
	setPendingAttribute(attrSet$0, "class", "foo");
	ifAttr$0(host, scope);
	ifAttr$1(host, scope);
	ifAttr$2(host, scope);
	addPendingClass(attrSet$0, "baz");
	finalizeAttributes(attrSet$0);
}

function template$0Unmount(scope) {
	scope.attrSet$0 = scope.a1Attr$0 = scope.main$0 = null;
}