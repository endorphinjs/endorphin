import { addEvent, appendChild, elem, removeEvent } from "endorphin";

function onEvt1$0(host, evt) {
	host.setState({ count: host.state.count + 1 });
}

function onEvt2$0(host, evt) {
	host.setState({ count: host.state.count + 2 });
}

function onEvt3$0(host, evt) {
	host.store.set({ s: !host.state.enabled });
}

function onEvt4$0(host, e) {
	host.setState({ a: host.state.a + e.pageX });
	host.setState({ b: host.state.b + e.pageY });
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const div$0 = appendChild(target$0, elem("div"));
	scope.evt1$0 = addEvent(div$0, "evt1", onEvt1$0, host, scope);
	scope.evt2$0 = addEvent(div$0, "evt2", onEvt2$0, host, scope);
	scope.evt3$0 = addEvent(div$0, "evt3", onEvt3$0, host, scope);
	scope.evt4$0 = addEvent(div$0, "evt4", onEvt4$0, host, scope);
}

template$0.dispose = template$0Unmount;

function template$0Unmount(scope) {
	scope.evt1$0 = removeEvent("evt1", scope.evt1$0);
	scope.evt2$0 = removeEvent("evt2", scope.evt2$0);
	scope.evt3$0 = removeEvent("evt3", scope.evt3$0);
	scope.evt4$0 = removeEvent("evt4", scope.evt4$0);
}