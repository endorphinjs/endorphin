import { Literal, Program } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import { isExpression, qStr } from '../lib/utils';

export default class TextEntity extends Entity {
    constructor(readonly node: Literal | Program, readonly state: CompileState) {
        super('text', state);
        if (isExpression(node)) {
            this.setMount(() => state.runtime('text', [generateExpression(node, state)], node));
            this.setUpdate(() => state.runtime('updateText', [this.getSymbol(), generateExpression(node, state)], node));
        } else {
            this.setMount(() => state.runtime('text', [qStr(node.value as string)], node));
        }

        let { slot } = state;
        if (slot == null && state.component && state.receiver === state.component) {
            // Adding text as immediate child of component: redirect to default slot
            slot = '';
        }
        state.markSlot(this, slot);
    }
}
