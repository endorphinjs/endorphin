import transform, { parse, generate, CompileOptions, CodeWithMap } from '@endorphinjs/template-compiler';
import cssModule = require('@endorphinjs/css-module');
import { SourceMapConsumer, SourceMapGenerator, RawSourceMap } from 'source-map';

interface ScopeCSSOptions {
	/** Source map of incoming source code */
	map?: any;

	/** Name of transformed file */
	filename?: string;
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
	const scoped = cssModule(code, scope, {
		filename: options.filename,
		positions: !!options.map,
		sourceMap: !!options.map
	});

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
 */
async function mergeMaps(oldMap: RawSourceMap, newMap: RawSourceMap): Promise<RawSourceMap> {
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
