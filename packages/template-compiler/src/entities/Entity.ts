import { Node } from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import CompileState from '../lib/CompileState';
import UsageStats from '../lib/UsageStats';
import { Chunk, RenderChunk, UsageContext, TemplateContinue, RuntimeSymbols } from '../types';
import { sn, nameToJS } from '../lib/utils';
import BlockContext from '../lib/BlockContext';

export type RenderOptions = { [K in RenderContext]?: RenderChunk };
type RenderContext = UsageContext | 'shared';

/**
 * Factory function for shorter entity instance code
 */
export function entity(name: string | Entity, state: CompileState, render?: RenderOptions): Entity {
    const ent = new Entity(name, state);
    if (render) {
        if (render.mount) {
            ent.setMount(render.mount);
        }

        if (render.update) {
            ent.setUpdate(render.update);
        }

        if (render.unmount) {
            ent.setUnmount(render.unmount);
        }

        if (render.shared) {
            ent.setShared(render.shared);
        }
    }
    return ent;
}

export default class Entity {
    children: Entity[] = [];

    /** Scoped entity symbol name */
    name: string;

    /** Raw (unscoped) entity symbol name */
    readonly rawName: string;

    /** Pointer to a parent entity which is referred by current entity */
    readonly parent?: Entity;

    /** Block context where current entity was created */
    readonly block?: BlockContext;

    /** Entity code chunks */
    code: { [K in UsageContext]?: Chunk };
    readonly symbolUsage = new UsageStats();

    constructor(name: string | Entity, readonly state: CompileState) {
        if (name instanceof Entity) {
            // Creating entity which must refer to another entity
            this.parent = name;
            this.rawName = name.rawName;
            this.name = name.name;
        } else if (name) {
            this.name = state.scopeSymbol(nameToJS(name));
            this.rawName = name;
        } else {
            this.name = this.rawName = '';
        }

        this.code = {
            mount: null,
            update: null,
            unmount: null
        };
        this.block = state.blockContext;
    }

    /**
     * Returns reference to current symbol in runtime scope
     */
    get scopeName(): string {
        return `${this.state.scope}.${this.name}`;
    }

    /**
     * Symbol for referencing current entity in current render scope.
     * Note that node returned by current method is self-modified depending on entity usage
     */
    getSymbol(): SourceNode {
        const { renderContext, blockContext } = this.state;

        if (!blockContext) {
            throw new Error('No block context!');
        }

        this.symbolUsage.use(renderContext);
        return blockContext.getRefNode(this, renderContext);
    }

    /**
     * Returns mount code for current entity
     */
    getMount(): Chunk {
        return this.code.mount;
    }

    /**
     * Set mount code for given entity
     */
    setMount(fn: RenderChunk): this {
        this.code.mount = this.state.mount(() => fn(this));
        this.state.blockContext.setMounted(this);
        return this;
    }

    /**
     * Returns entity update code
     */
    getUpdate(): Chunk {
        return this.code.update;
    }

    /**
     * Set update code for given entity
     */
    setUpdate(fn: RenderChunk): this {
        this.code.update = this.state.update(() => fn(this));
        return this;
    }

    /**
     * Returns entity update code
     */
    getUnmount(): Chunk {
        return this.code.unmount;
    }

    /**
     * Set unmount code for given entity
     */
    setUnmount(fn: RenderChunk): this {
        this.code.unmount = this.state.unmount(() => fn(this));
        return this;
    }

    /**
     * Set shared (mount and update) code for given entity
     */
    setShared(fn: RenderChunk): this {
        // NB run code twice to properly mark items usage in different render contexts
        this.setMount(fn);
        this.setUpdate(fn);
        return this;
    }

    /**
     * Adds given entity as a child of current one
     */
    add(ent: Entity): void {
        this.children.push(ent);
    }

    /**
     * Adds given entity as the first child of current one
     */
    prepend(ent: Entity): void {
        this.children.unshift(ent);
    }

    /**
     * Sets current entity content by receiving entities from given AST nodes
     */
    setContent(nodes: Node[], next: TemplateContinue): this {
        // Collect contents in two passes: convert nodes to entities to collect
        // injector usage, then attach it to element
        nodes.map(next).forEach(ent => ent && this.add(ent));
        return this;
    }

    /**
     * Creates code chunk that unmounts current entity with given runtime function
     */
    unmount(runtime: RuntimeSymbols): SourceNode {
        return sn([this.scopeName, ` = ${this.state.runtime(runtime)}(`, this.getSymbol(), ')']);
    }
}
