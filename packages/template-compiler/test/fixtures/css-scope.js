import { elemWithText } from "endorphin";
export const cssScope = "scope123";

export default function template$0(host) {
	const target$0 = host.componentView;
	target$0.appendChild(elemWithText("h1", "Hello world", cssScope));
}