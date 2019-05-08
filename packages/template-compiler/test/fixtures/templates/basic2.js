import { elemWithText, elem, text, updateText, addDisposeCallback } from "endorphin";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	target$0.appendChild(elemWithText("h1", "Hello world"));
	const p$0 = target$0.appendChild(elem("p"));
	p$0.setAttribute("title", "test");
	p$0.appendChild(text("foo "));
	scope.text$1 = p$0.appendChild(text(host.props.bar));
	p$0.appendChild(text(" baz"));
	addDisposeCallback(host, template$0Unmount);
	return template$0Update;
}

function template$0Update(host, scope) {
	updateText(scope.text$1, host.props.bar);
}

function template$0Unmount(scope) {
	scope.text$1 = null;
}