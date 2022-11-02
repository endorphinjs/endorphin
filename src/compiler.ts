import transform, { parse, generate, CompileOptions, CodeWithMap } from '@endorphinjs/template-compiler';
import postcss from 'postcss';
import scopeCSSPlugin from '@endorphinjs/postcss-plugin';

interface ScopeCSSOptions {
	/** Source map of incoming source code */
	map?: any;

	/** Name of transformed file */
	filename?: string;

    /**
     * Scope class names with `scope` suffix. If `RegExp` given, will scope class
     * names that does NOT match given regexp (e.g. excluded from scoping)
     */
    scopeClass?: boolean | RegExp;
}

/**
 * Compiles given Endorphin template to JavaScript
 */
module.exports = function compile(code: string, url: string, options?: CompileOptions): CodeWithMap {
	return transform(code, url, options);
};

module.exports.parse = parse;
module.exports.generate = generate;

/**
 * Isolates given CSS code with `scope` token
 * @param {string} code CSS source to rewrite
 * @param {string} scope CSS scoping token
 * @param {Object} [options] Options for CSS Tree parser
 */
module.exports.scopeCSS = scopeCSS;

/**
 * Isolates given CSS code with `scope` token
 */
async function scopeCSS(code: string, scope: string, options: ScopeCSSOptions = {}): Promise<string | CodeWithMap> {
    const processor = postcss(scopeCSSPlugin({
        scope,
        scopeClass: options.scopeClass
    }));

    const { css, map } = processor.process(code, {
        from: options.filename,
        map: options.map ? { prev: options.map } : undefined
    });

    if (options.map) {
        return {
            code: css,
            map: map.toJSON() as any
        };
    }

    return css;
}
