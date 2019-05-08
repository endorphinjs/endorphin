export default class ElementShim {
	childNodes: ElementShim[] = [];

	appendChild(item: ElementShim): ElementShim {
		this._remove(item);
		this.childNodes.push(item);
		return item;
	}

	insertBefore(newNode: ElementShim, refNode: ElementShim): ElementShim {
		if (this.childNodes.indexOf(refNode) === -1) {
			throw new Error('refNode is not a child node');
		}

		this._remove(newNode);
		const ix = this.childNodes.indexOf(refNode);
		this.childNodes.splice(ix, 0, newNode);
		return newNode;
	}

	removeChild(node: ElementShim) {
		const ix = this.childNodes.indexOf(node);
		if (ix === -1) {
			throw new Error('Node is not a child');
		}

		this.childNodes.splice(ix, 1);
	}

	_remove(node: ElementShim) {
		const ix = this.childNodes.indexOf(node);
		if (ix !== -1) {
			this.childNodes.splice(ix, 1);
		}
	}
}
