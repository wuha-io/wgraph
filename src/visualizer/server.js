import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'

import WGraph from '../wgraph'

let server = http.createServer((req, res) => {
  let sendError = err => {
    console.error(err)
    res.statusCode = 500;
    res.end(err.message || err)
  };
  let srcDir = __dirname.replace(path.sep + 'lib' + path.sep, path.sep + 'src' + path.sep)
  let indexHTML = String(fs.readFileSync(srcDir + '/index.html'))
  let query = url.parse(req.url, true).query
  if (!query.graph) return sendError('graph query parameter is required.')
  let graph
  try {
    graph = new WGraph(query.graph)
  } catch (e) {
    return sendError(e)
  }
  graph.export(true, true).then(elements => {
    res.end(indexHTML.replace('$graphJSON', JSON.stringify(elements)))
  }).catch(sendError)
});

if (!module.parent)
  server.listen(80, '0.0.0.0')

export default server
