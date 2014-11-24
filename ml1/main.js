(function() {

var isLoaded = false

function onload(k) {
  if(isLoaded) {
    k()
  } else {
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', k)
    } else {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'interactive')
          k()
      })
    }
  }
}

onload(function() { isLoaded = true })

function get(path, k, err) {
  var request = new XMLHttpRequest()
  request.open('GET', path, true)

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      k(JSON.parse(request.responseText))
    } else {
      err(null, request)
    }
  }

  request.onerror = err
  request.send()
}

get('data/rbm-params-500.json', rbmParamsLoaded, showErrorInfo)
get('data/mnist-50.json', mnistLoaded, showErrorInfo)

function forEachElementByClassName(className, f) {
  var elems = document.getElementsByClassName(className)
  for(var i = 0; i < elems.length; i++) {
    f(elems[i])
  }
}

function newZeroArray(length) {
  var array = []
  for(var i = 0; i < length; i++) {
    array[i] = 0.0
  }
  return array
}

function range(length) {
  var array = []
  for(var i = 0; i < length; i++) {
    array[i] = i
  }
  return array
}

function take(input, n) {
  var array = []
  for(var i = 0; i < n; i++) {
    array[i] = input[i]
  }
  return array
}

function last(input, n) {
  var array = []
  for(var i = 0; i < n; i++) {
    array[i] = input[input.length - n + i]
  }
  return array
}

function topFeatures(activations, n) {
  var indices = range(activations.length)
  indices.sort(function(a, b) {
    return activations[a] - activations[b]
  })
  return take(indices, n)
}

function clearChildren(node) {
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}

function precomputeFeatureImages(Wt) {
  var featureWidth = 28;
  var featureHeight = 28;
  var featureColormap = Gradient.gradient(
    [-0.8, 0, 0.8],
    [[0xff, 0xff, 0xff], [0x7f, 0x7f, 0x7f], [0x0, 0x0, 0.0]])

  var features = []
  for(var i = 0; i < Wt.length; i++) {
    features[i] = extractImage(Wt[i], featureWidth, featureHeight, featureColormap)
  }
  return features
}

function buildGrid(rows, columns, fn) {
  var elems = []
  var table = document.createElement('table')
  var tbody = document.createElement('tbody')
  table.appendChild(tbody)

  for(var i = 0; i < rows; i++) {
    var tr = document.createElement('tr')
    tbody.appendChild(tr)
    for(var j = 0; j < columns; j++) {
      var index = i*columns + j
      var td = document.createElement('td')

      var elem = fn(index)
      elems[index] = elem

      td.appendChild(elem)
      tr.appendChild(td)
    }
  }

  return {
    elems: elems,
    root: table
  }
}

function drawVectorCanvas(canvas, rows, columns) {
  var vector = newZeroArray(rows * columns)
  var context = canvas.getContext('2d')

  context.webkitImageSmoothingEnabled && (context.webkitImageSmoothingEnabled = false)

  function mouse_pos(canvas, event) {
    var rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  var backingCanvas = document.createElement('canvas')
  backingCanvas.width = columns
  backingCanvas.height = rows
  var backingContext = backingCanvas.getContext('2d')

  function redrawCanvas() {
    var imageData = vectorToImageData(backingContext, vector, columns, rows, digitColormap)
    backingContext.putImageData(imageData, 0, 0)
    context.drawImage(backingCanvas, 0, 0, canvas.width, canvas.height)
  }

  function fireDrawEvent() {
    var drawEvent = new CustomEvent('draw', {detail: {vector: vector}});
    canvas.dispatchEvent(drawEvent)
  }

  function redraw() {
    redrawCanvas()
    fireDrawEvent()
  }

  canvas.addEventListener('clear', function() {
    vector = newZeroArray(rows * columns)
    redraw()
  })

  redrawCanvas()

  function draw(event) {
    var xscale = columns / canvas.width
    var yscale = rows / canvas.height
    var pos = mouse_pos(canvas, event)

    var i1 = Math.floor(xscale * pos.x)
    var j1 = Math.floor(yscale * pos.y)
    var i2 = Math.ceil(xscale * pos.x)
    var j2 = Math.ceil(yscale * pos.y)

    vector[j1 * columns + i1] = 1
    vector[j1 * columns + i2] = 1
    vector[j2 * columns + i1] = 1
    vector[j2 * columns + i2] = 1

    redraw()
  }

  canvas.onmousedown = function(event) {
    canvas.onmousemove = draw
    draw(event)
  }

  canvas.onmouseup = function(event) {
    canvas.onmousemove = null
  }

  return {
    vector: vector,
    redraw: redraw,
    setVector: function(newVector) {
      vector = newVector
      redraw()
      fireDrawEvent()
    }
  }
}

var featureGrid = buildGrid(20, 25, function(index, td) {
  var img = document.createElement('img')
  img.classList.add('feature')
  return img
})

onload(function() {
  document.getElementById('feature-grid').appendChild(featureGrid.root)

  var canvas = document.getElementById('current-digit')
  var vectorCanvas = drawVectorCanvas(canvas, 28, 28)

  document.getElementById('digit-grid').addEventListener('choose-digit', function(event) {
    vectorCanvas.setVector(event.detail.input)
  })
})

function rbmParamsLoaded(json) {
  var params = RBM.load(json)
  var rbm = new RBM.RBMState(params)

  onload(function() {
    var currentFeatures = document.getElementById('current-features')
    var featureImages = precomputeFeatureImages(params.Wt)

    forEachElementByClassName('rbm-feature', function(elem) {
      var index = +elem.getAttribute('data-index')
      if(index) {
        elem.src = featureImages[index]
      }
    })

    featureGrid.elems.forEach(function(elem, index) {
      elem.src = featureImages[index]
    })

    document.getElementById('current-digit').addEventListener('draw', function(event) {
      rbm.visible = event.detail.vector
      rbm.sample_h_given_v()

      featureGrid.elems.forEach(function(elem, index) {
        elem.style.opacity = rbm.hidden[index]
      })
    })
  })
}

var digitColormap = Gradient.gradient([0, 1], [[255, 255, 255], [0, 0, 0]])

function mnistLoaded(mnist) {
  var width = mnist.geometry.width
  var height = mnist.geometry.height

  onload(function() {
    forEachElementByClassName('digit-grid', function(elem) {
      var grid = buildGrid(5, 10, function(index) {
        var img = document.createElement('img')
        img.classList.add('mnist-digit')
        img.setAttribute('data-index', index)
        return img
      })

      elem.appendChild(grid.root)
    })

    forEachElementByClassName('mnist-digit', function(elem) {
      var index = elem.getAttribute('data-index')
      if(index) {
        elem.src = extractImage(mnist.digits[index], width, height, digitColormap)
      }
    })

    document.getElementById('digit-grid').addEventListener('click', function(event) {
      var index = event.target.getAttribute('data-index')
      if(index) {
        var chooseEvent = new CustomEvent('choose-digit', {detail: {input: mnist.digits[index]}});
        event.currentTarget.dispatchEvent(chooseEvent)
      }
    })
  })
}

function showErrorInfo() {
  var html = 
    '<section class="error">' +
      '<h2>Couldn&rsquo;t load supporting data for this page properly!</h2>' +
      '<p>Try <a href="javascript:location.reload()">refreshing</a> the page.</p>' +
    '</section>'

  document.querySelector('section.title').insertAdjacentHTML('afterend', html)
}

function vectorToImageData(context, v, width, height, colormap) {
  var px = context.createImageData(width, height)

  var i, j;
  for(i = 0; i < width; i++) {
    for(j = 0; j < height; j++) {
      var idx = i*height + j
      var color = colormap(v[idx])
      var chan_idx = 4*idx

      px.data[chan_idx + 0] = color[0]
      px.data[chan_idx + 1] = color[1]
      px.data[chan_idx + 2] = color[2]
      px.data[chan_idx + 3] = 255
    }
  }

  return px
}

function extractImage(v, width, height, colormap) {
  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var context = canvas.getContext('2d')
  var imageData = vectorToImageData(context, v, width, height, colormap)
  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

})();

function clear(id) {
  var elem = document.getElementById(id)
  var event = new CustomEvent('clear')
  elem.dispatchEvent(event)
}
