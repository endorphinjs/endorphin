import { SourceNode } from 'source-map';
import { ENDElement, ENDImport, ENDTemplate, IdentifierContext, Node } from '@endorphinjs/template-parser';
import BlockContext from './BlockContext';
import Entity, { RenderOptions, entity } from '../entities/Entity';
import ElementEntity from '../entities/ElementEntity';
import createSymbolGenerator, { SymbolGenerator } from './SymbolGenerator';
import ComponentState from './ComponentState';
import { nameToJS, propGetter, isIdentifier, isLiteral, isElement, sn, prepareHelpers } from './utils';
import { Chunk, RenderContext, ComponentImport, RuntimeSymbols, ChunkList } from '../types';
import { CompileOptions } from '..';

interface NamespaceMap {
    [prefix: string]: string;
}

interface PartialDeclaration {
    name: string;
    defaults: Chunk;
}

export const defaultOptions: CompileOptions = {
    host: 'host',
    scope: 'scope',
    partials: 'partials',
    indent: '\t',
    prefix: '',
    suffix: '$',
    module: 'endorphin',
    component: ''
};

export default class CompileState {
    /** Current indentation token */
    get indent(): string {
        return this.options.indent;
    }

    /** Symbol for referencing host component */
    get host(): string {
        const { blockContext, renderContext } = this;
        if (blockContext && renderContext) {
            blockContext.hostUsage.use(renderContext);
        }
        return this.options.host;
    }

    /** Symbol for referencing runtime scope */
    get scope(): string {
        const { blockContext, renderContext } = this;
        if (blockContext && renderContext) {
            blockContext.scopeUsage.use(renderContext);
        }
        return this.options.scope;
    }

    /** Symbol for referencing current element’s injector */
    get injector() {
        return this.element.injector;
    }

    /** Context element */
    get element(): ElementEntity {
        return this.blockContext
            && this.blockContext.element;
    }

    get hasPartials(): boolean {
        return this.partialsMap.size > 0;
    }

    /** Symbol for referencing partials */
    get partials(): string {
        return this.options.partials;
    }

    /** Current rendering context */
    get renderContext(): RenderContext {
        return this._renderContext;
    }

    /**
     * Returns symbol for referencing CSS scope of current component or `null`
     * if component is unscoped
     */
    get cssScope(): string | null {
        return this.options.cssScope ? this.cssScopeSymbol : null;
    }

    /** Endorphin runtime symbols required by compiled template */
    usedRuntime: Set<RuntimeSymbols> = new Set();

    /** List of helpers used in compiled template */
    usedHelpers: Set<string> = new Set();

    /** List of symbols used for store access in template */
    usedStore: Set<string> = new Set();

    /** Context of currently rendered block */
    blockContext?: BlockContext;

    readonly options: CompileOptions;

    /** Generated code output */
    readonly output = new SourceNode();

    /** Generates unique global JS module symbol with given name */
    globalSymbol: SymbolGenerator;

    /** Generates unique symbol with given name for storing in component scope */
    scopeSymbol: SymbolGenerator;

    /** Current component and slot context */
    component?: ComponentState;

    /** List of child components */
    readonly componentsMap: Map<string, ComponentImport> = new Map();

    /** List of child components */
    readonly partialsMap: Map<string, PartialDeclaration> = new Map();

    /** List of used namespaces and their JS symbols */
    namespaceSymbols: Map<string, string> = new Map();

    /**
     * List of available helpers. Key is a helper name (name of function) and value
     * is a module URL
     */
    readonly helpers: {
        [name: string]: string;
    };

    /** List of all registered slot update symbols */
    readonly slotSymbols: string[] = [];

    /** Symbol for referencing CSS isolation scope */
    private readonly cssScopeSymbol = 'cssScope';

    /** Current namespaces */
    private namespaceMap: NamespaceMap = {};

    private _renderContext?: RenderContext;
    private _warned: Set<string> = new Set();

    constructor(options?: CompileOptions) {
        this.options = Object.assign({}, defaultOptions, options);
        this.helpers = prepareHelpers(options && options.helpers || {});

        const { prefix = '', suffix = '' } = this.options;
        const globalSuffix = nameToJS(this.options.component || '', true) + suffix;
        this.globalSymbol = createSymbolGenerator(prefix, num => globalSuffix + num.toString(36));
        this.scopeSymbol = createSymbolGenerator(prefix, num => suffix + num.toString(36));
    }

    /**
     * Getter for Endorphin runtime symbols: marks given symbol as used to
     * explicitly import it from Endorphin runtime lib
     */
    runtime(symbol: RuntimeSymbols): RuntimeSymbols;

    /**
     * Creates code chunk that invokes given runtime function with arguments.
     * The runtime function is marked as used and imported in final bundle
     */
    runtime(symbol: RuntimeSymbols, args: ChunkList, node?: Node): SourceNode;

    runtime(symbol: RuntimeSymbols, args?: ChunkList, node?: Node): RuntimeSymbols | SourceNode {
        this.usedRuntime.add(symbol);
        return args ? sn([`${symbol}(`, sn(args).join(', '), ')'], node) : symbol;
    }

    /**
     * Returns current namespace JS symbol for given prefix, if available
     */
    namespace(prefix: string = ''): string {
        const uri = this.namespaceMap[prefix];
        if (uri) {
            if (!this.namespaceSymbols.has(uri)) {
                this.namespaceSymbols.set(uri, this.globalSymbol('ns'));
            }

            return this.namespaceSymbols.get(uri);
        }
    }

    /**
     * Returns accessor prefix from host component for given identifier context
     */
    prefix(context: IdentifierContext): string {
        if (context === 'property') {
            return `${this.host}.props`;
        }

        if (context === 'state') {
            return `${this.host}.state`;
        }

        if (context === 'variable') {
            return this.scope;
        }

        if (context === 'store') {
            return `${this.host}.store.data`;
        }

        if (context === 'definition') {
            return `${this.host}.componentModel.definition`;
        }

        return '';
    }

    /**
     * Issues new slot update symbol
     */
    slotSymbol(): string {
        const symbol = this.globalSymbol('su');
        this.slotSymbols.push(symbol);
        return symbol;
    }

    /**
     * Accumulates slot update
     */
    markSlot<T extends Entity>(ent?: T): T {
        if (this.component) {
            this.component.mark(ent);
        }

        return ent;
    }

    /**
     * Creates new block with `name` and runs `fn` function in its context.
     * Block context, accumulated during `fn` run, will be generates and JS code
     * and added into final output
     * @returns Variable name for given block, generated from `name` argument
     */
    runBlock(name: string, fn: (block: BlockContext) => Entity | Entity[]): string {
        const prevBlock = this.blockContext;
        const block = new BlockContext(this.globalSymbol(name), this, !prevBlock);

        this.blockContext = block;
        const result = this.mount(() => fn(block));
        const entities = Array.isArray(result)
            ? result.filter(Boolean)
            : (result ? [result] : []);
        this.blockContext = prevBlock;

        block.generate(entities)
            .forEach(chunk => this.pushOutput(chunk));

        return block.name;
    }

    /**
     * Runs given `fn` function in context of `node` element
     */
    runElement(node: ENDTemplate | ENDElement | null, fn: (entity: ElementEntity) => void): ElementEntity {
        const { blockContext, namespaceMap } = this;

        if (!blockContext) {
            throw new Error('Unable to run in element context: parent block is absent');
        }

        const prevElem = blockContext.element;
        const ent = blockContext.element = new ElementEntity(node, this);

        if (node && isElement(node)) {
            this.namespaceMap = {
                ...namespaceMap,
                ...collectNamespaces(node)
            };
        }

        fn(ent);

        this.namespaceMap = namespaceMap;
        blockContext.element = prevElem;
        return ent;
    }

    /**
     * Runs given function in context of child block. A child block is a block
     * which updates contents of element in outer block. It always works via
     * injector, which must be passed as function argument
     */
    runChildBlock(name: string, fn: (block: BlockContext, element: ElementEntity) => void): string {
        return this.runBlock(name, block => {
            const elem = this.runElement(null, element => fn(block, element));
            block.injector = elem.injectorEntity;
            return elem;
        });
    }

    /**
     * Marks given helper symbol as used
     */
    helper(symbol: string): string {
        this.usedHelpers.add(symbol);
        return symbol;
    }

    /**
     * Marks given store property of current component as used
     * @param name
     */
    store(name: string): string {
        this.usedStore.add(name);
        return `${this.options.host}.store.data${propGetter(name)}`;
    }

    /**
     * Creates new entity with given name and render options
     */
    entity(name?: string | RenderOptions, options?: RenderOptions): Entity {
        if (typeof name !== 'string') {
            options = name;
            name = '';
        }

        return entity(name, this, options);
    }

    /**
     * Runs given function in `mount` block context
     */
    mount<T>(fn: (state: this) => T): T {
        return this.runInContext('mount', fn);
    }

    /**
     * Runs given function in `update` block context
     */
    update<T>(fn: (state: this) => T): T {
        return this.runInContext('update', fn);
    }

    /**
     * Runs given function in `unmount` block context
     */
    unmount<T>(fn: (state: this) => T): T {
        return this.runInContext('unmount', fn);
    }

    /**
     * Runs given function in `shared` block context (both `mount` and `update`)
     */
    shared<T>(fn: (state: this) => T): T {
        return this.runInContext('shared', fn);
    }

    /**
     * Check if given element is a *registered* component
     */
    isComponent(elem: ENDElement): boolean {
        const elemName = elem.name.name;
        const component = this.componentsMap.get(elemName);
        if (component) {
            return component.used = true;
        }

        if (elem.component) {
            this.warnOnce(elemName, `Missing component definition for <${elemName}>, did you forgot to <link rel="import"> it?`,
                elem.loc.start.offset);
        }
    }

    /**
     * Returns component definition symbol for given element
     */
    getComponent(elem: ENDElement): string {
        const elemName = elem.name.name;
        return this.componentsMap.get(elemName).symbol;
    }

    registerComponent(elem: ENDImport) {
        this.componentsMap.set(elem.name, {
            symbol: nameToJS(elem.name, true),
            href: elem.href,
            node: elem
        });
    }

    /**
     * Displays warning with given message
     */
    warn(msg: string, pos?: number): void {
        if (this.options.warn) {
            this.options.warn(msg, pos);
        }
    }

    /**
     * Displays warning only once for given label
     */
    warnOnce(label: string, msg: string, pos?: number): void {
        if (!this._warned.has(label)) {
            this._warned.add(label);
            this.warn(msg, pos);
        }
    }

    /**
     * Adds given chunk to generated output
     */
    pushOutput(chunk: Chunk | void): void {
        if (chunk) {
            this.output.add(chunk);
            this.output.add('\n');
        }
    }

    /**
     * Runs given function in given rendering context
     */
    private runInContext<T>(ctx: RenderContext, fn: (state: this) => T): T {
        const prev = this.renderContext;
        this._renderContext = ctx;
        const result = fn(this);
        this._renderContext = prev;
        return result;
    }
}

/**
 * Collects namespaces registered in given element
 */
function collectNamespaces(elem: ENDElement): NamespaceMap {
    const result = {};
    elem.attributes.forEach(attr => {
        if (isIdentifier(attr.name)) {
            const parts = attr.name.name.split(':');
            const prefix = parts.shift();

            if (prefix === 'xmlns' && isLiteral(attr.value)) {
                result[parts.join(':')] = String(attr.value.value);
            }
        }
    });

    return result;
}
