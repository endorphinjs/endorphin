const path = require('path');
const exts = require('module')._extensions;
const compile = require('@endorphinjs/template-compiler').default;

const runtimeBasePath = path.dirname(__dirname);
const jsHandler = exts['.js'];

const reg = require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
        allowJs: true
    }
});

exts['.html'] = function (m, filePath) {
    const baseModulePath = path.relative(path.dirname(filePath), runtimeBasePath);
    const _compile = m._compile;

    m._compile = function (code, fileName) {
        const m = /<template\s+cssScope="(.+?)"/.exec(code);

        const js = compile(code, fileName, {
            cssScope: m && m[1],
            module: path.join(baseModulePath, 'src/runtime'),
            warn: msg => console.warn(msg)
        }).code;

        return _compile.call(this, reg.compile(js, fileName), fileName);
    };

    return jsHandler(m, filePath);
};
