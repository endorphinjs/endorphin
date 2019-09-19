import parseTemplate, { ENDProgram } from '@endorphinjs/template-parser';
import { generate } from 'astring';
import SSRState, { SSROptions } from './SSRState';
import { visitors, VisitorContinue } from './visitors';
import { ENDCompileError } from '../lib/error';

export default function ssr(code: string, url?: string, options?: Partial<SSROptions>) {
    return compile(parseTemplate(code, url), options);
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

    return generate(state.program);
}
