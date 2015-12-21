"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

class NsProperties {
	constructor(ns, properties) {
		this.ns = ns;
		this.properties = properties;
	}
	_argsNs(args) {
		let nsArgs = [this.ns];
		for (let i in args) nsArgs.push(args[i]);
		return nsArgs;
	}
	map() {
		return this.properties.map(this.ns);
	}
	count() {
		return this.properties.count(this.ns);
	}
	get(index) {
		return this.properties.get(this.ns, index);
	}
	set() {
		return this.properties.set.apply(this.properties, this._argsNs(arguments));
	}
	del(index) {
		return this.properties.del(this.ns, index);
	}
	clear() {
		return this.properties.clear(this.ns);
	}
}

exports.default = NsProperties;
//# sourceMappingURL=nsprops.js.map