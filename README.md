
# WGraph

An optionnal thin abstraction layer of [LevelGraph](https://github.com/mcollina/levelgraph) for internal purposes.
LevelGraph use [LevelDB](http://code.google.com/p/leveldb/), as this layer do for edges and relations properties. 

** /!\ ==== Help is welcome! :) ==== /!\ **

## Table of Contents

* [Install](#install)
	* [Build](#build)
	* [Test](#test)
* [Usage](#usage)
* [Visualize](#visualize)
* [License MIT](#license)

## Install

	npm i -g babel babel-cli mocha
	npm i -S wgraph

## Build

	npm run build

## Test

	npm run test

## Usage

```javascript
import WGraph from 'wgraph'

let graph = new WGraph('mydb')

let brice = graph.node('brice')
brice.props.set({age: 27, sex: 'male'})

let arnaud = graph.node('arnaud')

// brice knows arnaud edge
brice.rel('knows', arnaud, {since: '2015/11/01'})

arnaud.save()
	.then(() => { brice.save() })
	.then(() => {
  console.log('arnaud, brice and his relation to arnaud have been saved')
}).catch(console.error.bind(console))

//TODO more examples
```
## Visualize

### Create a graph

```javascript
// [a-project-dir]/graph.js

import util from 'util'
import rsvp from 'rsvp'
import WGraph from 'wgraph'

let printExport = elements => console.log(util.inspect(elements))

let g = new WGraph('simple-graph')
let brice = g.node('brice', {age: 28})
var arnaud = g.node('arnaud')
var sacha = g.node('sacha')
var antonin = g.node('antonin')

brice.rel('knows', arnaud, {since: '2015/11/01'})
brice.rel('knows', sacha, {someAttr: 42})
arnaud.rel('knows', brice)
arnaud.rel('knows', sacha)
sacha.rel('knows', brice)
sacha.rel('knows', arnaud)
antonin.rel('knows', brice)
antonin.rel('knows', arnaud, {since: '2015/11/01'})
antonin.rel('directorOf', brice)
antonin.rel('directorOf', arnaud)
antonin.rel('love', antonin, {lovePower: 46.78})
sacha.rel('directorOf', brice, {by: 'passion'})
sacha.rel('directorOf', arnaud, {by: 'devotion'})

rsvp.all([
  brice.save(),
  arnaud.save(),
  sacha.save()
]).then(() => {
  return g.export().then(printExport)
}).catch(console.error.bind(console))
```

### Run the visualization server

  node [wgraph-lib]/lib/visualizer/server.js
  
### Open your browser with the graph absolute path

	// http://localhost/?graph=[a-project-dir]/simple-graph

![Logo](https://raw.githubusercontent.com/wuha-io/wgraph/master/screenshot.png)

## License

MIT / Copyright (c) 2015 Wuha.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
