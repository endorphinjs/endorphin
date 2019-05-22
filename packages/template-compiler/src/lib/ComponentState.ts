import ElementEntity from '../entities/ElementEntity';
import BlockContext from './BlockContext';

/**
 * Represents state of currently rendering component
 */
export default class ComponentState {
    slot: string | null = null;
    constructor(readonly element: ElementEntity, readonly block: BlockContext) {}
}
