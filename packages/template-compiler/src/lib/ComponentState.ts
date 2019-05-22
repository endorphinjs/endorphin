import ElementEntity from '../entities/ElementEntity';
import CompileState from './CompileState';
import Entity from '../entities/Entity';
import { sn } from './utils';

/**
 * Represents state of currently rendering component
 */
export default class ComponentState {
    slot: string | null = null;
    constructor(readonly element: ElementEntity, private state: CompileState) {}

    /**
     * Returns variable for accumulating slot update
     */
    get slotMark(): string | null {
        const { slot, element, state } = this;

        if (slot == null) {
            return null;
        }

        if (!(slot in element.slotUpdate)) {
            element.slotUpdate[slot] = state.slotSymbol();
        }

        // Always generate new name to properly mark `scope` usage
        return `${state.scope}.${element.slotUpdate[slot]}`;
    }

    /**
     * Accumulate current slot update from given entity
     */
    mark(entity?: Entity) {
        const mark = this.slotMark;
        if (mark != null) {
            const { blockContext } = this.state;
            if (blockContext && !blockContext.topLevel) {
                blockContext.slotSymbols.add(mark);
            }

            if (entity) {
                entity.setUpdate(() => sn([this.slotMark, ' |= ', entity.getUpdate()]));
            }
        }
    }
}
