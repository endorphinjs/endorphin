import { Store } from '../../../src/runtime';

export function store() {
    return new Store({ foo: 'bar' });
}

export function props() {
    return {
        value1: 1,
        value2: 2
    };
}
