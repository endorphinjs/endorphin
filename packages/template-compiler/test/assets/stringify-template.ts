import {
    ENDStatement, ENDProgram, ENDAttributeValue, ENDAttributeName,
    Literal, Program, ENDChooseCase, ENDProgramStatement
} from '@endorphinjs/template-parser';
import expr from './stringify-expression';

type WalkNode = ENDProgramStatement | ENDStatement | ENDChooseCase;
type WalkNext = (node: WalkNode) => void;
interface State {
    out: string;
    indent: number;
}

export default function stringify(program: ENDProgram): string {
    const state: State = {
        out: '',
        indent: 0
    };

    const next: WalkNext = node => walk(node, state, next);
    if (program.variables.length) {
        state.out = `[vars: ${program.variables.join(' ')}]\n`;
    }
    program.body.forEach(next);
    return state.out;
}

function walk(node: WalkNode, state: State, next: WalkNext) {
    if (node.type === 'ENDTemplate') {
        tag('template', '', state, node.body, next);
    } else if (node.type === 'ENDElement') {
        const attributes = node.attributes.map(attr => attribute(attr.name, attr.value));
        const directives = node.directives.map(dir => directive(dir.prefix, dir.name, dir.value));
        const attrs = attributes.concat(directives).join(' ');
        tag(node.name.name, attrs, state, node.body, next);
    } else if (node.type === 'ENDVariableStatement') {
        const attrs = node.variables.map(v => attribute(v.name, v.value)).join(' ');
        tag('e:var', attrs, state);
    } else if (node.type === 'ENDAddClassStatement') {
        tag('e:add-class', '', state, node.tokens, next);
    } else if (node.type === 'ENDAttributeStatement') {
        const attributes = node.attributes.map(attr => attribute(attr.name, attr.value));
        const directives = node.directives.map(dir => directive(dir.prefix, dir.name, dir.value));
        const attrs = attributes.concat(directives).join(' ');
        tag('e:attr', attrs, state);
    } else if (node.type === 'ENDIfStatement') {
        tag('e:if', attribute('test', node.test), state, node.consequent, next);
    } else if (node.type === 'ENDChooseStatement') {
        tag('e:choose', '', state, node.cases, next);
    } else if (node.type === 'ENDChooseCase') {
        tag(node.test ? 'e:when' : 'e:otherwise', attribute('test', node.test), state, node.consequent, next);
    } else if (node.type === 'ENDForEachStatement') {
        tag('e:for-each', attribute('select', node.select), state, node.body, next);
    } else if (node.type === 'ENDPartial') {
        const attributes = node.params.map(param => attribute(param.name, param.value));
        attributes.unshift(`partial:${node.id}`);
        nl(state);
        tag('template', attributes.join(' '), state, node.body, next);
    } else if (node.type === 'ENDPartialStatement') {
        const attributes = node.params.map(param => attribute(param.name, param.value));
        tag(`partial:${node.id}`, attributes.join(' '), state);
    } else if (node.type === 'ENDInnerHTML') {
        state.out += `{{${expr(node.value)}}}`;
    } else if (node.type === 'Literal') {
        state.out += node.value;
    } else if (node.type === 'Program') {
        state.out += `{${expr(node)}}`;
    }
}

function tag(name: string, attrs: string, state: State, children?: WalkNode[], next?: WalkNext) {
    state.out += `<${name}${attrs ? ' ' + attrs : ''}`;
    if (children) {
        children = (children as ENDStatement[]).filter(nonEmpty);
    }

    if (children && children.length && next) {
        state.out += '>';
        state.indent++;
        const isText = isTextOnly(children);
        for (const child of children) {
            if (!isText) {
                nl(state);
            }
            next(child);
        }
        state.indent--;
        if (!isText) {
            nl(state);
        }
        state.out += `</${name}>`;
    } else {
        state.out += '/>';
    }
}

function attribute(name: string | ENDAttributeName, value?: ENDAttributeValue): string {
    let result = '';
    if (typeof name === 'string') {
        result += name;
    } else if (name.type === 'Identifier') {
        result += name.name;
    } else {
        result += `{${expr(name)}}`;
    }

    if (value) {
        result += `=${attributeValue(value)}`;
    }

    return result;
}

function attributeValue(value: ENDAttributeValue): string {
    if (value.type === 'Literal') {
        const q = typeof value.value === 'string' ? '"' : '';
        return q + value.value + q;
    }

    if (value.type === 'ENDAttributeValueExpression') {
        let result = '"';
        for (const t of value.elements) {
            result += t.type === 'Literal' ? t.value : `{${expr(t)}}`;
        }
        return result + '"';
    }

    return `{${expr(value)}}`;
}

function directive(prefix: string, name: string, value?: ENDAttributeValue): string {
    let result = `${prefix}:${name}`;
    if (value) {
        result += `=${attributeValue(value)}`;
    }

    return result;
}

function isTextOnly(statements: WalkNode[]): statements is Array<Literal | Program> {
    return statements.every(s => s.type === 'Literal' || s.type === 'Program');
}

function nl(state: State) {
    state.out += '\n';
    indent(state);
}

function indent(state: State) {
    state.out += '    '.repeat(state.indent);
}

function nonEmpty(statement: ENDStatement): boolean {
    if (statement.type === 'ENDVariableStatement') {
        return statement.variables.length > 0;
    }

    return true;
}
