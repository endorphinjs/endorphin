import typescript from 'rollup-plugin-typescript';

export default {
    input: './src/index.ts',
    plugins: [typescript()],
    external: ['acorn', 'acorn-walk'],
    output: [{
        file: './dist/template-parser.es.js',
        format: 'es',
        sourcemap: true
    }, {
        file: './dist/template-parser.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    }]
};
