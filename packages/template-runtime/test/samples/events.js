import {
	createInjector, elem, getProp, addEvent, finalizeEvents
} from '../../src/runtime';

export default function template(host, scope) {
	const target = host.componentView;
	const elem1 = target.appendChild(elem('main'));
	const injector = scope.injector = createInjector(elem1);
	addEvent(injector, 'click', onClick1, host, scope);
	ifEvent(host, injector, scope);
	finalizeEvents(injector);
	return updateTemplate;
}

function updateTemplate(host, scope) {
	addEvent(scope.injector, 'click', onClick1, host, scope);
	ifEvent(host, scope.injector, scope);
	finalizeEvents(scope.injector);
}

function ifEvent(host, injector, scope) {
	if (getProp(host, 'c1')) {
		addEvent(injector, 'click', onClick2, host, scope);
	}
}

function onClick1(evt) {
	this.host.componentModel.definition.method1(this.host.props.foo, this.host.props.bar, this.host, evt, this.target);
}

function onClick2(evt) {
	this.host.componentModel.definition.method2(this.host.props.foo, this.host.props.bar, this.host, evt, this.target);
}
