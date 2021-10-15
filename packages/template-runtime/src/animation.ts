import { animatingKey, assign, nextTick, safeCall } from './utils';

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

if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (pool.length && pageInvisible()) {
			globalDebug('resume on page visible', { poolSize: pool.length });
			resumeTweenLoop();
		}
	});
}

/**
 * Starts animation on given element
 */
export function animate(elem: HTMLElement, animation: string | TweenFactory, callback?: Callback): void {
	debug(elem, 'request animate', { blocked, animation, callback });
	if (!blocked && animation) {
		if (typeof animation === 'function') {
			tweenAnimate(elem, animation, callback);
		} else {
			debug(elem, 'css animate');
			cssAnimate(elem, animation, callback);
		}
	} else if (callback) {
		// Stop previous animation, if any
		debug(elem, 'immediate cancel');
		stopAnimation(elem, true);
		callback();
	} else {
		debug(elem, 'stale animate request');
	}
}

/**
 * Starts CSS animation on given element
 */
export function cssAnimate(elem: HTMLElement, animation: string, callback?: Callback): void {
	// Stop previous animation, if any
	stopAnimation(elem, true);

	let timer: number | undefined;
	const prevAnimation = elem.style.animation;
	const evtPayload = {
		animation,
		direction: callback ? 'out' : 'in'
	};

	debug(elem, 'run css animation', { animation, prevAnimation, evtPayload });
	elem[animatingKey] = (cancel?: boolean) => {
		debug(elem, 'run css completion callback', { cancel });
		clearTimeout(timer);
		elem.removeEventListener('animationend', handler);
		elem.removeEventListener('animationcancel', handler);
		elem.style.animation = prevAnimation;
		notifyAnimation(elem, 'end', evtPayload);
		if (!cancel) {
			debug(elem, 'finalize css animation', { callback });
			finalizeAnimation(callback);
		}
	};

	const handler = (evt: AnimationEvent) => evt.target === elem && stopAnimation(elem);

	elem.addEventListener('animationend', handler);
	elem.addEventListener('animationcancel', handler);
	elem.style.animation = animation;

	// In case if callback is provided, we have to ensure that animation is actually applied.
	// In some testing environments, animations could be disabled via
	// `* { animation: none !important; }`. In this case, we should complete animation ASAP.
	if (callback) {
		nextTick(() => {
			const style = window.getComputedStyle(elem, null);
			if (!style.animationName || style.animationName === 'none') {
				stopAnimation(elem);
				debug(elem, 'stop css animation due to global css');
			} else {
				// Handle edge case: animation runs but during animation parent
				// element is unmounted. In this case `animationend` callback won’t
				// fire, causing memory leak.
				// Create timer which will forcibly dispose animation after animation
				// duration
				const duration = parseDuration(style.animationDelay) + parseDuration(style.animationDuration);
				if (duration) {
					timer = window.setTimeout(() => stopAnimation(elem), duration);
				}
			}
		});
	}

	notifyAnimation(elem, 'start', evtPayload);
}

/**
 * Starts JS animation on given element
 */
export function tweenAnimate(elem: HTMLElement, animation: TweenFactory, callback?: () => void): void {
	// Stop previous animation, if any
	const prevAnim = findTween(elem);
	stopAnimation(elem, true);

	if (!pageInvisible()) {
		if (callback) {
			callback();
		}
		globalDebug('cancel tween due to hidden page');
		return;
	}

	let options = animation(elem);
	debug(elem, 'tween animation', { prevAnim, options });
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
		const evtPayload = {
			animation,
			tween: options,
			direction: callback ? 'out' : 'in'
		};
		pool.push(anim);

		debug(elem, 'push pool', { size: pool.length, evtPayload });

		elem[animatingKey] = (cancel?: boolean) => {
			debug(elem, 'run completion callback', { cancel });
			const ix = pool.indexOf(anim);
			if (ix !== -1) {
				debug(elem, 'remove pool item', { ix, size: pool.length });
				pool.splice(ix, 1);
			} else {
				debug(elem, 'no pool item');
				console.warn('No pool item found for', anim);
			}
			options.complete && options.complete(elem, options);
			notifyAnimation(elem, 'end', evtPayload);
			if (!cancel) {
				debug(elem, 'finalize animation', { callback });
				finalizeAnimation(callback);
			}
		};

		resumeTweenLoop();

		notifyAnimation(elem, 'start', evtPayload);
	} else if (callback) {
		debug(elem, 'no options, run callback', { callback });
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

function tweenLoopIteration(now: number) {
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

	resumeTweenLoop(true);
}

let rafId = 0;
function resumeTweenLoop(isNextFrame?: boolean) {
	cancelAnimationFrame(rafId);
	if (pool.length) {
		rafId = requestAnimationFrame(tweenLoopIteration);
		if (!isNextFrame) {
			globalDebug('begin loop', { rafId, poolSize: pool.length });
		}
	}
}

export function stopAnimation(elem: HTMLElement, cancel?: boolean): void {
	const callback: Callback = elem && elem[animatingKey];
	debug(elem, 'stop animation', { cancel, callback });
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
 */
function concat(name: string, suffix: string) {
	const sep = suffix[0] === '_' || suffix[0] === '-' ? '' : '-';
	return name + sep + suffix;
}

function notifyAnimation(elem: Element, stage: string, detail?: Record<string, unknown>) {
	try {
		elem.dispatchEvent(new CustomEvent(`animate-${stage}`, {
			bubbles: false,
			cancelable: false,
			detail
		}));
	} catch (err) {
		// pass
	}
}

function parseDuration(value?: string): number {
	if (!value) {
		return 0;
	}

	const ms = value.indexOf('ms') !== -1 ? 1 : 1000;
	return parseFloat(value) * ms;
}

function pageInvisible(): boolean {
	return document.visibilityState ? document.visibilityState !== 'hidden' : false;
}

function isDebugEnabled(): boolean {
	return typeof window['__endorphinDebug'] !== 'undefined'
}

function debug(elem: Element, message: string, data?: unknown) {
	if (!isDebugEnabled()) {
		return;
	}

	window['__endorphinPool'] = pool;

	const animDebug = elem['__animDebug'] || [];
	animDebug.push({
		date: new Date(),
		message,
		data
	});
	elem['__animDebug'] = animDebug;
}

function globalDebug(message: string, data?: unknown) {
	if (!isDebugEnabled()) {
		return;
	}

	const animDebug = window['__animDebug'] || [];
	while (animDebug.length > 500) {
		animDebug.shift();
	}

	animDebug.push({
		date: new Date(),
		message,
		data
	});
	window['__animDebug'] = animDebug;
}
