import * as fs from 'fs';
import * as path from 'path';
import { strictEqual } from 'assert';
import _parse from '@endorphinjs/template-parser';
import hoist from '../src/hoist';
import stringify from './assets/stringify-template';

function read(fileName: string): string {
    const absPath = path.isAbsolute(fileName) ? fileName : path.resolve(__dirname, fileName);
    return fs.readFileSync(absPath, 'utf8').trim();
}

function parse(url: string) {
    return _parse(read(url), url, { disableCallers: true, disableGetters: true });
}

function testHoist(fileName: string, message?: string) {
    const src = path.join('samples', 'hoist', fileName);
    const fixture = path.join('fixtures', 'hoist', fileName);
    const template = parse(src);
    const result = stringify(hoist(template));
    strictEqual(result.trim(), read(fixture).trim(), message);
}

describe('Hoist variables', () => {
    it('basic', () => {
        testHoist('vars.html', 'Hoist variable definitions');
        testHoist('vars3.html', 'Hoist conditional variable definitions');
        testHoist('condition.html', 'Hoist conditional expressions');
        testHoist('attributes.html', 'Hoist attributes');
        testHoist('class.html', 'Hoist class names');
        testHoist('component-class.html', 'Hoist component class names');
        testHoist('add-class.html', 'Hoist <add-class>');
        testHoist('add-class2.html', 'Hoist <add-class> with same scoped variable');
        testHoist('choose.html', 'Hoist <e:choose>');
        testHoist('for-each.html', 'Hoist <for-each>');
        testHoist('partials.html', 'Hoist partials');
    });

    it.skip('debug', () => {
        const t = parse('./samples/hoist/msg-message.html');
        // tslint:disable-next-line:no-console
        console.log(stringify(hoist(t)));
    });
});
