/**
 * @description
 * Robert Penner’s easing functions
 * http://robertpenner.com/easing/
 */

export type EasingFunction = (t: number, b: number, c: number, d: number) => number;

export function linear(t: number, b: number, c: number, d: number): number {
    return c * t / d + b;
}

export function easeInQuad(t: number, b: number, c: number, d: number): number {
    return c * (t /= d) * t + b;
}

export function easeIutQuad(t: number, b: number, c: number, d: number): number {
    return -c * (t /= d) * (t - 2) + b;
}

export function easeInOutQuad(t: number, b: number, c: number, d: number): number {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
}

export function easeInCubic(t: number, b: number, c: number, d: number): number {
    return c * (t /= d) * t * t + b;
}

export function easeOutCubic(t: number, b: number, c: number, d: number): number {
    return c * ((t = t / d - 1) * t * t + 1) + b;
}

export function easeInOutCubic(t: number, b: number, c: number, d: number): number {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
}

export function easeInExpo(t: number, b: number, c: number, d: number): number {
    return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001;
}

export function easeOutExpo(t: number, b: number, c: number, d: number): number {
    return (t == d) ? b + c : c * 1.001 * (-Math.pow(2, -10 * t / d) + 1) + b;
}

export function easeInOutExpo(t: number, b: number, c: number, d: number): number {
    if (t == 0) return b;
    if (t == d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b - c * 0.0005;
    return c / 2 * 1.0005 * (-Math.pow(2, -10 * --t) + 2) + b;
}

export function easeInElastic(t: number, b: number, c: number, d: number, a: number, p: number): number {
    var s: number;
    if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
    if (!a || a < Math.abs(c)) { a = c; s = p / 4; } else s = p / (2 * Math.PI) * Math.asin(c / a);
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
}

export function easeOutElastic(t: number, b: number, c: number, d: number, a: number, p: number): number {
    var s: number;
    if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
    if (!a || a < Math.abs(c)) { a = c; s = p / 4; } else s = p / (2 * Math.PI) * Math.asin(c / a);
    return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
}

export function easeInOutElastic(t: number, b: number, c: number, d: number, a: number, p: number): number {
    var s: number;
    if (t == 0) return b;
    if ((t /= d / 2) == 2) return b + c;
    if (!p) p = d * (.3 * 1.5);
    if (!a || a < Math.abs(c)) { a = c; s = p / 4; } else s = p / (2 * Math.PI) * Math.asin(c / a);
    if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
}

export function easeInBack(t: number, b: number, c: number, d: number, s: number = 1.70158): number {
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
}

export function easeOutBack(t: number, b: number, c: number, d: number, s: number = 1.70158): number {
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
}

export function easeInOutBack(t: number, b: number, c: number, d: number, s: number = 1.70158): number {
    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
}

export function easeInBounce(t: number, b: number, c: number, d: number): number {
    return c - easeOutBounce(t, d - t, c, d) + b;
}

export function easeOutBounce(t: number, b: number, c: number, d: number): number {
    if ((t /= d) < (1 / 2.75)) {
        return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
        return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
    } else if (t < (2.5 / 2.75)) {
        return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
    } else {
        return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
    }
}

export function easeInOutBounce(t: number, b: number, c: number, d: number): number {
    if (t < d / 2) return easeInBounce(t * 2, 0, c, d) * .5 + b;
    return easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
}

export function easeOutHard(t: number, b: number, c: number, d: number): number {
    var ts = (t /= d) * t;
    var tc = ts * t;
    return b + c * (1.75 * tc * ts + -7.4475 * ts * ts + 12.995 * tc + -11.595 * ts + 5.2975 * t);
}
