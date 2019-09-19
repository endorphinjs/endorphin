import { Statement, BlockStatement, Expression, Program } from '@endorphinjs/template-parser';
import SSROutput from './SSROutput';

export interface SSROptions {
    /** List of HTML elements that should be empty */
    empty: string[];
}

export type SSRHelper = 'attr';

const defaultOptions: SSROptions = {
    empty: ['img', 'meta', 'link', 'br', 'base', 'hr', 'area', 'wbr', 'col', 'embed', 'input', 'param', 'source', 'track']
};

export default class SSRState {
    public options: SSROptions;
    public output: SSROutput;
    public program: Program = { type: 'Program', body: [], raw: '' };

    private usedHelpers = new Set<SSRHelper>();

    constructor(options: Partial<SSROptions>) {
        this.options = { ...defaultOptions, ...options };
    }

    /**
     * Marks given helper function as used
     */
    use(fn: SSRHelper): SSRHelper {
        this.usedHelpers.add(fn);
        return fn;
    }

    /**
     * Enters new output context and runs `callback` in it
     */
    enter(name: string, callback: (out: SSROutput) => void) {
        const { output } = this;
        this.output = new SSROutput(name);
        callback(this.output);
        this.program.body.push(this.output.finalize());
        this.output = output;
    }

    /**
     * Runs given `callback` in context of `block`. All output content will be added
     * into accumulator inside `block`
     */
    run(statement: Statement, block: BlockStatement, callback: () => void) {
        this.output.run(statement, block, callback);
    }

    /**
     * Pushes given value into output
     */
    out(value: string | Expression) {
        this.output.out(value);
    }
}
