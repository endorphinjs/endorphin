export type SymbolGenerator = (name: string) => string;
type SymbolPartGenerator = (num: number) => number | string;
const numGenerator: SymbolPartGenerator = num => num.toString(36);

/**
 * Creates symbol generator: a function that generates unique symbols with given
 * name
 */
export default function createSymbolGenerator(
        prefix = '',
        suffix: string | SymbolPartGenerator = numGenerator,
        mangle?: boolean): SymbolGenerator {
    const symbols: { [prefix: string]: number } = {};

    return name => {
        const base = mangle ? '' : prefix + name;
        if (base in symbols) {
            symbols[base]++;
        } else {
            symbols[base] = 0;
        }

        const num = symbols[base];
        if (mangle) {
            return `_${num.toString(36)}`;
        }

        return base + getPart(num, suffix);
    };
}

function getPart(num: number, generator: string | SymbolPartGenerator): number | string {
    if (typeof generator === 'function') {
        return generator(num);
    } else if (typeof generator === 'string') {
        return generator;
    }

    return '';
}
