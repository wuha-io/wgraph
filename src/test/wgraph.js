
import assert from 'assert'
import rsvp from 'rsvp'

import WGraph from '../wgraph'
import Edge from '../edge'

describe('WGraph', () => {

	let graph

	before(done => {
		graph = new WGraph(__dirname + '/graph')
    graph.clear().then(nbTriplets => {
      //console.log('%s deleted triplets', nbTriplets)
      done()
    }).catch(done)
	})

  it('should build triplets', () => {
    let isVariable = (v, name) => {
      assert.strictEqual(v.constructor.name, 'Variable')
      assert.strictEqual(v.name, name)
    }
    let triplet = graph.triplet()
    isVariable(triplet.subject, 'subject')
    isVariable(triplet.predicate, 'predicate')
    isVariable(triplet.object, 'object')
    triplet = graph.triplet('brice')
    assert.strictEqual(triplet.subject, 'brice')
    isVariable(triplet.predicate, 'predicate')
    isVariable(triplet.object, 'object')
    triplet = graph.triplet('brice', 'knows')
    assert.strictEqual(triplet.subject, 'brice')
    assert.strictEqual(triplet.predicate, 'knows')
    isVariable(triplet.object, 'object')
    triplet = graph.triplet('brice', 'knows', 'arnaud')
    assert.strictEqual(triplet.subject, 'brice')
    assert.strictEqual(triplet.predicate, 'knows')
    assert.strictEqual(triplet.object, 'arnaud')
  })

  it('should create edges', () => {
    let brice = graph.edge('brice')
    assert.strictEqual(brice.constructor.name, 'Edge')
    assert.strictEqual(brice.index, 'brice')
    let briceAndSacha = graph.edges('brice', 'sacha')
    assert.strictEqual(briceAndSacha.brice.constructor.name, 'Edge')
    assert.strictEqual(briceAndSacha.brice.index, 'brice')
    assert.strictEqual(briceAndSacha.sacha.constructor.name, 'Edge')
    assert.strictEqual(briceAndSacha.sacha.index, 'sacha')
  })

  describe('Edge', () => {

    it('should be loaded even if not exists', done => {
      let brice = graph.edge('brice')
      assert(brice.standalone())
      brice.load().then(() => {
        assert(brice.standalone())
        done()
      }).catch(done)
    })

    it('should be saved (no relations)', done => {
      let brice = graph.edge('brice')
      assert(brice.standalone())
      brice.save().then(() => {
        assert(brice.standalone())
        let search = graph.triplet(brice.index)
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err)
          assert.strictEqual(triplets.length, 1)
          assert.strictEqual(triplets.shift().predicate, Edge.SELF_PREDICATE)
          done()
        })
      }).catch(done)
    })

    it('should have properties', done => {
      let brice = graph.edge('brice')
      brice.props.clear()
        .then(() => { return brice.props.map() })
        .then(data0 => {
          assert.deepEqual(data0, {})
          return brice.props.set('age', 28)
            .then(() => { return brice.props.del('age') })
            .then(() => { return brice.props.set({sex: 'female', age: 27}) })
            .then(() => { return brice.props.set([['sex', 'male'], ['hair', 'brown']]) })
            .then(() => { return brice.props.map() })
        }).then(data1 => {
          assert.deepEqual(data1, {sex: 'male', age: 27, hair: 'brown'})
          done()
        }).catch(done)
    })

    let brice
    let arnaud

    it('should be related to other edges', () => {
      brice = graph.edge('brice')
      arnaud = graph.edge('arnaud')
      let rel = brice.rel('knows', arnaud)
      assert.strictEqual(rel.constructor.name, 'Relation')
      assert.strictEqual(rel.subject.index, brice.index)
      assert.strictEqual(rel.predicate, 'knows')
      assert.strictEqual(rel.object.index, arnaud.index)
    })

    it('should be saved (with relation)', done => {
      assert(!brice.standalone())
      brice.save().then(() => {
        let search = graph.triplet(brice.index)
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err)
          assert.strictEqual(triplets.length, 2)
          let rel = triplets.shift()
          assert.strictEqual(rel.predicate, 'knows')
          assert.strictEqual(rel.object, arnaud.index)
          assert.strictEqual(triplets.shift().predicate, Edge.SELF_PREDICATE)
          done()
        })
      }).catch(done)
    })

    it('should search edges', done => {
      let sacha = graph.edge('sacha')
      sacha.save()
        .then(() => { return graph.search('brice', 'sacha') })
        .then(edges => {
          assert.deepEqual(Object.keys(edges), ['brice', 'sacha'])
          assert.strictEqual(edges.brice.relations['knows:arnaud'].object.index, 'arnaud')
          done()
        }).catch(done)
    })

    it('should be deleted', done => {
      brice.del().then(() => {
        let search = graph.triplet(brice.index)
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err)
          assert.strictEqual(triplets.length, 0)
          brice.props.map().then(data => {
            assert.deepEqual(data, {})
            done()
          })
        })
      }).catch(done)
    })

  })

  describe('Relations', () => {

    let brice
    let arnaud
    let rel
    let expRelTriplet

    before(() => {
      brice = graph.edge('brice')
      arnaud = graph.edge('arnaud')
      rel = brice.rel('knows', arnaud)
      expRelTriplet = {subject: brice.index, predicate: 'knows', object: arnaud.index}
    })

    it('should be loaded', done => {
      rel.load().then(() => {
        assert.deepEqual(rel.triplet(), expRelTriplet)
        done()
      }).catch(done);
    })

    it('should be saved', done => {
      rel.save().then(() => {
        assert.deepEqual(rel.triplet(), expRelTriplet)
        done()
      }).catch(done);
    })

    it('should be deleted', done => {
      rel.save()
        .then(() => { return rel.del() })
        .then(triplet => {
          rel.graph.graph.search(expRelTriplet, (err, triplets) => {
            if (err) return done(err)
            assert.strictEqual(triplets.length, 0)
            done()
          })
        }).catch(done);
    })

    it('should have properties', done => {
      let attrs = {since: '2015/11/01', colleague: true}
      rel.props.set(attrs)
        .then(() => { return rel.props.map() })
        .then(data => {
          assert.deepEqual(data, attrs)
          done()
        }).catch(done);
    })

  })

})
