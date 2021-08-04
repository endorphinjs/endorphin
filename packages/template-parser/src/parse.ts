import Scanner from './scanner';
import { Program, ENDProgram, ENDStatement, ParsedTag, ENDIfStatement } from './ast';
import { openTag, tagText } from './tag';
import templateStatement from './elements/template';
import ifStatement from './elements/if';
import chooseStatement from './elements/choose';
import forEachStatement from './elements/for-each';
import partialStatement from './elements/partial';
import elementStatement from './elements/element';
import attributeStatement from './elements/attribute';
import addClassStatement from './elements/add-class';
import variableStatement from './elements/variable';
import importStatement from './elements/import';
import stylesheetStatement from './elements/stylesheet';
import scriptStatement from './elements/script';
import {
    prefix, ignored, getControlName, InnerStatement, assertExpression,
    getAttrValueIfLiteral
} from './elements/utils';

export interface ParserOptions {
    helpers?: string[];
    disableGetters?: boolean;
    disableCallers?: boolean;
}

interface StatementMap {
    [name: string]: InnerStatement;
}

const statements: StatementMap = {
    'attribute': attributeStatement,
    'attr': attributeStatement,
    'add-class': addClassStatement,
    'variable': variableStatement,
    'var': variableStatement,
    'if': ifStatement,
    'choose': chooseStatement('when', 'otherwise'),
    'switch': chooseStatement('case', 'default'),
    'for-each': forEachStatement,
    'partial': partialStatement
};

/**
 * Parses given Endorphin template text into AST
 * @param text Template source
 * @param url Location of source, used for source mapping
 */
export default function parse(code: string, url?: string, options?: ParserOptions): ENDProgram {
    const scanner = new Scanner(code, url, options);
    const program: ENDProgram = {
        type: 'ENDProgram',
        body: [],
        filename: url,
        stylesheets: [],
        scripts: [],
        variables: [],
        start: 0,
        end: code.length
    };
    let entry: ParsedTag;

    while (!scanner.eof()) {
        if (entry = openTag(scanner)) {
            const name = getName(entry);

            if (getControlName(name)) {
                throw scanner.error(`Unexpected control statement <${name}>`, entry);
            }

            if (name === 'template') {
                program.body.push(templateStatement(scanner, entry, statement));
            } else if (name === 'style' || (name === 'link' && getAttrValueIfLiteral(entry, 'rel') === 'stylesheet')) {
                const stylesheet = stylesheetStatement(scanner, entry);
                if (stylesheet) {
                    program.stylesheets.push(stylesheet);
                }
            } else if (name === 'link' && getAttrValueIfLiteral(entry, 'rel') === 'import') {
                program.body.push(importStatement(scanner, entry));
            } else if (name === 'script') {
                const script = scriptStatement(scanner, entry);
                if (script) {
                    program.scripts.push(script);
                }
            } else {
                program.body.push(elementStatement(scanner, entry, statement));
            }
        } else if (!ignored(scanner, true)) {
            throw scanner.error('Unexpected token');
        }
    }

    return program;
}

/**
 * Consumes tag statement for given open tag from current scanner state
 */
function statement(scanner: Scanner, open: ParsedTag): ENDStatement {
    const name = getName(open);
    const controlName = getControlName(name);
    let result: ENDStatement;
    const parents: ENDIfStatement[] = [];

    // Check if open tag contains `if` directive. If so, wrap output into
    // `<if>` statement and remove directives
    for (let i = open.directives.length - 1; i >= 0; i--) {
        const dir = open.directives[i];
        if (dir.prefix === prefix && dir.name === 'if') {
            assertExpression(scanner, dir);
            parents.push({
                type: 'ENDIfStatement',
                start: open.start,
                end: open.end,
                test: dir.value as Program,
                consequent: [],
                loc: dir.loc
            });
            open.directives.splice(i, 1);
        }
    }

    if (controlName && controlName in statements) {
        result = statements[controlName](scanner, open, statement);
    } else if (name === 'script' || name === 'style') {
        result = tagText(scanner, open);
    } else {
        // Consume as regular tag
        result = elementStatement(scanner, open, statement);
    }

    // Wrap result with IF statements
    while (parents.length) {
        const item = parents.pop();
        item.consequent.push(result);
        result = item;
    }

    return result;
}

function getName(tag: ParsedTag): string {
    return tag.name.name;
}
