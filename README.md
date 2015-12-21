
# WGraph

```javascript
import WGraph from 'wgraph'

let graph = new WGraph('mydb')

let brice = graph.edge('brice')
brice.props.set({age: 27, sex: 'male'})

let arnaud = graph.edge('arnaud')

let rel = brice.rel('knows', arnaud, {since: '2015/11/01'})
arnaud.save()
	.then(() => { brice.save() })
	.then(() => {
  console.log('arnaud, brice and his relation to arnaud have been saved')
}).catch(console.error.bind(console))

//TODO more examples
```
