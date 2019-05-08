import { ENDInnerHTML } from '@endorphinjs/template-parser';
import Entity from './Entity';
import { fn } from '../expression';
import CompileState from '../lib/CompileState';

export default class InnerHTMLEntity extends Entity {
    constructor(readonly node: ENDInnerHTML, readonly state: CompileState) {
        super('html', state);
        this.setMount(() => state.runtime('mountInnerHTML', [state.host, state.injector, fn('html', state, node.value)], node));
        this.setUpdate(() => state.runtime('updateInnerHTML', [this.getSymbol()], node));
        this.setUnmount(() => this.unmount('unmountInnerHTML'));
    }
}
