import { ok, deepStrictEqual } from 'assert';
import _parse, { ENDTemplate, ENDElement } from '@endorphinjs/template-parser';
import ElementStats from '../src/lib/ElementStats';

function parse(code: string): ENDTemplate {
    const ast = _parse(code);
    return ast.body.find(node => node.type === 'ENDTemplate') as ENDTemplate;
}

function stats(code: string | ENDTemplate | ENDElement) {
    if (typeof code === 'string') {
        code = parse(code).body[0] as ENDElement;
    }

    return new ElementStats(code);
}

describe('Element stats', () => {
    it('detect static content', () => {
        ok(stats(`<template>
            <div></div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div>text</div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div>{ text }</div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div>
                <span></span>
            </div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div>
                <span>text</span>
            </div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div foo={bar}></div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div foo={bar}>
                <e:attribute foo="baz" />
            </div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div foo={bar}>
                <e:attribute foo="baz" e:if={cond} />
            </div>
        </template>`).isStaticContent);

        ok(stats(`<template>
            <div foo={bar}>
                <e:if test={cond1}>
                    <e:for-each select={items}>
                        <e:attribute foo="baz" />
                    </e:for-each>
                </e:if>
            </div>
        </template>`).isStaticContent);
    });

    it('detect non-static content', () => {
        ok(!stats(`<template>
            <div>
                <span e:if={cond}></span>
            </div>
        </template>`).isStaticContent);

        ok(!stats(`<template>
            <div>
                <e:if test={cond}>
                    text
                </e:if>
            </div>
        </template>`).isStaticContent);

        ok(!stats(`<template>
            <div>
                <e:if test={cond}>
                    <e:for-each select={items}>text</e:for-each>
                </e:if>
            </div>
        </template>`).isStaticContent);

        const s = stats(`<template>
            <div>
                <partial:button/>
            </div>
        </template>`);
        ok(!s.isStaticContent);
        ok(s.hasPartials);
    });

    it('collect attribute stats', () => {
        let s = stats(`<template>
            <div a="1" b={foo}>
                <e:attribute a=2 c={bar} />
            </div>
        </template>`);

        deepStrictEqual(s.attributeNames(), ['a', 'b', 'c']);
        ok(!s.hasDynamicAttributes());
        ok(s.isStaticContent);

        s = stats(`<template>
            <div a="1" b={foo}>
                <e:attribute a=2 c={bar} e:if={cond} />
                <e:if test={cond2}>
                    <e:for-each select={items}>
                        <e:attribute d=3 e={baz}/>
                    </e:for-each>
                </e:if>
            </div>
        </template>`);

        deepStrictEqual(s.attributeNames(), ['a', 'b', 'c', 'd', 'e']);
        ok(s.hasDynamicAttributes());
        ok(s.isStaticContent);
    });
});
