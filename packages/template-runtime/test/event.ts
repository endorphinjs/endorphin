import { strictEqual, deepStrictEqual } from 'assert';
import document, { ElementShim, EventShim } from './assets/document';
import { createComponent, mountComponent, updateComponent } from '../src/runtime';
import { calls, resetCalls } from './samples/scripts/events';

// @ts-ignore
import * as Events from './samples/events.html';
// @ts-ignore
import * as EventsLoop from './samples/events-loop.html';
// @ts-ignore
import * as Branching from './samples/branching.html';

describe('Event handler', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);
	beforeEach(resetCalls);

	function dispatch(node: Node, evt: EventShim) {
		(node as any as ElementShim).dispatchEvent(evt);
	}

	it('should add and call event handler', () => {
		const component = createComponent('my-component', Events);

		// Initial render
		mountComponent(component);
		dispatch(component.firstChild, { type: 'click' });
		strictEqual(component.innerHTML, '<main></main>');
		deepStrictEqual(calls.method1, [['foo1', 'bar2']]);
		deepStrictEqual(calls.method2, []);

		// Re-run template: nothing should change
		updateComponent(component);
		dispatch(component.firstChild, { type: 'click' });
		strictEqual(component.innerHTML, '<main></main>');
		deepStrictEqual(calls.method1, [['foo1', 'bar2'], ['foo1', 'bar2']]);
		deepStrictEqual(calls.method2, []);

		// Bind new listener
		component.setProps({ foo: 'foo3', bar: 'bar4', c1: true });
		dispatch(component.firstChild, { type: 'click' });
		strictEqual(component.innerHTML, '<main></main>');
		deepStrictEqual(calls.method1, [['foo1', 'bar2'], ['foo1', 'bar2']]);
		deepStrictEqual(calls.method2, [['foo3', 'bar4']]);
	});

	it('should add and call event handler in loops', () => {
		const component = createComponent('my-component', EventsLoop);

		// Initial render
		mountComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });
		dispatch(component.firstChild.childNodes[1], { type: 'click' });
		strictEqual(component.innerHTML, '<ul>\n\t<li>item</li>\n\t<li>item</li>\n\t<li>item</li>\n</ul>');

		// XXX after hoisting implementation (v0.6), in current example the `@foo = 2`
		// expression is omitted since by hoisting rules it will be renamed and
		// never used. But in this example, where `@foo` is used inside `<for-each>`
		// loop, variable redefine might be the expected behavior.
		// In case if it causes any troubles for end users, we should figure out
		// better hoisting rules.
		// For now, update unit-tests to match current hoisting behavior
		// deepStrictEqual(calls.handleClick, [[0, 2, 1], [1, 2, 1]]);
		deepStrictEqual(calls.handleClick, [[0, 1, 1], [1, 1, 1]]);

		// Re-run template: nothing should change
		updateComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });
		dispatch(component.firstChild.childNodes[1], { type: 'click' });
		strictEqual(component.innerHTML, '<ul>\n\t<li>item</li>\n\t<li>item</li>\n\t<li>item</li>\n</ul>');
		// deepStrictEqual(calls.handleClick, [[0, 2, 1], [1, 2, 1], [0, 2, 1], [1, 2, 1]]);
		deepStrictEqual(calls.handleClick, [[0, 1, 1], [1, 1, 1], [0, 1, 1], [1, 1, 1]]);
	});

	it('should attach static events', () => {
		const component = createComponent('my-component', Branching);

		// Initial render
		mountComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });

		// Event should bubble up to container
		strictEqual(calls.staticClick, 1);

		// Re-run template: nothing should change
		updateComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });
		strictEqual(calls.staticClick, 2);
	});
});
