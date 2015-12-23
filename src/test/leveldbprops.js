import assert from 'assert'
import levelup from 'levelup'

import LevelDbProperties from '../leveldbprops'
import NsProperties from '../nsprops'

describe('LevelDbProperties', () => {

  let props

  before(done => {
    props = new LevelDbProperties(levelup(__dirname + '/db'))
    props.clear('test').then(() => done()).catch(done)
  })

  it('should return the namespace map', done => {
    props.map('test').then(map => {
      assert.deepEqual(map, {})
      done()
    }).catch(done)
  })

  it('should set properties into the namespace', done => {
    props.set('test', 'age', 28)
      .then(() => {
        return props.get('test', 'age')
      })
      .then(age => {
        assert.strictEqual(age, 28)
        return props.set('test', 'sex', 'male')
      })
      .then(() => {
        return props.map('test')
      })
      .then(map => {
        assert.deepEqual(map, {age: 28, sex: 'male'})
        done()
      }).catch(done)
  })

  it('should get properties into the namespace', done => {
    props.set('test', 'age', 28)
      .then(() => {
        return props.set('test', 'sex', 'male')
      })
      .then(() => {
        return props.get('test', 'age')
      })
      .then(() => {
        return props.get('test', 'age', 'sex')
      })
      .then(props0 => {
        assert.deepEqual(props0, {age: 28, sex: 'male'})
        return props.get('test', ['sex', 'age'])
      }).then(props1 => {
      assert.deepEqual(props1, {sex: 'male', age: 28})
      done()
    }).catch(done)
  })

  it('should del properties into the namespace', done => {
    props.set('test', 'age', 28)
      .then(() => {
        return props.get('test', 'age')
      })
      .then(age => {
        assert.strictEqual(age, 28)
        return props.del('test', 'age')
          .then(() => {
            return props.get('test', 'age')
          })
      })
      .then(age => {
        assert.strictEqual(age, undefined)
        done()
      }).catch(done)
  })

  it('should be namespaced', done => {
    let testProps = new NsProperties('test', props)
    testProps.set('age', 42)
      .then(() => {
        return testProps.map()
      })
      .then(map => {
        assert.deepEqual(map, {age: 42, sex: 'male'})
        done()
      }).catch(done)
  })

})
