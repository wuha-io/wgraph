
import util from 'util'
import levelup from 'levelup'
import levelgraph from 'levelgraph'
import rsvp from 'rsvp'

import Edge from './edge'
import LevelDbProperties from './leveldbprops'

class WGraph {

	constructor(dbFolder) {
		this.db = levelup(dbFolder)
		this.graph = levelgraph(this.db)
		this.properties = new LevelDbProperties(this.db)
		this.graph.db = this.db
		this.graph.properties = this.properties
	}

	triplet(subject, predicate, object) {
		return {
			subject: subject || this.graph.v('subject'),
			predicate: predicate || this.graph.v('predicate'),
			object: object || this.graph.v('object')
		}
	}

	triplets() { return this.graph.searchStream(this.triplet()) }

	edge(index, properties) { 
		let edge = new Edge(this, index)
		if (properties) edge.props.set(properties)
		return edge
	}

	edges() { 
		let edges = {}
		for (let i in arguments) 
			edges[arguments[i]] = this.edge(arguments[i])
		return edges
	}

	_fetch(fn) { return this.triplets().on('data', fn) }

	count() {
		return new rsvp.Promise((resolve, reject) => {
			let nbTriplets = 0
			this._fetch(() => nbTriplets++)
				.on('end', () => { resolve(nbTriplets) })
				.on('error', reject)
		})
	}

	clear() {
		return new rsvp.Promise((resolve, reject) => {
			let nbTriplets = 0
			this._fetch(triplet => {
				this.graph.del(triplet, err => {
	  			if (err) return reject(err)
	  			nbTriplets++
	  		})
			}).on('end', () => { resolve(nbTriplets) })
				.on('error', reject)
		})
	}

	search() {
		var args = arguments
		if (args.length === 1 && Array.isArray(args[0]))
			return this.search.apply(this, args[0])
		return new rsvp.Promise((resolve, reject) => {
			let indexes = []
			for (let i in args) indexes.push(args[i])
			let search = this.triplet()
			search.filter = triplet => {
				return indexes.indexOf(triplet.subject) > -1
			}
			this.graph.search(search, (err, triplets) => {
				if (err) return reject(err)
				let loadEdges = triplets.map(triplet => {
					return new Edge(this, triplet.subject).load()
				})
				rsvp.all(loadEdges).then(edges => {
					if (args.length === 1) return resolve(edges.shift())
					var result = {}
					edges.forEach(edge => result[edge.index] = edge)
					resolve(result)
				}).catch(reject)
			})
		})
	}

	export() {
		return new rsvp.Promise((resolve, reject) => {
			let nodes = []
			let edges = []
			this._fetch(triplet => {
				nodes.push(triplet.subject)
				nodes.push(triplet.object)
				edges.push({
					subject: triplet.subject, 
					predicate: triplet.predicate, 
					object: triplet.object
				})
			}).on('end', () => { 
				nodes = nodes.filter((n, i, arr) => { return arr.indexOf(n) === i })
				let nodeProps = nodes.map(node => {
					let nodeNs = util.format('__props:edge:%s', node)
					return new LevelDbProperties(this.db).map(nodeNs)
				})
				let edgeProps = edges.map(edge => {
					let propsNs = util.format('__props:rel:%s:%s:%s', edge.subject, edge.predicate, edge.object)
					return new LevelDbProperties(this.db).map(propsNs)
				})
				let props = {nodes: [], edges: []}
				rsvp.all(nodeProps).then(nodeMaps => {
					for (let i in nodeMaps) props.nodes.push(nodeMaps[i])
				}).then(() => { return rsvp.all(edgeProps) })
				.then(edgeMaps => {
					for (let i in edgeMaps) props.edges.push(edgeMaps[i])
					resolve({nodes: nodes, edges: edges, props: props})
				}).catch(reject)
			}).on('error', reject)
		})
	}

}

export default WGraph
