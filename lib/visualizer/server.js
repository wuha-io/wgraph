'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _wgraph = require('../wgraph');

var _wgraph2 = _interopRequireDefault(_wgraph);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let server = _http2.default.createServer((req, res) => {
  let sendError = err => {
    console.error(err);
    res.statusCode = 500;
    res.end(err.message || err);
  };
  let srcDir = __dirname.replace(_path2.default.sep + 'lib' + _path2.default.sep, _path2.default.sep + 'src' + _path2.default.sep);
  let indexHTML = String(_fs2.default.readFileSync(srcDir + '/index.html'));
  let query = _url2.default.parse(req.url, true).query;
  if (!query.graph) return sendError('graph query parameter is required.');
  new _wgraph2.default(query.graph).export().then(elements => {
    res.end(indexHTML.replace('$graphJSON', JSON.stringify(elements)));
  }).catch(sendError);
});

if (!module.parent) server.listen(80, '0.0.0.0');

exports.default = server;
//# sourceMappingURL=server.js.map