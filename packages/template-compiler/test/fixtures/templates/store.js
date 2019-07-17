import { addEvent, appendChild, call, elem, removeEvent, subscribeStore, text, updateText } from "endorphin";

function onClick$0(host, evt) {
	call(host.store, "update", [host.state.item]);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = appendChild(target$0, elem("div"));
	scope.click$0 = addEvent(div$0, "click", onClick$0, host, scope);
	const p$0 = appendChild(div$0, elem("p"));
	appendChild(p$0, text("Store value is "));
	scope.text$1 = appendChild(p$0, text(host.store.data.foo));
	subscribeStore(host, ["foo"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateText(scope.text$1, host.store.data.foo);
}

function template$0Unmount(scope) {
	scope.click$0 = removeEvent("click", scope.click$0);
	scope.text$1 = null;
}