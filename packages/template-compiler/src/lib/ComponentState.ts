import ElementEntity from '../entities/ElementEntity';
import CompileState from './CompileState';

/**
 * Represents state of currently rendering component
 */
export default class ComponentState {
    slot: string = '';
    constructor(readonly element: ElementEntity, private state: CompileState) {}

    /**
     * Returns variable for accumulating slot update
     */
    get slotMark(): string {
        const { slot, element, state } = this;

        if (!(slot in element.slotUpdate)) {
            element.slotUpdate[slot] = state.globalSymbol('su');
        }

        return state.blockContext.declareVar(element.slotUpdate[slot], '0');
    }
}
