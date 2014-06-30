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
  // var featureColormap = Gradient.gradient([-1.5, 0, 1.5], [[59, 76, 192], [221, 220, 220], [180, 4, 40]])
  // var featureColormap = Gradient.gradient([-1.2, 0, 1.2], [[0x05, 0x71, 0xb0], [0xf7, 0xf7, 0xf7], [0xca, 0x00, 0x20]])
  // var featureColormap = Gradient.gradient(
  //   [-1.5, -0.25, 0, 0.1, 1],
  //   [[0x05, 0x71, 0xb0], [0xff, 0xff, 0xff], [0xff, 0xff, 0xff], [0xff, 0xff, 0xff], [0xca, 0x00, 0x20]])
  // var featureColormap = Gradient.gradient([-1, 0, 1], [[0x5e, 0x3c, 0x99], [0xf7, 0xf7, 0xf7], [0xe6, 0x61, 0x01]])
  // var featureColormap = Gradient.gradient(
  //   [-0.8, 0, 0.8],
  //   [[0x0, 0x0, 0.0], [0x7f, 0x7f, 0x7f], [0xff, 0xff, 0xff]])

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

var featureGrid = buildGrid(20, 25, function(index, td) {
  var img = document.createElement('img')
  img.classList.add('feature')
  return img
})

onload(function() {
  document.getElementById('feature-grid').appendChild(featureGrid.root)
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

    var gridColumns = 25
    var gridRows = 20
    document.getElementById('digit-grid').addEventListener('choose-input', function(event) {
      rbm.visible = event.detail.input
      rbm.sample_h_given_v()

      featureGrid.elems.forEach(function(elem, index) {
        if(rbm.hidden[index] > 0.5) {
          elem.classList.add('active')
        } else {
          elem.classList.remove('active')
        }
      })
    })
  })
}

function mnistLoaded(mnist) {
  var width = mnist.geometry.width
  var height = mnist.geometry.height
  var colormap = Gradient.gradient([0, 1], [[255, 255, 255], [0, 0, 0]])

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
        elem.src = extractImage(mnist.digits[index], width, height, colormap)
      }
    })

    var currentDigit = document.getElementById('current-digit')
    document.getElementById('digit-grid').addEventListener('click', function(event) {
      var index = event.target.getAttribute('data-index')
      if(index) {
        currentDigit.src = event.target.src
        var chooseEvent = new CustomEvent('choose-input', {detail: {input: mnist.digits[index]}});
        event.currentTarget.dispatchEvent(chooseEvent)
      }
    })
  })
}

function showErrorInfo() {
  var html = 
    '<section class="error">' +
      '<h2>Could not load supporting data for this page properly!</h2>' +
      '<p>Try <a href="javascript:location.reload()">refreshing</a> the page.</p>' +
    '</section>'

  document.querySelector('section.title').insertAdjacentHTML('afterend', html)
}

function extractImage(v, width, height, colormap) {
  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var context = canvas.getContext('2d')
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

  context.putImageData(px, 0, 0)
  return canvas.toDataURL('image/png')
}

})();
