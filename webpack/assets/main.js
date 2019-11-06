var dat = require('./vendor/dat.gui.min')
var $ = require('./vendor/jquery-3.1.1.min')

window.$ = $
window.jQuery = $

var Cube = require('./cube').Cube

var solver = require('./solver')
var interpolation = require('./interpolation')

var Face = require('./model').Face
var faces = require('./model').faces
var State = require('./state').State
var util = require('./util')
var algorithm = require('./algorithm')

var canvas = document.getElementById('canvas')
var colorSelector = $("#color-select")

$("#color-select button").click(function(){
    colorControls.sticker = util.charToFace($(this).attr("id").split("-")[1][0]);
    colorControls.cubie.setSticker(util.charToFace(colorControls.face), colorControls.sticker);
    colorSelector.css("display", "none");
    controls.state = cube.getState()
})

window.onresize = function(){
  colorSelector.css("display", "none");
}

var cube = new Cube(canvas, {
  size: Number(util.getQueryParameter('size') || 3),
  showLabels: true,
  state: util.getQueryParameter('state'),

  click: true,
  longClick: false,

  moveEndListener: function (move) {
    controls.state = cube.getState()
  },

  onCubieClick: cubieColorer,

  getColorSelectState: function () {
    if (colorSelector.css("display") == "none"){
        return false;
    }
    else return true;
  },

  cancelColorSelect: function() {
    colorSelector.css("display", "none");
  }
})

function cubieColorer(face, cubie, mouseX, mouseY) {
  colorControls.face = face;
  colorControls.cubie = cubie;
  colorSelector.css("display", "block");
  colorSelector.css("left", mouseX + 5 + "px");
  colorSelector.css("top", mouseY - 10 + "px");
}


var colorControls = {
  face: null,
  cubie: null,
  sticker: Face.NONE,
}


var gui = new dat.GUI()

var controls = {
  size: cube.size,
  scramble: function () {},
  solve: function () {},
  labels: cube.shouldShowLabels,
  camera: function () {},
  interpolator: function () {},
  duration: cube.anim.duration,
  state: cube.getState(),
  alg: util.getQueryParameter('algorithm') || '',
  button: function () {}, // used for other buttons
  algorithm: '',
  steps: '',
  isAnimationAuto: false, //whether run animation when click solve
  move: function () {},
}

var algorithms = ['公式法', '最短路径法'];

function initGui () {
  var c = folder('操作')
//  c.add(controls, 'size').min(1).step(1).name('Size')
//    .onChange(function (size) { cube.setSize(size); })
  c.add(controls, 'scramble').name('随机打乱')
    .onChange(function () { cube.scramble(); })
  c.add(controls, 'solve').name('解魔方')
    .onChange(function () { solve(controls.algorithm); })
  c.add(controls, 'algorithm', algorithms).setValue(algorithms[0]).name('算法')

  var v = folder('视角')
  v.add(controls, 'labels').name('显示方位标记').listen()
    .onFinishChange(function (v) { cube.setLabels(v); })
  v.add(controls, 'camera').name('重置摄像机')
    .onFinishChange(function () { cube.resetCamera(); })

  var s = folder('步骤分解')
  s.add(controls, 'steps').name('总步骤').listen()
  s.add(controls, 'isAnimationAuto').setValue(true).name('自动播放解法').listen()
  s.add(controls, 'move').name('执行当前步骤')
    .onFinishChange(function () { runCurrentStep(); })


//  var a = folder('Animation')
//  var interpolators = Object.keys(interpolation.interpolators)
//  a.add(controls, 'duration').min(0).step(100).setValue(300).name('Duration (ms)')
//    .onFinishChange(function (d) { cube.setAnimationDuration(d); })
//  a.add(controls, 'interpolator', interpolators).setValue(interpolators[0]).name('Interpolator')
//    .onFinishChange(function (i) { cube.setInterpolator(i); })

//  var st = folder('State')
//  st.add(controls, 'state').name('Modify State').listen()
//  st.add(controls, 'button').name('Apply State')
//    .onFinishChange(function () { cube.setState(controls.state); })

//  var alg = folder('算法')
//  alg.add(controls, 'alg').name('Edit Algorithm').listen()
//  alg.add(controls, 'button').name('Run')
//    .onFinishChange(function () { cube.algorithm(controls.alg); })
//  alg.add(controls, 'button').name('Invert')
//    .onFinishChange(function () { controls.alg = algorithm.invert(controls.alg); })

  if (window.innerWidth <= 500) gui.close()

  function folder (name) {
    var f = gui.addFolder(name)
    f.open()
    return f
  }
}
initGui()

canvas.addEventListener('click', clickListener)
canvas.focus()

function clickListener () {
  canvas.focus()
}

function runCurrentStep () {
  var splitSteps = controls.steps.split(' ')
  var currentStep = splitSteps[0]
  cube.algorithm(currentStep)
  var restSteps = ''
  for (var i = 1; i < splitSteps.length; i++) {
      if (i != splitSteps.length - 1){
        restSteps += splitSteps[i] + ' ';
      }
      else{
        restSteps += splitSteps[i];
      }
  }
  controls.steps = restSteps
}

function solve (selectedAlg) {
  // 公式法
  if (selectedAlg == algorithms[0]) {
    var alg = solver.solve(new State(cube.getState()))
    var opt = algorithm.optimize(alg)

    controls.steps = opt
    console.log('Algorithm:', alg)

    if (controls.isAnimationAuto) {
        cube.algorithm(opt)
    }
  }

  // DeepCubeA
  else if (selectedAlg == algorithms[1]) {
    $.ajax({
      type: "POST",
      url:"/solve_cube/",
      data: {
        state_str: cube.getState(),
        method_type: 1,
      },
      dateType:"json",
      async: true,
      success: function(data) {
        if (data.code == '1') {
          controls.steps = opt
          console.log('Algorithm:', alg)
          if (controls.isAnimationAuto) {
            cube.algorithm(opt)
          }
        }
        else{
          swal({
            text: data.message,
            type: "error"
          });
        }
      }
    });
  }
  else alert('Error Algorithm!');
}

module.exports = cube
