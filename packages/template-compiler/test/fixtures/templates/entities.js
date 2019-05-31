import { elemWithText } from "endorphin";

export default function template$0(host) {
	const target$0 = host.componentView;
	const p$0 = target$0.appendChild(elemWithText("p", "Hello {world}!"));
	p$0.setAttribute("title", "<p>");
}