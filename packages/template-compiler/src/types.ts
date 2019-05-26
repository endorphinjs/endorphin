import { SourceNode } from 'source-map';
import { ENDImport, Node } from '@endorphinjs/template-parser';
import CompileState from './lib/CompileState';
import Entity from './entities/Entity';

export type UsageContext = 'mount' | 'update' | 'unmount';
export type RenderContext = UsageContext | 'shared';
export type RenderChunk = (entity: Entity) => Chunk;
export interface HelpersMap { [url: string]: string[]; }
export interface PlainObject { [key: string]: string; }

// AST Walkers
export type AstVisitorContinue<T> = (node: Node) => T;
export type AstVisitor<T> = (node: Node, state: CompileState, next: AstVisitorContinue<T>) => T;
export interface AstVisitorMap<T> { [name: string]: AstVisitor<T>; }

export type Chunk = string | SourceNode;
export type ChunkList = Chunk[];

export type ExpressionOutput = SourceNode;
export type ExpressionContinue = AstVisitorContinue<ExpressionOutput>;
export type ExpressionVisitorMap = AstVisitorMap<ExpressionOutput>;

export type TemplateOutput = Entity | void;
export type TemplateContinue = AstVisitorContinue<TemplateOutput>;
export type TemplateVisitorMap = AstVisitorMap<TemplateOutput>;

/** Endorphin runtime functions */
export type RuntimeSymbols = 'mountBlock' | 'updateBlock' | 'unmountBlock'
    | 'mountIterator' | 'updateIterator' | 'unmountIterator'
    | 'mountKeyIterator' | 'updateKeyIterator' | 'unmountKeyIterator'
    | 'mountComponent' | 'updateComponent' | 'unmountComponent'
    | 'mountInnerHTML' | 'updateInnerHTML' | 'unmountInnerHTML'
    | 'mountPartial' | 'updatePartial' | 'unmountPartial'
    | 'createSlot' | 'mountSlot' | 'updateIncomingSlot' | 'updateDefaultSlot' | 'unmountSlot'
    | 'createInjector' | 'unmountInjector' | 'block'
    | 'setAttribute' | 'setAttributeNS' | 'addClass' | 'finalizeAttributes'
    | 'addEvent' | 'addStaticEvent' | 'removeStaticEvent' | 'finalizeEvents'
    | 'setRef' | 'finalizeRefs' | 'createComponent' | 'updateText'
    | 'insert' | 'get' | 'call' | 'assign' | 'elem' | 'elemWithText' | 'elemNS'
    | 'elemNSWithText' | 'text' | 'filter' | 'find' | 'subscribeStore'
    | 'animate' | 'createAnimation' | 'domRemove';

export interface ComponentImport {
    /** JS symbol for referencing imported module */
    symbol: string;

    /** URL of module */
    href: string;

    /** Source node */
    node: ENDImport;

    /** Indicates given component was used */
    used?: boolean;
}
