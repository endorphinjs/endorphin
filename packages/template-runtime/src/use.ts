import { Component } from './component';

type UseDirectiveFactory = (elem: HTMLElement, param: any, host: Component) => UseDirectiveResult | undefined;

interface UseDirectiveResult {
	update?: (param: any) => void;
	destroy?: () => void;
}

interface UseDirectiveInternal {
	param: any;
	directive?: UseDirectiveResult;
}

export function mountUse(host: Component, elem: HTMLElement, factory: UseDirectiveFactory, param?: any): UseDirectiveInternal {
	return {
		param,
		directive: factory.call(host, elem, param)
	};
}

export function updateUse(data: UseDirectiveInternal, param?: any): void {
	if (param !== data.param && data.directive && data.directive.update) {
		data.directive.update(data.param = param);
	}
}

export function unmountUse(data: UseDirectiveInternal) {
	if (data.directive && data.directive.destroy) {
		data.directive.destroy();
	}
}
