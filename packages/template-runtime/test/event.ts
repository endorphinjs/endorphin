import { strictEqual, deepStrictEqual } from 'assert';
import document, { ElementShim, EventShim } from './assets/document';
import { createComponent, mountComponent, updateComponent } from '../src/runtime';
import { Component } from '../src/component';

// @ts-ignore
import template from './samples/events.html';
// @ts-ignore
import loopTemplate from './samples/events-loop.html';
// @ts-ignore
import branching from './samples/branching.html';

describe('Event handler', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);

	function dispatch(node: Node, evt: EventShim) {
		(node as any as ElementShim).dispatchEvent(evt);
	}

	it('should add and call event handler', () => {
		const calls = {
			method1: [],
			method2: []
		};

		const component = createComponent('my-component', {
			default: template,
			props() {
				return { foo: 'foo1', bar: 'bar2', c1: false };
			},
			method1(arg1: any, arg2: any, host: Component, evt: Event) {
				strictEqual(evt.type, 'click');
				calls.method1.push([arg1, arg2]);
			},
			method2(arg1: any, arg2: any, host: Component, evt: Event) {
				strictEqual(evt.type, 'click');
				calls.method2.push([arg1, arg2]);
			}
		});

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
		const calls = [];

		const component = createComponent('my-component', {
			default: loopTemplate,
			props() {
				return {
					items: [1, 2, 3]
				};
			},
			handleClick(arg1: any, arg2: any, arg3: any, host: Component, evt: Event) {
				strictEqual(evt.type, 'click');
				calls.push([arg1, arg2, arg3]);
			}
		});

		// Initial render
		mountComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });
		dispatch(component.firstChild.childNodes[1], { type: 'click' });
		strictEqual(component.innerHTML, '<ul>\n\t<li>item</li>\n\t<li>item</li>\n\t<li>item</li>\n</ul>');
		deepStrictEqual(calls, [[0, 2, 1], [1, 2, 1]]);

		// Re-run template: nothing should change
		updateComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });
		dispatch(component.firstChild.childNodes[1], { type: 'click' });
		strictEqual(component.innerHTML, '<ul>\n\t<li>item</li>\n\t<li>item</li>\n\t<li>item</li>\n</ul>');
		deepStrictEqual(calls, [[0, 2, 1], [1, 2, 1], [0, 2, 1], [1, 2, 1]]);
	});

	it('should attach static events', () => {
		let calls = 0;

		const component = createComponent('my-component', {
			default: branching,
			events: {
				click() {
					calls++;
				}
			}
		});

		// Initial render
		mountComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });

		// Event should bubble up to container
		strictEqual(calls, 1);

		// Re-run template: nothing should change
		updateComponent(component);
		dispatch(component.firstChild.childNodes[0], { type: 'click' });
		strictEqual(calls, 2);
	});
});
