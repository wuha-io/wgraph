
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

	edge(index) { return new Edge(this, index) }

	edges(indexes) { 
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

}

export default WGraph
