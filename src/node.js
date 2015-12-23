import rsvp from 'rsvp'

import NsProperties from './nsprops'
import Edge from './edge'

const SELF_PREDICATE = '_self'

class Node {

  constructor(graph, index) {
    this.graph = graph
    this.index = index
    this.props = new NsProperties('__props:node:' + index, graph.properties)
    this.edges = {}
  }

  _syncProps() {
    return this.props.map().then(map => {
      this.propsMap = map;
      return this;
    })
  }

  load(syncProps, syncEdgesProps) {
    return new rsvp.Promise((resolve, reject) => {
      this.graph.graph.search(this.graph.triplet(this.index), (err, triplets) => {
        if (err) return reject(err)
        let load = []
        triplets.forEach(triplet => {
          if (triplet.predicate === SELF_PREDICATE) return
          let edge = new Edge(this, triplet.predicate, new Node(this, triplet.object))
          if (syncEdgesProps) load.push(edge._syncProps())
          this.edges[triplet.predicate + ':' + triplet.object] = edge
        })
        if (syncProps) load.push(this._syncProps())
        return rsvp.all(load).then(() => resolve(this))
      })
    })
  }

  export(edges) {
    if (Array.isArray(edges)) for (let i in this.edges) edges.push(this.edges[i].export())
    return {index: this.index, props: this.propsMap || {}}
  }

  _triplets(includeSelf) {
    let triplets = []
    if (includeSelf || !Object.keys(this.edges).length)
      triplets.push(this.graph.triplet(this.index, SELF_PREDICATE, this.index))
    for (let i in this.edges) {
      triplets.push(this.graph.triplet(this.index, this.edges[i].predicate, this.edges[i].object.index))
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

  standalone() {
    return !Object.keys(this.edges).length
  }

  rel(predicate, node, properties) {
    let edge = new Edge(this, predicate, node)
    this.edges[predicate + ':' + node.index] = edge
    if (properties) edge.props.set(properties)
    return edge
  }

  del() {
    return new rsvp.Promise((resolve, reject) => {
      return this.load().then(() => {
        let q = []
        for (let i in this.edges) q.push(this.edges[i].del())
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
    let str = 'Node[' + this.index
    for (let i in this.edges)
      str += '\n  ' + this.edges[i].toString()
    str += '\n]'
    return str
  }

}

Node.SELF_PREDICATE = SELF_PREDICATE

export default Node
