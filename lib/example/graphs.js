'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _wgraph = require('../wgraph');

var _wgraph2 = _interopRequireDefault(_wgraph);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let buildPointGraph = () => {
	let g = new _wgraph2.default('lib/example/graph-point');
	let brice = g.node('brice', { age: 28, sex: 'male' });
	brice.save();
	return g;
};

let buildSimpleGraph = () => {
	let g = new _wgraph2.default('lib/example/graph-simple');
	let brice = g.node('brice', { age: 28 });
	let arnaud = g.node('arnaud');
	let sacha = g.node('sacha');
	let antonin = g.node('antonin');
	brice.rel('knows', arnaud);
	brice.rel('knows', sacha);
	arnaud.rel('knows', brice);
	arnaud.rel('knows', sacha);
	sacha.rel('knows', brice);
	sacha.rel('knows', arnaud);
	antonin.rel('knows', brice);
	antonin.rel('knows', arnaud, { since: '2015/11/01' });
	antonin.rel('directorOf', brice);
	antonin.rel('directorOf', arnaud);
	antonin.rel('love', antonin);
	sacha.rel('directorOf', brice);
	sacha.rel('directorOf', arnaud);
	brice.save();
	arnaud.save();
	sacha.save();
	antonin.save();
	return g;
};

exports.default = {
	point: buildPointGraph(),
	simple: buildSimpleGraph()
};
//# sourceMappingURL=graphs.js.map