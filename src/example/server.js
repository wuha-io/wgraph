
import fs from 'fs'
import path from 'path'
import express from 'express'

import graphs from './graphs'

let app = express()
let router = express.Router()

router.get('/', (req, res) => { res.end(String(fs.readFileSync('src/example/index.html'))) })

router.get('/graph/:name', (req, res, next) => {
	let graph = graphs[req.params.name]
	if (!graph) return next(new Error('Graph not found'))
	graph.export().then(elements => { res.json(elements) }).catch(next)
})

app.use(express.static('bower_components'))
app.use(express.static('src/example/public'))

app.use('/', router)

app.listen(80, '0.0.0.0')
