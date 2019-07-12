import { MountBlock } from './types';
import { injectBlock, emptyBlockContent, disposeBlock, getSlotContext, Block } from './injector';
import { Component } from './component';
import { isolateElement } from './dom';
import { getScope } from './scope';
import { runHook } from './hooks';

export interface SlotContext {
	name: string;
	element: HTMLElement;
	isDefault: boolean;
	defaultContent: SlotBlock | null;
}

interface SlotBlock extends Block {
	// Since `SlotBlock` is retained in injector, we have to toggle `mount` property
	// depending on current rendering state (incoming or default data) to not invoke
	// `mount.dispose` or already empty block.
	// We’ll keep mount function in separate property to restore `mount` property value
	content: MountBlock;
}

/**
 * Creates slot element
 */
export function createSlot(host: Component, name: string, cssScope?: string): HTMLElement {
	return isolateElement(getSlotContext(host.componentModel.input, name).element, cssScope);
}

/**
 * Mounts slot context
 */
export function mountSlot(host: Component, name: string, defaultContent?: MountBlock): SlotContext {
	const injector = host.componentModel.input;
	const ctx = getSlotContext(injector, name);

	if (defaultContent) {
		// Add block with default slot content
		ctx.defaultContent = injectBlock<SlotBlock>(injector, {
			host,
			injector,
			scope: getScope(host),
			content: defaultContent,
			mount: void 0,
			update: void 0
		});
	}

	if (isEmpty(ctx)) {
		// No incoming content, mount default content
		renderDefaultContent(ctx);
	} else {
		setSlotted(ctx, true);
	}

	return ctx;
}

/**
 * Handles possible update of incoming data
 */
export function updateIncomingSlot(host: Component, name: string, updated: number) {
	const ctx = getSlotContext(host.componentModel.input, name);

	if (updated) {
		// Incoming content was updated but there’s default content mounted
		if (ctx.isDefault) {
			const block = ctx.defaultContent!;
			if (block) {
				emptyBlockContent(block);
				block.mount = void 0;
			}
			setSlotted(ctx, true);
		}

		notifySlotUpdate(host, ctx);
	}

	if (!ctx.isDefault && isEmpty(ctx)) {
		// If slot content is empty, ensure default content is rendered
		renderDefaultContent(ctx);
	}
}

/**
 * Updates default slot content only if it was already rendered
 */
export function updateDefaultSlot(ctx: SlotContext) {
	if (ctx.isDefault) {
		const block = ctx.defaultContent!;
		if (block.update) {
			block.update(block.host, block.scope);
		}
	}
}

/**
 * Unmounts default content of given slot context
 */
export function unmountSlot(ctx: SlotContext) {
	const block = ctx.defaultContent;
	if (block) {
		disposeBlock(block);
		setSlotted(ctx, false);
		ctx.isDefault = false;
		ctx.defaultContent = null;
	}
}

export function notifySlotUpdate(host: Component, ctx: SlotContext) {
	runHook(host, 'didSlotUpdate', ctx.name, ctx.element);
}

/**
 * Renders default slot content
 */
function renderDefaultContent(ctx: SlotContext) {
	if (ctx.defaultContent) {
		const block = ctx.defaultContent;
		const { injector } = block;
		injector.ptr = block.start;
		block.mount = block.content;
		block.update = block.mount!(block.host, injector, block.scope);
		injector.ptr = block.end;
	}
	setSlotted(ctx, false);
}

/**
 * Check if given slot is empty
 */
function isEmpty(ctx: SlotContext): boolean {
	// TODO better check for input content?
	return !ctx.element.childNodes.length;
}

/**
 * Toggles slotted state in slot container
 */
function setSlotted(ctx: SlotContext, slotted: boolean) {
	ctx.isDefault = !slotted;
	slotted ? ctx.element.setAttribute('slotted', '') : ctx.element.removeAttribute('slotted');
}
