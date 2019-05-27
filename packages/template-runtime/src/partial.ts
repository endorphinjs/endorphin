import { setScope, getScope } from './scope';
import { assign, obj } from './utils';
import { injectBlock, emptyBlockContent, disposeBlock, Injector, Block } from './injector';
import { MountBlock } from './types';
import { Component } from './component';

interface PartialBlock extends Block {
	partial: PartialDefinition | null;
}

interface PartialDefinition {
	host: Component;
	body: MountBlock;
	defaults: object;
}

/**
 * Mounts given partial into injector context
 */
export function mountPartial(host: Component, injector: Injector, partial: PartialDefinition, args: object): PartialBlock {
	const block = injectBlock<PartialBlock>(injector, {
		host,
		injector,
		scope: getScope(host),
		mount: void 0,
		update: void 0,
		partial: null
	});
	updatePartial(block, partial, args);
	return block;
}

/**
 * Updates mounted partial
 * @returns Returns `1` if partial was updated, `0` otherwise
 */
export function updatePartial(block: PartialBlock, partial: PartialDefinition, args: object): number {
	const host = partial.host || block.host;
	const { injector } = block;
	const prevHost = block.host;
	const prevScope = getScope(host);
	let updated = 0;

	block.host = host;

	if (block.partial !== partial) {
		// Unmount previously rendered partial
		block.partial && emptyBlockContent(block);

		// Mount new partial
		const scope = block.scope = assign(obj(prevScope), partial.defaults, args);
		setScope(host, scope);
		injector.ptr = block.start;
		block.mount = partial && partial.body;
		block.update = block.mount && block.mount(host, injector, scope);
		block.partial = partial;
		setScope(host, prevScope);
		updated = 1;
	} else if (block.update) {
		// Update rendered partial
		const scope = setScope(host, assign(block.scope, args));
		if (block.update(host, injector, scope)) {
			updated = 1;
		}
		setScope(host, prevScope);
	}

	block.host = prevHost;
	injector.ptr = block.end;

	return updated;
}

export function unmountPartial(block: PartialBlock) {
	disposeBlock(block);
}
