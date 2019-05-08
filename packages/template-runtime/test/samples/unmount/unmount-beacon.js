export const mounted = [];

export function willMount(host) {
	mounted.push(host.props.id);
}

export function willUnmount(host) {
	const ix = mounted.indexOf(host.props.id);
	if (ix !== -1) {
		mounted.splice(ix, 1);
	}
}
