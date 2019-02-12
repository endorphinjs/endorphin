import { createComponent, mountComponent } from '@endorphinjs/template-runtime';

export * from '@endorphinjs/template-runtime';

/**
 * @typedef {import('@endorphinjs/template-runtime/types').ComponentDefinition} ComponentDefinition
 * @typedef {import('@endorphinjs/template-runtime/types').Component} Component
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {HTMLElement} [target] Parent element where created component should be mounted
 * @property {Object} [props] Initial component props
 * @property {import('@endorphinjs/template-runtime').Store} [store] Store for component
 */

/**
 * Creates Endorphin component and mounts it into given `options.target` container
 * @param {String} name Name of DOM element for created component
 * @param {ComponentDefinition} definition Component definition
 * @param {ComponentOptions} [options] Options for component mount
 * @returns {Component}
 */
export default function endorphin(name, definition, options = {}) {
	const component = createComponent(name, definition, options.target);

	if (options.store) {
		component.store = options.store;
	}

	if (options.target) {
		options.target.appendChild(component);
	}

	mountComponent(component, options.props);
	return component;
}

