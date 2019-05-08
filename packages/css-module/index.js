const { parse, walk, generate } = require('css-tree');

/**
 * @typedef {Object} CSSModuleOptions
 * @property {boolean} sourceMap Generate output with source maps
 * @property {(scope: string) => string} element A function that should return token for scoping single element inside component
 * @property {(scope: string) => string} host A function that should return token for scoping component host
 */

const defaultOptions = {
    /**
     * Returns token for scoping single element inside component
     * @param {string} scope
     * @returns {string}
     */
    element(scope) {
        return `[${scope}]`;
    },

    /**
     * Returns token for scoping component host
     * @param {string} scope
     * @returns {string}
     */
    host(scope) {
        return `[${scope}-host]`;
    }
};

/**
 * Isolates given CSS code with `scope` token
 * @param {string} code CSS source to rewrite
 * @param {string} scope CSS scoping token
 * @param {CSSModuleOptions} [options] Options for CSS Tree parser
 */
module.exports = function rewriteCSS(code, scope, options) {
    options = {
        ...defaultOptions,
        ...options
    };
    const ast = parse(code, options);
    const animations = {};
    let scopeStack = [];

    walk(ast, {
        enter(node, item, list) {
            const scopeMedia = getScopeMedia(node);
            if (scopeMedia === 'local' || scopeMedia === 'global') {
                scopeStack.push(scopeMedia);
            } else if (node.type === 'Selector' && !this.function && !inKeyframe(this)) {
                if (isSlotted(node)) {
                    // Rewrite ::slotted()
                    const slotted = node.children.first();
                    slotted.children.forEach((subSel, subSelItem) => {
                        subSel.children.prependData(raw(`slot[slotted]${options.element(scope)} > `));
                        list.insert(subSelItem, item);
                    });
                    slotted.children.clear();
                    list.remove(item);
                } else {
                    if (last(scopeStack) === 'local') {
                        node.children.prependData(raw(options.host(scope) + ' '));
                    } else if (!scopeStack.includes('global')) {
                        rewriteSelector(node, scope, options);
                    }
                }
            } else if (node.type === 'Identifier' && this.atrulePrelude && isKeyframeRule(this.atrule) && !scopeStack.length) {
                // Rewrite animation definition
                const scopedName = concat(node.name, scope);
                animations[node.name] = scopedName;
                node.name = scopedName;
            }
        },
        leave(node, item, list) {
            const scopeMedia = getScopeMedia(node);
            if (scopeMedia === 'local' || scopeMedia === 'global') {
                scopeStack.pop();
                if (shouldRemoveScopeMedia(node)) {
                    list.insertList(node.block.children, item);
                    list.remove(item);
                } else {
                    rewriteScopeMedia(node);
                }
            }
        }
    });

    // Use second pass to replace locally defined animations with scoped names
    walk(ast, {
        visit: 'Declaration',
        enter(node) {
            if (cssName(node.property) === 'animation' || cssName(node.property) === 'animation-name') {
                walk(node.value, value => {
                    if (value.type === 'Identifier' && value.name in animations) {
                        value.name = animations[value.name];
                    }
                });
            }
        }
    });

    return generate(ast, options);
};

/**
 * Scopes given CSS selector
 * @param {Object} sel
 * @param {string} scope
 * @param {CSSModuleOptions} options
 */
function rewriteSelector(sel, scope, options) {
    // To properly scope CSS selector, we have to rewrite fist and last part of it.
    // E.g. in `.foo .bar. > .baz` we have to scope `.foo` and `.baz` only
    const parts = getParts(sel);
    const localGlobal = [];
    const scopable = parts.filter(part => {
        if (part.type === 'PseudoElementSelector' && (part.name === 'global' || part.name === 'local')) {
            localGlobal.push(part);
            return false;
        }

        return true;
    });
    const first = scopable.shift();
    const last = scopable.pop();

    first && rewriteSelectorPart(sel, first, scope, options);
    last && rewriteSelectorPart(sel, last, scope, options);

    while (localGlobal.length) {
        rewriteSelectorPart(sel, localGlobal.pop(), scope, options);
    }
}

/**
 * Scopes given CSS selector fragment, if possible.
 * Returns either rewritten or the same node
 * @param {List} selector
 * @param {Object} item
 * @param {string} scope
 * @param {CSSModuleOptions} options
 * @returns {boolean}
 */
function rewriteSelectorPart(selector, item, scope, options) {
    const part = item.data;
    const list = selector.children;

    if (part.type === 'PseudoClassSelector') {
        if (part.name === 'host') {
            // :host(<sel>)
            list.insertData(raw(options.host(scope)), item);
            if (part.children) {
                list.replace(item, part.children);
            } else {
                list.remove(item);
            }
        } else if (part.name === 'host-context') {
            // :host-context(<sel>)
            if (part.children) {
                list.insertList(part.children, item);
            }
            list.insertData(raw(` ${options.host(scope)}`), item);
            list.remove(item);
        }
    } else if (part.type === 'PseudoElementSelector' && part.children) {
        if (part.name === 'global') {
            // TODO properly handle multiple selectors
            part.children.forEach((subSel, subSelItem) => {
                list.insert(subSelItem, item);
            });
            list.remove(item);
        } else if (part.name === 'local') {
            // TODO properly handle multiple selectors
            part.children.forEach((subSel, subSelItem) => {
                list.insertData(raw(options.host(scope) + ' '), item);
                list.insert(subSelItem, item);
            });
            list.remove(item);
        }
    } else if (part.type === 'TypeSelector') {
        list.insertData(raw(options.element(scope)), item.next);
    } else if (part.type === 'IdSelector' || part.type === 'ClassSelector' || part.type === 'AttributeSelector') {
        list.insertData(raw(options.element(scope)), item);
    }
}

/**
 * Creates raw token with given value
 * @param {string} value
 */
function raw(value) {
    return { type: 'Raw', value };
}

/**
 * Concatenates two strings with optional separator
 * @param {string} name
 * @param {string} suffix
 */
function concat(name, suffix) {
    const sep = suffix[0] === '_' || suffix[0] === '-' ? '' : '-';
    return name + sep + suffix;
}

/**
 * Returns list of child items where selector part starts
 * @param {AstNode} sel
 * @returns {object[]}
 */
function getParts(sel) {
    const result = [];
    let part = null;
    sel.children.forEach((child, listItem) => {
        if (child.type === 'Combinator' || child.type === 'WhiteSpace') {
            part = null;
        } else if (!part) {
            result.push(part = listItem);
        }
    });

    return result;
}

/**
 * Check if given `@media` rule is a scoping container (global or local)
 * @param {Object} rule
 * @returns {string} Name of scope media
 */
function getScopeMedia(rule) {
    let mediaName = null;
    if (rule.type === 'Atrule' && rule.name === 'media' && rule.prelude && rule.prelude.children && rule.prelude.children.getSize() === 1) {
        const mqList = rule.prelude.children.first();
        if (mqList.children) {
            mqList.children.some(mq => {
                return mq.children.some(token => {
                    if (isScopeMediaId(token)) {
                        return mediaName = token.name;
                    }
                });
            });
        }
    }

    return mediaName;
}

/**
 * Check if given scope media at-rule should be removed
 * @param {object} rule
 * @returns {boolean}
 */
function shouldRemoveScopeMedia(rule) {
    const mqList = rule.prelude.children.first();
    if (mqList.children) {
        const mq = mqList.children.first();
        return mq.children && mq.children.getSize() === 1;
    }
}

function rewriteScopeMedia(rule) {
    const mqList = rule.prelude.children.first();

    mqList.children.forEach(mq => {
        let accumulate = false;
        const toRemove = [];
        mq.children.forEach((token, item) => {
            if (accumulate) {
                toRemove.push(item);
                if (token.type === 'Identifier' && token.name === 'and') {
                    accumulate = false;
                }
            } else if (isScopeMediaId(token)) {
                toRemove.push(item);
                accumulate = true;
            }
        });

        while (toRemove.length) {
            mq.children.remove(toRemove.pop());
        }
    });
}

/**
 * Check if given token is a scope media identifier
 * @param {CssNodeCommon} token
 */
function isScopeMediaId(token) {
    return token.type === 'Identifier' && (token.name === 'local' || token.name === 'global');
}

/**
 * Check if context is in keyframe
 * @param {import('css-tree').WalkContext} ctx
 * @returns {boolean}
 */
function inKeyframe(ctx) {
    return isKeyframeRule(ctx.atrule);
}

/**
 * Check if given selector is slotted
 * @param {import('css-tree').Selector} sel
 * @returns {boolean}
 */
function isSlotted(sel) {
    const first = sel.children.first();
    return first && first.type === 'PseudoElementSelector' && first.name === 'slotted';
}

/**
 * Returns last item in array
 * @param {Array} arr
 * @return {*}
 */
function last(arr) {
    return arr.length ? arr[arr.length - 1] : void 0;
}

/**
 *
 * @param {import('css-tree').Atrule} atrule
 */
function isKeyframeRule(atrule) {
    const name = atrule && atrule.name || '';
    return cssName(name) === 'keyframes';

}

/**
 * Returns clean CSS name: removes any vendor prefixes from given name
 * @param {string} propName
 * @returns {string}
 */
function cssName(propName) {
    return propName.replace(/^-\w+-/, '');
}
