'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _wgraph = require('../wgraph');

var _wgraph2 = _interopRequireDefault(_wgraph);

var _edge = require('../edge');

var _edge2 = _interopRequireDefault(_edge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('WGraph', () => {

  let graph;

  before(done => {
    graph = new _wgraph2.default(__dirname + '/graph');
    graph.clear().then(nbTriplets => {
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

  it('should create edges', () => {
    let brice = graph.edge('brice');
    _assert2.default.strictEqual(brice.constructor.name, 'Edge');
    _assert2.default.strictEqual(brice.index, 'brice');
    let briceAndSacha = graph.edges('brice', 'sacha');
    _assert2.default.strictEqual(briceAndSacha.brice.constructor.name, 'Edge');
    _assert2.default.strictEqual(briceAndSacha.brice.index, 'brice');
    _assert2.default.strictEqual(briceAndSacha.sacha.constructor.name, 'Edge');
    _assert2.default.strictEqual(briceAndSacha.sacha.index, 'sacha');
  });

  describe('Edge', () => {

    it('should be loaded even if not exists', done => {
      let brice = graph.edge('brice');
      (0, _assert2.default)(brice.standalone());
      brice.load().then(() => {
        (0, _assert2.default)(brice.standalone());
        done();
      }).catch(done);
    });

    it('should be saved (no relations)', done => {
      let brice = graph.edge('brice');
      (0, _assert2.default)(brice.standalone());
      brice.save().then(() => {
        (0, _assert2.default)(brice.standalone());
        let search = graph.triplet(brice.index);
        graph.graph.search(search, (err, triplets) => {
          if (err) return done(err);
          _assert2.default.strictEqual(triplets.length, 1);
          _assert2.default.strictEqual(triplets.shift().predicate, _edge2.default.SELF_PREDICATE);
          done();
        });
      }).catch(done);
    });

    it('should have properties', done => {
      let brice = graph.edge('brice');
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

    it('should be related to other edges', () => {
      brice = graph.edge('brice');
      arnaud = graph.edge('arnaud');
      let rel = brice.rel('knows', arnaud);
      _assert2.default.strictEqual(rel.constructor.name, 'Relation');
      _assert2.default.strictEqual(rel.subject.index, brice.index);
      _assert2.default.strictEqual(rel.predicate, 'knows');
      _assert2.default.strictEqual(rel.object.index, arnaud.index);
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
          _assert2.default.strictEqual(triplets.shift().predicate, _edge2.default.SELF_PREDICATE);
          done();
        });
      }).catch(done);
    });

    it('should search edges', done => {
      let sacha = graph.edge('sacha');
      sacha.save().then(() => {
        return graph.search('brice', 'sacha');
      }).then(edges => {
        _assert2.default.deepEqual(Object.keys(edges), ['brice', 'sacha']);
        _assert2.default.strictEqual(edges.brice.relations['knows:arnaud'].object.index, 'arnaud');
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

  describe('Relations', () => {

    let brice;
    let arnaud;
    let rel;
    let expRelTriplet;

    before(() => {
      brice = graph.edge('brice');
      arnaud = graph.edge('arnaud');
      rel = brice.rel('knows', arnaud);
      expRelTriplet = { subject: brice.index, predicate: 'knows', object: arnaud.index };
    });

    it('should be loaded', done => {
      rel.load().then(() => {
        _assert2.default.deepEqual(rel.triplet(), expRelTriplet);
        done();
      }).catch(done);
    });

    it('should be saved', done => {
      rel.save().then(() => {
        _assert2.default.deepEqual(rel.triplet(), expRelTriplet);
        done();
      }).catch(done);
    });

    it('should be deleted', done => {
      rel.save().then(() => {
        return rel.del();
      }).then(triplet => {
        rel.graph.graph.search(expRelTriplet, (err, triplets) => {
          if (err) return done(err);
          _assert2.default.strictEqual(triplets.length, 0);
          done();
        });
      }).catch(done);
    });

    it('should have properties', done => {
      let attrs = { since: '2015/11/01', colleague: true };
      rel.props.set(attrs).then(() => {
        return rel.props.map();
      }).then(data => {
        _assert2.default.deepEqual(data, attrs);
        done();
      }).catch(done);
    });
  });
});
//# sourceMappingURL=wgraph.js.map