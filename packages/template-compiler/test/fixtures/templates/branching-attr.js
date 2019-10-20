import { appendChild, createInjector, elem, elemWithText, insert, mountBlock, obj, unmountBlock, updateAttribute, updateBlock } from "endorphin";

function setVars$0(host, scope) {
	scope.__choose0 = ((host.props.expr1 === 1) ? 1 : ((host.props.expr1 === 2) ? 2 : 3));
	scope.__case0 = (scope.__choose0 === 1);
	scope.__case2 = (scope.__choose0 === 3);
}

function blockquoteAttrs$0(elem, prev, host, scope) {
	updateAttribute(elem, prev, "a", (scope.__case2 ? 3 : (scope.__case0 ? 1 : undefined)));
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

function chooseEntry$0(host, scope) {
	return [chooseBody$0, chooseBody$1, chooseBody$2][scope.__choose0];
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	setVars$0(host, scope);
	const blockquote$0 = scope.blockquote$0 = appendChild(target$0, elem("blockquote"));
	const inj$0 = createInjector(blockquote$0);
	const attrSet$0 = scope.attrSet$0 = obj();
	blockquoteAttrs$0(blockquote$0, attrSet$0, host, scope);
	insert(inj$0, elemWithText("p", "Lorem ipsum 1"));
	scope.choose$0 = mountBlock(host, inj$0, chooseEntry$0);
	insert(inj$0, elemWithText("p", "Lorem ipsum 2"));
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	setVars$0(host, scope);
	blockquoteAttrs$0(scope.blockquote$0, scope.attrSet$0, host, scope);
	updateBlock(scope.choose$0);
}

function template$0Unmount(scope) {
	scope.choose$0 = unmountBlock(scope.choose$0);
}