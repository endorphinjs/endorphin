import parseTemplate, { ENDProgram } from '@endorphinjs/template-parser';
import generate from './generate';
import SSRState, { SSROptions } from './SSRState';
import { visitors, VisitorContinue } from './visitors';
import { ENDCompileError } from '../lib/error';
import hoist from '../hoist';

export default function ssr(code: string, url?: string, options?: Partial<SSROptions>) {
    const template = parseTemplate(code, url);
    return compile(hoist(template), options);
}

export function compile(ast: ENDProgram, options?: Partial<SSROptions>): string {
    const state = new SSRState(options);

    const next: VisitorContinue = node => {
        if (node.type in visitors) {
            return visitors[node.type](node, state, next);
        }

        throw new ENDCompileError(`${node.type} is not supported in SSR mode`, node);
    };

    ast.body.forEach(node => {
        if (node.type === 'ENDTemplate' || node.type === 'ENDPartial') {
            next(node);
        }
    });

    return generate(state.finalize());
}
