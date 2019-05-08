import { elemWithText } from '../../../src/runtime';

/**
 * @param {Component} component
 */
export default function subComponent2Template(component) {
	const target = component.componentView;

	target.appendChild(elemWithText('p', 'sub-component 1'));
}
