import { setScope, getScope } from './scope';
import { assign, obj } from './utils';
import { run, injectBlock, emptyBlockContent, disposeBlock, BaseBlock, Injector } from './injector';
import { UpdateBlock, MountBlock } from './types';
import { Component } from './component';

interface PartialBlock extends BaseBlock<PartialBlock> {
	update: UpdateBlock | void;
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
		$$block: true,
		host,
		injector,
		scope: getScope(host),
		dispose: null,
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
export function updatePartial(ctx: PartialBlock, partial: PartialDefinition, args: object): number {
	const host = partial.host || ctx.host;
	const { injector } = ctx;
	const prevHost = ctx.host;
	const prevScope = getScope(host);
	let updated = 0;

	ctx.host = host;

	if (ctx.partial !== partial) {
		// Unmount previously rendered partial
		ctx.partial && emptyBlockContent(ctx);

		// Mount new partial
		const scope = ctx.scope = assign(obj(prevScope), partial.defaults, args);
		setScope(host, scope);
		ctx.update = partial ? run(ctx, partial.body, scope) : void 0;
		ctx.partial = partial;
		setScope(host, prevScope);
		updated = 1;
	} else if (ctx.update) {
		// Update rendered partial
		const scope = setScope(host, assign(ctx.scope, args));
		if (run(ctx, ctx.update, scope)) {
			updated = 1;
		}
		setScope(host, prevScope);
	}

	ctx.host = prevHost;
	injector.ptr = ctx.end;

	return updated;
}

export function unmountPartial(ctx: PartialBlock) {
	disposeBlock(ctx);
}
