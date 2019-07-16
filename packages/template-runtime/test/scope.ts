import { strictEqual } from 'assert';
import document from './assets/document';
import { createComponent, getProp, getState, getVar, setVar, enterScope, exitScope, mountComponent } from '../src/runtime';

describe('Scope', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	it('should get props', () => {
		const component = createComponent('my-component', {
			props() {
				return {
					class: 'foo',
					id: 'bar',
					prop1: 123
				};
			}
		});

		mountComponent(component);
		strictEqual(getProp(component, 'class'), 'foo');
		strictEqual(getProp(component, 'id'), 'bar');
		strictEqual(getProp(component, 'prop1'), 123);
		strictEqual(getProp(component, 'prop2'), undefined);
	});

	it('should get/set state values', () => {
		const component = createComponent('my-component', {});

		strictEqual(getState(component, 'foo'), undefined);

		component.setState({ foo: 'bar', baz: 1 });
		strictEqual(getState(component, 'foo'), 'bar');
		strictEqual(getState(component, 'baz'), 1);
	});

	it('should get/set local variables', () => {
		const component = createComponent('my-component', {});

		strictEqual(getVar(component, 'foo'), undefined);

		setVar(component, 'foo', 'bar');
		setVar(component, 'baz', 1);
		strictEqual(getVar(component, 'foo'), 'bar');
		strictEqual(getVar(component, 'baz'), 1);

		// Enter new scope with variable collision
		enterScope(component, { baz: 2, a: 'b' });
		strictEqual(getVar(component, 'foo'), 'bar');
		strictEqual(getVar(component, 'baz'), 2);
		strictEqual(getVar(component, 'a'), 'b');

		setVar(component, 'foo', 'bar2');
		strictEqual(getVar(component, 'foo'), 'bar2');

		// Exit scope, should restore previous variables state
		exitScope(component);
		strictEqual(getVar(component, 'foo'), 'bar');
		strictEqual(getVar(component, 'baz'), 1);
		strictEqual(getVar(component, 'a'), undefined);
	});
});
