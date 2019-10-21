import { ENDVariableStatement, ENDAttributeValue } from '@endorphinjs/template-parser';
import Entity, { entity } from './Entity';
import CompileState from '../lib/CompileState';
import generateExpression from '../expression';
import { sn, isLiteral, isExpression } from '../lib/utils';

export default class VariableEntity extends Entity {
    constructor(readonly node: ENDVariableStatement, readonly state: CompileState) {
        super('vars', state);
        const fn = state.runBlock('setVars', () => {
            return node.variables.map(v => entity(v.name, state, {
                mount: () => sn([`${state.localVar(v.name)} = `, compileValue(v.value, state) || 'null'])
            }));
        });
        this.setShared(() => {
            const scopeArg = fn.scopeUsage.mount ? `, ${state.scope}` : '';
            const hostArg = fn.hostUsage || fn.scopeUsage.mount ? state.host : '';
            return `${fn.mountSymbol}(${hostArg}${scopeArg})`;
        });
    }
}

function compileValue(value: ENDAttributeValue, state: CompileState) {
    if (isLiteral(value)) {
        const json = typeof value.value === 'undefined'
            ? 'undefined' // JSON.stringify would return empty string
            : JSON.stringify(value.value);

        return sn(json, value);
    }

    if (isExpression(value)) {
        return generateExpression(value, state);
    }

    if (value.type === 'ENDAttributeValueExpression') {
        return sn(value.elements.map(v => compileValue(v, state))).join(' + ');
    }
}
