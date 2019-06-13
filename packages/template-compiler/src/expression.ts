import { Program, JSNode, Node } from '@endorphinjs/template-parser';
import CompileState from './lib/CompileState';
import baseVisitors from './visitors/expression';
import { sn } from './lib/utils';
import { ENDCompileError } from './lib/error';
import { ExpressionContinue, ExpressionVisitorMap, ExpressionOutput } from './types';

export default function generateExpression(expr: JSNode, state: CompileState, visitors: ExpressionVisitorMap = {}): ExpressionOutput {
    return walk(expr, state, { ...baseVisitors, ...visitors });
}

/**
 * Generates function from given JS code in compile state
 * @param prefix
 * @param state
 * @param value
 */
export function fn(prefix: string, state: CompileState, value: Program): string {
    return state.runBlock(prefix, () =>
        state.entity({
            mount: () => sn(['return ', generateExpression(value, state)])
        })).mountSymbol;
}

export function walk(node: Node, state: CompileState, visitors: ExpressionVisitorMap): ExpressionOutput {
    const next: ExpressionContinue = child => {
        if (child.type in visitors) {
            return visitors[child.type](child, state, next);
        }

        throw new ENDCompileError(`${child.type} is not supported in template expressions`, child);
    };

    return next(node);
}
