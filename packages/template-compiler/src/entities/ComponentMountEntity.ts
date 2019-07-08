import Entity from './Entity';
import ElementEntity from './ElementEntity';
import CompileState from '../lib/CompileState';
import { ChunkList } from '../types';

export default class ComponentMountEntity extends Entity {
    constructor(readonly element: ElementEntity, state: CompileState) {
        super('', state);
        this.setMount(() => {
            const args: ChunkList = [element.getSymbol()];
            if (element.hasPendingAttributes) {
                args.push(element.pendingAttributes.getSymbol());
            }
            return state.runtime('mountComponent', args);
        });

        this.setUnmount(() => element.unmount('unmountComponent'));

        if (element.hasPendingAttributes && element.pendingAttributes.symbolUsage.update) {
            // Pending props receiver is used in update scope, should update component as well
            this.setUpdate(() => state.runtime('updateComponent', [element.getSymbol(), element.pendingAttributes.getSymbol()]));
            state.markSlot(this);
        }
    }
}
