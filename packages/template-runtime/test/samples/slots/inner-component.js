import { elemWithText, elem, insert, text, mountSlot } from "../../../src/runtime";

export default function $$template0(host) {
	const target0 = host.componentView;
	target0.appendChild(elemWithText("p", "Inner"));
	const slot0 = target0.appendChild(elem("slot"));
	mountSlot(host, "", slot0, $$slotDefaultContent0);
	const slot1 = target0.appendChild(elem("slot"));
	slot1.setAttribute("name", "footer");
	mountSlot(host, "footer", slot1, $$slotFooterContent0);
}

export function didSlotUpdate(component, slotName, slotBody) {
	global.slotCallbacks.push([slotName, slotBody.textContent.trim()]);
}

function $$slotDefaultContent0(host, injector) {
	insert(injector, text("Default inner"));
}

function $$slotFooterContent0(host, injector) {
	insert(injector, text("Default footer"));
}
