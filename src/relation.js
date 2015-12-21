
import util from 'util'
import rsvp from 'rsvp'

import NsProperties from './nsprops'

class Relation {
	
	constructor(subject, predicate, object) {
		this.subject = subject
		this.predicate = predicate
		this.object = object
		this.graph = this.subject.graph
		this.props = new NsProperties('__props:rel:' + this._relIndex(), this.graph.properties)
		this.synchronized = false
	}

	_relIndex() { return this.subject.index + ':' + this.predicate + ':' + this.object.index }

	triplet() { return this.graph.triplet(this.subject.index, this.predicate, this.object.index) }

	load() {
		return new rsvp.Promise((resolve, reject) => {
			let search = this.graph.triplet()
			search.filter = triplet => {
				return triplet.subject === this.subject.index
					&& triplet.predicate === this.predicate
					&& triplet.object === this.object.index
			}
			this.graph.graph.search(search, (err, triplets) => {
				if (err) return reject(err)
				if (!triplets.length) return resolve(this.triplet())
				rsvp.all([
					this.graph.edge(this.subject.index).load(),
					this.graph.edge(this.object.index).load(),
				]).then(edges => {
					this.subject = edges[0]
					this.object = edges[1]
					resolve(this)
				}).catch(reject)
			})
		})
	}

	save() { return this.subject.save().then(() => { return this.load() }) }

	del() {
		return new rsvp.Promise((resolve, reject) => {
			return this.props.del().then(() => {
				this.graph.graph.del(this.triplet(), err => {
					if (err) return reject(err)
					resolve(this)
				})
			})
		})
	}

	toString() {
		return util.format(
			'Relation[%s %s %s]',
			this.subject.index,
			this.predicate,
			this.object.index
		)
	}

}

export default Relation
