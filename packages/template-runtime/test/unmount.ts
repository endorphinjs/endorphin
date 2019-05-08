import { strictEqual, deepStrictEqual } from 'assert';
import document from './assets/document';
import { createComponent, mountComponent, unmountComponent } from '../src/runtime';
import { mounted } from './samples/unmount/unmount-beacon';
import * as UnmountCondition from './samples/unmount/unmount-condition';
import * as UnmountIterator from './samples/unmount/unmount-iterator';
import * as UnmountKeyIterator from './samples/unmount/unmount-key-iterator';
import * as UnmountSlot from './samples/unmount/unmount-slot';

describe('Unmount', () => {
	before(() => global['document'] = document);
	after(() => delete global['document']);
	afterEach(() => mounted.length = 0);

	function calcRefs(vars: { [key: string]: any }) {
		let refs = 0;
		for (const p in vars) {
			if (p.startsWith('$_') && vars[p] != null) {
				refs++;
			}
		}

		return refs;
	}

	it('should unmount block', () => {
		const component = createComponent('unmount-condition', UnmountCondition);

		mountComponent(component, {
			enabled: true,
			alt: false
		});
		deepStrictEqual(mounted, [1, 2, 4]);

		component.setProps({ alt: true });
		deepStrictEqual(mounted, [1, 2, 3]);

		component.setProps({ enabled: false });
		deepStrictEqual(mounted, [1]);

		component.setProps({ enabled: true });
		deepStrictEqual(mounted, [1, 2, 3]);

		const { vars } = component.componentModel;
		unmountComponent(component);
		deepStrictEqual(mounted, []);
		strictEqual(calcRefs(vars), 0);
	});

	it('should unmount iterator', () => {
		const component = createComponent('unmount-iterator', UnmountIterator);

		mountComponent(component, {
			items: [1, 2, 3, 4, 5]
		});

		deepStrictEqual(mounted, [1, 2, 3, 4, 5]);

		component.setProps({ items: [1, 2, 3] });
		deepStrictEqual(mounted, [1, 2, 3]);

		component.setProps({ items: [1, 2, 3, 4] });
		deepStrictEqual(mounted, [1, 2, 3, 4]);

		const { vars } = component.componentModel;
		unmountComponent(component);
		deepStrictEqual(mounted, []);
		strictEqual(calcRefs(vars), 0);
	});

	it('should unmount key iterator', () => {
		const component = createComponent('unmount-key-iterator', UnmountKeyIterator);

		mountComponent(component, {
			items: [1, 2, 3, 4, 5]
		});

		deepStrictEqual(mounted, [1, 2, 3, 4, 5]);

		component.setProps({ items: [2, 3, 4] });
		deepStrictEqual(mounted, [2, 3, 4]);

		component.setProps({ items: [1, 2, 3, 4] });
		deepStrictEqual(mounted, [2, 3, 4, 1]);

		const { vars } = component.componentModel;
		unmountComponent(component);
		deepStrictEqual(mounted, []);
		strictEqual(calcRefs(vars), 0);
	});

	it('should unmount slot', () => {
		const component = createComponent('unmount-slot', UnmountSlot);
		mountComponent(component, {
			outer: false,
			inner: false
		});
		deepStrictEqual(mounted, []);

		component.setProps({ inner: true });
		deepStrictEqual(mounted, ['inner']);

		component.setProps({ outer: true });
		deepStrictEqual(mounted, ['outer']);

		component.setProps({ inner: false });
		deepStrictEqual(mounted, ['outer']);

		component.setProps({ outer: false });
		deepStrictEqual(mounted, []);

		component.setProps({ inner: true });
		deepStrictEqual(mounted, ['inner']);

		component.setProps({ outer: true });
		deepStrictEqual(mounted, ['outer']);

		component.setProps({ outer: false });
		deepStrictEqual(mounted, ['inner']);

		const { vars } = component.componentModel;
		unmountComponent(component);
		deepStrictEqual(mounted, []);
		strictEqual(calcRefs(vars), 0);
	});
});
