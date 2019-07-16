import Entity from './Entity';
import ElementEntity from './ElementEntity';
import CompileState from '../lib/CompileState';
import { ChunkList } from '../types';
import { pendingAttributesCur } from '../lib/utils';

export default class ComponentMountEntity extends Entity {
    constructor(readonly element: ElementEntity, state: CompileState) {
        super('', state);
        this.setMount(() => {
            const args: ChunkList = [element.getSymbol()];
            if (element.hasPendingAttributes) {
                args.push(pendingAttributesCur(state, element));
            }
            return state.runtime('mountComponent', args);
        });

        this.setUnmount(() => element.unmount('unmountComponent'));

        if (element.hasPendingAttributes && element.pendingAttributes.symbolUsage.update) {
            // Pending props receiver is used in update scope, should update component as well
            this.setUpdate(() => state.runtime('updateComponent', [element.getSymbol(), pendingAttributesCur(state, element)]));
            state.markSlot(this);
        }
    }
}
