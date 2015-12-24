'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _nsprops = require('./nsprops');

var _nsprops2 = _interopRequireDefault(_nsprops);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Edge {

  constructor(subject, predicate, object) {
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
    this.graph = this.subject.graph;
    this.props = new _nsprops2.default('__props:edge:' + this._relIndex(), this.graph.properties);
  }

  _relIndex() {
    return this.subject.index + ':' + this.predicate + ':' + this.object.index;
  }

  triplet() {
    return this.graph.triplet(this.subject.index, this.predicate, this.object.index);
  }

  _syncProps() {
    return this.props.map().then(map => {
      this.propsMap = map;
      return this;
    });
  }

  load(syncProps, syncNodesProps) {
    return new _rsvp2.default.Promise((resolve, reject) => {
      let search = this.graph.triplet();
      search.filter = triplet => {
        return triplet.subject === this.subject.index && triplet.predicate === this.predicate && triplet.object === this.object.index;
      };
      this.graph.graph.search(search, (err, triplets) => {
        if (err) return reject(err);
        if (!triplets.length) return resolve(this.triplet());
        _rsvp2.default.all([this.graph.node(this.subject.index).load(), this.graph.node(this.object.index).load()]).then(nodes => {
          this.subject = nodes[0];
          this.object = nodes[1];
          let load = [];
          if (syncNodesProps) {
            load.push(this.subject._syncProps());
            load.push(this.object._syncProps());
          }
          if (syncProps) load.push(this._syncProps());
          return _rsvp2.default.all(load).then(() => resolve(this));
        }).catch(reject);
      });
    });
  }

  export() {
    return {
      subject: this.subject.index,
      predicate: this.predicate,
      object: this.object.index,
      props: this.propsMap || {}
    };
  }

  save() {
    return this.subject.save().then(() => {
      return this.load();
    });
  }

  del() {
    return new _rsvp2.default.Promise((resolve, reject) => {
      return this.props.del().then(() => {
        this.graph.graph.del(this.triplet(), err => {
          if (err) return reject(err);
          resolve(this);
        });
      });
    });
  }

  toString() {
    return _util2.default.format('Edge[%s %s %s]', this.subject.index, this.predicate, this.object.index);
  }

}

exports.default = Edge;
//# sourceMappingURL=edge.js.map