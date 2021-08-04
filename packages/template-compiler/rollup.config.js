import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
    input: './src/index.ts',
    plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.json' })],
    external: ['@endorphinjs/template-parser', 'entities', 'source-map'],
    output: [{
        file: './dist/template-compiler.es.js',
        format: 'es',
        sourcemap: true
    }, {
        file: './dist/template-compiler.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    }]
};
