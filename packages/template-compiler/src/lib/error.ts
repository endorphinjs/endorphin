import { Node, Position } from '@endorphinjs/template-parser';

export class ENDCompileError extends Error {
    constructor(message: string, readonly node: Node) {
        super(message);
    }
}

export class ENDSyntaxError extends SyntaxError {
    readonly fileName: string | null;
    readonly lineNumber: number;
    readonly columnNumber: number;
    readonly rawMessage: string;
    readonly snippet?: string;

    constructor(message: string, fileName?: string | null, pos?: Position, source?: string) {
        const rawMessage = message;

        if (pos) {
            message += ` at line ${pos.line}, column ${pos.column}`;
        }

        if (fileName) {
            message += ` in ${fileName}`;
        }

        let snippet: string;
        if (pos && source) {
            snippet = getSnippet(source, pos.line, pos.column);
            message += `\n\n${snippet}`;
        }

        super(message);
        this.fileName = fileName;
        this.lineNumber = pos && pos.line;
        this.columnNumber = pos && pos.column;
        this.snippet = snippet;
        this.rawMessage = rawMessage;
    }
}

/**
 * Returns code fragment with pointer to given `line` and `column`
 */
function getSnippet(code: string, line: number, column: number): string {
    const lines = splitByLines(code);
    const start = Math.max(line - 3, 0);
    const targetLine = line - start - 1;

    // Replace all tab characters with spaces for better representation in TTY
    const indent = '  ';
    const chunk = lines.slice(start, start + 5).map((l, i) => {
        if (i === targetLine) {
            const result = replaceTabs(l, indent, column);
            column += result.offset;
            return result.text;
        }

        return l.replace(/\t/g, indent);
    });

    chunk.splice(targetLine + 1, 0, '-'.repeat(column) + '^');
    return chunk.join('\n');
}

function splitByLines(text: string): string[] {
    return text.replace(/\r\n/g, '\n').split('\n');
}

function replaceTabs(text: string, replacement: string, column: number = 0): { text: string, offset: number } {
    let offset = 0;
    let output = '';

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\t') {
            output += replacement;
            if (i < column) {
                // NB -1 because of tab character length
                offset += replacement.length - 1;
            }
        } else {
            output += ch;
        }
    }

    return { text: output, offset };
}
