import { appendChild, elemWithText } from "endorphin";
export * from "%definition";

export default function template$0(host) {
	const target$0 = host.componentView;
	appendChild(target$0, elemWithText("h1", "Hello world"));
}