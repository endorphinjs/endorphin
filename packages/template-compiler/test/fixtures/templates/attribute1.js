import { appendChild, attributeSet, elem, finalizeAttributes } from "endorphin";

function ifAttr$0(host, scope) {
	if (host.props.c1) {
		scope._a$0.c.a2 = "1";
	}
}

function ifAttr$1(host, scope) {
	if (host.props.c2) {
		scope._a$0.c.a2 = "2";
	}
}

function ifAttr$2(host, scope) {
	const { _a$0 } = scope;
	if (host.props.c3) {
		_a$0.c.a2 = "3";
		_a$0.c.a1 = "3";
		_a$0.c.a3 = "3";
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const main$0 = scope.main$0 = appendChild(target$0, elem("main"));
	const _a$0 = scope._a$0 = attributeSet();
	_a$0.c.a1 = host.props.id;
	_a$0.c.a2 = "0";
	ifAttr$0(host, scope);
	ifAttr$1(host, scope);
	ifAttr$2(host, scope);
	_a$0.c.a3 = "4";
	finalizeAttributes(main$0, _a$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _a$0 } = scope;
	_a$0.c.a1 = host.props.id;
	_a$0.c.a2 = "0";
	ifAttr$0(host, scope);
	ifAttr$1(host, scope);
	ifAttr$2(host, scope);
	_a$0.c.a3 = "4";
	finalizeAttributes(scope.main$0, _a$0);
}

function template$0Unmount(scope) {
	scope._a$0 = scope.main$0 = null;
}