import * as fs from 'fs';
import * as path from 'path';
import ssr from '../src/ssr';

function read(fileName: string): string {
    const absPath = path.isAbsolute(fileName) ? fileName : path.resolve(__dirname, fileName);
    return fs.readFileSync(absPath, 'utf8').trim();
}

describe.only('Server-side rendering', () => {
    it('create server-side code', () => {
        const template = read('./samples/templates/branching.html');
        console.log(ssr(template, './samples/templates/branching.html'));
    });
});
