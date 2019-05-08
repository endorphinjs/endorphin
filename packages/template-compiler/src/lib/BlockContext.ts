import { SourceNode } from 'source-map';
import { ChunkList, Chunk, UsageContext, RenderContext } from '../types';
import CompileState from './CompileState';
import Entity from '../entities/Entity';
import ElementEntity from '../entities/ElementEntity';
import UsageStats from './UsageStats';
import { sn, format } from './utils';
import InjectorEntity from '../entities/InjectorEntity';

interface VariableMap {
    [name: string]: string | void;
}

export default class BlockContext {
    element?: ElementEntity;
    scopeUsage = new UsageStats();

    /** Runtime variables used in block render */
    variables: { [K in UsageContext]?: VariableMap } = {};

    /** Indicates that block uses given injector as argument */
    injector?: InjectorEntity;

    /** Should block mount function export itself? */
    exports?: boolean | 'default';

    /**
     * @param name Name of the block, will be used as suffix in generated function
     * so it must be unique in its scope
     */
    constructor(readonly name: string, readonly state: CompileState) {}

    /**
     * Variable reference to component scope
     */
    get scope(): string {
        this.scopeUsage.use(this.state.renderContext);
        return this.rawScope;
    }

    /**
     * Variable reference to component scope without marking usage
     */
    get rawScope(): string {
        return this.state.options.scope;
    }

    /**
     * Declares variable with given default value
     */
    declareVar(name: string, value?: string): string {
        const { renderContext } = this.state;
        if (this.variables[renderContext]) {
            this.variables[renderContext][name] = value;
        } else {
            this.variables[renderContext] = { [name]: value };
        }

        return name;
    }

    /**
     * Generates mount, update and unmount functions from given entities
     */
    generate(entities: Entity[]): ChunkList {
        const { state, name, scopeUsage, rawScope: scope } = this;
        const scopeArg = (count: number, first?: boolean): string => count ? `${first ? '' : ', '}${scope}` : '';

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

        if (unmountChunks.length) {
            mountChunks.push(state.runtime('addDisposeCallback', [state.host, `${name}Unmount`]));
        }

        if (updateChunks.length) {
            mountChunks.push(`return ${name}Update`);
        }

        this.pushVars(updateChunks, 'update');

        const { indent } = state;
        const injectorArg = this.injector ? `, ${this.injector.name}` : '';
        const mountFn = createFunction(name, `${state.host}${injectorArg}${scopeArg(scopeUsage.mount)}`, mountChunks, indent);

        if (this.exports) {
            mountFn.prepend([`export `, this.exports === 'default' ? 'default ' : '']);
        }

        return [
            mountFn,
            createFunction(`${name}Update`, `${state.host}${injectorArg}${scopeArg(scopeUsage.update)}`, updateChunks, indent),
            createFunction(`${name}Unmount`, scopeArg(scopeUsage.unmount, true), unmountChunks, indent)
        ];
    }

    private pushVars(chunks: ChunkList, context: RenderContext) {
        const vars = this.variables[context];
        if (vars) {
            const varNames = Object.keys(vars);

            if (varNames.length) {
                const decl = varNames
                    .map(name => `${name}${vars[name] ? ` = ${vars[name]}` : ''}`)
                    .join(', ');
                chunks.unshift(`let ${decl}`);
                chunks.push(`return ${varNames.join(' | ')}`);
            }
        }
    }
}

/**
 * Generates function from given fragments
 */
function createFunction(name: string, args: string, chunks: ChunkList, indent: string = '\t'): SourceNode {
    if (chunks && chunks.length) {
        return sn([
            `function ${name}(${args}) {\n${indent}`,
            ...format(chunks, indent),
            '\n}\n'
        ]);
    }
}
