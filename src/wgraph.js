import util from 'util'
import levelup from 'levelup'
import levelgraph from 'levelgraph'
import rsvp from 'rsvp'

import Node from './node'
import LevelDbProperties from './leveldbprops'

class WGraph {

  constructor(dbFolder) {
    this.dbFolder = dbFolder
    this.db = levelup(this.dbFolder)
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

  triplets() {
    return this.graph.searchStream(this.triplet())
  }

  node(index, properties) {
    let node = new Node(this, index)
    if (properties) node.props.set(properties)
    return node
  }

  nodes() {
    let nodes = {}
    for (let i in arguments)
      nodes[arguments[i]] = this.node(arguments[i])
    return nodes
  }

  _fetch(fn) {
    return this.triplets().on('data', fn)
  }

  count() {
    return new rsvp.Promise((resolve, reject) => {
      let nbTriplets = 0
      this._fetch(() => nbTriplets++)
        .on('end', () => {
          resolve(nbTriplets)
        })
        .on('error', reject)
    })
  }

  del() {
    return new rsvp.Promise((resolve, reject) => {
      this._nodes(true, true).then(nodes => {
        return rsvp.all(nodes.map(n => {
          return n.del()
        })).then(() => resolve(this))
      }).catch(reject)
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
        let result = {}
        if (!triplets.length) return resolve(result)
        let nodes = triplets.map(triplet => triplet.subject)
          .filter((index, i, arr) => arr.indexOf(index) === i)
          .map(index => new Node(this, index).load())
        rsvp.all(nodes)
          .then(nodes => {
            if (args.length === 1) return resolve(nodes.shift())
            nodes.forEach(node => result[node.index] = node)
            resolve(result)
          }).catch(reject)
      })
    })
  }

  static _nodesMapToArray(nodesMap) {
    let nodes = []
    for (let i in nodesMap) nodes.push(nodesMap[i])
    return nodes
  }

  //TODO test
  subGraph() {
    let name = arguments[0]
    delete arguments[0]
    if (!name) throw new Error('Sub graph name required')
    let args = []
    for (let i in arguments) args.push(arguments[i])
    return new rsvp.Promise((resolve, reject) => {
      this.search.apply(this, args).then(nodes => {
          nodes = nodes.constructor.name === 'Node' ? [nodes] : WGraph._nodesMapToArray(nodes)
          return rsvp.all(nodes.map(n => {
            return n.load(true, true)
          }))
        })
        .then(nodes => {
          let subGraph = new WGraph(name)
          let save = []
          for (let i in nodes) {
            let sNode = subGraph.node(nodes[i].index)
            for (let j in nodes[i].edges)
              sNode.rel(
                nodes[i].edges[j].predicate,
                nodes[i].edges[j].object,
                nodes[i].edges[j].propsMap
              )
            save.push(sNode.save())
          }
          return rsvp.all(save).then(() => resolve(subGraph))
        }).catch(reject)
    })
  }

  _nodes(syncProps, syncEdgesProps) {
    return new rsvp.Promise((resolve, reject) => {
      let indexes = []
      this._fetch(triplet => {
        indexes.push(triplet.subject)
        indexes.push(triplet.object)
      }).on('end', () => {
        rsvp.all(indexes.filter((index, i, arr) => {
            return arr.indexOf(index) === i
          })
          .map(index => {
            return new Node(this, index).load(syncProps, syncEdgesProps)
          }))
          .then(nodes => resolve(nodes))
          .catch(reject)
      }).on('error', reject)
    })
  }

  export() {
    return new rsvp.Promise((resolve, reject) => {
      let edges = [];
      this._nodes(true, true).then(nodes => {
        nodes = nodes.map(node => node.export(edges))
        resolve({nodes: nodes, edges: edges})
      }).catch(reject)
    })
  }

}

export default WGraph
