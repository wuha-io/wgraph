'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LevelDbProperties {

	constructor(db) {
		this.db = db;
	}

	map(namespace) {
		return new _rsvp2.default.Promise((resolve, reject) => {
			this.db.get(namespace, (err, data) => {
				if (err) {
					if (err.message.indexOf('Key not found in database') === -1) return reject(err);
				}
				if (!data) data = {};else data = JSON.parse(data);
				resolve(data);
			});
		});
	}

	count(namespace) {
		throw new Error('Not supported operation');
	}

	get() {
		let args = arguments;
		let nbArgs = args.length;
		if (nbArgs < 2) throw new Error('Invalid arguments');
		let namespace = args[0];
		delete args[0];
		return this.map(namespace).then(data => {
			let result = {};
			if (nbArgs > 2) {
				for (let i in args) result[args[i]] = data[args[i]];
			} else {
				if (typeof args[1] === 'object') args[1].forEach(property => result[property] = data[property]);else if (typeof args[1] === 'string') result = data[args[1]];else throw new Error('Invalid properties arguments');
			}
			return result;
		});
	}

	set() {
		let args = arguments;
		let nbArgs = arguments.length;
		if (nbArgs < 2 && nbArgs > 3) throw new Error('Invalid arguments');
		return new _rsvp2.default.Promise((resolve, reject) => {
			this.map(args[0]).then(data => {
				if (nbArgs === 3) {
					data[args[1]] = args[2];
				} else {
					let propsObj = {};
					if (Array.isArray(args[1])) args[1].forEach(property => {
						propsObj[property[0]] = property[1];
					});else if (typeof args[1] === 'object') propsObj = args[1];else return reject(new Error('Invalid properties arguments'));
					for (let property in propsObj) data[property] = propsObj[property];
				}
				this.db.put(args[0], JSON.stringify(data), err => {
					if (err) return reject(err);
					resolve(this);
				});
			});
		});
	}

	del(namespace, index) {
		return new _rsvp2.default.Promise((resolve, reject) => {
			return this.map(namespace).then(data => {
				delete data[index];
				this.db.put(namespace, JSON.stringify(data), err => {
					if (err) return reject(err);
					resolve(this);
				});
			});
		});
	}

	clear(namespace) {
		return new _rsvp2.default.Promise((resolve, reject) => {
			this.db.put(namespace, JSON.stringify({}), err => {
				if (err) return reject(err);
				resolve(this);
			});
		});
	}

}

exports.default = LevelDbProperties;
//# sourceMappingURL=leveldbprops.js.map