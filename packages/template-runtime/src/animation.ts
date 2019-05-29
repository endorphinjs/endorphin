import { animatingKey, assign } from './utils';

export type EasingFunction = (t: number, b: number, c: number, d: number) => number;
export type AnimationCallback = (elem: HTMLElement, options: TweenOptions) => void;
export type AnimationStep = (elem: HTMLElement, pos: number, options: TweenOptions) => void;
export type TweenFactory = (elem: HTMLElement, options?: TweenOptions) => TweenOptions;

type Callback = () => void;

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

/**
 * Starts animation on given element
 */
export function animate(elem: HTMLElement, animation: string | TweenFactory, callback?: Callback) {
	// Stop previous animation, if any
	stopAnimation(elem);

	if (isAttached(elem) && animation) {
		// We should run animation only if element is attached to DOM
		if (typeof animation === 'function') {
			tweenAnimate(elem, animation, callback);
		} else {
			cssAnimate(elem, animation, callback);
		}
	} else if (callback) {
		callback();
	}
}

/**
 * Starts CSS animation on given element
 */
export function cssAnimate(elem: HTMLElement, animation: string, callback?: Callback) {
	const prevAnimation = elem.style.animation;
	elem[animatingKey] = () => {
		elem.removeEventListener('animationend', handler);
		elem.removeEventListener('animationcancel', handler);
		elem.style.animation = prevAnimation;
		callback && callback();
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
	let options = animation(elem);
	if (options) {
		options = assign({}, defaultTween, options);

		if (typeof options.easing !== 'function') {
			throw new Error('Easing must be a function');
		}

		const now = performance.now();
		const start = now + options.delay!;
		const anim: Animation = {
			elem,
			options,
			start,
			end: start + options.duration!,
			started: false
		};
		pool.push(anim);

		elem[animatingKey] = () => {
			pool.splice(pool.indexOf(anim), 1);
			options.complete && options.complete(elem, options);
			callback && callback();
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
	const callbacks: Array<keyof TweenOptions> = ['start', 'step', 'complete'];

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

function stopAnimation(elem: HTMLElement) {
	const callback: Callback = elem[animatingKey];
	if (callback) {
		elem[animatingKey] = null;
		callback();
	}
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
