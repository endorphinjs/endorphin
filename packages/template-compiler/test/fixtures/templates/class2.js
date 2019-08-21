import { addPendingClassIf, appendChild, createComponent, mountComponent, propsSet, unmountComponent, updateComponent } from "endorphin";
import * as MyComp from "./my-comp.html";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComp$0 = scope.myComp$0 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const _p$0 = scope._p$0 = propsSet(myComp$0);
	_p$0.c.class = "a";
	addPendingClassIf(_p$0, "b", host.props.cond);
	mountComponent(myComp$0, _p$0.c);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { _p$0 } = scope;
	addPendingClassIf(_p$0, "b", host.props.cond);
	updateComponent(scope.myComp$0, _p$0.c);
}

function template$0Unmount(scope) {
	scope.myComp$0 = unmountComponent(scope.myComp$0);
	scope._p$0 = null;
}