'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _nsprops = require('./nsprops');

var _nsprops2 = _interopRequireDefault(_nsprops);

var _edge = require('./edge');

var _edge2 = _interopRequireDefault(_edge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const SELF_PREDICATE = '_self';

class Node {

	constructor(graph, index) {
		this.graph = graph;
		this.index = index;
		this.props = new _nsprops2.default('__props:node:' + index, graph.properties);
		this.edges = {};
	}

	load() {
		return new _rsvp2.default.Promise((resolve, reject) => {
			this.graph.graph.search(this.graph.triplet(this.index), (err, triplets) => {
				if (err) return reject(err);
				triplets.forEach(triplet => {
					if (triplet.predicate === SELF_PREDICATE) return;
					let edge = new _edge2.default(this, triplet.predicate, new Node(this, triplet.object));
					this.edges[triplet.predicate + ':' + triplet.object] = edge;
				});
				resolve(this);
			});
		});
	}

	_triplets(includeSelf) {
		let triplets = [];
		if (includeSelf || !Object.keys(this.edges).length) triplets.push(this.graph.triplet(this.index, SELF_PREDICATE, this.index));
		for (let i in this.edges) {
			triplets.push(this.graph.triplet(this.index, this.edges[i].predicate, this.edges[i].object.index));
		}
		return triplets;
	}

	save() {
		return new _rsvp2.default.Promise((resolve, reject) => {
			this.graph.graph.put(this._triplets(), err => {
				if (err) return reject(err);
				resolve(this);
			});
		});
	}

	standalone() {
		return !Object.keys(this.edges).length;
	}

	rel(predicate, node, properties) {
		let edge = new _edge2.default(this, predicate, node);
		this.edges[predicate + ':' + node.index] = edge;
		if (properties) edge.props.set(properties);
		return edge;
	}

	del() {
		return new _rsvp2.default.Promise((resolve, reject) => {
			return this.load().then(() => {
				let q = [];
				for (let i in this.edges) q.push(this.edges[i].del());
				q.push(this.props.clear());
				return _rsvp2.default.all(q).then(() => {
					let tripletsTodel = this._triplets(true);
					this.graph.graph.del(tripletsTodel, err => {
						if (err) return reject(err);
						resolve(tripletsTodel.length);
					});
				});
			});
		});
	}

	toString() {
		let str = 'Node[' + this.index;
		for (let i in this.edges) str += '\n  ' + this.edges[i].toString();
		str += '\n]';
		return str;
	}

}

Node.SELF_PREDICATE = SELF_PREDICATE;

exports.default = Node;
//# sourceMappingURL=node.js.map