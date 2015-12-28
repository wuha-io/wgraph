import assert from 'assert'
import rsvp from 'rsvp'

import WGraph from '../wgraph'
import Node from '../node'

describe('WGraph', () => {

  let graph

  before(done => {
    graph = new WGraph(__dirname + '/graph')
    graph.del().then(nbTriplets => {
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

  it('should create nodes', () => {
    let brice = graph.node('brice')
    assert.strictEqual(brice.constructor.name, 'Node')
    assert.strictEqual(brice.index, 'brice')
    let briceAndSacha = graph.nodes('brice', 'sacha')
    assert.strictEqual(briceAndSacha.brice.constructor.name, 'Node')
    assert.strictEqual(briceAndSacha.brice.index, 'brice')
    assert.strictEqual(briceAndSacha.sacha.constructor.name, 'Node')
    assert.strictEqual(briceAndSacha.sacha.index, 'sacha')
  })

  describe('Node', () => {

    it('should be loaded even if not exists', done => {
      let brice = graph.node('brice')
      assert(brice.standalone())
      brice.load().then(() => {
        assert(brice.standalone())
        done()
      }).catch(done)
    })

    it('should be saved (no relations)', done => {
      let brice = graph.node('brice')
      assert(brice.standalone())
      brice.save().then(() => {
        assert(brice.standalone())
        let search = graph.triplet(brice.index)
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err)
          assert.strictEqual(triplets.length, 1)
          assert.strictEqual(triplets.shift().predicate, Node.SELF_PREDICATE)
          done()
        })
      }).catch(done)
    })

    it('should have properties', done => {
      let brice = graph.node('brice')
      brice.props.clear()
        .then(() => {
          return brice.props.map()
        })
        .then(data0 => {
          assert.deepEqual(data0, {})
          return brice.props.set('age', 28)
            .then(() => {
              return brice.props.del('age')
            })
            .then(() => {
              return brice.props.set({sex: 'female', age: 27})
            })
            .then(() => {
              return brice.props.set([['sex', 'male'], ['hair', 'brown']])
            })
            .then(() => {
              return brice.props.map()
            })
        }).then(data1 => {
        assert.deepEqual(data1, {sex: 'male', age: 27, hair: 'brown'})
        done()
      }).catch(done)
    })

    let brice
    let arnaud

    it('should be related to other nodes', () => {
      brice = graph.node('brice')
      arnaud = graph.node('arnaud')
      let briceKnowsArnaud = brice.rel('knows', arnaud)
      assert.strictEqual(briceKnowsArnaud.constructor.name, 'Edge')
      assert.strictEqual(briceKnowsArnaud.subject.index, brice.index)
      assert.strictEqual(briceKnowsArnaud.predicate, 'knows')
      assert.strictEqual(briceKnowsArnaud.object.index, arnaud.index)
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
          assert.strictEqual(triplets.shift().predicate, Node.SELF_PREDICATE)
          done()
        })
      }).catch(done)
    })

    describe('should search', () => {

      it('#1 empty', done => {
        graph.search('antonin').then(nodes => {
          assert.deepEqual(nodes, {})
          done()
        }).catch(done)
      })

      it('#1 args', done => {
        let antonin = graph.node('antonin')
        let sacha = graph.node('sacha')
        antonin.rel('knows', sacha);
        rsvp.all([antonin.save(), sacha.save()])
          .then(() => {
            return graph.search('antonin', 'sacha')
          })
          .then(nodes => {
            assert.deepEqual(Object.keys(nodes), ['sacha', 'antonin'])
            assert.strictEqual(nodes.antonin.edges['knows:sacha'].object.index, 'sacha')
            done()
          }).catch(done)
      })

      it('#2 array', done => {
        graph.search(['antonin', 'sacha'])
          .then(nodes => {
            assert.deepEqual(Object.keys(nodes), ['sacha', 'antonin'])
            done()
          }).catch(done)
      })

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

  describe('Edges', () => {

    let brice
    let arnaud
    let briceKnowsArnaud
    let expRelTriplet

    before(() => {
      brice = graph.node('brice')
      arnaud = graph.node('arnaud')
      briceKnowsArnaud = brice.rel('knows', arnaud)
      expRelTriplet = {subject: brice.index, predicate: 'knows', object: arnaud.index}
    })

    it('should be loaded', done => {
      briceKnowsArnaud.load().then(() => {
        assert.deepEqual(briceKnowsArnaud.triplet(), expRelTriplet)
        done()
      }).catch(done);
    })

    it('should be saved', done => {
      briceKnowsArnaud.save().then(() => {
        assert.deepEqual(briceKnowsArnaud.triplet(), expRelTriplet)
        done()
      }).catch(done);
    })

    it('should be deleted', done => {
      briceKnowsArnaud.save()
        .then(() => {
          return briceKnowsArnaud.del()
        })
        .then(triplet => {
          briceKnowsArnaud.graph.graph.search(expRelTriplet, (err, triplets) => {
            if (err) return done(err)
            assert.strictEqual(triplets.length, 0)
            done()
          })
        }).catch(done);
    })

    it('should have properties', done => {
      let attrs = {since: '2015/11/01', colleague: true}
      briceKnowsArnaud.props.set(attrs)
        .then(() => {
          return briceKnowsArnaud.props.map()
        })
        .then(data => {
          assert.deepEqual(data, attrs)
          done()
        }).catch(done);
    })

  })

})
