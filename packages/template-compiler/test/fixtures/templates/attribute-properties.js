import { appendChild, elem, obj, setAttribute, text, updateAttribute, updateProperty } from "endorphin";

function pAttrs$0(elem, prev, host) {
	updateAttribute(elem, prev, "title", host.props.title);
}

function audioAttrs$0(elem, prev, host) {
	updateProperty(elem, prev, "srcObject", host.props.stream);
}

function inputAttrs$0(elem, prev, host) {
	updateProperty(elem, prev, "checked", host.props.enabled);
	updateProperty(elem, prev, "value", host.props.title);
}

export default function template$0(host, scope) {
	const target$0 = host.componentView;
	const p$0 = scope.p$0 = appendChild(target$0, elem("p"));
	const attrSet$0 = scope.attrSet$0 = obj();
	p$0.hidden = true;
	setAttribute(p$0, "muted", "");
	pAttrs$0(p$0, attrSet$0, host);
	appendChild(target$0, text(""));
	const audio$0 = scope.audio$0 = appendChild(target$0, elem("audio"));
	const attrSet$1 = scope.attrSet$1 = obj();
	audio$0.muted = true;
	audioAttrs$0(audio$0, attrSet$1, host);
	const input$0 = scope.input$0 = appendChild(target$0, elem("input"));
	const attrSet$2 = scope.attrSet$2 = obj();
	setAttribute(input$0, "type", "radio");
	inputAttrs$0(input$0, attrSet$2, host);
	return template$0Update;
}

function template$0Update(host, scope) {
	pAttrs$0(scope.p$0, scope.attrSet$0, host);
	audioAttrs$0(scope.audio$0, scope.attrSet$1, host);
	inputAttrs$0(scope.input$0, scope.attrSet$2, host);
}