import { deepEqual, equal } from 'assert';
import { parseJS, walk } from '../src/index';
import { Identifier, Program, IdentifierContext } from '../src/ast';
import generateJS from './assets/generate';

interface IdContextMap {
    [id: string]: IdentifierContext | void;
}

function js(code: string): string {
    return generateJS(parseJS(code, { helpers: ['emit'] })).trim();
}

function collectIdContext(ast: Program): IdContextMap {
    const result: IdContextMap = {};
    walk(ast, {
        Identifier(node: Identifier) {
            result[node.name] = node.context;
        }
    });

    return result;
}

function getContext(expr: string): IdContextMap {
    return collectIdContext(parseJS(expr));
}

describe('JS Parser', () => {
    it('should detect identifier context', () => {
        deepEqual(getContext('foo[bar => bar > baz]'), {
            foo: 'property',
            bar: undefined,
            baz: 'property'
        });

        deepEqual(getContext('foo[({ bar }) => bar > baz]'), {
            foo: 'property',
            bar: undefined,
            baz: 'property'
        });

        deepEqual(getContext('foo[([bar, baz]) => bar > baz]'), {
            foo: 'property',
            bar: undefined,
            baz: undefined
        });
    });

    it('should upgrade to getters', () => {
        equal(js('foo'), '$host.props.foo;');
        equal(js('foo.bar'), '$get($host.props.foo, "bar");');
        equal(js('foo.bar[1].baz'), '$get($host.props.foo, "bar", 1, "baz");');
        equal(js('foo[bar]'), '$get($host.props.foo, $host.props.bar);');
        equal(js('foo["bar"]'), '$get($host.props.foo, "bar");');
        equal(js('foo.bar[baz.bam]'), '$get($host.props.foo, "bar", $get($host.props.baz, "bam"));');
        equal(js('foo[a ? b : c]'), '$get($host.props.foo, $host.props.a ? $host.props.b : $host.props.c);');

        equal(js('foo.bar + baz()'), '$get($host.props.foo, "bar") + $call($host.props, "baz");');
        equal(js('Math.round(foo)'), 'Math.round($host.props.foo);', 'Keep globals as-is');
        equal(js('foo.bar[a => a > b]'), '$find($get($host.props.foo, "bar"), a => a > $host.props.b);', 'Rewrite filters');
        equal(js('foo.bar[[a => a > #c]]'), '$filter($get($host.props.foo, "bar"), a => a > $host.state.c);', 'Rewrite filters (multiple)');
        equal(js('`foo ${bar}`'), '`foo ${$host.props.bar}`;');
    });

    it('should upgrade to callers', () => {
        equal(js('emit(foo)'), 'emit(this, $host.props.foo);');
        equal(js('foo.bar()'), '$call($host.props.foo, "bar");');
        equal(js('foo()'), '$call($host.props, "foo");');
        equal(js('foo(bar)'), '$call($host.props, "foo", [$host.props.bar]);');
    });

    it('should upgrade nodes in function', () => {
        // Detect `emit` is a helper and add reference to component
        equal(js('e => emit(foo)'), '(e => emit(this, $host.props.foo));');
        equal(js('e => foo(e.pageX)'), '(e => $call($host.props, "foo", [e.pageX]));');
    });
});
