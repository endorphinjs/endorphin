import { addPendingClass, addPendingClassIf, appendChild, createComponent, mountComponent, propsSet, unmountComponent, updateComponent } from "endorphin";
import * as MyComp from "./my-comp.html";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComp$0 = scope.myComp$0 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$0 = propsSet(myComp$0);
	_p$0.c.class = "c1";
	mountComponent(myComp$0, _p$0.c);
	const myComp$1 = scope.myComp$1 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$1 = propsSet(myComp$1);
	_p$1.c.class = "c2_1";
	addPendingClass(_p$1, "c2_2");
	mountComponent(myComp$1, _p$1.c);
	const myComp$2 = scope.myComp$2 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$2 = propsSet(myComp$2);
	addPendingClass(_p$2, "c3_1");
	addPendingClass(_p$2, "c3_2");
	mountComponent(myComp$2, _p$2.c);
	const myComp$3 = scope.myComp$3 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$3 = scope._p$3 = propsSet(myComp$3);
	_p$3.c.class = "c4_1";
	addPendingClassIf(_p$3, "c4_2", host.props.cond);
	addPendingClass(_p$3, "c4_3");
	mountComponent(myComp$3, _p$3.c);
	const myComp$4 = scope.myComp$4 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$4 = scope._p$4 = propsSet(myComp$4);
	addPendingClassIf(_p$4, "c5_1", host.props.cond);
	addPendingClass(_p$4, "c5_2");
	mountComponent(myComp$4, _p$4.c);
	const myComp$5 = scope.myComp$5 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$5 = scope._p$5 = propsSet(myComp$5);
	addPendingClassIf(_p$5, "c6_1", host.props.cond1);
	addPendingClassIf(_p$5, "c6_2", host.props.cond2);
	mountComponent(myComp$5, _p$5.c);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _p$3, _p$4, _p$5 } = scope;
	_p$3.c.class = null;
	_p$3.c.class = "c4_1";
	addPendingClassIf(_p$3, "c4_2", host.props.cond);
	addPendingClass(_p$3, "c4_3");
	updateComponent(scope.myComp$3, _p$3.c);
	_p$4.c.class = null;
	addPendingClassIf(_p$4, "c5_1", host.props.cond);
	addPendingClass(_p$4, "c5_2");
	updateComponent(scope.myComp$4, _p$4.c);
	_p$5.c.class = null;
	addPendingClassIf(_p$5, "c6_1", host.props.cond1);
	addPendingClassIf(_p$5, "c6_2", host.props.cond2);
	updateComponent(scope.myComp$5, _p$5.c);
}

function template$0Unmount(scope) {
	scope.myComp$0 = unmountComponent(scope.myComp$0);
	scope.myComp$1 = unmountComponent(scope.myComp$1);
	scope.myComp$2 = unmountComponent(scope.myComp$2);
	scope.myComp$3 = unmountComponent(scope.myComp$3);
	scope.myComp$4 = unmountComponent(scope.myComp$4);
	scope.myComp$5 = unmountComponent(scope.myComp$5);
	scope._p$3 = scope._p$4 = scope._p$5 = null;
}