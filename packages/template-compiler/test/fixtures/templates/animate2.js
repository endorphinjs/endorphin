import { animate, createInjector, domRemove, elem, elemWithText, finalizeAttributes, insert, mountBlock, setAttribute, unmountBlock, updateBlock } from "endorphin";

function ifBody$1(host, injector) {
	insert(injector, elemWithText("p", "Something 1"));
}

function ifEntry$1(host) {
	if (host.state.something) {
		return ifBody$1;
	}
}

function animatedDiv$0(host, injector, scope) {
	const div$0 = scope.div$0 = insert(injector, elem("div"));
	const inj$2 = createInjector(div$0);
	div$0.setAttribute("class", "css-anim");
	const div$1 = insert(inj$2, elemWithText("div", "CSS Animation"));
	const inj$1 = scope.inj$1 = createInjector(div$1);
	setAttribute(inj$1, "title", host.state.title);
	finalizeAttributes(inj$1);
	scope.if$1 = mountBlock(host, inj$2, ifEntry$1);
}

function animatedDiv$0Update(host, injector, scope) {
	const { inj$1 } = scope;
	setAttribute(inj$1, "title", host.state.title);
	finalizeAttributes(inj$1);
	updateBlock(scope.if$1);
}

function animatedDiv$0Unmount(scope) {
	scope.if$1 = unmountBlock(scope.if$1);
	scope.div$0 = domRemove(scope.div$0);
	scope.inj$1 = null;
}

function ifBody$2(host, injector) {
	insert(injector, elemWithText("p", "Something 2"));
}

function ifEntry$2(host) {
	if (host.state.something) {
		return ifBody$2;
	}
}

function ifBody$0(host, injector, scope) {
	scope.div$0 ? animatedDiv$0Update(host, injector, scope) : animatedDiv$0(host, injector, scope);
	animate(scope.div$0, "show 2s");
	const div$2 = insert(injector, elemWithText("div", "CSS static"));
	div$2.setAttribute("class", "css-static");
	scope.if$2 = mountBlock(host, injector, ifEntry$2);
	return ifBody$0Update;
}

ifBody$0.dispose = ifBody$0Unmount;

function ifBody$0Update(host, injector, scope) {
	animatedDiv$0Update(host, injector, scope);
	updateBlock(scope.if$2);
}

function ifBody$0Unmount(scope, host) {
	animate(scope.div$0, "hide 2s", () => animatedDiv$0Unmount(scope, host));
	scope.if$2 = unmountBlock(scope.if$2);
}

function ifEntry$0(host) {
	if (host.state.css) {
		return ifBody$0;
	}
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const inj$0 = createInjector(target$0);
	scope.if$0 = mountBlock(host, inj$0, ifEntry$0);
	return template$0Update;
}

template$0.dispose = template$0Unmount;

function template$0Update(host, scope) {
	updateBlock(scope.if$0);
}

function template$0Unmount(scope) {
	scope.if$0 = unmountBlock(scope.if$0);
}