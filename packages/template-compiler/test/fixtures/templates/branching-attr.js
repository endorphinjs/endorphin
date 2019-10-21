import { appendChild, createInjector, elem, elemWithText, insert, mountBlock, obj, unmountBlock, updateAttribute, updateBlock } from "endorphin";
let __chooseExpr, __caseExpr, __caseExpr_2;

function setVars$0(host) {
	__chooseExpr = ((host.props.expr1 === 1) ? 1 : ((host.props.expr1 === 2) ? 2 : 3));
	__caseExpr = (__chooseExpr === 1);
	__caseExpr_2 = (__chooseExpr === 3);
}

function blockquoteAttrs$0(elem, prev) {
	updateAttribute(elem, prev, "a", (__caseExpr_2 ? 3 : (__caseExpr ? 1 : undefined)));
}

function chooseBody$0(host, injector) {
	insert(injector, elemWithText("div", "sub 1"));
}

function chooseBody$1(host, injector) {
	insert(injector, elemWithText("div", "sub 2"));
}

function chooseBody$2(host, injector) {
	insert(injector, elemWithText("div", "sub 3"));
}

function chooseEntry$0() {
	return [chooseBody$0, chooseBody$1, chooseBody$2][__chooseExpr];
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host);
	const blockquote$0 = scope.blockquote$0 = appendChild(target$0, elem("blockquote"));
	const inj$0 = createInjector(blockquote$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	blockquoteAttrs$0(blockquote$0, attrSet$0);
	insert(inj$0, elemWithText("p", "Lorem ipsum 1"));
	scope.choose$0 = mountBlock(host, inj$0, chooseEntry$0);
	insert(inj$0, elemWithText("p", "Lorem ipsum 2"));
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	setVars$0(host);
	blockquoteAttrs$0(scope.blockquote$0, scope.attrSet$0);
	updateBlock(scope.choose$0);
}

function template$0Unmount(scope) {
	scope.choose$0 = unmountBlock(scope.choose$0);
}