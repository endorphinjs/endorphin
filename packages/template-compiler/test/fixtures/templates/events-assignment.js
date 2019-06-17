import { addStaticEvent, elem, removeStaticEvent } from "endorphin";

function onEvt1$0(evt) {
	this.host.setState({ count: this.host.state.count + 1 });
}

function onEvt2$0(evt) {
	this.host.setState({ count: this.host.state.count + 2 });
}

function onEvt3$0(evt) {
	this.host.store.set({ s: !this.host.state.enabled });
}

function onEvt4$0(e) {
	this.host.setState({ a: this.host.state.a + e.pageX });
	this.host.setState({ b: this.host.state.b + e.pageY });
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = target$0.appendChild(elem("div"));
	scope.evt1$0 = addStaticEvent(div$0, "evt1", onEvt1$0, host, scope);
	scope.evt2$0 = addStaticEvent(div$0, "evt2", onEvt2$0, host, scope);
	scope.evt3$0 = addStaticEvent(div$0, "evt3", onEvt3$0, host, scope);
	scope.evt4$0 = addStaticEvent(div$0, "evt4", onEvt4$0, host, scope);
}

template$0.dispose = template$0Unmount;

function template$0Unmount(scope) {
	scope.evt1$0 = removeStaticEvent(scope.evt1$0);
	scope.evt2$0 = removeStaticEvent(scope.evt2$0);
	scope.evt3$0 = removeStaticEvent(scope.evt3$0);
	scope.evt4$0 = removeStaticEvent(scope.evt4$0);
}