(function(){

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

window.RBM = init_RBM(numeric)

get('/data/rbm-params-500.json', rbmParamsLoaded, showErrorInfo)
get('/data/mnist-50.json', mnistLoaded, showErrorInfo)

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
  var featureColormap = Gradient.gradient([-1.5, 0, 1.5], [[0x05, 0x71, 0xb0], [0xf7, 0xf7, 0xf7], [0xca, 0x00, 0x20]])

  var features = []
  for(var i = 0; i < Wt.length; i++) {
    features[i] = extractImage(Wt[i], 28, 28, featureColormap)
  }
  return features
}

function rbmParamsLoaded(json) {
  var params = RBM.load(json)
  var rbm = new RBM.RBMState(params)
  var currentActivation = document.getElementById('current-activation')
  var currentFeatures = document.getElementById('current-features')
  var featureImages = precomputeFeatureImages(params.Wt)
  var activationColormap = Gradient.gradient([-1, 0, 1], [[0, 0, 255], [255, 255, 255], [255, 0, 0]])

  forEachElementByClassName('rbm-feature', function(elem) {
    var index = +elem.getAttribute('data-index')
    if(index) {
      elem.src = featureImages[index]
    }
  })

  document.getElementById('digit-grid').addEventListener('choose-input', function(event) {
    rbm.visible = event.detail.input
    rbm.sample_h_given_v()
    currentActivation.src = extractImage(rbm.hidden, 25, 20, activationColormap)
    var features = topFeatures(rbm.hidden, 50)

    clearChildren(currentFeatures)
    features.forEach(function(featureIndex) {
      var node = document.createElement("img")
      node.src = featureImages[featureIndex]
      currentFeatures.appendChild(node)
    })
  })
}

function mnistLoaded(mnist) {
  var width = mnist.geometry.width
  var height = mnist.geometry.height
  var colormap = Gradient.gradient([0, 1], [[255, 255, 255], [0, 0, 0]])

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
}

function showErrorInfo() {
  document.getElementById('load-error-information').style.display = 'block'
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
