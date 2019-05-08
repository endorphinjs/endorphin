import { Literal, Program } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import { isExpression, qStr } from '../lib/utils';

export default class TextEntity extends Entity {
    constructor(readonly node: Literal | Program, readonly state: CompileState) {
        super('text', state);
        if (isExpression(node)) {
            const expr = state.shared(() => generateExpression(node, state));
            this.setMount(() => state.runtime('text', [expr], node));
            this.setUpdate(() => state.runtime('updateText', [this.getSymbol(), expr], node));
        } else {
            this.setMount(() => state.runtime('text', [qStr(node.value as string)], node));
        }
    }
}
