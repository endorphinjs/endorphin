import * as fs from 'fs';
import * as path from 'path';
import { equal, deepEqual, throws } from 'assert';
import parse from '../src/index';
import { ENDElement, Program, ExpressionStatement } from '../src/ast';

describe('Template parser', () => {
    function read(fileName: string): string {
        return fs.readFileSync(path.resolve(__dirname, fileName), 'utf8');
    }

    const parseTag = (code: string) => parse(code).body[0] as ENDElement;

    it('should parse simple template', () => {
        const file = 'samples/template1.html';
        const ast = parse(read(file), file);
        const astJSON = JSON.parse(JSON.stringify(ast));
        // fs.writeFileSync(path.resolve(__dirname, 'fixtures/template1-ast.json'), JSON.stringify(astJSON, null, 2));
        deepEqual(astJSON, JSON.parse(read('fixtures/template1-ast.json')));
    });

    it('should parse styles & scripts', () => {
        const file = 'samples/resources.html';
        const ast = parse(read(file), file);

        equal(ast.filename, file);

        // Should omit empty styles and scripts
        equal(ast.stylesheets.length, 3);
        equal(ast.scripts.length, 2);

        equal(ast.stylesheets[0].content, null);
        equal(ast.stylesheets[0].url, './style.css');
        equal(ast.stylesheets[0].mime, 'text/css');

        equal(ast.stylesheets[1].content, null);
        equal(ast.stylesheets[1].url, '/style.scss');
        equal(ast.stylesheets[1].mime, 'scss');

        equal(ast.stylesheets[2].content, '\n    .foo { padding: 10px; }\n');
        deepEqual(ast.stylesheets[2].loc, {
            source: file,
            start: { line: 3, column: 0, offset: 102 },
            end: { line: 5, column: 8, offset: 146 }
        });
        equal(ast.stylesheets[2].url, file);
        equal(ast.stylesheets[2].mime, 'text/css');

        equal(ast.scripts[0].content, 'var foo = \'<p>hello world</p>\';');
        deepEqual(ast.scripts[0].loc, {
            source: file,
            start: { line: 7, column: 0, offset: 163 },
            end: { line: 7, column: 48, offset: 211 }
        });
        equal(ast.scripts[0].url, file);
        equal(ast.scripts[0].mime, 'text/javascript');
    });

    it('should parse ref', () => {
        let elem = parseTag('<div ref="foo" />');
        equal(elem.ref, 'foo');
        equal(elem.attributes.length, 0);
        equal(elem.directives.length, 0);

        elem = parseTag('<div ref=foo />');
        equal(elem.ref, 'foo');
        equal(elem.attributes.length, 0);
        equal(elem.directives.length, 0);

        elem = parseTag('<div ref={bar} />');
        equal((elem.ref as Program).type, 'Program');
        equal(elem.attributes.length, 0);
        equal(elem.directives.length, 0);

        elem = parseTag('<div ref:foo />');
        equal(elem.ref, 'foo');
        equal(elem.attributes.length, 0);
        equal(elem.directives.length, 0);

        throws(() => parseTag('<div ref:foo=bar />'), 'Shorthand ref should not have value');
    });

    it('should handle assignments in event handlers', () => {
        let elem = parseTag('<div on:click={ #count++ } />');
        const onClick = elem.directives[0];
        const expr = (onClick.value as Program).body[0] as ExpressionStatement;
        equal(onClick.value.type, 'Program');
        equal(expr.expression.type, 'UpdateExpression');

        throws(() => parseTag('<div a={ #count++ } />'), /Assignment expressions are not allowed/);

    });
});