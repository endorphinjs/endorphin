import { call, addStaticEvent, removeStaticEvent, elem, text, updateText, subscribeStore } from "endorphin";

function onClick$0(evt) {
	call(this.host.store, "update", [this.host.state.item]);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = target$0.appendChild(elem("div"));
	scope.click$0 = addStaticEvent(div$0, "click", onClick$0, host, scope);
	const p$0 = div$0.appendChild(elem("p"));
	p$0.appendChild(text("Store value is "));
	scope.text$1 = p$0.appendChild(text(host.store.data.foo));
	subscribeStore(host, ["foo"]);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateText(scope.text$1, host.store.data.foo);
}

function template$0Unmount(scope) {
	scope.click$0 = removeStaticEvent(scope.click$0);
	scope.text$1 = null;
}