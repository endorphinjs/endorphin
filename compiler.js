const endorphin = require('@endorphinjs/template-compiler');
const cssModule = require('@endorphinjs/css-module');
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');

/**
 * @typedef {import('@endorphinjs/template-compiler/dist').CompileScopeOptions} CompileScopeOptions
 */

/**
 * @typedef {object} ScopeCSSOptions
 * @property {string|object} [map] Source map of incoming source code
 * @property {string} [filename] Name of transformed file
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

/**
 * Isolates given CSS code with `scope` token
 * @param {string} code CSS source to rewrite
 * @param {string} scope CSS scoping token
 * @param {Object} [options] Options for CSS Tree parser
 */
module.exports.scopeCSS = scopeCSS;

/**
 * Isolates given CSS code with `scope` token
 * @param {string} code CSS source to rewrite
 * @param {string} scope CSS scoping token
 * @param {ScopeCSSOptions} [options] Options for CSS Tree parser
 * @returns {string | {code: string, map: object}}
 */
async function scopeCSS(code, scope, options = {}) {
	const opts = {
		filename: options.filename
	};

	if (options.map) {
		opts.positions = true;
		opts.sourceMap = true;
	}

	const scoped = cssModule(code, scope, opts);

	if (options.map) {
		scoped.map = await mergeMaps(options.map, scoped.map.toJSON());
	}

	if (scoped && typeof scoped === 'object') {
		return {
			code: scoped.css,
			map: scoped.map
		};
	}

	return scoped;
}

/**
 * Merge contents of two source maps.
 * A copy-paste from https://github.com/keik/merge-source-map with slight
 * modifications for async `SourceMapConsumer`
 * @param {string|object} oldMap
 * @param {string|object} newMap
 * @returns {Object}
 */
async function mergeMaps(oldMap, newMap) {
	if (!oldMap) {
		return newMap;
	}

	if (!newMap) {
		return oldMap;
	}

	const oldMapConsumer = await new SourceMapConsumer(oldMap);
	const newMapConsumer = await new SourceMapConsumer(newMap);
	const mergedMapGenerator = new SourceMapGenerator({
		file: oldMapConsumer.file,
		sourceRoot: oldMapConsumer.sourceRoot
	});

	oldMapConsumer.sources.forEach(source => {
		mergedMapGenerator.setSourceContent(source, oldMapConsumer.sourceContentFor(source, true));
	});

	// iterate on new map and overwrite original position of new map with one of old map
	newMapConsumer.eachMapping(m => {
		// pass when `originalLine` is null.
		// It occurs in case that the node does not have origin in original code.
		if (m.originalLine == null) {
			return;
		}

		const origPosInOldMap = oldMapConsumer.originalPositionFor({
			line: m.originalLine,
			column: m.originalColumn
		});

		if (origPosInOldMap.source == null) {
			return;
		}

		mergedMapGenerator.addMapping({
			original: {
				line: origPosInOldMap.line,
				column: origPosInOldMap.column
			},
			generated: {
				line: m.generatedLine,
				column: m.generatedColumn
			},
			source: origPosInOldMap.source,
			name: origPosInOldMap.name
		});
	});

	return mergedMapGenerator.toJSON();
}
