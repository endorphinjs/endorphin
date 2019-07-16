import { injectBlock, emptyBlockContent, disposeBlock, Injector, Block } from './injector';
import { getScope } from './scope';
import { GetMount } from './types';
import { Component } from './component';

export interface FunctionBlock extends Block {
	get: GetMount;
}

export function mountBlock(host: Component, injector: Injector, get: GetMount): FunctionBlock {
	const block = injectBlock<FunctionBlock>(injector, {
		host,
		injector,
		scope: getScope(host),
		get,
		mount: undefined,
		update: undefined
	});
	updateBlock(block);
	return block;
}

/**
 * Updated block, described in `ctx` object
 * @returns Returns `1` if block was updated, `0` otherwise
 */
export function updateBlock(block: FunctionBlock): number {
	let updated = 0;
	const { host, injector, scope } = block;
	const mount = block.get(host, scope);

	if (block.mount !== mount) {
		updated = 1;
		// Unmount previously rendered content
		block.mount && emptyBlockContent(block);

		// Mount new block content
		injector.ptr = block.start;
		block.mount = mount;
		block.update = mount && mount(block.host, injector, scope);
	} else if (block.update) {
		// Update rendered result
		updated = block.update(host, scope) ? 1 : 0;
	}

	block.injector.ptr = block.end;
	return updated;
}

export function unmountBlock(block: FunctionBlock) {
	disposeBlock(block);
}
