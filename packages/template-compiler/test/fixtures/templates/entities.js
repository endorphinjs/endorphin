import { appendChild, elemWithText, setAttribute } from "endorphin";

export default function template$0(host) {
	const target$0 = host.componentView;
	const p$0 = appendChild(target$0, elemWithText("p", "Hello {world}!"));
	setAttribute(p$0, "title", "<p>");
}