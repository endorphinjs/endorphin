import { addPendingClass, appendChild, attributeSet, elem, finalizeAttributes, setAttributeExpression, updateAttributeExpression } from "endorphin";

function ifAttr$0(host, scope) {
	if (host.props.c1) {
		scope._a$0.c.a2 = "1";
	}
}

function ifAttr$1(host, scope) {
	if (host.props.c2) {
		addPendingClass(scope._a$0, "foo bar");
	}
}

function ifAttr$2(host, scope) {
	if (host.props.c3) {
		scope._a$0.c.class = ("bam" + host.props.id);
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const _a$0 = scope._a$0 = attributeSet();
	scope.a1Attr$0 = setAttributeExpression(main$0, "a1", host.props.id);
	_a$0.c.a2 = "0";
	_a$0.c.class = "foo";
	ifAttr$0(host, scope);
	ifAttr$1(host, scope);
	ifAttr$2(host, scope);
	addPendingClass(_a$0, "baz");
	finalizeAttributes(main$0, _a$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0, main$0 } = scope;
	scope.a1Attr$0 = updateAttributeExpression(main$0, "a1", host.props.id, scope.a1Attr$0);
	_a$0.c.a2 = "0";
	_a$0.c.class = "foo";
	ifAttr$0(host, scope);
	ifAttr$1(host, scope);
	ifAttr$2(host, scope);
	addPendingClass(_a$0, "baz");
	finalizeAttributes(main$0, _a$0);
}

function template$0Unmount(scope) {
	scope._a$0 = scope.a1Attr$0 = scope.main$0 = null;
}