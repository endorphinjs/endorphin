import { ENDTemplate, ENDStatement } from '@endorphinjs/template-parser';

interface RefData {
    /** Ref is added under some condition, e.g. inside `<e:if>` or `<e:for-each>` */
    conditional: boolean;

    /** Same ref may be added for multiple elements */
    multiple: boolean;
}

export interface RefStats {
    /** Template contains refs with expression as value or partials with possible refs */
    isDynamic: boolean;
    refs: { [name: string]: RefData };
    hasDynamicRefs(): boolean;
}

interface WalkState {
    condition: number;
    stats: RefStats;
}

/**
 * Collects stats about used refs. In most cases, `ref` is a one-to-one mapping,
 * but sometimes multiple elements may use same ref name or ref name can be
 * dynamic, e.g. defined in runtime
 */
export default function refStats(template: ENDTemplate): RefStats {
    const state: WalkState = {
        condition: 0,
        stats: {
            isDynamic: false,
            refs: {},
            hasDynamicRefs() {
                return this.isDynamic
                    || Object.keys(this.refs).some(name => this.refs[name].conditional);
            }
        }
    };

    template.body.forEach(child => walk(child, state));
    return state.stats;
}

function walk(node: ENDStatement, state: WalkState) {
    const next = (item: ENDStatement) => walk(item, state);

    if (node.type === 'ENDElement') {
        if (node.ref) {
            if (typeof node.ref === 'string') {
                if (node.ref in state.stats.refs) {
                    const stats = state.stats.refs[node.ref];
                    stats.multiple = true;
                    if (state.condition) {
                        stats.conditional = true;
                    }
                } else {
                    state.stats.refs[node.ref] = {
                        multiple: false,
                        conditional: state.condition > 0
                    };
                }
            } else {
                state.stats.isDynamic = true;
            }
        }

        node.body.forEach(next);
    } else if (node.type === 'ENDPartialStatement') {
        state.stats.isDynamic = true;
    } else if (node.type === 'ENDIfStatement') {
        state.condition++;
        node.consequent.forEach(next);
        state.condition--;
    } else if (node.type === 'ENDChooseStatement') {
        state.condition++;
        node.cases.forEach(c => c.consequent.forEach(next));
        state.condition--;
    } else if (node.type === 'ENDForEachStatement') {
        state.condition++;
        node.body.forEach(next);
        state.condition--;
    }
}
