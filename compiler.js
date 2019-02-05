const endorphin = require('@endorphinjs/template-compiler');

/**
 * @typedef {import('@endorphinjs/template-compiler/dist').CompileScopeOptions} CompileScopeOptions
 */

/**
 * Compiles given Endorphin template to JavaScript
 * @param {string} code Template source code
 * @param {string} [url] URL of source code, used for source mapping
 * @param {CompileScopeOptions} [options] Compiler options
 * @returns {code: string, map: object}
 */
module.exports = function compile(code, url, options) {
	return endorphin.default(code, url, Object.assign({ module: 'endorphin' }, options));
};

module.exports.parse = endorphin.parse;
module.exports.generate = endorphin.generate;
