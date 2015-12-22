'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _levelup = require('levelup');

var _levelup2 = _interopRequireDefault(_levelup);

var _levelgraph = require('levelgraph');

var _levelgraph2 = _interopRequireDefault(_levelgraph);

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _edge = require('./edge');

var _edge2 = _interopRequireDefault(_edge);

var _leveldbprops = require('./leveldbprops');

var _leveldbprops2 = _interopRequireDefault(_leveldbprops);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class WGraph {

	constructor(dbFolder) {
		this.db = (0, _levelup2.default)(dbFolder);
		this.graph = (0, _levelgraph2.default)(this.db);
		this.properties = new _leveldbprops2.default(this.db);
		this.graph.db = this.db;
		this.graph.properties = this.properties;
	}

	triplet(subject, predicate, object) {
		return {
			subject: subject || this.graph.v('subject'),
			predicate: predicate || this.graph.v('predicate'),
			object: object || this.graph.v('object')
		};
	}

	triplets() {
		return this.graph.searchStream(this.triplet());
	}

	edge(index, properties) {
		let edge = new _edge2.default(this, index);
		if (properties) edge.props.set(properties);
		return edge;
	}

	edges() {
		let edges = {};
		for (let i in arguments) edges[arguments[i]] = this.edge(arguments[i]);
		return edges;
	}

	_fetch(fn) {
		return this.triplets().on('data', fn);
	}

	count() {
		return new _rsvp2.default.Promise((resolve, reject) => {
			let nbTriplets = 0;
			this._fetch(() => nbTriplets++).on('end', () => {
				resolve(nbTriplets);
			}).on('error', reject);
		});
	}

	clear() {
		return new _rsvp2.default.Promise((resolve, reject) => {
			let nbTriplets = 0;
			this._fetch(triplet => {
				this.graph.del(triplet, err => {
					if (err) return reject(err);
					nbTriplets++;
				});
			}).on('end', () => {
				resolve(nbTriplets);
			}).on('error', reject);
		});
	}

	search() {
		var args = arguments;
		if (args.length === 1 && Array.isArray(args[0])) return this.search.apply(this, args[0]);
		return new _rsvp2.default.Promise((resolve, reject) => {
			let indexes = [];
			for (let i in args) indexes.push(args[i]);
			let search = this.triplet();
			search.filter = triplet => {
				return indexes.indexOf(triplet.subject) > -1;
			};
			this.graph.search(search, (err, triplets) => {
				if (err) return reject(err);
				let loadEdges = triplets.map(triplet => {
					return new _edge2.default(this, triplet.subject).load();
				});
				_rsvp2.default.all(loadEdges).then(edges => {
					if (args.length === 1) return resolve(edges.shift());
					var result = {};
					edges.forEach(edge => result[edge.index] = edge);
					resolve(result);
				}).catch(reject);
			});
		});
	}

	export() {
		return new _rsvp2.default.Promise((resolve, reject) => {
			let nodes = [];
			let edges = [];
			this._fetch(triplet => {
				nodes.push(triplet.subject);
				nodes.push(triplet.object);
				edges.push({
					subject: triplet.subject,
					predicate: triplet.predicate,
					object: triplet.object
				});
			}).on('end', () => {
				nodes = nodes.filter((n, i, arr) => {
					return arr.indexOf(n) === i;
				});
				let nodeProps = nodes.map(node => {
					let nodeNs = _util2.default.format('__props:edge:%s', node);
					return new _leveldbprops2.default(this.db).map(nodeNs);
				});
				let edgeProps = edges.map(edge => {
					let propsNs = _util2.default.format('__props:rel:%s:%s:%s', edge.subject, edge.predicate, edge.object);
					return new _leveldbprops2.default(this.db).map(propsNs);
				});
				let props = { nodes: [], edges: [] };
				_rsvp2.default.all(nodeProps).then(nodeMaps => {
					for (let i in nodeMaps) props.nodes.push(nodeMaps[i]);
				}).then(() => {
					return _rsvp2.default.all(edgeProps);
				}).then(edgeMaps => {
					for (let i in edgeMaps) props.edges.push(edgeMaps[i]);
					resolve({ nodes: nodes, edges: edges, props: props });
				}).catch(reject);
			}).on('error', reject);
		});
	}

}

exports.default = WGraph;
//# sourceMappingURL=wgraph.js.map