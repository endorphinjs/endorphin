import { ENDForEachStatement, Node } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import { fn } from '../expression';
import { TemplateContinue } from '../types';

export default class IteratorEntity extends Entity {
    constructor(readonly node: ENDForEachStatement, readonly state: CompileState) {
        super('for', state);
    }

    setContent(statements: Node[], next: TemplateContinue): this {
        const { state, node, rawName } = this;
        this.setMount(() => {
            const select = fn(`${rawName}Select`, state, node.select);
            const key: string = node.key ? fn(`${rawName}Key`, state, node.key) : null;
            const content = state.runChildBlock(`${rawName}Content`, (ctx, element) =>
                element.setContent(statements, next));

            return state.runtime(key ? 'mountKeyIterator' : 'mountIterator', [state.host, state.injector, select, key, content], node);
        });
        this.setUpdate(() => state.runtime(node.key ? 'updateKeyIterator' : 'updateIterator', [this.getSymbol()], node));
        this.setUnmount(() => this.unmount(node.key ? 'unmountKeyIterator' : 'unmountIterator'));

        return this;
    }
}
