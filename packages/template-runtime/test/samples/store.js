import { elem, text, updateText, subscribeStore } from '../../src/runtime';

export default function template(host, scope) {
	const target = host.componentView;
	const div = target.appendChild(elem('div'));
	const p = div.appendChild(elem('p'));
	p.appendChild(text('Store value is '));
	scope.text0 = p.appendChild(text(host.store.data.foo));
	subscribeStore(host, ['foo']);
	return updateTemplate;
}

function updateTemplate(host, scope) {
	updateText(scope.text0, host.store.data.foo);
}
