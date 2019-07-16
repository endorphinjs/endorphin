import { appendChild, createComponent, elem, insert, mountComponent, text, unmountComponent, updateIncomingSlot, updateText } from "endorphin";
import * as SlotInner from "./slot-inner.html";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const header$0 = appendChild(target$0, elem("header"));
	scope.text$0 = appendChild(header$0, text(host.props.header));
	const slotInner$0 = scope.slotInner$0 = appendChild(target$0, createComponent("slot-inner", SlotInner, host));
	const inj$0 = slotInner$0.componentModel.input;
	scope.text$1 = insert(inj$0, text(host.props.content));
	mountComponent(slotInner$0);
	const footer$0 = appendChild(target$0, elem("footer"));
	scope.text$2 = appendChild(footer$0, text(host.props.footer));
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	scope.su$0 = 0;
	updateText(scope.text$0, host.props.header);
	scope.su$0 |= updateText(scope.text$1, host.props.content);
	updateIncomingSlot(scope.slotInner$0, "", scope.su$0);
	updateText(scope.text$2, host.props.footer);
}

function template$0Unmount(scope) {
	scope.slotInner$0 = unmountComponent(scope.slotInner$0);
	scope.text$0 = scope.text$1 = scope.text$2 = null;
}