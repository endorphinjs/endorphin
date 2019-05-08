import { generate, baseGenerator } from 'astring';
import { Program, ENDGetterPrefix, IdentifierContext, ENDGetter, ENDCaller, ENDFilter, Identifier } from '../../src/ast';

interface AstringState {
    write(text: string): void;
}

const generator = Object.assign({}, baseGenerator, {
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
            state.write('.');
        }

        state.write(node.name);
    }
});

function getPrefix(context: IdentifierContext): string {
    if (context === 'property') {
        return '$host.props';
    }

    if (context === 'state') {
        return '$host.state';
    }

    if (context === 'variable') {
        return '$scope';
    }

    if (context === 'store') {
        return '$store';
    }

    return '';
}

export default function generateJS(ast: Program): string {
    return generate(ast, { generator });
}
