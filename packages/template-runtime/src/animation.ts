import { animatingKey, assign, safeCall } from './utils';

export type EasingFunction = (t: number, b: number, c: number, d: number) => number;
export type AnimationCallback = (elem: HTMLElement, options: TweenOptions) => void;
export type AnimationStep = (elem: HTMLElement, pos: number, options: TweenOptions) => void;
export type TweenFactory = (elem: HTMLElement, options?: TweenOptions) => TweenOptions;

type Callback = (cancel?: boolean) => void;
type TweenCallbackKeys = 'start' | 'step' | 'complete';

export interface TweenOptions {
	/** Animation duration, ms */
	duration?: number;

	/** Delay before actual animation start, ms */
	delay?: number;

	/** Easing function */
	easing?: EasingFunction;

	/** Callback for animation start */
	start?: AnimationCallback;

	/** Callback for each animation step */
	step?: AnimationStep;

	/** Callback for animation end */
	complete?: AnimationCallback;
}

interface Animation {
	elem: HTMLElement;
	options: TweenOptions;
	start: number;
	end: number;
	started: boolean;
}

const pool: Animation[] = [];

const defaultTween: TweenOptions = {
	duration: 500,
	delay: 0,
	easing(t: number, b: number, c: number, d: number): number {
		return c * t / d + b;
	}
};

// If `true` then no animations will be invoked
let blocked = false;

/**
 * Starts animation on given element
 */
export function animate(elem: HTMLElement, animation: string | TweenFactory, callback?: Callback) {
	if (!blocked && animation) {
		if (typeof animation === 'function') {
			tweenAnimate(elem, animation, callback);
		} else {
			cssAnimate(elem, animation, callback);
		}
	} else if (callback) {
		// Stop previous animation, if any
		stopAnimation(elem, true);
		callback();
	}
}

/**
 * Starts CSS animation on given element
 */
export function cssAnimate(elem: HTMLElement, animation: string, callback?: Callback) {
	// Stop previous animation, if any
	stopAnimation(elem, true);

	const prevAnimation = elem.style.animation;
	elem[animatingKey] = (cancel?: boolean) => {
		elem.removeEventListener('animationend', handler);
		elem.removeEventListener('animationcancel', handler);
		elem.style.animation = prevAnimation;
		!cancel && finalizeAnimation(callback);
	};

	const handler = (evt: AnimationEvent) => evt.target === elem && stopAnimation(elem);

	elem.addEventListener('animationend', handler);
	elem.addEventListener('animationcancel', handler);
	elem.style.animation = animation;
}

/**
 * Starts JS animation on given element
 */
export function tweenAnimate(elem: HTMLElement, animation: TweenFactory, callback?: () => void) {
	// Stop previous animation, if any
	const prevAnim = findTween(elem);
	stopAnimation(elem, true);

	let options = animation(elem);
	if (options) {
		options = assign({}, defaultTween, options);

		if (typeof options.easing !== 'function') {
			throw new Error('Easing must be a function');
		}

		const now = performance.now();
		const offset = prevAnim
			? 1 - (now - prevAnim.start) / (prevAnim.end - prevAnim.start)
			: 0;

		const start = now + options.delay! - (offset * options.duration!);
		const anim: Animation = {
			elem,
			options,
			start,
			end: start + options.duration!,
			started: false
		};
		pool.push(anim);

		elem[animatingKey] = (cancel?: boolean) => {
			pool.splice(pool.indexOf(anim), 1);
			options.complete && options.complete(elem, options);
			!cancel && finalizeAnimation(callback);
		};

		if (pool.length === 1) {
			tweenLoop(now);
		}
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
 * Composes two tween options objects into single one: instead of simple `assign`,
 * callbacks from both tweens will be composed into a single call
 */
export function composeTween(tween1?: TweenOptions, tween2?: TweenOptions): TweenOptions {
	const next: TweenOptions = assign({}, tween1, tween2);
	const callbacks: TweenCallbackKeys[] = ['start', 'step', 'complete'];

	for (let i = 0; i < callbacks.length; i++) {
		const cbName = callbacks[i];
		const cb1 = tween1 && tween1[cbName] as AnimationCallback | AnimationStep;
		const cb2 = tween2 && tween2[cbName] as AnimationCallback | AnimationStep;
		if (cb1 && cb2) {
			next[cbName] = (elem: HTMLElement, p1?: any, p2?: any) => {
				cb1(elem, p1, p2);
				cb2(elem, p1, p2);
			};
		}
	}

	return next;
}

/**
 * Finalizes current animation: invokes given callback and blocks all nested
 * animations
 */
function finalizeAnimation(callback?: () => void) {
	if (callback) {
		blocked = true;
		safeCall(callback);
		blocked = false;
	}
}

function tweenLoop(now: number) {
	for (let i = pool.length - 1, anim: Animation; i >= 0; i--) {
		anim = pool[i];
		const { elem, options } = anim;

		if (now >= anim.start) {
			if (!anim.started) {
				anim.started = true;
				options.start && options.start(elem, options);
			}

			const finished = now >= anim.end;
			const pos = finished ? 1 : options.easing!(now - anim.start, 0, 1, options.duration!);
			options.step && options.step(elem, pos, options);

			if (finished) {
				stopAnimation(elem);
			}
		}
	}

	if (pool.length) {
		requestAnimationFrame(tweenLoop);
	}
}

export function stopAnimation(elem: HTMLElement, cancel?: boolean) {
	const callback: Callback = elem && elem[animatingKey];
	if (callback) {
		elem[animatingKey] = null;
		callback(cancel);
	}
}

/**
 * Finds existing tween animation for given element, if any
 */
function findTween(elem: HTMLElement): Animation | null {
	for (let i = 0; i < pool.length; i++) {
		if (pool[i].elem === elem) {
			return pool[i];
		}
	}

	return null;
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
