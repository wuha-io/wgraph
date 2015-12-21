'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _levelup = require('levelup');

var _levelup2 = _interopRequireDefault(_levelup);

var _leveldbprops = require('../leveldbprops');

var _leveldbprops2 = _interopRequireDefault(_leveldbprops);

var _nsprops = require('../nsprops');

var _nsprops2 = _interopRequireDefault(_nsprops);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('LevelDbProperties', () => {

  let props;

  before(done => {
    props = new _leveldbprops2.default((0, _levelup2.default)(__dirname + '/db'));
    props.clear('test').then(() => done()).catch(done);
  });

  it('should return the namespace map', done => {
    props.map('test').then(map => {
      _assert2.default.deepEqual(map, {});
      done();
    }).catch(done);
  });

  it('should set properties into the namespace', done => {
    props.set('test', 'age', 28).then(() => {
      return props.get('test', 'age');
    }).then(age => {
      _assert2.default.strictEqual(age, 28);
      return props.set('test', 'sex', 'male');
    }).then(() => {
      return props.map('test');
    }).then(map => {
      _assert2.default.deepEqual(map, { age: 28, sex: 'male' });
      done();
    }).catch(done);
  });

  it('should get properties into the namespace', done => {
    props.set('test', 'age', 28).then(() => {
      return props.set('test', 'sex', 'male');
    }).then(() => {
      return props.get('test', 'age');
    }).then(() => {
      return props.get('test', 'age', 'sex');
    }).then(props0 => {
      _assert2.default.deepEqual(props0, { age: 28, sex: 'male' });
      return props.get('test', ['sex', 'age']);
    }).then(props1 => {
      _assert2.default.deepEqual(props1, { sex: 'male', age: 28 });
      done();
    }).catch(done);
  });

  it('should del properties into the namespace', done => {
    props.set('test', 'age', 28).then(() => {
      return props.get('test', 'age');
    }).then(age => {
      _assert2.default.strictEqual(age, 28);
      return props.del('test', 'age').then(() => {
        return props.get('test', 'age');
      });
    }).then(age => {
      _assert2.default.strictEqual(age, undefined);
      done();
    }).catch(done);
  });

  it('should be namespaced', done => {
    let testProps = new _nsprops2.default('test', props);
    testProps.set('age', 42).then(() => {
      return testProps.map();
    }).then(map => {
      _assert2.default.deepEqual(map, { age: 42, sex: 'male' });
      done();
    }).catch(done);
  });
});
//# sourceMappingURL=leveldbprops.js.map