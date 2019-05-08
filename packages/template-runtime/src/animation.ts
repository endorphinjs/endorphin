import { domRemove } from './dom';
import { animatingKey, assign, obj } from './utils';
import { Scope } from './types';

type AnimationCallback = (elem: Element, scope?: Scope) => void;

/**
 * Animates element appearance
 */
export function animateIn(elem: HTMLElement, animation: string, cssScope?: string): void {
	if (animation = createAnimation(animation, cssScope)) {
		elem.style.animation = animation;
	}
}

/**
 * Animates element disappearance
 */
export function animateOut(elem: HTMLElement, animation: string, cssScope: string): void;
export function animateOut(elem: HTMLElement, animation: string, scope: Scope, callback: AnimationCallback, cssScope: string): void;
export function animateOut(elem: HTMLElement, animation: string, scope: Scope | string | undefined, callback?: AnimationCallback, cssScope?: string): void {
	if (typeof scope === 'string') {
		cssScope = scope;
		scope = callback = undefined;
	}

	if (animation = createAnimation(animation, cssScope)) {
		// Create a copy of scope and pass it to callback function.
		// It’s required for proper clean-up in case if the same element
		// (with the same scope references) will be created during animation
		if (scope) {
			scope = assign(obj(), scope);
		}

		/** @param {AnimationEvent} evt */
		const handler = (evt: AnimationEvent) => {
			if (evt.target === elem) {
				elem[animatingKey] = false;
				elem.removeEventListener('animationend', handler);
				elem.removeEventListener('animationcancel', handler);
				dispose(elem, scope as Scope, callback);
			}
		};

		elem[animatingKey] = true;
		elem.addEventListener('animationend', handler);
		elem.addEventListener('animationcancel', handler);
		elem.style.animation = animation;
	} else {
		dispose(elem, scope as Scope, callback);
	}
}

/**
 * Creates animation CSS value with scoped animation name
 */
function createAnimation(animation: string, cssScope?: string): string {
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

function dispose(elem: HTMLElement, scope?: Scope, callback?: AnimationCallback) {
	callback && callback(elem, scope);
	domRemove(elem);
}
