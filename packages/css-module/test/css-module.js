const fs = require('fs');
const path = require('path');
const assert = require('assert');
const rewrite = require('../');

describe('CSS Tree', () => {
    const read = file => fs.readFileSync(path.resolve(__dirname, file), 'utf8');

    it('should rewrite rules', () => {
        const result = rewrite(read('./fixtures/input.css'), 'abc123');
        assert.equal(format(result), read('./fixtures/output.css').trim());
    });
});

/**
 * Dead simple CSS formatting
 * @param {string} code
 */
function format(code) {
    let level = 0;
    const baseIndent = '    ';
    let indent = '';
    let result = '', pos = 0, ch;

    while (ch = code[pos++]) {
        switch (ch) {
        case '{':
            indent = baseIndent.repeat(++level);
            result += ` ${ch}\n${indent}`;
            break;

        case '}':
            indent = baseIndent.repeat(--level);
            result += `\n${indent}${ch}`;
            if (code[pos] !== '}') {
                result += `\n\n${indent}`;
            }
            break;

        case ',':
            result += `${ch} `;
            break;

        case ':':
            result += `${ch}${indent ? ' ' : ''}`;
            break;

        case ';':
            result += `${ch}\n${indent}`;
            break;

        default:
            result += ch;
        }
    }

    return result.trim();
}
