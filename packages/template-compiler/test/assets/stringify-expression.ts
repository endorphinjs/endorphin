import { generate, GENERATOR } from 'astring';
import { Program, ENDGetterPrefix, IdentifierContext, ENDFilter, Identifier, ENDGetter, ENDCaller } from '@endorphinjs/template-parser';

interface AstringState {
    write(text: string): void;
}

const generator = Object.assign({}, GENERATOR, {
    ENDGetterPrefix(node: ENDGetterPrefix, state: AstringState) {
        state.write(getPrefix(node.context));
    },
    ENDGetter(node: ENDGetter, state: AstringState) {
        state.write('$get(');
        node.path.forEach((child, i) => {
            if (i !== 0) {
                state.write(', ');
            }
            this[child.type](child, state);
        });

        state.write(')');
    },
    ENDCaller(node: ENDCaller, state: AstringState) {
        state.write('$call(');
        const { object, property } = node;
        this[object.type](object, state);
        state.write(', ');
        this[property.type](property, state);
        if (node.arguments && node.arguments.length) {
            state.write(', [');
            node.arguments.forEach((arg, i) => {
                if (i !== 0) {
                    state.write(', ');
                }
                this[arg.type](arg, state);
            });
            state.write(']');
        }
        state.write(')');
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
    return (generate(ast, { generator }) as string).replace(/;\s*$/, '');
}
