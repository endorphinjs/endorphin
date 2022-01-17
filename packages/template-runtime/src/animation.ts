import { animatingKey, assign, nextTick, safeCall } from './utils';

export type EasingFunction = (t: number, b: number, c: number, d: number) => number;
export type AnimationCallback = (elem: HTMLElement, options: TweenOptions) => void;
export type AnimationStep = (elem: HTMLElement, pos: number, options: TweenOptions) => void;
export type TweenFactory = (elem: HTMLElement, options?: TweenOptions) => TweenOptions;

type Callback = (cancel?: boolean) => void;
type TweenCallbackKeys = 'start' | 'step' | 'complete';

interface AnimationState {
	start: number;
	animation: string | TweenFactory;
	onComplete: Callback;
	timeout?: number;
	callback?: () => void;
}

interface HTMLElementAnim extends HTMLElement {
	[animatingKey]?: AnimationState
}

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
			resumeTweenLoop();
		}
	});
}

/**
 * Starts animation on given element
 */
export function animate(elem: HTMLElementAnim, animation: string | TweenFactory, callback?: Callback): void {
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
export function cssAnimate(elem: HTMLElementAnim, animation: string, callback?: Callback): void {
	const prevState = elem[animatingKey];

	clearStateTimeout(prevState);

	if (prevState && !prevState.start) {
		// There’s previous animation, which is not started yet: no need to start
		// new animation
		prevState.onComplete(true);
		finalizeAnimation(callback);
		return;
	}

	const prevName = prevState ? elem.style.animationName : '';
	const delay = getCSSDelay(animation);

	const begin = (noDelay?: boolean) => {
		const nextState: AnimationState = {
			start: prevState ? now() : 0,
			animation,
			onComplete: (cancel?: boolean) => {
				clearCSSAnimationState(elem);
				if (!cancel) {
					notifyAnimation(elem, 'end', {
						animation,
						direction: callback ? 'out' : 'in'
					});
					finalizeAnimation(callback);
				}
			}
		};

		clearStateTimeout(prevState);
		elem.style.animation = animation;

		if (prevState && prevName !== elem.style.animationName) {
			// Есть незавершённая анимация: нужно запустить новую с учётом
			// прошедшего времени текущей анимации.
			// Произошла смена анимации: попробуем запустить новую с того момента,
			// где завершилась предыдущая
			const delay = getStartDelay(animation, prevState);
			elem.style.animationDelay = `-${delay}ms`;
		} else if (noDelay) {
			elem.style.animationDelay = '0';
		}

		if (parseFloat(elem.style.animationDelay) && elem.style.animationFillMode === 'none') {
			elem.style.animationFillMode = 'both';
		}

		elem[animatingKey] = nextState;
		bindCSSAnimationEvents(elem);

		// In case if callback is provided, we have to ensure that animation is actually applied.
		// In some testing environments, animations could be disabled via
		// `* { animation: none !important; }`. In this case, we should complete animation ASAP.
		if (callback) {
			nextTick(() => {
				const style = window.getComputedStyle(elem, null);
				if (!style.animationName || style.animationName === 'none') {
					nextState.onComplete();
				}
			});
		}
	};

	if (delay && prevState) {
		// Нужно запустить анимацию с задержкой во время работы другой анимации:
		if (callback) {
			// Запускаем анимацию скрытия во время работы анимации открытия:
			// нужно подождать
			prevState.timeout = window.setTimeout(() => begin(true), delay);
		} else if (animation !== prevState.animation) {
			begin();
		}
	} else {
		begin();
	}
}

/**
 * Starts JS animation on given element
 */
export function tweenAnimate(elem: HTMLElementAnim, animation: TweenFactory, callback?: () => void): void {
	// Stop previous animation, if any
	const prevAnim = findTween(elem);
	stopAnimation(elem, true);

	if (!pageInvisible()) {
		finalizeAnimation(callback);
		return;
	}

	let options = animation(elem);
	if (options) {
		options = assign({}, defaultTween, options);

		if (typeof options.easing !== 'function') {
			throw new Error('Easing must be a function');
		}

		const _now = now();
		const offset = prevAnim
			? 1 - (_now - prevAnim.start) / (prevAnim.end - prevAnim.start)
			: 0;

		const start = _now + options.delay! - (offset * options.duration!);
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

		const nextState: AnimationState = {
			start: 0,
			animation,
			onComplete: (cancel?: boolean) => {
				const ix = pool.indexOf(anim);
				if (ix !== -1) {
					pool.splice(ix, 1);
				} else {
					console.warn('No pool item found for', anim);
				}
				options.complete && options.complete(elem, options);
				notifyAnimation(elem, 'end', evtPayload);
				if (!cancel) {
					finalizeAnimation(callback);
				}
			}
		};

		elem[animatingKey] = nextState;
		resumeTweenLoop();

		notifyAnimation(elem, 'start', evtPayload);
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
	}
}

export function stopAnimation(elem: HTMLElementAnim, cancel?: boolean): void {
	const state = elem && elem[animatingKey];
	if (state) {
		elem[animatingKey] = undefined;
		state.onComplete(cancel);
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

function clearCSSAnimationState(elem: HTMLElementAnim) {
	const state = elem[animatingKey];
	if (state) {
		unbindCSSAnimationEvents(elem);
		elem[animatingKey] = undefined;
		elem.style.animation = '';
		clearStateTimeout(state);
	}
}

function bindCSSAnimationEvents(elem: HTMLElementAnim) {
	elem.addEventListener('animationstart', onAnimationStart);
	elem.addEventListener('animationcancel', onAnimationEnd);
	elem.addEventListener('animationend', onAnimationEnd);
}

function unbindCSSAnimationEvents(elem: HTMLElementAnim) {
	elem.removeEventListener('animationstart', onAnimationStart);
	elem.removeEventListener('animationcancel', onAnimationEnd);
	elem.removeEventListener('animationend', onAnimationEnd);
}

function onAnimationStart(evt: AnimationEvent) {
	const state = getAnimationState(evt);
	if (state && !state.start) {
		state.start = now();
		notifyAnimation(evt.currentTarget as HTMLElementAnim, 'start', {
			animation: state.animation,
			direction: state.callback ? 'out' : 'in'
		});
	}
}

function onAnimationEnd(evt: AnimationEvent) {
	const state = getAnimationState(evt);
	if (state) {
		if (state.timeout) {
			const elem = evt.currentTarget as HTMLElementAnim;
			elem.style.animation = '';
		} else {
			state.onComplete();
		}
	}
}

function getAnimationState(evt: AnimationEvent): AnimationState | undefined {
	const elem = evt.currentTarget as HTMLElementAnim;
	const state = elem[animatingKey];
	if (state && elem === evt.target && typeof state.animation === 'string' && state.animation.includes(evt.animationName)) {
		return state;
	}
}

const now: () => number = typeof performance !== 'undefined'
	? () => performance.now()
	: () => Date.now();

/**
 * Возвращает начальную задержку для анимации. Если у элемента есть уже рабочая анимация,
 * вернётся время, с которого надо начать новую анимацию, либо 0, если нужно
 * начинать с начала.
 */
function getStartDelay(animation: string, state: AnimationState): number {
	if (state && state.start && typeof state.animation === 'string') {
		// Анимация уже началась, перевернём её
		const duration = getAnimationDuration(state.animation);
		const now = performance.now();
		const timeLeft = duration - (now - state.start);
		if (timeLeft > 0) {
			const ratio = timeLeft / duration;
			return Math.round(getAnimationDuration(animation) * ratio);
		}
	}

	return 0;
}

/**
 * Возвращает длительность указанного объявления анимации
 */
function getAnimationDuration(animation: string): number {
	const duration = animation.split(/\s+/).find(chunk => /([\d.]+(?:s|ms))/.test(chunk));
	return parseDuration(duration || '1s');
}

function getCSSDelay(animation: string): number {
	const m = animation.match(/(?:^|\s)(?:\.\d+|\d+(?:\.\d*)?)(?:ms|s)\b/g);
	return m && m[1] ? parseDuration(m[1]) : 0;
}

function clearStateTimeout(state?: AnimationState): void {
	if (state && state.timeout) {
		clearTimeout(state.timeout);
		state.timeout = 0;
	}
}
