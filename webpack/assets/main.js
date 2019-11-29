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
  reset: function () {},
  algorithm: '',
  steps: '',
  isAnimationAuto: false, //whether run animation when click solve
  move: function () {},
}

var algorithms = ['公式法', 'DeepCubeA'];

function initGui () {
  var v = folder('视角')
  v.add(controls, 'labels').name('显示方位标记').listen()
    .onFinishChange(function (v) { cube.setLabels(v); })
  v.add(controls, 'camera').name('重置摄像机')
    .onFinishChange(function () { cube.resetCamera(); })

  var st = folder('魔方状态')
  st.add(controls, 'scramble').name('随机打乱')
    .onChange(function () { cube.scramble(); controls.steps = '';})
  st.add(controls, 'state').name('当前状态').listen()
  st.add(controls, 'button').name('修改状态')
    .onFinishChange(function () { cube.setState(controls.state); controls.steps = '';})
  st.add(controls, 'reset').name('重置状态')
    .onFinishChange(function () { cube.setState('UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'); controls.steps = '';})

  var c = folder('魔方求解')
  c.add(controls, 'algorithm', algorithms).setValue(algorithms[0]).name('算法').listen()
  c.add(controls, 'isAnimationAuto').setValue(true).name('自动播放解法').listen()
  c.add(controls, 'solve').name('解魔方')
    .onChange(function () { solve(controls.algorithm); })

  var s = folder('求解结果')
  s.add(controls, 'steps').name('总步骤').listen()
  s.add(controls, 'move').name('执行当前步骤')
    .onFinishChange(function () { runCurrentStep(); })

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
      url:"/is_fast_deepcubea/",
      data: {
        state_str: cube.getState(),
      },
      dateType:"json",
      async: true,
      success: function(data) {
        if (data.code == '1') {

          swal({
            title: "正在求解中...",
            showConfirmButton: false,
            showLoaderOnConfirm: true,
            imageUrl: "/static/img/loading.gif",
            showCancelButton: true,
          });

          $.ajax({
              type: "POST",
              url:"/solve_cube/",
              data: {
                state_str: data.id_seq,
                method_type: 1,
              },
              dateType:"json",
              async: true,
              success: function(data) {
                if (data.code == '1') {
                  opt = data.moves
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
        else if (data.code == '2') {
          swal({
            text: data.message,
            type: "info",
          }).then(function() {
              controls.algorithm = algorithms[0]
              var alg = solver.solve(new State(cube.getState()))
              var opt = algorithm.optimize(alg)

              controls.steps = opt
              console.log('Algorithm:', alg)

              if (controls.isAnimationAuto) {
                cube.algorithm(opt)
              }
            });
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
