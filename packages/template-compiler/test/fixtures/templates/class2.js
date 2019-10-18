import { appendChild, createComponent, mountComponent, unmountComponent, updateClass, updateComponent } from "endorphin";
import * as MyComp from "./my-comp.html";

function myCompAttrs$0(elem, prev, host) {
	updateClass(elem, prev, "c4_1" + ((host.props.cond ? " c4_2" : "")) + " c4_3");
}

function myCompAttrs$1(elem, prev, host) {
	updateClass(elem, prev, ((host.props.cond ? "c5_1" : "")) + " c5_2");
}

function myCompAttrs$2(elem, prev, host) {
	updateClass(elem, prev, ((host.props.cond1 ? "c6_1" : "")) + ((host.props.cond2 ? " c6_2" : "")));
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const myComp$0 = scope.myComp$0 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	mountComponent(myComp$0, {class: "c1"});
	const myComp$1 = scope.myComp$1 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	mountComponent(myComp$1, {class: "c2_1 c2_2"});
	const myComp$2 = scope.myComp$2 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	mountComponent(myComp$2, {class: "c3_1 c3_2"});
	const myComp$3 = scope.myComp$3 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const propSet$3 = scope.propSet$3 = {}
	myCompAttrs$0(myComp$3, propSet$3, host);
	mountComponent(myComp$3, propSet$3);
	const myComp$4 = scope.myComp$4 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const propSet$4 = scope.propSet$4 = {}
	myCompAttrs$1(myComp$4, propSet$4, host);
	mountComponent(myComp$4, propSet$4);
	const myComp$5 = scope.myComp$5 = appendChild(target$0, createComponent("my-comp", MyComp, host));
	const propSet$5 = scope.propSet$5 = {}
	myCompAttrs$2(myComp$5, propSet$5, host);
	mountComponent(myComp$5, propSet$5);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	const { myComp$3, propSet$3, myComp$4, propSet$4, myComp$5, propSet$5 } = scope;
	myCompAttrs$0(myComp$3, propSet$3, host);
	updateComponent(myComp$3, propSet$3);
	myCompAttrs$1(myComp$4, propSet$4, host);
	updateComponent(myComp$4, propSet$4);
	myCompAttrs$2(myComp$5, propSet$5, host);
	updateComponent(myComp$5, propSet$5);
}

function template$0Unmount(scope) {
	scope.myComp$0 = unmountComponent(scope.myComp$0);
	scope.myComp$1 = unmountComponent(scope.myComp$1);
	scope.myComp$2 = unmountComponent(scope.myComp$2);
	scope.myComp$3 = unmountComponent(scope.myComp$3);
	scope.myComp$4 = unmountComponent(scope.myComp$4);
	scope.myComp$5 = unmountComponent(scope.myComp$5);
}