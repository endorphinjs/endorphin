import typescript from 'rollup-plugin-typescript';

export default {
	input: './src/runtime.ts',
	plugins: [typescript()],
	output: [{
		file: './dist/runtime.es.js',
		format: 'es',
		sourcemap: true
	}, {
		file: './dist/runtime.cjs.js',
		format: 'cjs',
		sourcemap: true,
		exports: 'named'
	}]
};
