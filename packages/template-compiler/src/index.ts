import parseTemplate, { ENDProgram } from '@endorphinjs/template-parser';
import { HelpersMap } from './types';
import generateTemplate from './template';
import { ENDCompileError, ENDSyntaxError } from './lib/error';
import { prepareHelpers } from './lib/utils';
import hoist from './hoist';

export interface ParsedTemplate {
    /** Original template source code */
    code: string;
    url?: string;
    ast: ENDProgram;
}

export interface CodeWithMap {
    code: string;
    map: object;
}

export interface CompileOptions {
    /** Path to JS module that holds Endorphin runtime functions */
    module?: string;

    /** Symbol for referencing host component of the rendered template */
    host?: string;

    /** Symbol for referencing local scope of rendered component */
    scope?: string;

    /** Symbol for referencing partials container of rendered component */
    partials?: string;

    /** String token for scoping CSS styles of component */
    cssScope?: string;

    /**
     * Mangle symbol names, used for scope variables. If enabled, outputs shorter
     * but more cryptic variable names
     */
    mangleNames?: boolean;

    /**
     * Run expression hoisting to optimize templates layout. Required for
     * server-side rendering
     */
    optimize?: boolean;

    /**
     * List of supported helpers. Key is an URL of module and value is a list of
     * available (exported) functions in this module
     */
    helpers?: HelpersMap;

    /** Name of component being compiled, must be in CamelCase */
    component?: string;

    /** Characters for one level of indentation */
    indent?: string;

    /** Prefix for generated top-level module symbols */
    prefix?: string;

    /** Suffix for generated top-level module symbols */
    suffix?: string;

    /** Do not import components which were detected as unused */
    removeUnusedImports?: boolean;

    /** URI for referencing component’s JS definition */
    definition?: string;

    /** Called with warning messages */
    warn?(msg: string, pos?: number): void;
}

/**
 * Compiles given Endorphin template into JS
 * @param code Template source code
 * @param url Template file URL
 * @param options Compiler options
 */
export default function transform(code: string, url?: string, options?: CompileOptions): CodeWithMap {
    return generate(parse(code, url, options), options);
}

/**
 * Parses given Endorphin template into AST
 * @param code Template source code
 * @param url URL of source code
 */
export function parse(code: string, url?: string, options?: CompileOptions): ParsedTemplate {
    const helpers = prepareHelpers(options && options.helpers || {});
    const ast = parseTemplate(code, url, { helpers: Object.keys(helpers) });
    hoist(ast);
    return { code, url, ast };
}

/**
 * Generates JS code from given parsed Endorphin template AST
 * @param parsed Parsed template AST
 * @param options Compiler options
 */
export function generate(parsed: ParsedTemplate, options?: CompileOptions): CodeWithMap {
    try {
        const sourceMap = generateTemplate(parsed.ast, options);

        if (parsed.url) {
            sourceMap.setSourceContent(parsed.url, parsed.code);

            const result = sourceMap.toStringWithSourceMap({ file: parsed.url });

            return {
                code: result.code,
                map: result.map.toJSON()
            };
        }

        return { code: sourceMap.toString(), map: null };

    } catch (err) {
        if (err instanceof ENDCompileError) {
            const { loc } = err.node;
            throw new ENDSyntaxError(err.message, parsed.url, loc && loc.start, parsed.code);
        }

        throw err;
    }
}
