import { ENDIfStatement, ENDChooseStatement, ENDChooseCase, ENDStatement, Program } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import { sn } from '../lib/utils';
import generateExpression from '../expression';
import { TemplateContinue, TemplateOutput } from '../types';

export default class ConditionEntity extends Entity {
    constructor(readonly node: ENDIfStatement | ENDChooseStatement, state: CompileState) {
        super(node.type === 'ENDIfStatement' ? 'if' : 'choose', state);
    }

    setContent(statements: Array<ENDIfStatement | ENDChooseCase>, next: TemplateContinue): this {
        const { state } = this;
        this.setMount(() => state.runtime('mountBlock', [state.host, state.injector, conditionEntry(this.rawName, statements, state, next)]))
            .setUpdate(() => state.runtime('updateBlock', [this.getSymbol()]))
            .setUnmount(() => this.unmount('unmountBlock'));

        return this;
    }

    setSimple(test: Program, statements: ENDStatement[], next: TemplateContinue) {
        const fn = ifAttr(test, statements, this.state, next);
        this.setShared(() => {
            const args = sn([this.state.host]);
            if (fn.usesScope) {
                args.add(this.state.scope);
            }
            return sn([`${fn.name}(`, args.join(', '), ')']);
        });
    }
}

/**
 * Generates condition entry function: tests condition and returns another function
 * for rendering matched block
 */
function conditionEntry(name: string, conditions: Array<ENDIfStatement | ENDChooseCase>, state: CompileState, next: TemplateContinue): string {
    return state.runBlock(`${name}Entry`, () => {
        return state.entity({
            mount: () => {
                const indent = state.indent;
                const innerIndent = indent.repeat(2);
                const body = sn();

                conditions.forEach((block, i) => {
                    if (block.test) {
                        body.add([`${i === 0 ? '' : ' else '}if (`, generateExpression(block.test, state), ') ']);
                    } else {
                        body.add(' else ');
                    }

                    const blockContent = state.runChildBlock(`${name}Body`, (ctx, element) =>
                        element.setContent(block.consequent, next));

                    body.add(`{\n${innerIndent}return ${blockContent.mountSymbol};\n${indent}}`);
                });

                return body;
            }
        });
    }).mountSymbol;
}

function ifAttr(test: Program, statements: ENDStatement[], state: CompileState, next: TemplateContinue): { name: string, usesScope: boolean } {
    const block = state.runBlock('ifAttr', () => {
        return state.entity({
            mount() {
                const body = sn();
                const indent = state.indent.repeat(2);
                const entities = collectEntities(statements.map(next));

                body.add([`if (`, generateExpression(test, state), ') {']);

                for (let i = 0; i < entities.length; i++) {
                    const mount = entities[i].getMount();
                    if (mount) {
                        body.add(['\n', indent, mount, ';']);
                    }
                }

                body.add(`\n${state.indent}}`);
                return body;
            }
        });
    });

    return {
        name: block.name,
        usesScope: block.scopeUsage.mount > 0
    };
}

function collectEntities(list: TemplateOutput[], dest: Entity[] = []): Entity[] {
    for (let i = 0; i < list.length; i++) {
        const entity = list[i];
        if (entity) {
            dest.push(entity);
            collectEntities(entity.children, dest);
        }
    }

    return dest;
}
