'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _wgraph = require('../wgraph');

var _wgraph2 = _interopRequireDefault(_wgraph);

var _node = require('../node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('WGraph', () => {

  let graph;

  before(done => {
    graph = new _wgraph2.default(__dirname + '/graph');
    graph.del().then(nbTriplets => {
      //console.log('%s deleted triplets', nbTriplets)
      done();
    }).catch(done);
  });

  it('should build triplets', () => {
    let isVariable = (v, name) => {
      _assert2.default.strictEqual(v.constructor.name, 'Variable');
      _assert2.default.strictEqual(v.name, name);
    };
    let triplet = graph.triplet();
    isVariable(triplet.subject, 'subject');
    isVariable(triplet.predicate, 'predicate');
    isVariable(triplet.object, 'object');
    triplet = graph.triplet('brice');
    _assert2.default.strictEqual(triplet.subject, 'brice');
    isVariable(triplet.predicate, 'predicate');
    isVariable(triplet.object, 'object');
    triplet = graph.triplet('brice', 'knows');
    _assert2.default.strictEqual(triplet.subject, 'brice');
    _assert2.default.strictEqual(triplet.predicate, 'knows');
    isVariable(triplet.object, 'object');
    triplet = graph.triplet('brice', 'knows', 'arnaud');
    _assert2.default.strictEqual(triplet.subject, 'brice');
    _assert2.default.strictEqual(triplet.predicate, 'knows');
    _assert2.default.strictEqual(triplet.object, 'arnaud');
  });

  it('should create nodes', () => {
    let brice = graph.node('brice');
    _assert2.default.strictEqual(brice.constructor.name, 'Node');
    _assert2.default.strictEqual(brice.index, 'brice');
    let briceAndSacha = graph.nodes('brice', 'sacha');
    _assert2.default.strictEqual(briceAndSacha.brice.constructor.name, 'Node');
    _assert2.default.strictEqual(briceAndSacha.brice.index, 'brice');
    _assert2.default.strictEqual(briceAndSacha.sacha.constructor.name, 'Node');
    _assert2.default.strictEqual(briceAndSacha.sacha.index, 'sacha');
  });

  describe('Node', () => {

    it('should be loaded even if not exists', done => {
      let brice = graph.node('brice');
      (0, _assert2.default)(brice.standalone());
      brice.load().then(() => {
        (0, _assert2.default)(brice.standalone());
        done();
      }).catch(done);
    });

    it('should be saved (no relations)', done => {
      let brice = graph.node('brice');
      (0, _assert2.default)(brice.standalone());
      brice.save().then(() => {
        (0, _assert2.default)(brice.standalone());
        let search = graph.triplet(brice.index);
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err);
          _assert2.default.strictEqual(triplets.length, 1);
          _assert2.default.strictEqual(triplets.shift().predicate, _node2.default.SELF_PREDICATE);
          done();
        });
      }).catch(done);
    });

    it('should have properties', done => {
      let brice = graph.node('brice');
      brice.props.clear().then(() => {
        return brice.props.map();
      }).then(data0 => {
        _assert2.default.deepEqual(data0, {});
        return brice.props.set('age', 28).then(() => {
          return brice.props.del('age');
        }).then(() => {
          return brice.props.set({ sex: 'female', age: 27 });
        }).then(() => {
          return brice.props.set([['sex', 'male'], ['hair', 'brown']]);
        }).then(() => {
          return brice.props.map();
        });
      }).then(data1 => {
        _assert2.default.deepEqual(data1, { sex: 'male', age: 27, hair: 'brown' });
        done();
      }).catch(done);
    });

    let brice;
    let arnaud;

    it('should be related to other nodes', () => {
      brice = graph.node('brice');
      arnaud = graph.node('arnaud');
      let briceKnowsArnaud = brice.rel('knows', arnaud);
      _assert2.default.strictEqual(briceKnowsArnaud.constructor.name, 'Edge');
      _assert2.default.strictEqual(briceKnowsArnaud.subject.index, brice.index);
      _assert2.default.strictEqual(briceKnowsArnaud.predicate, 'knows');
      _assert2.default.strictEqual(briceKnowsArnaud.object.index, arnaud.index);
    });

    it('should be saved (with relation)', done => {
      (0, _assert2.default)(!brice.standalone());
      brice.save().then(() => {
        let search = graph.triplet(brice.index);
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err);
          _assert2.default.strictEqual(triplets.length, 2);
          let rel = triplets.shift();
          _assert2.default.strictEqual(rel.predicate, 'knows');
          _assert2.default.strictEqual(rel.object, arnaud.index);
          _assert2.default.strictEqual(triplets.shift().predicate, _node2.default.SELF_PREDICATE);
          done();
        });
      }).catch(done);
    });

    it('should search nodes', done => {
      let sacha = graph.node('sacha');
      sacha.save().then(() => {
        return graph.search('brice', 'sacha');
      }).then(nodes => {
        _assert2.default.deepEqual(Object.keys(nodes), ['brice', 'sacha']);
        _assert2.default.strictEqual(nodes.brice.edges['knows:arnaud'].object.index, 'arnaud');
        done();
      }).catch(done);
    });

    it('should be deleted', done => {
      brice.del().then(() => {
        let search = graph.triplet(brice.index);
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err);
          _assert2.default.strictEqual(triplets.length, 0);
          brice.props.map().then(data => {
            _assert2.default.deepEqual(data, {});
            done();
          });
        });
      }).catch(done);
    });
  });

  describe('Edges', () => {

    let brice;
    let arnaud;
    let briceKnowsArnaud;
    let expRelTriplet;

    before(() => {
      brice = graph.node('brice');
      arnaud = graph.node('arnaud');
      briceKnowsArnaud = brice.rel('knows', arnaud);
      expRelTriplet = { subject: brice.index, predicate: 'knows', object: arnaud.index };
    });

    it('should be loaded', done => {
      briceKnowsArnaud.load().then(() => {
        _assert2.default.deepEqual(briceKnowsArnaud.triplet(), expRelTriplet);
        done();
      }).catch(done);
    });

    it('should be saved', done => {
      briceKnowsArnaud.save().then(() => {
        _assert2.default.deepEqual(briceKnowsArnaud.triplet(), expRelTriplet);
        done();
      }).catch(done);
    });

    it('should be deleted', done => {
      briceKnowsArnaud.save().then(() => {
        return briceKnowsArnaud.del();
      }).then(triplet => {
        briceKnowsArnaud.graph.graph.search(expRelTriplet, (err, triplets) => {
          if (err) return done(err);
          _assert2.default.strictEqual(triplets.length, 0);
          done();
        });
      }).catch(done);
    });

    it('should have properties', done => {
      let attrs = { since: '2015/11/01', colleague: true };
      briceKnowsArnaud.props.set(attrs).then(() => {
        return briceKnowsArnaud.props.map();
      }).then(data => {
        _assert2.default.deepEqual(data, attrs);
        done();
      }).catch(done);
    });
  });
});
//# sourceMappingURL=wgraph.js.map