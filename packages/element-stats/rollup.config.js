import typescript from 'rollup-plugin-typescript2';

export default {
    input: './src/index.ts',
    plugins: [typescript({
        tsconfigOverride: {
            compilerOptions: {
                module: 'esnext'
            }
        }
    })],
    output: [{
        file: './dist/element-stats.es.js',
        format: 'es',
        sourcemap: true
    }, {
        file: './dist/element-stats.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    }]
};
