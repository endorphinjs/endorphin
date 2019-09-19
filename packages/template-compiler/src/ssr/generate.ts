import { generate as _generate, baseGenerator } from 'astring';
import { IdentifierContext, Identifier, ENDCaller, ENDFilter, ENDGetter, ENDGetterPrefix, JSNode } from '@endorphinjs/template-parser';
import { propGetter } from '../lib/utils';

interface AstringState {
    write(text: string): void;
}

const prefixes: { [name in IdentifierContext]?: string } = {
    'state': 'state',
    'property': 'props',
    'variable': 'scope',
    'store': 'store.data',
    'store-host': 'store',
};

export default function generate(ast: JSNode) {
    return _generate(ast, { generator });
}

const generator = Object.assign({}, baseGenerator, {
    ENDGetterPrefix(node: ENDGetterPrefix, state: AstringState) {
        const prefix = prefixes[node.context];
        if (prefix) {
            state.write(prefix);
        }
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
        const prefix = prefixes[node.context];
        if (prefix) {
            state.write(prefix);
            state.write(propGetter(node.name));
        } else {
            state.write(node.name);
        }
    }
});
