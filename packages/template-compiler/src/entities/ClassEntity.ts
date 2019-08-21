import { ENDDirective } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import { qStr, sn, pendingAttributes } from '../lib/utils';
import { compileAttributeValue } from './AttributeEntity';

export default class ClassEntity extends Entity {
    constructor(readonly node: ENDDirective, readonly state: CompileState) {
        super('class', state);
        const { receiver } = state;

        if (receiver) {
            if (receiver.isComponent) {
                if (receiver.hasConditionalClassNames()) {
                    this.setShared(() => renderPendingClass(node, state));
                } else {
                    this.setMount(() => renderPendingClass(node, state));
                }
            } else if (receiver.hasDynamicClass()) {
                this.setShared(() => renderPendingClass(node, state));
            } else if (node.value) {
                // Value is used as a condition for toggling class name
                this.setMount(() => state.runtime('addClassIf', [
                    receiver.getSymbol(),
                    qStr(node.name),
                    compileAttributeValue(node.value, state)
                ]));
                this.setUpdate(() => sn([this.scopeName, ' = ', state.runtime('toggleClassIf', [
                    receiver.getSymbol(),
                    qStr(node.name),
                    compileAttributeValue(node.value, state),
                    this.getSymbol()
                ])]));
            } else {
                this.setMount(() => state.runtime('addClass', [
                    receiver.getSymbol(),
                    qStr(node.name)
                ]));
            }
        }
    }
}

function renderPendingClass(node: ENDDirective, state: CompileState) {
    if (node.value) {
        return state.runtime('addPendingClassIf', [
            pendingAttributes(state),
            qStr(node.name),
            compileAttributeValue(node.value, state)
        ]);
    }

    return state.runtime('addPendingClass', [
        pendingAttributes(state),
        qStr(node.name)
    ]);
}
