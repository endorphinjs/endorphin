import {
    AssignmentExpression, BlockStatement, FunctionDeclaration, Expression, Literal,
    BinaryExpression, ReturnStatement, Statement
} from '@endorphinjs/template-parser';
import { identifier, literal } from '../lib/ast-constructor';

export default class SSROutput {
    private root: FunctionDeclaration;
    private block: BlockStatement;
    private node: AssignmentExpression | null = null;
    private outVar = identifier('out');

    constructor(name: string) {
        // Create function AST node
        this.block = {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                id: this.outVar,
                init: literal('')
            }]
        };

        this.root = {
            type: 'FunctionDeclaration',
            id: identifier(name),
            params: [identifier('props')],
            body: this.block
        };
    }

    /**
     * Runs given `callback` in context of `block`. All output content will be added
     * into accumulator inside `block`
     */
    run(statement: Statement, block: BlockStatement, callback: () => void) {
        const prevBlock = this.block;
        prevBlock.body.push(statement);
        this.block = block;
        this.node = null;
        callback();
        this.block = prevBlock;
    }

    /**
     * Pushes given value into output
     */
    out(value: string | Expression) {
        const node = typeof value === 'string' ? literal(value) : value;

        if (!this.node) {
            // No output node yet, create it
            this.node = {
                type: 'AssignmentExpression',
                left: this.outVar,
                operator: '+=',
                right: node
            };
            this.block.body.push({
                type: 'ExpressionStatement',
                expression: this.node
            });
        } else {
            // Modify expression and add given value to it
            let target: Literal | null = null;
            if (isString(node)) {
                if (isString(this.node.right)) {
                    target = this.node.right;
                    // this.node.right.value += node.value as string;
                } else if (this.node.right.type === 'BinaryExpression' && isString(this.node.right.right)) {
                    target = this.node.right.right;
                }
            }

            // We can merge two strings into a single token
            if (target) {
                target.value += (node as Literal).value as string;
            } else {
                this.node.right = {
                    type: 'BinaryExpression',
                    left: this.node.right,
                    operator: '+',
                    right: node
                } as BinaryExpression;
            }
        }
    }

    finalize() {
        (this.root.body as BlockStatement).body.push({
            argument: this.outVar
        } as ReturnStatement);
        return this.root;
    }
}

function isString(node: Expression): node is Literal {
    return node.type === 'Literal' && typeof node.value === 'string';
}
