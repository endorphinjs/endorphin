import { AnimationOptions, tween } from './tween';

export * from './easings';

/**
 * Slide down given block
 */
export function slideDown(elem: HTMLElement, options?: AnimationOptions) {
    return slide(elem, 0, getHeight(elem), options);
}

/**
 * Slide up given block
 */
export function slideUp(elem: HTMLElement, options?: AnimationOptions) {
    return slide(elem, getHeight(elem), 0, options);
}

function getHeight(elem: HTMLElement): number {
    return parseInt(getComputedStyle(elem).height, 10);
}

/**
 * Performs slide animation
 */
function slide(elem: HTMLElement, from: number, to: number, options?: AnimationOptions) {
    const { height, overflow } = elem.style;
    const delta = to - from;

    elem.style.height = `${from}px`;
    elem.style.overflow = 'hidden';

    return tween(elem, options,
        pos => elem.style.height = `${from + pos * delta}px`,
        () => {
            elem.style.height = height;
            elem.style.overflow = overflow;
        }
    );
}

export { tween };
