'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _wgraph = require('../wgraph');

var _wgraph2 = _interopRequireDefault(_wgraph);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

it('Functionnal test', done => {

  let saveFixtures = () => {

    let briceKnowsArnaud = brice.rel('knows', arnaud);
    let arnaudKnowsBrice = arnaud.rel('knows', brice);

    let q = [];

    q.push(brice.props.set({ age: 28, sex: 'male', job: 'CTO' }));
    q.push(arnaud.props.set({ age: 21, sex: 'male', job: 'dev' }));

    q.push(briceKnowsArnaud.props.set('since', '2015/11/01'));
    q.push(arnaudKnowsBrice.props.set({ since: '2015/11/10', supervisor: true }));

    q.push(brice.save());
    q.push(arnaud.save());

    return _rsvp2.default.all(q);
  };

  let loadFixtures = () => {
    return _rsvp2.default.all([graph.node('brice').load(), graph.node('arnaud').load()]).then(nodes => {
      return _rsvp2.default.all([nodes[0].props.map(), // brice properties
      nodes[1].props.map(), // arnaud properties
      nodes[0].edges['knows:arnaud'].props.map(), // brice->arnaud properties
      nodes[1].edges['knows:brice'].props.map()]);
    });
  };

  // arnaud->brice properties
  let graph = new _wgraph2.default(__dirname + '/fgraph');

  let brice = graph.node('brice');
  let arnaud = graph.node('arnaud');

  graph.del().then(() => {
    return _rsvp2.default.all([brice.del(), arnaud.del()]);
  }).then(() => {
    return saveFixtures();
  }).then(() => {
    return loadFixtures();
  }).then(data => {
    let briceProps = data.shift();
    let arnaudProps = data.shift();
    let briceKnowsArnaudProps = data.shift();
    let arnaudKnowsBriceProps = data.shift();
    _assert2.default.deepEqual(briceProps, { age: 28, sex: 'male', job: 'CTO' });
    _assert2.default.deepEqual(arnaudProps, { age: 21, sex: 'male', job: 'dev' });
    _assert2.default.deepEqual(briceKnowsArnaudProps, { since: '2015/11/01' });
    _assert2.default.deepEqual(arnaudKnowsBriceProps, { since: '2015/11/10', supervisor: true });
    done();
  }).catch(done);
});
//# sourceMappingURL=functional.js.map