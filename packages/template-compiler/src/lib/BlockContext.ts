import { ChunkList, Chunk } from '../types';
import CompileState from './CompileState';
import Entity from '../entities/Entity';
import ElementEntity from '../entities/ElementEntity';
import UsageStats from './UsageStats';
import { createFunction } from './utils';
import InjectorEntity from '../entities/InjectorEntity';

export default class BlockContext {
    element?: ElementEntity;
    scopeUsage = new UsageStats();
    hostUsage = new UsageStats();

    /** Indicates that block uses given injector as argument */
    injector?: InjectorEntity;

    /** Should block mount function export itself? */
    exports?: boolean | 'default';

    /** Slot symbols used in current block */
    slotSymbols: Set<string> = new Set();

    /**
     * @param name Name of the block, will be used as suffix in generated function
     * so it must be unique in its scope
     * @param topLevel Indicates this is a top-level block
     */
    constructor(readonly name: string, readonly state: CompileState, readonly parent?: BlockContext) {}

    /**
     * Generates mount, update and unmount functions from given entities
     */
    generate(entities: Entity[]): ChunkList {
        const { state, name, scopeUsage, hostUsage } = this;
        const scope = this.state.options.scope;

        const mountChunks: ChunkList = [];
        const updateChunks: ChunkList = [];
        const unmountChunks: ChunkList = [];

        /** List of all entities rendered by block */
        const allEntities: Entity[] = [];

        // List of entities that must be explicitly nulled because of absent unmount code
        const toNull: Entity[] = [];

        const add = (entity: Entity) => {
            allEntities.push(entity);

            let chunk: Chunk | void;
            if (chunk = entity.getMount()) {
                mountChunks.push(chunk);
            }

            entity.children.forEach(add);

            if (chunk = entity.getUpdate()) {
                updateChunks.push(chunk);
            }

            if (chunk = entity.getUnmount()) {
                unmountChunks.push(chunk);
            } else if (entity.symbolUsage.update) {
                // Entity was used in update code, which means it’s in component scope.
                // We have to reset it
                toNull.push(entity);
            }
        };

        entities.forEach(add);

        if (toNull.length) {
            scopeUsage.use('unmount');
            unmountChunks.push(toNull.map(entity => `${scope}.${entity.name} = `).join('') + 'null');
        }

        state.update(() => {
            const symbols: string[] = [];

            if (symbols.length) {
                updateChunks.unshift(`let ${symbols.join(' = ')} = 0`);
            }
        });

        // Destructure element refs for smaller code
        const updateRefs = allEntities
            .filter(ent => ent.symbolUsage.update > 1)
            .map(ent => ent.name);

        if (updateRefs.length) {
            state.update(() => {
                updateChunks.unshift(`const { ${updateRefs.join(', ')} } = ${state.scope}`);
            });
        }

        if (this.slotSymbols.size) {
            // Mark used slot symbols as updated in mount and unmount context
            const updateSlots = `${Array.from(this.slotSymbols).join(' = ')} = 1`;
            mountChunks.push(updateSlots);
            unmountChunks.push(updateSlots);
            // Mark scope as used in unmount context in case if slot marker is
            // the only output of unmount function
            scopeUsage.use('unmount');
        }

        if (unmountChunks.length) {
            mountChunks.push(state.runtime('addDisposeCallback', [this.injector ? this.injector.name : state.host, `${name}Unmount`]));
        }

        if (updateChunks.length) {
            mountChunks.push(`return ${name}Update`);
        }

        const { indent } = state;
        const injectorArg = this.injector ? this.injector.name : '';
        const scopeArg = (count: number): string => count ? scope : '';
        const mountFn = createFunction(name, [state.host, injectorArg, scopeArg(scopeUsage.mount)], mountChunks, indent);

        if (this.exports) {
            mountFn.prepend([`export `, this.exports === 'default' ? 'default ' : '']);
        }

        return [
            mountFn,
            createFunction(`${name}Update`, [state.host, injectorArg, scopeArg(scopeUsage.update)], updateChunks, indent),
            createFunction(`${name}Unmount`, [scopeArg(scopeUsage.unmount), hostUsage.unmount ? state.host : null], unmountChunks, indent)
        ];
    }
}
