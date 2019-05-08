import Entity from './Entity';
import CompileState from '../lib/CompileState';
import { sn } from '../lib/utils';
import { SourceNode } from 'source-map';

export default class InjectorEntity extends Entity {
    /**
     * @param isArgument Indicates that current entity is passed as argument and
     * should not be added to local scope when used
     */
    constructor(readonly rawName: string, readonly state: CompileState, readonly isArgument?: boolean) {
        super(rawName, state);
        if (isArgument) {
            this.name = rawName;
        }
    }

    getSymbol(): SourceNode {
        if (this.isArgument) {
            this.symbolUsage.use(this.state.renderContext);
            return sn(this.name);
        }

        return super.getSymbol();
    }
}
