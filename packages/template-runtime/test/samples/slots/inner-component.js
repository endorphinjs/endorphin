export const slotCallbacks = [];

export function resetCallbacks() {
	slotCallbacks.length = 0;
}

export function didSlotUpdate(component, slotName, slotBody) {
	slotCallbacks.push([slotName, slotBody.textContent.trim()]);
}
