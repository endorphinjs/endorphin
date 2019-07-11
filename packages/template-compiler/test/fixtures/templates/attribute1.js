import { appendChild, attributeSet, elem, finalizeAttributes, setPendingAttribute } from "endorphin";

function ifAttr$0(host, scope) {
	if (host.props.c1) {
		setPendingAttribute(scope.attrSet$0, "a2", "1");
	}
}

function ifAttr$1(host, scope) {
	if (host.props.c2) {
		setPendingAttribute(scope.attrSet$0, "a2", "2");
	}
}

function ifAttr$2(host, scope) {
	const { attrSet$0 } = scope;
	if (host.props.c3) {
		setPendingAttribute(attrSet$0, "a2", "3");
		setPendingAttribute(attrSet$0, "a1", "3");
		setPendingAttribute(attrSet$0, "a3", "3");
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = appendChild(target$0, elem("main"));
	const attrSet$0 = scope.attrSet$0 = attributeSet(main$0);
	setPendingAttribute(attrSet$0, "a1", host.props.id);
	setPendingAttribute(attrSet$0, "a2", "0");
	ifAttr$0(host);
	ifAttr$1(host);
	ifAttr$2(host);
	setPendingAttribute(attrSet$0, "a3", "4");
	finalizeAttributes(attrSet$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { attrSet$0 } = scope;
	setPendingAttribute(attrSet$0, "a1", host.props.id);
	setPendingAttribute(attrSet$0, "a2", "0");
	ifAttr$0(host);
	ifAttr$1(host);
	ifAttr$2(host);
	setPendingAttribute(attrSet$0, "a3", "4");
	finalizeAttributes(attrSet$0);
}

function template$0Unmount(scope) {
	scope.attrSet$0 = null;
}