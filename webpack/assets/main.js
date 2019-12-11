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
    old_state = cube.getState();
    colorControls.sticker = util.charToFace($(this).attr("id").split("-")[1][0]);
    colorControls.cubie.setSticker(util.charToFace(colorControls.face), colorControls.sticker);
    colorSelector.css("display", "none");
    new_state = cube.getState();
    if (old_state[4]==new_state[4] &&
        old_state[13]==new_state[13] &&
        old_state[22]==new_state[22] &&
        old_state[31]==new_state[31] &&
        old_state[40]==new_state[40] &&
        old_state[49]==new_state[49]){
            controls.state = cube.getState()
        }
    else{
        cube.setState(old_state)
        swal({
            text: "中间色块无法修改",
            type: "error"
          });
    }

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
  movedSteps: '',
  isAnimationAuto: false, //whether run animation when click solve
}

var algorithms = ['层先法', 'CFOP', 'Kociemba', 'DeepCubeA'];

function initGui () {
  var v = folder('视角')
  v.add(controls, 'labels').name('显示方位标记').listen()
    .onFinishChange(function (v) { cube.setLabels(v); })
  v.add(controls, 'camera').name('重置摄像机')
    .onFinishChange(function () { cube.resetCamera(); })

  var st = folder('魔方状态')
  st.add(controls, 'scramble').name('随机打乱')
    .onChange(function () { cube.scramble(); controls.steps = ''; controls.movedSteps = '';})
  st.add(controls, 'state').name('当前状态').listen()
  st.add(controls, 'button').name('修改状态')
    .onFinishChange(function () { cube.setState(controls.state); controls.steps = ''; controls.movedSteps = '';})
  st.add(controls, 'button').name('重置状态')
    .onFinishChange(function () { cube.setState('UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'); controls.steps = ''; controls.movedSteps = '';})

  var c = folder('魔方求解')
  c.add(controls, 'algorithm', algorithms).setValue(algorithms[0]).name('算法').listen()
  c.add(controls, 'isAnimationAuto').setValue(true).name('自动播放解法').listen()
  c.add(controls, 'solve').name('解魔方')
    .onChange(function () { solve(controls.algorithm); })

  var s = folder('求解结果')
  s.add(controls, 'steps').name('步骤').listen()
  s.add(controls, 'movedSteps').name('已执行步骤').listen()
  s.add(controls, 'button').name('单步执行')
    .onFinishChange(function () { moveSingleForward(); })
  s.add(controls, 'button').name('单步回退')
    .onFinishChange(function () { moveSingleBackward(); })
  s.add(controls, 'button').name('执行剩余步骤')
    .onFinishChange(function () { moveAllForward(); })
  s.add(controls, 'button').name('回退所有步骤')
    .onFinishChange(function () { moveAllBackward(); })

  var test = folder('测试')
  test.add(controls, 'button').name('测试层先法性能')
    .onFinishChange(function () { testLayerFirst(); })

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

function moveSingleForward () {
  // get current step
  var splitSteps = controls.steps.split(' ')
  var currentStep = splitSteps[0]

  // call API to run current step
  cube.algorithm(currentStep)

  //  update controls.steps
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

  // update controls.movedSteps
  if (controls.movedSteps.length != 0){
    controls.movedSteps += (' ' + currentStep)
  }
  else {
    controls.movedSteps += currentStep
  }
}

function moveAllForward () {
    while (controls.steps.length != 0){
        moveSingleForward ()
    }
}

function moveSingleBackward() {
  // get last step
  var splitSteps = controls.movedSteps.split(' ')
  var lastStep = splitSteps[splitSteps.length-1]

  // reverse last step
  var reverseLastStep = algorithm.invert(lastStep)

  // call API to run reversed last step
  cube.algorithm(reverseLastStep)

  // update controls.movedSteps
  var restSteps = ''
  for (var i = 0; i < splitSteps.length-1; i++) {
      if (i != splitSteps.length - 2){
        restSteps += splitSteps[i] + ' ';
      }
      else{
        restSteps += splitSteps[i];
      }
  }
  controls.movedSteps = restSteps

  // update controls.steps
  if (controls.steps.length != 0){
    controls.steps = (lastStep + ' ' + controls.steps)
  }
  else {
    controls.steps = lastStep
  }
}

function moveAllBackward() {
    while (controls.movedSteps.length != 0){
        moveSingleBackward ()
    }
}


function solve (selectedAlg) {

  if (cube.getState() == 'UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'){
    swal({
      text: "魔方已处于还原状态",
      type: "info"
    });
  }
  else{
    // 层先法
  if (selectedAlg == algorithms[0]) {
    var alg = solver.solve(new State(cube.getState()))
    var opt = algorithm.optimize(alg)

    controls.steps = opt
    console.log('Algorithm:', alg)

    if (controls.isAnimationAuto) {
        moveAllForward();
    }
  }

  // CFOP、Kociemba、DeepCubeA
  else if (selectedAlg == algorithms[1] || selectedAlg == algorithms[2] || selectedAlg == algorithms[3]) {

    $.ajax({
      type: "POST",
      url:"/verify_legality/",
      data: {
        state_str: cube.getState(),
        method_type: algorithms.indexOf(selectedAlg),
      },
      dateType:"json",
      async: true,
      success: function(data) {
        if (data.code == '1') {

          swal({
            text: "正在求解中...",
            showConfirmButton: false,
            showLoaderOnConfirm: true,
            imageUrl: "/static/img/loading.gif",
            allowOutsideClick: false,
          });

          $.ajax({
              type: "POST",
              url:"/solve_cube/",
              data: {
                state_str: cube.getState(),
                method_type: algorithms.indexOf(selectedAlg),
              },
              dateType:"json",
              async: true,
              success: function(data) {
                if (data.code == '1') {
                  swal.close()
                  opt = data.moves
                  controls.steps = opt
                  console.log('Algorithm:', alg)
                  if (controls.isAnimationAuto) {
                    moveAllForward();
                  }
                }
                else{
                  swal({
                    text: "求解失败，请重试",
                    type: "error"
                  });
                }
              }
          });
        }
        else{
          swal({
            text: "魔方状态不合法",
            type: "error"
          });
        }
      }
    });
  }
  else alert('Error Algorithm!');
  }
}

function testLayerFirst(){
    $.getJSON("test_states_by_face.json", function (data){
         var start_time = new Date().getTime();

    });
}

module.exports = cube
