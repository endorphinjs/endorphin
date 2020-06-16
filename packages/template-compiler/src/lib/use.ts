import { ENDDirective } from '@endorphinjs/template-parser';
import ElementEntity from '../entities/ElementEntity';
import Entity from '../entities/Entity';
import CompileState from './CompileState';
import { ChunkList } from '../types';
import { compileAttributeValue } from './attributes';

/**
 * Mounts `use:***` directive
 */
export default function mountUse(directive: ENDDirective, receiver: ElementEntity, state: CompileState): Entity {
    state.usedDefinition.add(directive.name);
    const ent = state.entity('use', {
        mount() {
            const args: ChunkList = [state.host, receiver.getSymbol(), directive.name];
            if (directive.value) {
                args.push(compileAttributeValue(directive.value, state));
            }
            return state.runtime('mountUse', args);
        }
    });

    if (directive.value) {
        ent.setUpdate(() => {
            return state.runtime('updateUse', [ent.getSymbol(), compileAttributeValue(directive.value, state)]);
        });
    }

    ent.setUnmount(() => ent.unmount('unmountUse'));
    return ent;
}
