import { ENDIfStatement, ENDChooseStatement, ENDChooseCase, ENDStatement, Program } from '@endorphinjs/template-parser';
import Entity from './Entity';
import CompileState from '../lib/CompileState';
import { sn } from '../lib/utils';
import generateExpression from '../expression';
import { TemplateContinue, TemplateOutput } from '../types';

type ConditionStatement = ENDIfStatement | ENDChooseCase;

export default class ConditionEntity extends Entity {
    constructor(readonly node: ENDIfStatement | ENDChooseStatement, state: CompileState) {
        super(node.type === 'ENDIfStatement' ? 'if' : 'choose', state);
    }

    setContent(statements: ConditionStatement[], next: TemplateContinue): this {
        const { state } = this;
        this.setMount(() => {
            const fn = this.node.type === 'ENDChooseStatement' && this.node.test
                ? pickEntry(this.rawName, this.node.test, statements, state, next)
                : conditionEntry(this.rawName, statements, state, next);

            return state.runtime('mountBlock', [state.host, state.injector, fn]);
        });
        this.setUpdate(() => state.runtime('updateBlock', [this.getSymbol()]));
        this.setUnmount(() => this.unmount(state.isTopLevel() ? 'clearBlock' : 'unmountBlock'));
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
function conditionEntry(name: string, conditions: ConditionStatement[], state: CompileState, next: TemplateContinue): string {
    return state.runBlock(`${name}Entry`, () => {
        return state.entity({
            mount: () => {
                const body = sn('return ');
                const lastIx = conditions.length - 1;
                conditions.forEach((block, i) => {
                    const blockContent = state.runChildBlock(`${name}Body`, (ctx, element) =>
                        element.setContent(block.consequent, next));

                    if (block.test) {
                        body.add([generateExpression(block.test, state), ' ? ', blockContent.mountSymbol, ' : ', i === lastIx ? 'null' : '']);
                    } else {
                        body.add(blockContent.mountSymbol);
                    }
                });

                return body;
            }
        });
    }).mountSymbol;
}

/**
 * Generates a special, simplified function for picking from one of the choose
 * statements using pre-calculated `expr` expression
 */
function pickEntry(name: string, expr: Program, conditions: ConditionStatement[], state: CompileState, next: TemplateContinue): string {
    const blocks = conditions.map(block => {
        const ctx = state.runChildBlock(`${name}Body`, (_, element) =>
            element.setContent(block.consequent, next));
        return ctx.mountSymbol;
    });

    return state.runBlock(`${name}Entry`, () => {
        return state.entity({
            mount: () => sn([`return [${blocks.join(', ')}][`, generateExpression(expr, state), ']'])
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
