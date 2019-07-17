import { strictEqual } from 'assert';

export const calls = {
    method1: [],
    method2: [],
    handleClick: [],
    staticClick: 0
};

export const events = {
    click() {
        calls.staticClick++;
    }
};

export function resetCalls() {
    calls.method1.length = calls.method2.length = calls.handleClick.length = calls.staticClick = 0;
}

export function props() {
    return {
        foo: 'foo1',
        bar: 'bar2',
        c1: false,
        items: [1, 2, 3]
    };
}

export function method1(arg1, arg2, host, evt) {
    strictEqual(evt.type, 'click');
    calls.method1.push([arg1, arg2]);
}

export function method2(arg1, arg2, host, evt) {
    strictEqual(evt.type, 'click');
    calls.method2.push([arg1, arg2]);
}

export function handleClick(arg1, arg2, arg3, host, evt) {
    strictEqual(evt.type, 'click');
    calls.handleClick.push([arg1, arg2, arg3]);
}
