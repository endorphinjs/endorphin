import { createComponent, mountComponent } from '@endorphinjs/template-runtime';

/**
 * @typedef {import('@endorphinjs/template-runtime/types').ComponentDefinition} ComponentDefinition
 * @typedef {import('@endorphinjs/template-runtime/types').Component} Component
 */

/**
 * Creates Endorphin component and mounts it into given `target` container
 * @param {String} name Name of DOM element for created component
 * @param {ComponentDefinition} definition Component definition
 * @param {HTMLElement} [target] Where to mount created component
 * @param {Object} [initialProps] Initial component properties
 * @returns {Component}
 */
export default function endorphin(name, definition, target, initialProps) {
	const component = createComponent(name, definition, target);
	if (target) {
		target.appendChild(target);
	}
	mountComponent(component, initialProps);
	return component;
}

