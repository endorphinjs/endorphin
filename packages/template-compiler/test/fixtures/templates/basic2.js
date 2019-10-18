import { appendChild, elem, elemWithText, setAttribute, text, updateText } from "endorphin";

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	appendChild(target$0, elemWithText("h1", "Hello world"));
	const p$0 = appendChild(target$0, elem("p"));
	setAttribute(p$0, "title", "test");
	appendChild(p$0, text("foo "));
	scope.text$1 = appendChild(p$0, text(host.props.bar));
	appendChild(p$0, text(" baz"));
	return template$0Update;
}

function template$0Update(host, scope) {
	updateText(scope.text$1, host.props.bar);
}