import { ChunkList, Chunk, UsageContext } from '../types';
import CompileState from './CompileState';
import Entity from '../entities/Entity';
import ElementEntity from '../entities/ElementEntity';
import UsageStats from './UsageStats';
import { createFunction, sn } from './utils';
import InjectorEntity from '../entities/InjectorEntity';
import { SourceNode } from 'source-map';

interface EntityData {
    mounted: boolean;
    refs: { [K in UsageContext]: SourceNode };
    usage: UsageStats;
}

export default class BlockContext {
    element?: ElementEntity;
    scopeUsage = new UsageStats();
    hostUsage = new UsageStats();
    entities: Map<Entity, EntityData> = new Map();

    /** Indicates that block uses given injector as argument */
    injector?: InjectorEntity;

    /** Should block mount function export itself? */
    exports?: boolean | 'default';

    /** Slot symbols used in current block */
    slotSymbols: Set<string> = new Set();

    // Symbols of generated functions, if any
    mountSymbol?: string;
    updateSymbol?: string;
    unmountSymbol?: string;

    // Additional arguments to prepend to generated function
    mountArgs: string[] = [];
    updateArgs: string[] = [];
    unmountArgs: string[] = [];

    /** Indicates that generated functions should be unlinked */
    unlinked?: boolean;

    /**
     * @param name Name of the block, will be used as suffix in generated function
     * so it must be unique in its scope
     * @param topLevel Indicates this is a top-level block
     */
    constructor(readonly name: string, readonly state: CompileState) {}

    /**
     * Returns source node for referencing given entity in current block’s rendering context
     */
    getRefNode(entity: Entity, context: UsageContext): SourceNode {
        const data = this.getEntityData(entity);
        data.usage.use(context);
        return data.refs[context];
    }

    setMounted(entity: Entity) {
        this.getEntityData(entity).mounted = true;
    }

    getEntityData(entity: Entity): EntityData {
        if (!this.entities.has(entity)) {
            this.entities.set(entity, {
                mounted: false,
                refs: {
                    mount: sn(),
                    update: sn(),
                    unmount: sn()
                },
                usage: new UsageStats()
            });
        }

        return this.entities.get(entity)!;
    }

    /**
     * Generates mount, update and unmount functions from given entities
     */
    generate(entities: Entity[]): ChunkList {
        const { state, name, scopeUsage, hostUsage } = this;
        const { host, scope } = this.state.options;

        const mountChunks: ChunkList = [];
        const updateChunks: ChunkList = [];
        const unmountChunks: ChunkList = [];

        const mountSymbol = name;
        const updateSymbol = `${name}Update`;
        const unmountSymbol = `${name}Unmount`;

        /** List of all entities rendered by block */
        const allEntities: Entity[] = [];

        // List of entities that must be explicitly nulled because of absent unmount code
        const toNull: Entity[] = [];

        const add = (entity: Entity) => {
            allEntities.push(entity);

            let chunk: Chunk | void;
            if (chunk = this.getMountCode(entity)) {
                // If entity is mounted in current block, check if entity should
                // be referred in other blocks
                const ref = sn(chunk);
                if (!entity.parent) {
                    const { symbolUsage } = entity;

                    if (symbolUsage.update || symbolUsage.unmount) {
                        ref.prepend(`${entity.scopeName} = `);
                        scopeUsage.use('mount');
                    }

                    if (symbolUsage.mount) {
                        ref.prepend(`const ${entity.name} = `);
                    }
                }
                mountChunks.push(ref);
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

        this.setRefs();
        entities.forEach(add);

        // Edge case: do not null variables for main component template: since
        // component will be destroyed, all scope contents will be automatically
        // garbage collected
        if (toNull.length && this.exports !== 'default') {
            scopeUsage.use('unmount');
            unmountChunks.push(toNull.map(entity => `${entity.scopeName} = `).join('') + 'null');
        }

        // Destructure element refs for smaller code
        this.destructureRefs('mount', mountChunks);
        this.destructureRefs('update', updateChunks);
        this.destructureRefs('unmount', unmountChunks);

        if (this.slotSymbols.size) {
            // Mark used slot symbols as updated in mount and unmount context
            const updateSlots = `${Array.from(this.slotSymbols).join(' = ')} = 1`;
            mountChunks.push(updateSlots);
            unmountChunks.push(updateSlots);
            // Mark scope as used in unmount context in case if slot marker is
            // the only output of unmount function
            scopeUsage.use('unmount');
        }

        if (updateChunks.length && !this.unlinked) {
            mountChunks.push(`return ${updateSymbol}`);
        }

        const { indent } = state;
        const injectorArg = this.injector ? this.injector.name : '';
        const hostArg = (ctx: keyof UsageStats) => hostUsage[ctx] || (ctx === 'mount' && injectorArg) || scopeUsage[ctx] ? host : '';
        const scopeArg = (ctx: keyof UsageStats): string => scopeUsage[ctx] ? scope : '';
        const mountFn = createFunction(mountSymbol, [...this.mountArgs, hostArg('mount'), injectorArg, scopeArg('mount')], mountChunks, indent);
        const updateFn = createFunction(updateSymbol, [...this.updateArgs, hostArg('update'), scopeArg('update')], updateChunks, indent);
        const unmountFn = createFunction(unmountSymbol,
            [...this.unmountArgs, scopeArg('unmount'), hostUsage.unmount ? host : null], unmountChunks, indent);

        if (this.exports) {
            mountFn.prepend([`export `, this.exports === 'default' ? 'default ' : '']);
        }

        if (mountFn && unmountFn && !this.unlinked) {
            mountFn.add(`\n${name}.dispose = ${unmountSymbol};\n`);
        }

        this.mountSymbol = name;
        this.updateSymbol = updateFn ? updateSymbol : null;
        this.unmountSymbol = unmountFn ? unmountSymbol : null;

        return [mountFn, updateFn, unmountFn];
    }

    private getMountCode(entity: Entity): Chunk | undefined {
        return this.getEntityData(entity).mounted ? entity.getMount() : null;
    }

    private destructureRefs(context: UsageContext, chunks: ChunkList) {
        const entities: Entity[] = [];
        this.entities.forEach((data, entity) => {
            if (data.usage[context] > 1 && (context !== 'mount' || !data.mounted)) {
                entities.push(entity);
            }
        });

        if (entities.length && chunks.length) {
            this.scopeUsage.use(context);
            chunks.unshift(`const { ${entities.map(ent => ent.name).join(', ')} } = ${this.state.options.scope}`);
        }
    }

    /**
     * Writes contents of into ref source nodes for entities used in current block
     */
    private setRefs() {
        this.entities.forEach((data, entity) => {
            const { usage, refs } = data;
            if (usage.mount) {
                // If entity was mounted in current block we should use local
                // variable for referencing entity. Also use local var if entity
                // is used more than once, otherwise use scoped var
                if (!entity.parent && (data.mounted || usage.mount > 1)) {
                    refs.mount.add(entity.name);
                } else {
                    refs.mount.add(entity.scopeName);
                    this.scopeUsage.use('mount');
                }
            }

            if (usage.update) {
                refs.update.add(usage.update > 1 ? entity.name : entity.scopeName);
                this.scopeUsage.use('update');
            }

            if (usage.unmount) {
                refs.unmount.add(usage.unmount > 1 ? entity.name : entity.scopeName);
                this.scopeUsage.use('unmount');
            }
        });
    }
}
