import { generate, baseGenerator } from 'astring';
import { Program, ENDGetterPrefix, IdentifierContext, ENDFilter, Identifier } from '@endorphinjs/template-parser';

interface AstringState {
    write(text: string): void;
}

const generator = Object.assign({}, baseGenerator, {
    ENDGetterPrefix(node: ENDGetterPrefix, state: AstringState) {
        state.write(getPrefix(node.context));
    },
    ENDFilter(node: ENDFilter, state: AstringState) {
        const { object, expression } = node;
        state.write(node.multiple ? '$filter(' : '$find(');
        this[object.type](object, state);
        state.write(', ');
        this[expression.type](expression, state);
        state.write(')');
    },
    Identifier(node: Identifier, state: AstringState) {
        if (node.context && node.context !== 'helper' && node.context !== 'argument') {
            state.write(getPrefix(node.context));
        }

        state.write(node.name);
    }
});

function getPrefix(context: IdentifierContext): string {
    if (context === 'state') {
        return '#';
    }

    if (context === 'variable') {
        return '@';
    }

    if (context === 'store') {
        return '$';
    }

    if (context === 'store-host') {
        return '$.';
    }

    return '';
}

export default function generateJS(ast: Program): string {
    return (generate(ast, { generator }) as string).trim().replace(/;$/, '');
}
