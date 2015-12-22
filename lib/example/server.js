'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _graphs = require('./graphs');

var _graphs2 = _interopRequireDefault(_graphs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let app = (0, _express2.default)();
let router = _express2.default.Router();

router.get('/', (req, res) => {
	res.end(String(_fs2.default.readFileSync('src/example/index.html')));
});

router.get('/graph/:name', (req, res, next) => {
	let graph = _graphs2.default[req.params.name];
	if (!graph) return next(new Error('Graph not found'));
	graph.export().then(elements => {
		res.json(elements);
	}).catch(next);
});

app.use(_express2.default.static('bower_components'));
app.use(_express2.default.static('src/example/public'));

app.use('/', router);

app.listen(80, '0.0.0.0');
//# sourceMappingURL=server.js.map