'use strict'

let drawGraph = null

let props = document.createElement('div')
props.id = 'props'
document.body.appendChild(props)

let container = document.createElement('div')
container.id = 'container'
document.body.appendChild(container)

let showProps = data => { $(props).JSONView(data) }

let upContainerHeight = () => { container.style.height = (window.innerHeight - 30) + 'px' }
upContainerHeight()

let qParams = {}
let searchParts = location.search.substr(1).split('&')
searchParts.forEach(sp => { sp = sp.split('='); qParams[sp[0]] = sp[1] })

if (!qParams.name) { 
	window.location = '/?name=point'
	throw new Error('End of process')
}

let loadGraph = id => {
	return new Promise((res, rej) => {
		let xhr = new XMLHttpRequest()
		xhr.open('GET', '/graph/' + id, true);
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) return;
			if (xhr.status !== 200) return rej(xhr.responseText)
			res(JSON.parse(xhr.responseText))
		};
		xhr.send()
	})
}

let layout = {
	name: 'breadthfirst',
  directed: true,
  padding: 5
}

let nodeStyle = cytoscape.stylesheet()
	.selector('node')
		.css({
      height: 40,
      width: 40,
      'background-fit': 'cover',
      'border-color': '#03213D',
      'background-color': '#CEE3F6',
      'border-width': 1,
      content: 'data(name)',
      'text-transform': 'uppercase',
      color: '#165999'
		})
	.selector('edge')
  	.css({
      width: 3,
      'line-color': '#EAF5FF',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#82C3FF',
      content: 'data(name)',
      color: '#03213D',
      'font-size': '0.5em'
  	})
	/*.selector(':selected')
		.css({
			'background-color': '#B4CCE3',
			'line-color': '#DDE9F4'
		})*/
	.selector('.faded')
		.css({
			opacity: 0.5
		})

loadGraph(qParams.name).then(elements => {

	drawGraph = () => {

		let opts = {};

		opts.container = container
		opts.layout = layout
		opts.style = nodeStyle

		opts.elements = {}

		opts.elements.nodes = elements.nodes.map((node, i) => { 
			return {
				data: {
    			id: node, 
    			name: node, 
    			props: elements.props.nodes[i]
  			}
  		}
  	})

  	opts.elements.edges = elements.edges.map((edge, i) => {
  		return {
  			data: {
    			source: edge.subject, 
    			target: edge.object, 
    			name: edge.predicate,
    			props: elements.props.edges[i]
    		}
    	}
    })

    let selectElem = e => {
    	let elem = e.cyTarget
    	let selected = elem.neighborhood().add(elem)
			cy.elements().addClass('faded')
			selected.removeClass('faded')
			showProps(elem.data())
    }

		container.html = null;
		
		let cy = cytoscape(opts)
			.on('tap', 'node', selectElem)
			.on('tap', 'edge', selectElem)
			.on('tap', e => {
				if (e.cyTarget === cy)
					cy.elements().removeClass('faded')
			})

		//cy.ready(() => {})
	}

	window.addEventListener('resize', () => {
		upContainerHeight()
		drawGraph()
	})

	drawGraph()

}).catch(console.error.bind(console))
