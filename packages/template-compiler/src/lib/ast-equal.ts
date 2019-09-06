import {
    Literal, Expression, Identifier, ArrowFunctionExpression, BlockStatement,
    Pattern, AssignmentPattern, ObjectPattern, Property, ArrayPattern, SpreadElement,
    RestElement, ArrayExpression, ObjectExpression, BaseExpression, CallExpression,
    MemberExpression, ConditionalExpression, RegExpLiteral, SequenceExpression, UnaryExpression,
    ExpressionStatement, ReturnStatement, Statement, TemplateLiteral, TemplateElement, TaggedTemplateExpression
} from '@endorphinjs/template-parser';

type VisitorNode = Expression | BlockStatement | Pattern | Property | RestElement
    | Statement | BaseExpression | ExpressionStatement | TemplateElement | TaggedTemplateExpression;
type Visitor<T = VisitorNode> = (n1: T, n2: T) => boolean;
interface VisitorMap {
    [name: string]: Visitor;
}

/**
 * Check if two given AST nodes are equal, e.g. has the same value
 */
export default function equal(n1: VisitorNode, n2: VisitorNode): boolean {
    if (n1.type !== n2.type) {
        return false;
    }

    const visitor = visitors[n1.type];
    return visitor ? visitor(n1, n2) : false;
}

function BaseExpression(n1: BaseExpression, n2: BaseExpression) {
    return n1.operator === n2.operator
        && equal(n1.left, n2.left)
        && equal(n1.right, n2.right);
}

function UnaryExpression(n1: UnaryExpression, n2: UnaryExpression) {
    return n1.prefix === n2.prefix
        && n1.operator === n2.operator
        && equal(n1.argument, n2.argument);
}

function arrEqual(n1: VisitorNode[], n2: VisitorNode[]): boolean {
    if (n1.length === n2.length) {
        for (let i = 0; i < n1.length; i++) {
            if (!equal(n1[i], n2[i])) {
                return false;
            }
        }

        return true;
    }

    return false;
}

const visitors: VisitorMap = {
    Literal(n1: Literal, n2: Literal) {
        return n1.value === n2.value;
    },
    Identifier(n1: Identifier, n2: Identifier) {
        return n1.name === n2.name && n1.context === n2.context;
    },
    ThisExpression() {
        return true;
    },
    ArrowFunctionExpression(n1: ArrowFunctionExpression, n2: ArrowFunctionExpression) {
        return arrEqual(n1.params, n2.params) && equal(n1.body, n2.body);
    },
    AssignmentPattern(n1: AssignmentPattern, n2: AssignmentPattern) {
        return equal(n1.left, n2.left) && equal(n1.right, n2.right);
    },
    ObjectPattern(n1: ObjectPattern, n2: ObjectPattern) {
        return arrEqual(n1.properties, n2.properties);
    },
    ArrayPattern(n1: ArrayPattern, n2: ArrayPattern) {
        return arrEqual(n1.elements, n2.elements);
    },
    SpreadElement(n1: SpreadElement, n2: SpreadElement) {
        return equal(n1.argument, n2.argument);
    },
    RestElement(n1: RestElement, n2: RestElement) {
        return equal(n1.argument, n2.argument);
    },
    ArrayExpression(n1: ArrayExpression, n2: ArrayExpression) {
        return arrEqual(n1.elements, n2.elements);
    },
    ObjectExpression(n1: ObjectExpression, n2: ObjectExpression) {
        return arrEqual(n1.properties, n2.properties);
    },
    Property(n1: Property, n2: Property) {
        return n1.kind === n2.kind
            && n1.computed === n2.computed
            && n1.method === n2.method
            && n1.shorthand === n2.shorthand
            && equal(n1.key, n2.key)
            && equal(n1.value, n2.value);
    },
    AssignmentExpression: BaseExpression,
    BinaryExpression: BaseExpression,
    LogicalExpression: BaseExpression,
    CallExpression(n1: CallExpression, n2: CallExpression) {
        return equal(n1.callee, n2.callee) && arrEqual(n1.arguments, n2.arguments);
    },
    MemberExpression(n1: MemberExpression, n2: MemberExpression) {
        return n1.computed === n2.computed
            && equal(n1.object, n2.object)
            && equal(n1.property, n2.property);
    },
    ConditionalExpression(n1: ConditionalExpression, n2: ConditionalExpression) {
        return equal(n1.test, n2.test)
            && equal(n1.consequent, n2.consequent)
            && equal(n1.alternate, n2.alternate);
    },
    RegExpLiteral(n1: RegExpLiteral, n2: RegExpLiteral) {
        return n1.regex.flags === n2.regex.flags
            && n1.regex.pattern === n2.regex.pattern;
    },
    SequenceExpression(n1: SequenceExpression, n2: SequenceExpression) {
        return arrEqual(n1.expressions, n2.expressions);
    },
    UnaryExpression,
    UpdateExpression: UnaryExpression,
    ExpressionStatement(n1: ExpressionStatement, n2: ExpressionStatement) {
        return equal(n1.expression, n2.expression);
    },
    EmptyStatement() {
        return true;
    },
    ReturnStatement(n1: ReturnStatement, n2: ReturnStatement) {
        return n1.argument === n2.argument
            || (n1.argument && n2.argument && equal(n1.argument, n2.argument));
    },
    BlockStatement(n1: BlockStatement, n2: BlockStatement) {
        return arrEqual(n1.body, n2.body);
    },
    TemplateLiteral(n1: TemplateLiteral, n2: TemplateLiteral) {
        return arrEqual(n1.quasis, n2.quasis)
            && arrEqual(n1.expressions, n2.expressions);
    },
    TaggedTemplateExpression(n1: TaggedTemplateExpression, n2: TaggedTemplateExpression) {
        return equal(n1.tag, n2.tag)
            && equal(n1.quasi, n2.quasi);
    },
    TemplateElement(n1: TemplateElement, n2: TemplateElement) {
        return n1.tail === n2.tail
            && n1.value.cooked === n1.value.cooked
            && n1.value.raw === n2.value.raw;
    }
};
