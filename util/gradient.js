Gradient = (function() {

function binarySearch(x, array, l, r) {
  if(r <= l) {
    return l
  }

  var c = l + Math.floor((r - l) / 2)
  if(x == array[c]) {
    return c
  } else if(x < array[c]) {
    return binarySearch(x, array, l, c)
  } else {
    return binarySearch(x, array, c + 1, r)
  }
}

function blend(a, c1, c2) {
  return [
    (1-a)*c1[0] + a*c2[0],
    (1-a)*c1[1] + a*c2[1],
    (1-a)*c1[2] + a*c2[2]
  ]
}

function gradient(ticks, colors) {
  return function(x) {
    var idx = binarySearch(x, ticks, 0, ticks.length)
    if(idx == 0) {
      return colors[0]
    } else if(idx == colors.length) {
      return colors[idx-1]
    } else {
      var a = (x - ticks[idx-1]) / (ticks[idx] - ticks[idx-1])
      return blend(a, colors[idx-1], colors[idx])
    }
  }
}

return {
  binarySearch: binarySearch,
  gradient: gradient
}

})()
