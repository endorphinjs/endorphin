import { ENDProgram } from '@endorphinjs/template-parser';
import { SourceNode } from 'source-map';
import { ChunkList, TemplateContinue, TemplateVisitorMap } from './types';
import CompileState from './lib/CompileState';
import { sn, qStr, format, isPropKey } from './lib/utils';
import { ENDCompileError, ENDSyntaxError } from './lib/error';
import templateVisitors from './visitors/template';
import { CompileOptions } from '.';
import { collectPartialDeps } from './lib/partials';

export default function generateTemplate(ast: ENDProgram, options?: CompileOptions): SourceNode {
    const state = new CompileState(options);
    const body: ChunkList = [];

    if (ast.scripts.length > 1) {
        throw new ENDCompileError(`Component must contain at most one <script> tag, but found ${ast.scripts.length} tags`, ast.scripts[1]);
    }

    // Collect child components. We should do it in separate pass to hoist component
    // definitions before templates are rendered
    registerComponents(ast, state);

    // Collect dependencies defined in partials
    state.partialDeps = collectPartialDeps(ast);

    // Compile template to collect usage stats as well
    const template = compileTemplate(ast, state, templateVisitors);

    // Import runtime symbols, used by template
    if (state.usedRuntime.size) {
        body.push(`import { ${sortedList(state.usedRuntime)} } from "${state.options.module}";`);
    }

    // Import helpers
    getUsedHelpers(state).forEach((helpers, url) => {
        body.push(`import { ${sortedList(helpers)} } from ${qStr(url)};`);
    });

    // Import child components
    state.componentsMap.forEach((item, name) => {
        if (item.used) {
            body.push(`import * as ${item.symbol} from ${qStr(item.href)};`);
        } else {
            state.warn(`Unused import "${name}", skipping`, item.node.loc.start.offset);
        }
    });

    // CSS scoping
    if (state.options.cssScope) {
        body.push(`export const cssScope = ${qStr(state.options.cssScope)};`);
    }

    // Runtime variables
    if (state.options.moduleVars) {
        if (ast.variables.length) {
            body.push(`let ${ast.variables.map(v => state.localVar(v)).join(', ')};`);
        }
    }

    // Partials declarations
    if (state.partialsMap.size) {
        const { indent } = state;
        const innerIndent = indent.repeat(2);
        let count = 0;

        const partials = sn(`\nexport const ${state.partials} = {`);
        state.partialsMap.forEach((partial, name) => {
            if (count++) {
                partials.add(',\n');
            }

            partials.add([
                `\n${indent}${isPropKey(name) ? name : qStr(name)}: {\n`,
                `${innerIndent}body: ${partial.name},\n`,
                `${innerIndent}defaults: `, partial.defaults, '\n',
                `${indent}}`
            ]);
        });

        partials.add('\n};');
        body.push(partials);
    }

    // Used namespaces
    state.namespaceSymbols.forEach((symbol, uri) => {
        body.push(`const ${symbol} = ${qStr(uri)};`);
    });

    // Definition symbols
    if (state.usedDefinition.size) {
        const script = ast.scripts[0];
        if (!script) {
            const symbols = Array.from(state.usedDefinition).slice(0, 2);
            // tslint:disable-next-line:max-line-length
            throw new ENDSyntaxError(`Template uses JS function${symbols.length > 1 ? 's' : ''} like ${symbols.map(qStr).join(', ')} but no <script> tag found in template`, ast.filename);
        }

        if (!script.transformed && !script.content) {
            body.push(`import { ${sortedList(state.usedDefinition)} } from "${script.url}";`);
        }
    }

    // Output scripts
    ast.scripts.forEach(script => {
        if (script.transformed || script.content) {
            body.push(sn(script.transformed || script.content));
        } else if (script.url) {
            body.push(sn(`export * from ${qStr(script.url)};`));
        }
    });

    body.push('\n', template);

    return sn(format(body));
}

function compileTemplate(ast: ENDProgram, state: CompileState, visitors: TemplateVisitorMap) {
    const next: TemplateContinue = node => {
        if (node.type in visitors) {
            return visitors[node.type](node, state, next);
        }
        throw new ENDCompileError(`${node.type} is not supported in templates`, node);
    };

    ast.body.forEach(node => {
        if (node.type === 'ENDTemplate' || node.type === 'ENDPartial') {
            next(node);
        }
    });

    return state.output;
}

function registerComponents(ast: ENDProgram, state: CompileState) {
    ast.body.forEach(node => {
        if (node.type === 'ENDImport') {
            state.registerComponent(node);
        }
    });
}

/**
 * Returns map of used helpers and their URLs
 */
function getUsedHelpers(state: CompileState): Map <string, string[]> {
    const result: Map<string, string[]> = new Map();

    state.usedHelpers.forEach(helper => {
        const url = state.helpers[helper];
        if (result.has(url)) {
            result.get(url).push(helper);
        } else {
            result.set(url, [helper]);
        }
    });

    return result;
}

function sortedList(items: string[] | Set<string>): string {
    return Array.from(items).sort().join(', ');
}
