import * as fs from 'fs';
import * as path from 'path';
import { equal } from 'assert';
import { Linter } from 'eslint';
import compile, { CompileOptions } from '../src/index';

describe('Template compiler', () => {
    const baseInput = path.resolve(__dirname, './samples');
    const baseOutput = path.resolve(__dirname, './fixtures');
    const linterConfig = require('./fixtures/.eslintrc.js');

    function read(fileName: string): string {
        const absPath = path.isAbsolute(fileName) ? fileName : path.resolve(__dirname, fileName);
        return fs.readFileSync(absPath, 'utf8').trim();
    }

    function lint(code: string, filename: string) {
        const linter = new Linter();
        const errors = linter.verify(code, linterConfig, { filename })
            .filter(item => item.fatal)
            .map(item => `${item.message} at line ${item.line}, column ${item.column}`)
            .join('\n');

        if (errors) {
            throw new Error(`Lint errors in ${filename}:\n\n${errors}`);
        }
    }

    function compare(input: string, options?: CompileOptions, save?: boolean) {
        const output = input.replace(/\.html$/, '.js');
        const fileName = path.basename(input);
        const absInput = path.resolve(baseInput, input);
        const absOutput = path.resolve(baseOutput, output);
        const { code } = compile(read(absInput), fileName, options);
        if (save) {
            fs.writeFileSync(absOutput, code.trim());
        }
        equal(code.trim(), read(absOutput), input);
        lint(code, fileName);
    }

    it('should generate JS templates', () => {
        const templatesDir = 'templates';
        const files = fs.readdirSync(path.join(baseInput, templatesDir));
        const opt: CompileOptions = {
            helpers: { main: ['count'] }
        };

        files.forEach(file => {
            compare(path.join(templatesDir, file), opt);
        });
    });

    it('should use scripts', () => {
        compare('scripts/script1.html');
        compare('scripts/script2.html');
    });

    it('should export CSS scope', () => {
        compare('css-scope.html', { cssScope: 'scope123' });
    });

    it('should resolve tag name from import', () => {
        compare('imports.html');
    });

    it('should generate namespaced elements', () => {
        compare('svg.html');
    });

    it.skip('debug', () => {
        compare('templates/partials.html', null, true);
    });
});
