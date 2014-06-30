/*

RBM

n = input layer size
k = hidden layer size

rbm = {
  "W": <Matrix (n, k)>  // Connection Weight Matrix
  "h": <Vector (n)>     // Hidden Unit Bias
  "v": <Vector (n)>     // Visible Unit Bias
}

*/

RBM = (function(numeric) {

function load(params) {
  return {
    W: params.W,
    Wt: numeric.transpose(params.W),
    hbias: params.h,
    vbias: params.v
  }
}

function sigmoid(input) {
  for(var i = 0; i < input.length; i++) {
    input[i] = 1 / (1 + Math.exp(-input[i]))
  }
}

function binomial(input) {
  for(var i = 0; i < input.length; i++) {
    input[i] = Math.random() < input[i] ? 1 : 0
  }
}

function sample(input, W, bias) {
  var output = numeric.add(numeric.dot(W, input), bias)
  sigmoid(output)
  binomial(output)

  return output
}

function RBMState(params) {
  this.params = params
  this.hidden = []
  this.visible = []
}

RBMState.prototype.sample_h_given_v = function() {
  this.hidden = sample(this.visible, this.params.Wt, this.params.hbias)
};

RBMState.prototype.sample_v_given_h = function() {
  this.visible = sample(this.hidden, this.params.W, this.params.vbias)
};

return {
  load: load,
  RBMState: RBMState
}

})(numeric);
