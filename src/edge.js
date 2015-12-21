
import rsvp from 'rsvp'

import NsProperties from './nsprops'
import Relation from './relation'

const SELF_PREDICATE = '_self'

class Edge {

	constructor(graph, index) {
		this.graph = graph
		this.index = index
		this.props = new NsProperties('__props:edge:' + index, graph.properties)
		this.relations = {}
	}

	load() {
		return new rsvp.Promise((resolve, reject) => {
			this.graph.graph.search(this.graph.triplet(this.index), (err, triplets) => {
				if (err) return reject(err)
				triplets.forEach(triplet => {
					if (triplet.predicate === SELF_PREDICATE) return
					let rel = new Relation(this, triplet.predicate, new Edge(this, triplet.object))
					this.relations[triplet.predicate + ':' + triplet.object] = rel
				})
				resolve(this)
			})
		})
	}

	_triplets(includeSelf) {
		let triplets = []
		if (includeSelf || !Object.keys(this.relations).length)
			triplets.push(this.graph.triplet(this.index, SELF_PREDICATE, this.index))
		for (let i in this.relations) {
			let rel = this.relations[i]
			triplets.push(this.graph.triplet(this.index, rel.predicate, rel.object.index))
		}
		return triplets
	}

	save() {
		return new rsvp.Promise((resolve, reject) => {
			this.graph.graph.put(this._triplets(), err => {
				if (err) return reject(err)
				resolve(this)
			})
		})
	}

	standalone() { return !Object.keys(this.relations).length }

	rel(predicate, edge, properties) {
		let rel = new Relation(this, predicate, edge)
		this.relations[predicate + ':' + edge.index] = rel
		if (properties) rel.props.set(properties)
		return rel
	}

	del() {
		return new rsvp.Promise((resolve, reject) => {
			return this.load().then(() => {
				let q = []
				for (let i in this.relations) q.push(this.relations[i].del())
				q.push(this.props.clear())
				return rsvp.all(q).then(() => {
					let tripletsTodel = this._triplets(true)
					this.graph.graph.del(tripletsTodel, err => {
						if (err) return reject(err)
						resolve(tripletsTodel.length)
					})
				})
			})
		})
	}

	toString() {
		let str = 'Edge[' + this.index
		for (let i in this.relations)
			str += '\n  ' + this.relations[i].toString()
		str += '\n]'
		return str
	}
	
}

Edge.SELF_PREDICATE = SELF_PREDICATE

export default Edge
