import { animatingKey } from './utils';

/**
 * Sets CSS animation to given element and waits until it finishes
 */
export function animate(elem: HTMLElement, animation: string, callback?: () => void) {
	if (animation && isAttached(elem)) {
		/** @param {AnimationEvent} evt */
		const handler = (evt: AnimationEvent) => {
			if (evt.target === elem) {
				elem[animatingKey] = false;
				elem.removeEventListener('animationend', handler);
				elem.removeEventListener('animationcancel', handler);
				callback && callback();
			}
		};

		elem[animatingKey] = true;
		elem.addEventListener('animationend', handler);
		elem.addEventListener('animationcancel', handler);
		elem.style.animation = animation;
	} else if (callback) {
		callback();
	}
}

/**
 * Creates animation CSS value with scoped animation name
 */
export function createAnimation(animation: string, cssScope?: string): string {
	if (animation == null) {
		return '';
	}

	const parts = String(animation).split(' ');
	const name = parts[0].trim();
	const globalPrefix = 'global:';

	if (name.indexOf(globalPrefix) === 0) {
		// Do not scope animation name, use globally defined animation name
		parts[0] = name.slice(globalPrefix.length);
	} else if (cssScope) {
		parts[0] = concat(name, cssScope);
	}

	return parts.join(' ').trim();
}

/**
 * Concatenates two strings with optional separator
 * @param {string} name
 * @param {string} suffix
 */
function concat(name: string, suffix: string) {
	const sep = suffix[0] === '_' || suffix[0] === '-' ? '' : '-';
	return name + sep + suffix;
}

/**
 * Check if given DOM element is still attached to document
 */
function isAttached(elem: HTMLElement): boolean {
	const root = elem.ownerDocument && elem.ownerDocument.documentElement;
	return root ? root.contains(elem) : false;
}
