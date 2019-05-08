export type SymbolGenerator = (name: string) => string;
type SymbolPartGenerator = (num: number) => number | string;
const numGenerator: SymbolPartGenerator = num => num.toString(36);

/**
 * Creates symbol generator: a function that generates unique symbols with given
 * name
 */
export default function createSymbolGenerator(
        prefix: string | SymbolPartGenerator = '',
        suffix: string | SymbolPartGenerator = numGenerator): SymbolGenerator {
    const symbols: { [prefix: string]: number } = {};

    return name => {
        if (name in symbols) {
            symbols[name]++;
        } else {
            symbols[name] = 0;
        }

        const num = symbols[name];
        return getPart(num, prefix) + name + getPart(num, suffix);
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
