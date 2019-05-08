import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import parse from '../src/index';
import { ENDElement, Program } from '../src/ast';

describe('Template parser', () => {
    function read(fileName: string): string {
        return fs.readFileSync(path.resolve(__dirname, fileName), 'utf8');
    }

    it('should parse simple template', () => {
        const file = 'samples/template1.html';
        const ast = parse(read(file), file);
        const astJSON = JSON.parse(JSON.stringify(ast));
        // fs.writeFileSync(path.resolve(__dirname, 'fixtures/template1-ast.json'), JSON.stringify(astJSON, null, 2));
        assert.deepEqual(astJSON, JSON.parse(read('fixtures/template1-ast.json')));
    });

    it('should parse styles & scripts', () => {
        const file = 'samples/resources.html';
        const ast = parse(read(file), file);

        assert.equal(ast.filename, file);

        // Should omit empty styles and scripts
        assert.equal(ast.stylesheets.length, 3);
        assert.equal(ast.scripts.length, 2);

        assert.equal(ast.stylesheets[0].content, null);
        assert.equal(ast.stylesheets[0].url, './style.css');
        assert.equal(ast.stylesheets[0].mime, 'text/css');

        assert.equal(ast.stylesheets[1].content, null);
        assert.equal(ast.stylesheets[1].url, '/style.scss');
        assert.equal(ast.stylesheets[1].mime, 'scss');

        assert.equal(ast.stylesheets[2].content, '\n    .foo { padding: 10px; }\n');
        assert.deepEqual(ast.stylesheets[2].loc, {
            source: file,
            start: { line: 3, column: 0, offset: 102 },
            end: { line: 5, column: 8, offset: 146 }
        });
        assert.equal(ast.stylesheets[2].url, file);
        assert.equal(ast.stylesheets[2].mime, 'text/css');

        assert.equal(ast.scripts[0].content, 'var foo = \'<p>hello world</p>\';');
        assert.deepEqual(ast.scripts[0].loc, {
            source: file,
            start: { line: 7, column: 0, offset: 163 },
            end: { line: 7, column: 48, offset: 211 }
        });
        assert.equal(ast.scripts[0].url, file);
        assert.equal(ast.scripts[0].mime, 'text/javascript');
    });

    it('should parse ref', () => {
        const parseTag = (code: string) => parse(code).body[0] as ENDElement;
        let elem = parseTag('<div ref="foo" />');
        assert.equal(elem.ref, 'foo');
        assert.equal(elem.attributes.length, 0);
        assert.equal(elem.directives.length, 0);

        elem = parseTag('<div ref=foo />');
        assert.equal(elem.ref, 'foo');
        assert.equal(elem.attributes.length, 0);
        assert.equal(elem.directives.length, 0);

        elem = parseTag('<div ref={bar} />');
        assert.equal((elem.ref as Program).type, 'Program');
        assert.equal(elem.attributes.length, 0);
        assert.equal(elem.directives.length, 0);

        elem = parseTag('<div ref:foo />');
        assert.equal(elem.ref, 'foo');
        assert.equal(elem.attributes.length, 0);
        assert.equal(elem.directives.length, 0);

        assert.throws(() => parseTag('<div ref:foo=bar />'), 'Shorthand ref should not have value');
    });
});
