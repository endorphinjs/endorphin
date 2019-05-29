import { TweenOptions, TweenFactory, composeTween } from '..';

export * from './easings';

/**
 * Slide down given block
 */
export function slideDown(elem: HTMLElement, options?: TweenOptions): TweenFactory {
    return (elem) => slide(elem, 0, getHeight(elem), options);
}

/**
 * Slide up given block
 */
export function slideUp(elem: HTMLElement, options?: TweenOptions): TweenFactory {
    return (elem) => slide(elem, getHeight(elem), 0, options);
}

function getHeight(elem: HTMLElement): number {
    return parseInt(getComputedStyle(elem).height, 10);
}

/**
 * Performs slide animation
 */
function slide(elem: HTMLElement, from: number, to: number, options?: TweenOptions): TweenOptions {
    const { height, overflow } = elem.style;
    const delta = to - from;

    elem.style.height = `${from}px`;
    elem.style.overflow = 'hidden';

    return composeTween(options, {
        step(elem, pos) {
            elem.style.height = `${Math.round(from + pos * delta)}px`;
        },
        complete(elem) {
            elem.style.height = height;
            elem.style.overflow = overflow;
        }
    });
}
