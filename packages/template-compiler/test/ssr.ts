import * as fs from 'fs';
import * as path from 'path';
import { strictEqual as equal } from 'assert';
import ssr from '../src/ssr';

const baseInput = path.resolve(__dirname, './samples');
const baseOutput = path.resolve(__dirname, './ssr');

function read(fileName: string): string {
    const absPath = path.isAbsolute(fileName) ? fileName : path.resolve(__dirname, fileName);
    return fs.readFileSync(absPath, 'utf8').trim();
}

function compare(input: string, save?: boolean) {
    const output = input.replace(/\.html$/, '.js');
    const fileName = path.basename(input);
    const absInput = path.resolve(baseInput, input);
    const absOutput = path.resolve(baseOutput, output);
    const code = ssr(read(absInput), fileName);
    if (save) {
        fs.writeFileSync(absOutput, code.trim());
    }
    equal(code.trim(), read(absOutput), input);
}

describe.only('Server-side rendering', () => {
    it('create server-side code', () => {
        compare('./templates/branching.html', true);
        compare('./templates/basic1.html', true);
        compare('./templates/basic2.html', true);
        compare('./templates/attribute1.html', true);
        compare('./templates/attribute2.html', true);
        compare('./templates/attrs.html', true);
        compare('./templates/class.html', true);
    });
});
