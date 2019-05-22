import { EasingFunction, easeOutCubic } from './easings';

const animatingKey = '$$animating';

export interface AnimationOptions {
    /** Animation duration, ms */
    duration?: number;

    /** Delay before actual animation start, ms */
    delay?: number;

    /** Easing function */
    easing?: EasingFunction;

    /** Callback for animation start */
    start?: (elem: HTMLElement) => void;

    /** Callback for each animation step */
    step?: AnimationStep;

    /** Callback for animation end */
    complete?: (elem: HTMLElement) => void;

    /** Private callback for template continuation */
    next$?: () => void;
}

type AnimationStep = (pos: number, elem: HTMLElement, option: AnimationOptions) => void;

interface Animation {
    elem: HTMLElement;
    step: AnimationStep;
    options: AnimationOptions;
    start: number;
    end: number;
    started: boolean;
    tearDown?: () => void;
};

const pool: Animation[] = [];

const defaults: AnimationOptions = {
    duration: 500,
    delay: 0,
    easing: easeOutCubic
}

export function tween(elem: HTMLElement, options: AnimationOptions, step: AnimationStep, tearDown?: () => void) {
    const prevAnim = elem[animatingKey];
    if (prevAnim) {
        // TODO stop CSS Animations as well
        elem[animatingKey] = stopTween(prevAnim);
    }

    if (!isAttached(elem)) {
        // Element is not attached: no need to animate
        return next(options);
    }

    options = Object.assign({}, defaults, options);
    if (typeof options.easing !== 'function') {
        throw new Error('Easing must be a function');
    }

    const start = Date.now() + options.delay;
    const end = start + options.duration;
    pool.push(elem[animatingKey] = { elem, step, options, start, end, started: false, tearDown });

    if (pool.length === 1) {
        mainLoop();
    }
}

function mainLoop() {
    const now = Date.now();

    for (let i = pool.length - 1, anim: Animation; i >= 0; i--) {
        anim = pool[i];
        const { elem, step, options } = anim;

        if (now > anim.start) {
            if (!anim.started) {
                anim.started = true;
                options.start && options.start(elem);
            }

            const finished = now >= anim.end;
            const pos = finished ? 1 : options.easing(now - anim.start, 0, 1, options.duration);
            step(pos, elem, options);
            options.step && options.step(pos, elem, options);

            if (finished) {
                elem[animatingKey] = null;
                anim.tearDown && anim.tearDown();
                options.complete && options.complete(elem);
                pool.splice(i, 1);
                next(options);
            }
        }
    }

    if (pool.length) {
        requestAnimationFrame(mainLoop);
    }
}

/**
 * Stops given animation
 */
export function stopTween(anim: Animation): null {
    const ix = pool.indexOf(anim);
    if (ix !== -1) {
        pool.splice(ix, 1);
    }

    return null;
}

/**
 * Check if given DOM element is still attached to document
 */
function isAttached(elem: HTMLElement): boolean {
    const root = elem.ownerDocument && elem.ownerDocument.documentElement;
    return root ? root.contains(elem) : false;
}

function next(opt?: AnimationOptions) {
    if (opt && opt.next$) {
        opt.next$();
    }
}
