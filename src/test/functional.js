
import assert from 'assert'
import rsvp from 'rsvp'

import WGraph from '../wgraph'

it('Functionnal test', done => {

	let saveFixtures = () => {

		let briceKnowsArnaud = brice.rel('knows', arnaud)
		let arnaudKnowsBrice = arnaud.rel('knows', brice)

		let q = []

		q.push(brice.props.set({age: 28, sex: 'male', job: 'CTO'}))
		q.push(arnaud.props.set({age: 21, sex: 'male', job: 'dev'}))

		q.push(briceKnowsArnaud.props.set('since', '2015/11/01'))
		q.push(arnaudKnowsBrice.props.set({since: '2015/11/10', supervisor: true}))

		q.push(brice.save())
		q.push(arnaud.save())

		return rsvp.all(q)
	}

	let loadFixtures = () => {
		return rsvp.all([
			graph.edge('brice').load(),
			graph.edge('arnaud').load()
		]).then(edges => {
			return rsvp.all([
				edges[0].props.map(), // brice properties
				edges[1].props.map(), // arnaud properties
				edges[0].relations['knows:arnaud'].props.map(), // brice->arnaud properties
				edges[1].relations['knows:brice'].props.map(), // arnaud->brice properties
			])
		})
	}

	let graph = new WGraph(__dirname + '/fgraph')

	let brice = graph.edge('brice')
	let arnaud = graph.edge('arnaud')

	graph
		.clear()
		.then(() => { return rsvp.all([brice.del(), arnaud.del()]) })
		.then(() => { return saveFixtures() })
		.then(() => { return loadFixtures() })
		.then(data => {
			let briceProps = data.shift()
			let arnaudProps = data.shift()
			let briceKnowsArnaudProps = data.shift()
			let arnaudKnowsBriceProps = data.shift()
			assert.deepEqual(briceProps, {age: 28, sex: 'male', job: 'CTO'})
			assert.deepEqual(arnaudProps, {age: 21, sex: 'male', job: 'dev'})
			assert.deepEqual(briceKnowsArnaudProps, {since: '2015/11/01'})
			assert.deepEqual(arnaudKnowsBriceProps, {since: '2015/11/10', supervisor: true})
			done()
		}).catch(done)

})
