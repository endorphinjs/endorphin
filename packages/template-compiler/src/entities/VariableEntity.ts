import { ENDVariableStatement, ENDAttributeValue } from '@endorphinjs/template-parser';
import Entity, { entity } from './Entity';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import { sn, propGetter, isLiteral, isExpression } from '../lib/utils';

export default class VariableEntity extends Entity {
    constructor(readonly node: ENDVariableStatement, readonly state: CompileState) {
        super('vars', state);
        const fn = state.runBlock('setVars', () => {
            return node.variables.map(v => entity(v.name, state, {
                mount: () => sn([`${state.scope}${propGetter(v.name)} = `, compileValue(v.value, state)])
            }));
        });
        this.setShared(() => `${fn}(${state.host}, ${state.scope})`);
    }
}

function compileValue(value: ENDAttributeValue, state: CompileState) {
    if (isLiteral(value)) {
        return sn(JSON.stringify(value.value), value);
    }

    if (isExpression(value)) {
        return generateExpression(value, state);
    }

    if (value.type === 'ENDAttributeValueExpression') {
        return sn(value.elements.map(v => compileValue(v, state))).join(' + ');
    }
}
