/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/build/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var dat = __webpack_require__(1)
	var $ = __webpack_require__(2)

	window.$ = $
	window.jQuery = $

	var Cube = __webpack_require__(4).Cube

	var solver = __webpack_require__(15)
	var interpolation = __webpack_require__(17)

	var Face = __webpack_require__(9).Face
	var faces = __webpack_require__(9).faces
	var State = __webpack_require__(14).State
	var util = __webpack_require__(8)
	var algorithm = __webpack_require__(13)

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
	    .onChange(function () { cube.scramble(); controls.steps = '';})
	  st.add(controls, 'state').name('当前状态').listen()
	  st.add(controls, 'button').name('修改状态')
	    .onFinishChange(function () { cube.setState(controls.state); controls.steps = '';})
	  st.add(controls, 'button').name('重置状态')
	    .onFinishChange(function () { cube.setState('UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'); controls.steps = '';})

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
	      if (i != splitSteps.length - 1){
	        restSteps += splitSteps[i] + ' ';
	      }
	      else{
	        restSteps += splitSteps[i];
	      }
	  }
	  controls.movedSteps = restSteps

	  // update controls.steps
	  if (controls.steps.length != 0){
	    controls.steps = (lastStep + ' ' + currentStepcontrols.movedSteps)
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


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	/**
	 * dat-gui JavaScript Controller Library
	 * http://code.google.com/p/dat-gui
	 *
	 * Copyright 2011 Data Arts Team, Google Creative Lab
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 */
	var dat=dat||{};dat.gui=dat.gui||{};dat.utils=dat.utils||{};dat.controllers=dat.controllers||{};dat.dom=dat.dom||{};dat.color=dat.color||{};dat.utils.css=function(){return{load:function(f,a){a=a||document;var d=a.createElement("link");d.type="text/css";d.rel="stylesheet";d.href=f;a.getElementsByTagName("head")[0].appendChild(d)},inject:function(f,a){a=a||document;var d=document.createElement("style");d.type="text/css";d.innerHTML=f;a.getElementsByTagName("head")[0].appendChild(d)}}}();
	dat.utils.common=function(){var f=Array.prototype.forEach,a=Array.prototype.slice;return{BREAK:{},extend:function(d){this.each(a.call(arguments,1),function(a){for(var c in a)this.isUndefined(a[c])||(d[c]=a[c])},this);return d},defaults:function(d){this.each(a.call(arguments,1),function(a){for(var c in a)this.isUndefined(d[c])&&(d[c]=a[c])},this);return d},compose:function(){var d=a.call(arguments);return function(){for(var e=a.call(arguments),c=d.length-1;0<=c;c--)e=[d[c].apply(this,e)];return e[0]}},
	each:function(a,e,c){if(a)if(f&&a.forEach&&a.forEach===f)a.forEach(e,c);else if(a.length===a.length+0)for(var b=0,p=a.length;b<p&&!(b in a&&e.call(c,a[b],b)===this.BREAK);b++);else for(b in a)if(e.call(c,a[b],b)===this.BREAK)break},defer:function(a){setTimeout(a,0)},toArray:function(d){return d.toArray?d.toArray():a.call(d)},isUndefined:function(a){return void 0===a},isNull:function(a){return null===a},isNaN:function(a){return a!==a},isArray:Array.isArray||function(a){return a.constructor===Array},
	isObject:function(a){return a===Object(a)},isNumber:function(a){return a===a+0},isString:function(a){return a===a+""},isBoolean:function(a){return!1===a||!0===a},isFunction:function(a){return"[object Function]"===Object.prototype.toString.call(a)}}}();
	dat.controllers.Controller=function(f){var a=function(a,e){this.initialValue=a[e];this.domElement=document.createElement("div");this.object=a;this.property=e;this.__onFinishChange=this.__onChange=void 0};f.extend(a.prototype,{onChange:function(a){this.__onChange=a;return this},onFinishChange:function(a){this.__onFinishChange=a;return this},setValue:function(a){this.object[this.property]=a;this.__onChange&&this.__onChange.call(this,a);this.updateDisplay();return this},getValue:function(){return this.object[this.property]},
	updateDisplay:function(){return this},isModified:function(){return this.initialValue!==this.getValue()}});return a}(dat.utils.common);
	dat.dom.dom=function(f){function a(b){if("0"===b||f.isUndefined(b))return 0;b=b.match(e);return f.isNull(b)?0:parseFloat(b[1])}var d={};f.each({HTMLEvents:["change"],MouseEvents:["click","mousemove","mousedown","mouseup","mouseover"],KeyboardEvents:["keydown"]},function(b,a){f.each(b,function(b){d[b]=a})});var e=/(\d+(\.\d+)?)px/,c={makeSelectable:function(b,a){void 0!==b&&void 0!==b.style&&(b.onselectstart=a?function(){return!1}:function(){},b.style.MozUserSelect=a?"auto":"none",b.style.KhtmlUserSelect=
	a?"auto":"none",b.unselectable=a?"on":"off")},makeFullscreen:function(b,a,c){f.isUndefined(a)&&(a=!0);f.isUndefined(c)&&(c=!0);b.style.position="absolute";a&&(b.style.left=0,b.style.right=0);c&&(b.style.top=0,b.style.bottom=0)},fakeEvent:function(b,a,c,e){c=c||{};var r=d[a];if(!r)throw Error("Event type "+a+" not supported.");var n=document.createEvent(r);switch(r){case "MouseEvents":n.initMouseEvent(a,c.bubbles||!1,c.cancelable||!0,window,c.clickCount||1,0,0,c.x||c.clientX||0,c.y||c.clientY||0,!1,
	!1,!1,!1,0,null);break;case "KeyboardEvents":r=n.initKeyboardEvent||n.initKeyEvent;f.defaults(c,{cancelable:!0,ctrlKey:!1,altKey:!1,shiftKey:!1,metaKey:!1,keyCode:void 0,charCode:void 0});r(a,c.bubbles||!1,c.cancelable,window,c.ctrlKey,c.altKey,c.shiftKey,c.metaKey,c.keyCode,c.charCode);break;default:n.initEvent(a,c.bubbles||!1,c.cancelable||!0)}f.defaults(n,e);b.dispatchEvent(n)},bind:function(a,e,d,f){a.addEventListener?a.addEventListener(e,d,f||!1):a.attachEvent&&a.attachEvent("on"+e,d);return c},
	unbind:function(a,e,d,f){a.removeEventListener?a.removeEventListener(e,d,f||!1):a.detachEvent&&a.detachEvent("on"+e,d);return c},addClass:function(a,e){if(void 0===a.className)a.className=e;else if(a.className!==e){var d=a.className.split(/ +/);-1==d.indexOf(e)&&(d.push(e),a.className=d.join(" ").replace(/^\s+/,"").replace(/\s+$/,""))}return c},removeClass:function(a,e){if(e){if(void 0!==a.className)if(a.className===e)a.removeAttribute("class");else{var d=a.className.split(/ +/),f=d.indexOf(e);-1!=
	f&&(d.splice(f,1),a.className=d.join(" "))}}else a.className=void 0;return c},hasClass:function(a,c){return(new RegExp("(?:^|\\s+)"+c+"(?:\\s+|$)")).test(a.className)||!1},getWidth:function(b){b=getComputedStyle(b);return a(b["border-left-width"])+a(b["border-right-width"])+a(b["padding-left"])+a(b["padding-right"])+a(b.width)},getHeight:function(b){b=getComputedStyle(b);return a(b["border-top-width"])+a(b["border-bottom-width"])+a(b["padding-top"])+a(b["padding-bottom"])+a(b.height)},getOffset:function(a){var c=
	{left:0,top:0};if(a.offsetParent){do c.left+=a.offsetLeft,c.top+=a.offsetTop;while(a=a.offsetParent)}return c},isActive:function(a){return a===document.activeElement&&(a.type||a.href)}};return c}(dat.utils.common);
	dat.controllers.OptionController=function(f,a,d){var e=function(c,b,f){e.superclass.call(this,c,b);var q=this;this.__select=document.createElement("select");if(d.isArray(f)){var l={};d.each(f,function(a){l[a]=a});f=l}d.each(f,function(a,b){var c=document.createElement("option");c.innerHTML=b;c.setAttribute("value",a);q.__select.appendChild(c)});this.updateDisplay();a.bind(this.__select,"change",function(){q.setValue(this.options[this.selectedIndex].value)});this.domElement.appendChild(this.__select)};
	e.superclass=f;d.extend(e.prototype,f.prototype,{setValue:function(a){a=e.superclass.prototype.setValue.call(this,a);this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue());return a},updateDisplay:function(){this.__select.value=this.getValue();return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common);
	dat.controllers.NumberController=function(f,a){function d(a){a=a.toString();return-1<a.indexOf(".")?a.length-a.indexOf(".")-1:0}var e=function(c,b,f){e.superclass.call(this,c,b);f=f||{};this.__min=f.min;this.__max=f.max;this.__step=f.step;a.isUndefined(this.__step)?this.__impliedStep=0==this.initialValue?1:Math.pow(10,Math.floor(Math.log(Math.abs(this.initialValue))/Math.LN10))/10:this.__impliedStep=this.__step;this.__precision=d(this.__impliedStep)};e.superclass=f;a.extend(e.prototype,f.prototype,
	{setValue:function(a){void 0!==this.__min&&a<this.__min?a=this.__min:void 0!==this.__max&&a>this.__max&&(a=this.__max);void 0!==this.__step&&0!=a%this.__step&&(a=Math.round(a/this.__step)*this.__step);return e.superclass.prototype.setValue.call(this,a)},min:function(a){this.__min=a;return this},max:function(a){this.__max=a;return this},step:function(a){this.__impliedStep=this.__step=a;this.__precision=d(a);return this}});return e}(dat.controllers.Controller,dat.utils.common);
	dat.controllers.NumberControllerBox=function(f,a,d){var e=function(c,b,f){function q(){var a=parseFloat(n.__input.value);d.isNaN(a)||n.setValue(a)}function l(a){var b=u-a.clientY;n.setValue(n.getValue()+b*n.__impliedStep);u=a.clientY}function r(){a.unbind(window,"mousemove",l);a.unbind(window,"mouseup",r)}this.__truncationSuspended=!1;e.superclass.call(this,c,b,f);var n=this,u;this.__input=document.createElement("input");this.__input.setAttribute("type","text");a.bind(this.__input,"change",q);a.bind(this.__input,
	"blur",function(){q();n.__onFinishChange&&n.__onFinishChange.call(n,n.getValue())});a.bind(this.__input,"mousedown",function(b){a.bind(window,"mousemove",l);a.bind(window,"mouseup",r);u=b.clientY});a.bind(this.__input,"keydown",function(a){13===a.keyCode&&(n.__truncationSuspended=!0,this.blur(),n.__truncationSuspended=!1)});this.updateDisplay();this.domElement.appendChild(this.__input)};e.superclass=f;d.extend(e.prototype,f.prototype,{updateDisplay:function(){var a=this.__input,b;if(this.__truncationSuspended)b=
	this.getValue();else{b=this.getValue();var d=Math.pow(10,this.__precision);b=Math.round(b*d)/d}a.value=b;return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.NumberController,dat.dom.dom,dat.utils.common);
	dat.controllers.NumberControllerSlider=function(f,a,d,e,c){function b(a,b,c,e,d){return e+(a-b)/(c-b)*(d-e)}var p=function(c,e,d,f,u){function A(c){c.preventDefault();var e=a.getOffset(k.__background),d=a.getWidth(k.__background);k.setValue(b(c.clientX,e.left,e.left+d,k.__min,k.__max));return!1}function g(){a.unbind(window,"mousemove",A);a.unbind(window,"mouseup",g);k.__onFinishChange&&k.__onFinishChange.call(k,k.getValue())}p.superclass.call(this,c,e,{min:d,max:f,step:u});var k=this;this.__background=
	document.createElement("div");this.__foreground=document.createElement("div");a.bind(this.__background,"mousedown",function(b){a.bind(window,"mousemove",A);a.bind(window,"mouseup",g);A(b)});a.addClass(this.__background,"slider");a.addClass(this.__foreground,"slider-fg");this.updateDisplay();this.__background.appendChild(this.__foreground);this.domElement.appendChild(this.__background)};p.superclass=f;p.useDefaultStyles=function(){d.inject(c)};e.extend(p.prototype,f.prototype,{updateDisplay:function(){var a=
	(this.getValue()-this.__min)/(this.__max-this.__min);this.__foreground.style.width=100*a+"%";return p.superclass.prototype.updateDisplay.call(this)}});return p}(dat.controllers.NumberController,dat.dom.dom,dat.utils.css,dat.utils.common,"/**\n * dat-gui JavaScript Controller Library\n * http://code.google.com/p/dat-gui\n *\n * Copyright 2011 Data Arts Team, Google Creative Lab\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n */\n\n.slider {\n  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);\n  height: 1em;\n  border-radius: 1em;\n  background-color: #eee;\n  padding: 0 0.5em;\n  overflow: hidden;\n}\n\n.slider-fg {\n  padding: 1px 0 2px 0;\n  background-color: #aaa;\n  height: 1em;\n  margin-left: -0.5em;\n  padding-right: 0.5em;\n  border-radius: 1em 0 0 1em;\n}\n\n.slider-fg:after {\n  display: inline-block;\n  border-radius: 1em;\n  background-color: #fff;\n  border:  1px solid #aaa;\n  content: '';\n  float: right;\n  margin-right: -1em;\n  margin-top: -1px;\n  height: 0.9em;\n  width: 0.9em;\n}");
	dat.controllers.FunctionController=function(f,a,d){var e=function(c,b,d){e.superclass.call(this,c,b);var f=this;this.__button=document.createElement("div");this.__button.innerHTML=void 0===d?"Fire":d;a.bind(this.__button,"click",function(a){a.preventDefault();f.fire();return!1});a.addClass(this.__button,"button");this.domElement.appendChild(this.__button)};e.superclass=f;d.extend(e.prototype,f.prototype,{fire:function(){this.__onChange&&this.__onChange.call(this);this.getValue().call(this.object);
	this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue())}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common);
	dat.controllers.BooleanController=function(f,a,d){var e=function(c,b){e.superclass.call(this,c,b);var d=this;this.__prev=this.getValue();this.__checkbox=document.createElement("input");this.__checkbox.setAttribute("type","checkbox");a.bind(this.__checkbox,"change",function(){d.setValue(!d.__prev)},!1);this.domElement.appendChild(this.__checkbox);this.updateDisplay()};e.superclass=f;d.extend(e.prototype,f.prototype,{setValue:function(a){a=e.superclass.prototype.setValue.call(this,a);this.__onFinishChange&&
	this.__onFinishChange.call(this,this.getValue());this.__prev=this.getValue();return a},updateDisplay:function(){!0===this.getValue()?(this.__checkbox.setAttribute("checked","checked"),this.__checkbox.checked=!0):this.__checkbox.checked=!1;return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common);
	dat.color.toString=function(f){return function(a){if(1==a.a||f.isUndefined(a.a)){for(a=a.hex.toString(16);6>a.length;)a="0"+a;return"#"+a}return"rgba("+Math.round(a.r)+","+Math.round(a.g)+","+Math.round(a.b)+","+a.a+")"}}(dat.utils.common);
	dat.color.interpret=function(f,a){var d,e,c=[{litmus:a.isString,conversions:{THREE_CHAR_HEX:{read:function(a){a=a.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);return null===a?!1:{space:"HEX",hex:parseInt("0x"+a[1].toString()+a[1].toString()+a[2].toString()+a[2].toString()+a[3].toString()+a[3].toString())}},write:f},SIX_CHAR_HEX:{read:function(a){a=a.match(/^#([A-F0-9]{6})$/i);return null===a?!1:{space:"HEX",hex:parseInt("0x"+a[1].toString())}},write:f},CSS_RGB:{read:function(a){a=a.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
	return null===a?!1:{space:"RGB",r:parseFloat(a[1]),g:parseFloat(a[2]),b:parseFloat(a[3])}},write:f},CSS_RGBA:{read:function(a){a=a.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);return null===a?!1:{space:"RGB",r:parseFloat(a[1]),g:parseFloat(a[2]),b:parseFloat(a[3]),a:parseFloat(a[4])}},write:f}}},{litmus:a.isNumber,conversions:{HEX:{read:function(a){return{space:"HEX",hex:a,conversionName:"HEX"}},write:function(a){return a.hex}}}},{litmus:a.isArray,conversions:{RGB_ARRAY:{read:function(a){return 3!=
	a.length?!1:{space:"RGB",r:a[0],g:a[1],b:a[2]}},write:function(a){return[a.r,a.g,a.b]}},RGBA_ARRAY:{read:function(a){return 4!=a.length?!1:{space:"RGB",r:a[0],g:a[1],b:a[2],a:a[3]}},write:function(a){return[a.r,a.g,a.b,a.a]}}}},{litmus:a.isObject,conversions:{RGBA_OBJ:{read:function(b){return a.isNumber(b.r)&&a.isNumber(b.g)&&a.isNumber(b.b)&&a.isNumber(b.a)?{space:"RGB",r:b.r,g:b.g,b:b.b,a:b.a}:!1},write:function(a){return{r:a.r,g:a.g,b:a.b,a:a.a}}},RGB_OBJ:{read:function(b){return a.isNumber(b.r)&&
	a.isNumber(b.g)&&a.isNumber(b.b)?{space:"RGB",r:b.r,g:b.g,b:b.b}:!1},write:function(a){return{r:a.r,g:a.g,b:a.b}}},HSVA_OBJ:{read:function(b){return a.isNumber(b.h)&&a.isNumber(b.s)&&a.isNumber(b.v)&&a.isNumber(b.a)?{space:"HSV",h:b.h,s:b.s,v:b.v,a:b.a}:!1},write:function(a){return{h:a.h,s:a.s,v:a.v,a:a.a}}},HSV_OBJ:{read:function(b){return a.isNumber(b.h)&&a.isNumber(b.s)&&a.isNumber(b.v)?{space:"HSV",h:b.h,s:b.s,v:b.v}:!1},write:function(a){return{h:a.h,s:a.s,v:a.v}}}}}];return function(){e=!1;
	var b=1<arguments.length?a.toArray(arguments):arguments[0];a.each(c,function(c){if(c.litmus(b))return a.each(c.conversions,function(c,f){d=c.read(b);if(!1===e&&!1!==d)return e=d,d.conversionName=f,d.conversion=c,a.BREAK}),a.BREAK});return e}}(dat.color.toString,dat.utils.common);
	dat.GUI=dat.gui.GUI=function(f,a,d,e,c,b,p,q,l,r,n,u,A,g,k){function v(a,b,h,d){if(void 0===b[h])throw Error("Object "+b+' has no property "'+h+'"');d.color?b=new n(b,h):(b=[b,h].concat(d.factoryArgs),b=e.apply(a,b));d.before instanceof c&&(d.before=d.before.__li);y(a,b);g.addClass(b.domElement,"c");h=document.createElement("span");g.addClass(h,"property-name");h.innerHTML=b.property;var f=document.createElement("div");f.appendChild(h);f.appendChild(b.domElement);d=w(a,f,d.before);g.addClass(d,m.CLASS_CONTROLLER_ROW);
	g.addClass(d,typeof b.getValue());t(a,d,b);a.__controllers.push(b);return b}function w(a,b,h){var c=document.createElement("li");b&&c.appendChild(b);h?a.__ul.insertBefore(c,params.before):a.__ul.appendChild(c);a.onResize();return c}function t(a,c,h){h.__li=c;h.__gui=a;k.extend(h,{options:function(b){if(1<arguments.length)return h.remove(),v(a,h.object,h.property,{before:h.__li.nextElementSibling,factoryArgs:[k.toArray(arguments)]});if(k.isArray(b)||k.isObject(b))return h.remove(),v(a,h.object,h.property,
	{before:h.__li.nextElementSibling,factoryArgs:[b]})},name:function(a){h.__li.firstElementChild.firstElementChild.innerHTML=a;return h},listen:function(){h.__gui.listen(h);return h},remove:function(){h.__gui.remove(h);return h}});if(h instanceof l){var d=new q(h.object,h.property,{min:h.__min,max:h.__max,step:h.__step});k.each(["updateDisplay","onChange","onFinishChange"],function(a){var K=h[a],b=d[a];h[a]=d[a]=function(){var a=Array.prototype.slice.call(arguments);K.apply(h,a);return b.apply(d,a)}});
	g.addClass(c,"has-slider");h.domElement.insertBefore(d.domElement,h.domElement.firstElementChild)}else if(h instanceof q){var e=function(b){return k.isNumber(h.__min)&&k.isNumber(h.__max)?(h.remove(),v(a,h.object,h.property,{before:h.__li.nextElementSibling,factoryArgs:[h.__min,h.__max,h.__step]})):b};h.min=k.compose(e,h.min);h.max=k.compose(e,h.max)}else h instanceof b?(g.bind(c,"click",function(){g.fakeEvent(h.__checkbox,"click")}),g.bind(h.__checkbox,"click",function(a){a.stopPropagation()})):
	h instanceof p?(g.bind(c,"click",function(){g.fakeEvent(h.__button,"click")}),g.bind(c,"mouseover",function(){g.addClass(h.__button,"hover")}),g.bind(c,"mouseout",function(){g.removeClass(h.__button,"hover")})):h instanceof n&&(g.addClass(c,"color"),h.updateDisplay=k.compose(function(a){c.style.borderLeftColor=h.__color.toString();return a},h.updateDisplay),h.updateDisplay());h.setValue=k.compose(function(b){a.getRoot().__preset_select&&h.isModified()&&E(a.getRoot(),!0);return b},h.setValue)}function y(a,
	b){var c=a.getRoot(),d=c.__rememberedObjects.indexOf(b.object);if(-1!=d){var e=c.__rememberedObjectIndecesToControllers[d];void 0===e&&(e={},c.__rememberedObjectIndecesToControllers[d]=e);e[b.property]=b;if(c.load&&c.load.remembered){c=c.load.remembered;if(c[a.preset])c=c[a.preset];else if(c.Default)c=c.Default;else return;c[d]&&void 0!==c[d][b.property]&&(d=c[d][b.property],b.initialValue=d,b.setValue(d))}}}function L(a){var b=a.__save_row=document.createElement("li");g.addClass(a.domElement,"has-save");
	a.__ul.insertBefore(b,a.__ul.firstChild);g.addClass(b,"save-row");var c=document.createElement("span");c.innerHTML="&nbsp;";g.addClass(c,"button gears");var d=document.createElement("span");d.innerHTML="Save";g.addClass(d,"button");g.addClass(d,"save");var e=document.createElement("span");e.innerHTML="New";g.addClass(e,"button");g.addClass(e,"save-as");var f=document.createElement("span");f.innerHTML="Revert";g.addClass(f,"button");g.addClass(f,"revert");var r=a.__preset_select=document.createElement("select");
	a.load&&a.load.remembered?k.each(a.load.remembered,function(b,c){F(a,c,c==a.preset)}):F(a,"Default",!1);g.bind(r,"change",function(){for(var b=0;b<a.__preset_select.length;b++)a.__preset_select[b].innerHTML=a.__preset_select[b].value;a.preset=this.value});b.appendChild(r);b.appendChild(c);b.appendChild(d);b.appendChild(e);b.appendChild(f);if(x){var n=function(){u.style.display=a.useLocalStorage?"block":"none"},b=document.getElementById("dg-save-locally"),u=document.getElementById("dg-local-explain");
	b.style.display="block";b=document.getElementById("dg-local-storage");"true"===localStorage.getItem(document.location.href+".isLocal")&&b.setAttribute("checked","checked");n();g.bind(b,"change",function(){a.useLocalStorage=!a.useLocalStorage;n()})}var m=document.getElementById("dg-new-constructor");g.bind(m,"keydown",function(a){!a.metaKey||67!==a.which&&67!=a.keyCode||B.hide()});g.bind(c,"click",function(){m.innerHTML=JSON.stringify(a.getSaveObject(),void 0,2);B.show();m.focus();m.select()});g.bind(d,
	"click",function(){a.save()});g.bind(e,"click",function(){var b=prompt("Enter a new preset name.");b&&a.saveAs(b)});g.bind(f,"click",function(){a.revert()})}function M(a){function b(f){f.preventDefault();e=f.clientX;g.addClass(a.__closeButton,m.CLASS_DRAG);g.bind(window,"mousemove",c);g.bind(window,"mouseup",d);return!1}function c(b){b.preventDefault();a.width+=e-b.clientX;a.onResize();e=b.clientX;return!1}function d(){g.removeClass(a.__closeButton,m.CLASS_DRAG);g.unbind(window,"mousemove",c);g.unbind(window,
	"mouseup",d)}a.__resize_handle=document.createElement("div");k.extend(a.__resize_handle.style,{width:"6px",marginLeft:"-3px",height:"200px",cursor:"ew-resize",position:"absolute"});var e;g.bind(a.__resize_handle,"mousedown",b);g.bind(a.__closeButton,"mousedown",b);a.domElement.insertBefore(a.__resize_handle,a.domElement.firstElementChild)}function G(a,b){a.domElement.style.width=b+"px";a.__save_row&&a.autoPlace&&(a.__save_row.style.width=b+"px");a.__closeButton&&(a.__closeButton.style.width=b+"px")}
	function C(a,b){var c={};k.each(a.__rememberedObjects,function(d,e){var f={};k.each(a.__rememberedObjectIndecesToControllers[e],function(a,c){f[c]=b?a.initialValue:a.getValue()});c[e]=f});return c}function F(a,b,c){var d=document.createElement("option");d.innerHTML=b;d.value=b;a.__preset_select.appendChild(d);c&&(a.__preset_select.selectedIndex=a.__preset_select.length-1)}function E(a,b){var c=a.__preset_select[a.__preset_select.selectedIndex];c.innerHTML=b?c.value+"*":c.value}function H(a){0!=a.length&&
	u(function(){H(a)});k.each(a,function(a){a.updateDisplay()})}f.inject(d);var x;try{x="localStorage"in window&&null!==window.localStorage}catch(N){x=!1}var B,I=!0,z,D=!1,J=[],m=function(a){function b(){var a=c.getRoot();a.width+=1;k.defer(function(){--a.width})}var c=this;this.domElement=document.createElement("div");this.__ul=document.createElement("ul");this.domElement.appendChild(this.__ul);g.addClass(this.domElement,"dg");this.__folders={};this.__controllers=[];this.__rememberedObjects=[];this.__rememberedObjectIndecesToControllers=
	[];this.__listening=[];a=a||{};a=k.defaults(a,{autoPlace:!0,width:m.DEFAULT_WIDTH});a=k.defaults(a,{resizable:a.autoPlace,hideable:a.autoPlace});k.isUndefined(a.load)?a.load={preset:"Default"}:a.preset&&(a.load.preset=a.preset);k.isUndefined(a.parent)&&a.hideable&&J.push(this);a.resizable=k.isUndefined(a.parent)&&a.resizable;a.autoPlace&&k.isUndefined(a.scrollable)&&(a.scrollable=!0);var d=x&&"true"===localStorage.getItem(document.location.href+".isLocal"),e;Object.defineProperties(this,{parent:{get:function(){return a.parent}},
	scrollable:{get:function(){return a.scrollable}},autoPlace:{get:function(){return a.autoPlace}},preset:{get:function(){return c.parent?c.getRoot().preset:a.load.preset},set:function(b){c.parent?c.getRoot().preset=b:a.load.preset=b;for(b=0;b<this.__preset_select.length;b++)this.__preset_select[b].value==this.preset&&(this.__preset_select.selectedIndex=b);c.revert()}},width:{get:function(){return a.width},set:function(b){a.width=b;G(c,b)}},name:{get:function(){return a.name},set:function(b){a.name=
	b;r&&(r.innerHTML=a.name)}},closed:{get:function(){return a.closed},set:function(b){a.closed=b;a.closed?g.addClass(c.__ul,m.CLASS_CLOSED):g.removeClass(c.__ul,m.CLASS_CLOSED);this.onResize();c.__closeButton&&(c.__closeButton.innerHTML=b?m.TEXT_OPEN:m.TEXT_CLOSED)}},load:{get:function(){return a.load}},useLocalStorage:{get:function(){return d},set:function(a){x&&((d=a)?g.bind(window,"unload",e):g.unbind(window,"unload",e),localStorage.setItem(document.location.href+".isLocal",a))}}});if(k.isUndefined(a.parent)){a.closed=
	!1;g.addClass(this.domElement,m.CLASS_MAIN);g.makeSelectable(this.domElement,!1);if(x&&d){c.useLocalStorage=!0;var f=localStorage.getItem(document.location.href+".gui");f&&(a.load=JSON.parse(f))}this.__closeButton=document.createElement("div");this.__closeButton.innerHTML=m.TEXT_CLOSED;g.addClass(this.__closeButton,m.CLASS_CLOSE_BUTTON);this.domElement.appendChild(this.__closeButton);g.bind(this.__closeButton,"click",function(){c.closed=!c.closed})}else{void 0===a.closed&&(a.closed=!0);var r=document.createTextNode(a.name);
	g.addClass(r,"controller-name");f=w(c,r);g.addClass(this.__ul,m.CLASS_CLOSED);g.addClass(f,"title");g.bind(f,"click",function(a){a.preventDefault();c.closed=!c.closed;return!1});a.closed||(this.closed=!1)}a.autoPlace&&(k.isUndefined(a.parent)&&(I&&(z=document.createElement("div"),g.addClass(z,"dg"),g.addClass(z,m.CLASS_AUTO_PLACE_CONTAINER),document.body.appendChild(z),I=!1),z.appendChild(this.domElement),g.addClass(this.domElement,m.CLASS_AUTO_PLACE)),this.parent||G(c,a.width));g.bind(window,"resize",
	function(){c.onResize()});g.bind(this.__ul,"webkitTransitionEnd",function(){c.onResize()});g.bind(this.__ul,"transitionend",function(){c.onResize()});g.bind(this.__ul,"oTransitionEnd",function(){c.onResize()});this.onResize();a.resizable&&M(this);this.saveToLocalStorageIfPossible=e=function(){x&&"true"===localStorage.getItem(document.location.href+".isLocal")&&localStorage.setItem(document.location.href+".gui",JSON.stringify(c.getSaveObject()))};c.getRoot();a.parent||b()};m.toggleHide=function(){D=
	!D;k.each(J,function(a){a.domElement.style.zIndex=D?-999:999;a.domElement.style.opacity=D?0:1})};m.CLASS_AUTO_PLACE="a";m.CLASS_AUTO_PLACE_CONTAINER="ac";m.CLASS_MAIN="main";m.CLASS_CONTROLLER_ROW="cr";m.CLASS_TOO_TALL="taller-than-window";m.CLASS_CLOSED="closed";m.CLASS_CLOSE_BUTTON="close-button";m.CLASS_DRAG="drag";m.DEFAULT_WIDTH=245;m.TEXT_CLOSED="Close Controls";m.TEXT_OPEN="Open Controls";g.bind(window,"keydown",function(a){"text"===document.activeElement.type||72!==a.which&&72!=a.keyCode||
	m.toggleHide()},!1);k.extend(m.prototype,{add:function(a,b){return v(this,a,b,{factoryArgs:Array.prototype.slice.call(arguments,2)})},addColor:function(a,b){return v(this,a,b,{color:!0})},remove:function(a){this.__ul.removeChild(a.__li);this.__controllers.splice(this.__controllers.indexOf(a),1);var b=this;k.defer(function(){b.onResize()})},destroy:function(){this.autoPlace&&z.removeChild(this.domElement)},addFolder:function(a){if(void 0!==this.__folders[a])throw Error('You already have a folder in this GUI by the name "'+
	a+'"');var b={name:a,parent:this};b.autoPlace=this.autoPlace;this.load&&this.load.folders&&this.load.folders[a]&&(b.closed=this.load.folders[a].closed,b.load=this.load.folders[a]);b=new m(b);this.__folders[a]=b;a=w(this,b.domElement);g.addClass(a,"folder");return b},open:function(){this.closed=!1},close:function(){this.closed=!0},onResize:function(){var a=this.getRoot();if(a.scrollable){var b=g.getOffset(a.__ul).top,c=0;k.each(a.__ul.childNodes,function(b){a.autoPlace&&b===a.__save_row||(c+=g.getHeight(b))});
	window.innerHeight-b-20<c?(g.addClass(a.domElement,m.CLASS_TOO_TALL),a.__ul.style.height=window.innerHeight-b-20+"px"):(g.removeClass(a.domElement,m.CLASS_TOO_TALL),a.__ul.style.height="auto")}a.__resize_handle&&k.defer(function(){a.__resize_handle.style.height=a.__ul.offsetHeight+"px"});a.__closeButton&&(a.__closeButton.style.width=a.width+"px")},remember:function(){k.isUndefined(B)&&(B=new A,B.domElement.innerHTML=a);if(this.parent)throw Error("You can only call remember on a top level GUI.");var b=
	this;k.each(Array.prototype.slice.call(arguments),function(a){0==b.__rememberedObjects.length&&L(b);-1==b.__rememberedObjects.indexOf(a)&&b.__rememberedObjects.push(a)});this.autoPlace&&G(this,this.width)},getRoot:function(){for(var a=this;a.parent;)a=a.parent;return a},getSaveObject:function(){var a=this.load;a.closed=this.closed;0<this.__rememberedObjects.length&&(a.preset=this.preset,a.remembered||(a.remembered={}),a.remembered[this.preset]=C(this));a.folders={};k.each(this.__folders,function(b,
	c){a.folders[c]=b.getSaveObject()});return a},save:function(){this.load.remembered||(this.load.remembered={});this.load.remembered[this.preset]=C(this);E(this,!1);this.saveToLocalStorageIfPossible()},saveAs:function(a){this.load.remembered||(this.load.remembered={},this.load.remembered.Default=C(this,!0));this.load.remembered[a]=C(this);this.preset=a;F(this,a,!0);this.saveToLocalStorageIfPossible()},revert:function(a){k.each(this.__controllers,function(b){this.getRoot().load.remembered?y(a||this.getRoot(),
	b):b.setValue(b.initialValue)},this);k.each(this.__folders,function(a){a.revert(a)});a||E(this.getRoot(),!1)},listen:function(a){var b=0==this.__listening.length;this.__listening.push(a);b&&H(this.__listening)}});return m}(dat.utils.css,'<div id="dg-save" class="dg dialogue">\n\n  Here\'s the new load parameter for your <code>GUI</code>\'s constructor:\n\n  <textarea id="dg-new-constructor"></textarea>\n\n  <div id="dg-save-locally">\n\n    <input id="dg-local-storage" type="checkbox"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id="dg-local-explain">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>\'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n      \n    </div>\n    \n  </div>\n\n</div>',
	".dg {\n  /** Clear list styles */\n  /* Auto-place container */\n  /* Auto-placed GUI's */\n  /* Line items that don't contain folders. */\n  /** Folder names */\n  /** Hides closed items */\n  /** Controller row */\n  /** Name-half (left) */\n  /** Controller-half (right) */\n  /** Controller placement */\n  /** Shorter number boxes when slider is present. */\n  /** Ensure the entire boolean and function row shows a hand */ }\n  .dg ul {\n    list-style: none;\n    margin: 0;\n    padding: 0;\n    width: 100%;\n    clear: both; }\n  .dg.ac {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    height: 0;\n    z-index: 0; }\n  .dg:not(.ac) .main {\n    /** Exclude mains in ac so that we don't hide close button */\n    overflow: hidden; }\n  .dg.main {\n    -webkit-transition: opacity 0.1s linear;\n    -o-transition: opacity 0.1s linear;\n    -moz-transition: opacity 0.1s linear;\n    transition: opacity 0.1s linear; }\n    .dg.main.taller-than-window {\n      overflow-y: auto; }\n      .dg.main.taller-than-window .close-button {\n        opacity: 1;\n        /* TODO, these are style notes */\n        margin-top: -1px;\n        border-top: 1px solid #2c2c2c; }\n    .dg.main ul.closed .close-button {\n      opacity: 1 !important; }\n    .dg.main:hover .close-button,\n    .dg.main .close-button.drag {\n      opacity: 1; }\n    .dg.main .close-button {\n      /*opacity: 0;*/\n      -webkit-transition: opacity 0.1s linear;\n      -o-transition: opacity 0.1s linear;\n      -moz-transition: opacity 0.1s linear;\n      transition: opacity 0.1s linear;\n      border: 0;\n      position: absolute;\n      line-height: 19px;\n      height: 20px;\n      /* TODO, these are style notes */\n      cursor: pointer;\n      text-align: center;\n      background-color: #000; }\n      .dg.main .close-button:hover {\n        background-color: #111; }\n  .dg.a {\n    float: right;\n    margin-right: 15px;\n    overflow-x: hidden; }\n    .dg.a.has-save > ul {\n      margin-top: 27px; }\n      .dg.a.has-save > ul.closed {\n        margin-top: 0; }\n    .dg.a .save-row {\n      position: fixed;\n      top: 0;\n      z-index: 1002; }\n  .dg li {\n    -webkit-transition: height 0.1s ease-out;\n    -o-transition: height 0.1s ease-out;\n    -moz-transition: height 0.1s ease-out;\n    transition: height 0.1s ease-out; }\n  .dg li:not(.folder) {\n    cursor: auto;\n    height: 27px;\n    line-height: 27px;\n    overflow: hidden;\n    padding: 0 4px 0 5px; }\n  .dg li.folder {\n    padding: 0;\n    border-left: 4px solid rgba(0, 0, 0, 0); }\n  .dg li.title {\n    cursor: pointer;\n    margin-left: -4px; }\n  .dg .closed li:not(.title),\n  .dg .closed ul li,\n  .dg .closed ul li > * {\n    height: 0;\n    overflow: hidden;\n    border: 0; }\n  .dg .cr {\n    clear: both;\n    padding-left: 3px;\n    height: 27px; }\n  .dg .property-name {\n    cursor: default;\n    float: left;\n    clear: left;\n    width: 40%;\n    overflow: hidden;\n    text-overflow: ellipsis; }\n  .dg .c {\n    float: left;\n    width: 60%; }\n  .dg .c input[type=text] {\n    border: 0;\n    margin-top: 4px;\n    padding: 3px;\n    width: 100%;\n    float: right; }\n  .dg .has-slider input[type=text] {\n    width: 30%;\n    /*display: none;*/\n    margin-left: 0; }\n  .dg .slider {\n    float: left;\n    width: 66%;\n    margin-left: -5px;\n    margin-right: 0;\n    height: 19px;\n    margin-top: 4px; }\n  .dg .slider-fg {\n    height: 100%; }\n  .dg .c input[type=checkbox] {\n    margin-top: 9px; }\n  .dg .c select {\n    margin-top: 5px; }\n  .dg .cr.function,\n  .dg .cr.function .property-name,\n  .dg .cr.function *,\n  .dg .cr.boolean,\n  .dg .cr.boolean * {\n    cursor: pointer; }\n  .dg .selector {\n    display: none;\n    position: absolute;\n    margin-left: -9px;\n    margin-top: 23px;\n    z-index: 10; }\n  .dg .c:hover .selector,\n  .dg .selector.drag {\n    display: block; }\n  .dg li.save-row {\n    padding: 0; }\n    .dg li.save-row .button {\n      display: inline-block;\n      padding: 0px 6px; }\n  .dg.dialogue {\n    background-color: #222;\n    width: 460px;\n    padding: 15px;\n    font-size: 13px;\n    line-height: 15px; }\n\n/* TODO Separate style and structure */\n#dg-new-constructor {\n  padding: 10px;\n  color: #222;\n  font-family: Monaco, monospace;\n  font-size: 10px;\n  border: 0;\n  resize: none;\n  box-shadow: inset 1px 1px 1px #888;\n  word-wrap: break-word;\n  margin: 12px 0;\n  display: block;\n  width: 440px;\n  overflow-y: scroll;\n  height: 100px;\n  position: relative; }\n\n#dg-local-explain {\n  display: none;\n  font-size: 11px;\n  line-height: 17px;\n  border-radius: 3px;\n  background-color: #333;\n  padding: 8px;\n  margin-top: 10px; }\n  #dg-local-explain code {\n    font-size: 10px; }\n\n#dat-gui-save-locally {\n  display: none; }\n\n/** Main type */\n.dg {\n  color: #eee;\n  font: 11px 'Lucida Grande', sans-serif;\n  text-shadow: 0 -1px 0 #111;\n  /** Auto place */\n  /* Controller row, <li> */\n  /** Controllers */ }\n  .dg.main {\n    /** Scrollbar */ }\n    .dg.main::-webkit-scrollbar {\n      width: 5px;\n      background: #1a1a1a; }\n    .dg.main::-webkit-scrollbar-corner {\n      height: 0;\n      display: none; }\n    .dg.main::-webkit-scrollbar-thumb {\n      border-radius: 5px;\n      background: #676767; }\n  .dg li:not(.folder) {\n    background: #1a1a1a;\n    border-bottom: 1px solid #2c2c2c; }\n  .dg li.save-row {\n    line-height: 25px;\n    background: #dad5cb;\n    border: 0; }\n    .dg li.save-row select {\n      margin-left: 5px;\n      width: 108px; }\n    .dg li.save-row .button {\n      margin-left: 5px;\n      margin-top: 1px;\n      border-radius: 2px;\n      font-size: 9px;\n      line-height: 7px;\n      padding: 4px 4px 5px 4px;\n      background: #c5bdad;\n      color: #fff;\n      text-shadow: 0 1px 0 #b0a58f;\n      box-shadow: 0 -1px 0 #b0a58f;\n      cursor: pointer; }\n      .dg li.save-row .button.gears {\n        background: #c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;\n        height: 7px;\n        width: 8px; }\n      .dg li.save-row .button:hover {\n        background-color: #bab19e;\n        box-shadow: 0 -1px 0 #b0a58f; }\n  .dg li.folder {\n    border-bottom: 0; }\n  .dg li.title {\n    padding-left: 16px;\n    background: black url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;\n    cursor: pointer;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.2); }\n  .dg .closed li.title {\n    background-image: url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==); }\n  .dg .cr.boolean {\n    border-left: 3px solid #806787; }\n  .dg .cr.function {\n    border-left: 3px solid #e61d5f; }\n  .dg .cr.number {\n    border-left: 3px solid #2fa1d6; }\n    .dg .cr.number input[type=text] {\n      color: #2fa1d6; }\n  .dg .cr.string {\n    border-left: 3px solid #1ed36f; }\n    .dg .cr.string input[type=text] {\n      color: #1ed36f; }\n  .dg .cr.function:hover, .dg .cr.boolean:hover {\n    background: #111; }\n  .dg .c input[type=text] {\n    background: #303030;\n    outline: none; }\n    .dg .c input[type=text]:hover {\n      background: #3c3c3c; }\n    .dg .c input[type=text]:focus {\n      background: #494949;\n      color: #fff; }\n  .dg .c .slider {\n    background: #303030;\n    cursor: ew-resize; }\n  .dg .c .slider-fg {\n    background: #2fa1d6; }\n  .dg .c .slider:hover {\n    background: #3c3c3c; }\n    .dg .c .slider:hover .slider-fg {\n      background: #44abda; }\n",
	dat.controllers.factory=function(f,a,d,e,c,b,p){return function(q,l,r,n){var u=q[l];if(p.isArray(r)||p.isObject(r))return new f(q,l,r);if(p.isNumber(u))return p.isNumber(r)&&p.isNumber(n)?new d(q,l,r,n):new a(q,l,{min:r,max:n});if(p.isString(u))return new e(q,l);if(p.isFunction(u))return new c(q,l,"");if(p.isBoolean(u))return new b(q,l)}}(dat.controllers.OptionController,dat.controllers.NumberControllerBox,dat.controllers.NumberControllerSlider,dat.controllers.StringController=function(f,a,d){var e=
	function(c,b){function d(){f.setValue(f.__input.value)}e.superclass.call(this,c,b);var f=this;this.__input=document.createElement("input");this.__input.setAttribute("type","text");a.bind(this.__input,"keyup",d);a.bind(this.__input,"change",d);a.bind(this.__input,"blur",function(){f.__onFinishChange&&f.__onFinishChange.call(f,f.getValue())});a.bind(this.__input,"keydown",function(a){13===a.keyCode&&this.blur()});this.updateDisplay();this.domElement.appendChild(this.__input)};e.superclass=f;d.extend(e.prototype,
	f.prototype,{updateDisplay:function(){a.isActive(this.__input)||(this.__input.value=this.getValue());return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common),dat.controllers.FunctionController,dat.controllers.BooleanController,dat.utils.common),dat.controllers.Controller,dat.controllers.BooleanController,dat.controllers.FunctionController,dat.controllers.NumberControllerBox,dat.controllers.NumberControllerSlider,dat.controllers.OptionController,
	dat.controllers.ColorController=function(f,a,d,e,c){function b(a,b,d,e){a.style.background="";c.each(l,function(c){a.style.cssText+="background: "+c+"linear-gradient("+b+", "+d+" 0%, "+e+" 100%); "})}function p(a){a.style.background="";a.style.cssText+="background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);";a.style.cssText+="background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";
	a.style.cssText+="background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";a.style.cssText+="background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";a.style.cssText+="background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);"}var q=function(f,n){function u(b){v(b);a.bind(window,"mousemove",v);a.bind(window,
	"mouseup",l)}function l(){a.unbind(window,"mousemove",v);a.unbind(window,"mouseup",l)}function g(){var a=e(this.value);!1!==a?(t.__color.__state=a,t.setValue(t.__color.toOriginal())):this.value=t.__color.toString()}function k(){a.unbind(window,"mousemove",w);a.unbind(window,"mouseup",k)}function v(b){b.preventDefault();var c=a.getWidth(t.__saturation_field),d=a.getOffset(t.__saturation_field),e=(b.clientX-d.left+document.body.scrollLeft)/c;b=1-(b.clientY-d.top+document.body.scrollTop)/c;1<b?b=1:0>
	b&&(b=0);1<e?e=1:0>e&&(e=0);t.__color.v=b;t.__color.s=e;t.setValue(t.__color.toOriginal());return!1}function w(b){b.preventDefault();var c=a.getHeight(t.__hue_field),d=a.getOffset(t.__hue_field);b=1-(b.clientY-d.top+document.body.scrollTop)/c;1<b?b=1:0>b&&(b=0);t.__color.h=360*b;t.setValue(t.__color.toOriginal());return!1}q.superclass.call(this,f,n);this.__color=new d(this.getValue());this.__temp=new d(0);var t=this;this.domElement=document.createElement("div");a.makeSelectable(this.domElement,!1);
	this.__selector=document.createElement("div");this.__selector.className="selector";this.__saturation_field=document.createElement("div");this.__saturation_field.className="saturation-field";this.__field_knob=document.createElement("div");this.__field_knob.className="field-knob";this.__field_knob_border="2px solid ";this.__hue_knob=document.createElement("div");this.__hue_knob.className="hue-knob";this.__hue_field=document.createElement("div");this.__hue_field.className="hue-field";this.__input=document.createElement("input");
	this.__input.type="text";this.__input_textShadow="0 1px 1px ";a.bind(this.__input,"keydown",function(a){13===a.keyCode&&g.call(this)});a.bind(this.__input,"blur",g);a.bind(this.__selector,"mousedown",function(b){a.addClass(this,"drag").bind(window,"mouseup",function(b){a.removeClass(t.__selector,"drag")})});var y=document.createElement("div");c.extend(this.__selector.style,{width:"122px",height:"102px",padding:"3px",backgroundColor:"#222",boxShadow:"0px 1px 3px rgba(0,0,0,0.3)"});c.extend(this.__field_knob.style,
	{position:"absolute",width:"12px",height:"12px",border:this.__field_knob_border+(.5>this.__color.v?"#fff":"#000"),boxShadow:"0px 1px 3px rgba(0,0,0,0.5)",borderRadius:"12px",zIndex:1});c.extend(this.__hue_knob.style,{position:"absolute",width:"15px",height:"2px",borderRight:"4px solid #fff",zIndex:1});c.extend(this.__saturation_field.style,{width:"100px",height:"100px",border:"1px solid #555",marginRight:"3px",display:"inline-block",cursor:"pointer"});c.extend(y.style,{width:"100%",height:"100%",
	background:"none"});b(y,"top","rgba(0,0,0,0)","#000");c.extend(this.__hue_field.style,{width:"15px",height:"100px",display:"inline-block",border:"1px solid #555",cursor:"ns-resize"});p(this.__hue_field);c.extend(this.__input.style,{outline:"none",textAlign:"center",color:"#fff",border:0,fontWeight:"bold",textShadow:this.__input_textShadow+"rgba(0,0,0,0.7)"});a.bind(this.__saturation_field,"mousedown",u);a.bind(this.__field_knob,"mousedown",u);a.bind(this.__hue_field,"mousedown",function(b){w(b);a.bind(window,
	"mousemove",w);a.bind(window,"mouseup",k)});this.__saturation_field.appendChild(y);this.__selector.appendChild(this.__field_knob);this.__selector.appendChild(this.__saturation_field);this.__selector.appendChild(this.__hue_field);this.__hue_field.appendChild(this.__hue_knob);this.domElement.appendChild(this.__input);this.domElement.appendChild(this.__selector);this.updateDisplay()};q.superclass=f;c.extend(q.prototype,f.prototype,{updateDisplay:function(){var a=e(this.getValue());if(!1!==a){var f=!1;
	c.each(d.COMPONENTS,function(b){if(!c.isUndefined(a[b])&&!c.isUndefined(this.__color.__state[b])&&a[b]!==this.__color.__state[b])return f=!0,{}},this);f&&c.extend(this.__color.__state,a)}c.extend(this.__temp.__state,this.__color.__state);this.__temp.a=1;var l=.5>this.__color.v||.5<this.__color.s?255:0,p=255-l;c.extend(this.__field_knob.style,{marginLeft:100*this.__color.s-7+"px",marginTop:100*(1-this.__color.v)-7+"px",backgroundColor:this.__temp.toString(),border:this.__field_knob_border+"rgb("+l+
	","+l+","+l+")"});this.__hue_knob.style.marginTop=100*(1-this.__color.h/360)+"px";this.__temp.s=1;this.__temp.v=1;b(this.__saturation_field,"left","#fff",this.__temp.toString());c.extend(this.__input.style,{backgroundColor:this.__input.value=this.__color.toString(),color:"rgb("+l+","+l+","+l+")",textShadow:this.__input_textShadow+"rgba("+p+","+p+","+p+",.7)"})}});var l=["-moz-","-o-","-webkit-","-ms-",""];return q}(dat.controllers.Controller,dat.dom.dom,dat.color.Color=function(f,a,d,e){function c(a,
	b,c){Object.defineProperty(a,b,{get:function(){if("RGB"===this.__state.space)return this.__state[b];p(this,b,c);return this.__state[b]},set:function(a){"RGB"!==this.__state.space&&(p(this,b,c),this.__state.space="RGB");this.__state[b]=a}})}function b(a,b){Object.defineProperty(a,b,{get:function(){if("HSV"===this.__state.space)return this.__state[b];q(this);return this.__state[b]},set:function(a){"HSV"!==this.__state.space&&(q(this),this.__state.space="HSV");this.__state[b]=a}})}function p(b,c,d){if("HEX"===
	b.__state.space)b.__state[c]=a.component_from_hex(b.__state.hex,d);else if("HSV"===b.__state.space)e.extend(b.__state,a.hsv_to_rgb(b.__state.h,b.__state.s,b.__state.v));else throw"Corrupted color state";}function q(b){var c=a.rgb_to_hsv(b.r,b.g,b.b);e.extend(b.__state,{s:c.s,v:c.v});e.isNaN(c.h)?e.isUndefined(b.__state.h)&&(b.__state.h=0):b.__state.h=c.h}var l=function(){this.__state=f.apply(this,arguments);if(!1===this.__state)throw"Failed to interpret color arguments";this.__state.a=this.__state.a||
	1};l.COMPONENTS="r g b h s v hex a".split(" ");e.extend(l.prototype,{toString:function(){return d(this)},toOriginal:function(){return this.__state.conversion.write(this)}});c(l.prototype,"r",2);c(l.prototype,"g",1);c(l.prototype,"b",0);b(l.prototype,"h");b(l.prototype,"s");b(l.prototype,"v");Object.defineProperty(l.prototype,"a",{get:function(){return this.__state.a},set:function(a){this.__state.a=a}});Object.defineProperty(l.prototype,"hex",{get:function(){"HEX"!==!this.__state.space&&(this.__state.hex=
	a.rgb_to_hex(this.r,this.g,this.b));return this.__state.hex},set:function(a){this.__state.space="HEX";this.__state.hex=a}});return l}(dat.color.interpret,dat.color.math=function(){var f;return{hsv_to_rgb:function(a,d,e){var c=a/60-Math.floor(a/60),b=e*(1-d),f=e*(1-c*d);d=e*(1-(1-c)*d);a=[[e,d,b],[f,e,b],[b,e,d],[b,f,e],[d,b,e],[e,b,f]][Math.floor(a/60)%6];return{r:255*a[0],g:255*a[1],b:255*a[2]}},rgb_to_hsv:function(a,d,e){var c=Math.min(a,d,e),b=Math.max(a,d,e),c=b-c;if(0==b)return{h:NaN,s:0,v:0};
	a=(a==b?(d-e)/c:d==b?2+(e-a)/c:4+(a-d)/c)/6;0>a&&(a+=1);return{h:360*a,s:c/b,v:b/255}},rgb_to_hex:function(a,d,e){a=this.hex_with_component(0,2,a);a=this.hex_with_component(a,1,d);return a=this.hex_with_component(a,0,e)},component_from_hex:function(a,d){return a>>8*d&255},hex_with_component:function(a,d,e){return e<<(f=8*d)|a&~(255<<f)}}}(),dat.color.toString,dat.utils.common),dat.color.interpret,dat.utils.common),dat.utils.requestAnimationFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||
	window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(f,a){window.setTimeout(f,1E3/60)}}(),dat.dom.CenteredDiv=function(f,a){var d=function(){this.backgroundElement=document.createElement("div");a.extend(this.backgroundElement.style,{backgroundColor:"rgba(0,0,0,0.8)",top:0,left:0,display:"none",zIndex:"1000",opacity:0,WebkitTransition:"opacity 0.2s linear",transition:"opacity 0.2s linear"});f.makeFullscreen(this.backgroundElement);this.backgroundElement.style.position=
	"fixed";this.domElement=document.createElement("div");a.extend(this.domElement.style,{position:"fixed",display:"none",zIndex:"1001",opacity:0,WebkitTransition:"-webkit-transform 0.2s ease-out, opacity 0.2s linear",transition:"transform 0.2s ease-out, opacity 0.2s linear"});document.body.appendChild(this.backgroundElement);document.body.appendChild(this.domElement);var d=this;f.bind(this.backgroundElement,"click",function(){d.hide()})};d.prototype.show=function(){var d=this;this.backgroundElement.style.display=
	"block";this.domElement.style.display="block";this.domElement.style.opacity=0;this.domElement.style.webkitTransform="scale(1.1)";this.layout();a.defer(function(){d.backgroundElement.style.opacity=1;d.domElement.style.opacity=1;d.domElement.style.webkitTransform="scale(1)"})};d.prototype.hide=function(){var a=this,c=function(){a.domElement.style.display="none";a.backgroundElement.style.display="none";f.unbind(a.domElement,"webkitTransitionEnd",c);f.unbind(a.domElement,"transitionend",c);f.unbind(a.domElement,
	"oTransitionEnd",c)};f.bind(this.domElement,"webkitTransitionEnd",c);f.bind(this.domElement,"transitionend",c);f.bind(this.domElement,"oTransitionEnd",c);this.backgroundElement.style.opacity=0;this.domElement.style.opacity=0;this.domElement.style.webkitTransform="scale(1.1)"};d.prototype.layout=function(){this.domElement.style.left=window.innerWidth/2-f.getWidth(this.domElement)/2+"px";this.domElement.style.top=window.innerHeight/2-f.getHeight(this.domElement)/2+"px"};return d}(dat.dom.dom,dat.utils.common),
	dat.dom.dom,dat.utils.common);

	module.exports = dat;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! jQuery v3.1.1 | (c) jQuery Foundation | jquery.org/license */
	!function(a,b){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){"use strict";var c=[],d=a.document,e=Object.getPrototypeOf,f=c.slice,g=c.concat,h=c.push,i=c.indexOf,j={},k=j.toString,l=j.hasOwnProperty,m=l.toString,n=m.call(Object),o={};function p(a,b){b=b||d;var c=b.createElement("script");c.text=a,b.head.appendChild(c).parentNode.removeChild(c)}var q="3.1.1",r=function(a,b){return new r.fn.init(a,b)},s=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,t=/^-ms-/,u=/-([a-z])/g,v=function(a,b){return b.toUpperCase()};r.fn=r.prototype={jquery:q,constructor:r,length:0,toArray:function(){return f.call(this)},get:function(a){return null==a?f.call(this):a<0?this[a+this.length]:this[a]},pushStack:function(a){var b=r.merge(this.constructor(),a);return b.prevObject=this,b},each:function(a){return r.each(this,a)},map:function(a){return this.pushStack(r.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(f.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(a<0?b:0);return this.pushStack(c>=0&&c<b?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:h,sort:c.sort,splice:c.splice},r.extend=r.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||r.isFunction(g)||(g={}),h===i&&(g=this,h--);h<i;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(r.isPlainObject(d)||(e=r.isArray(d)))?(e?(e=!1,f=c&&r.isArray(c)?c:[]):f=c&&r.isPlainObject(c)?c:{},g[b]=r.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},r.extend({expando:"jQuery"+(q+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===r.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){var b=r.type(a);return("number"===b||"string"===b)&&!isNaN(a-parseFloat(a))},isPlainObject:function(a){var b,c;return!(!a||"[object Object]"!==k.call(a))&&(!(b=e(a))||(c=l.call(b,"constructor")&&b.constructor,"function"==typeof c&&m.call(c)===n))},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?j[k.call(a)]||"object":typeof a},globalEval:function(a){p(a)},camelCase:function(a){return a.replace(t,"ms-").replace(u,v)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(w(a)){for(c=a.length;d<c;d++)if(b.call(a[d],d,a[d])===!1)break}else for(d in a)if(b.call(a[d],d,a[d])===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(s,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(w(Object(a))?r.merge(c,"string"==typeof a?[a]:a):h.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:i.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;d<c;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;f<g;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,f=0,h=[];if(w(a))for(d=a.length;f<d;f++)e=b(a[f],f,c),null!=e&&h.push(e);else for(f in a)e=b(a[f],f,c),null!=e&&h.push(e);return g.apply([],h)},guid:1,proxy:function(a,b){var c,d,e;if("string"==typeof b&&(c=a[b],b=a,a=c),r.isFunction(a))return d=f.call(arguments,2),e=function(){return a.apply(b||this,d.concat(f.call(arguments)))},e.guid=a.guid=a.guid||r.guid++,e},now:Date.now,support:o}),"function"==typeof Symbol&&(r.fn[Symbol.iterator]=c[Symbol.iterator]),r.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){j["[object "+b+"]"]=b.toLowerCase()});function w(a){var b=!!a&&"length"in a&&a.length,c=r.type(a);return"function"!==c&&!r.isWindow(a)&&("array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a)}var x=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C={}.hasOwnProperty,D=[],E=D.pop,F=D.push,G=D.push,H=D.slice,I=function(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},J="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",K="[\\x20\\t\\r\\n\\f]",L="(?:\\\\.|[\\w-]|[^\0-\\xa0])+",M="\\["+K+"*("+L+")(?:"+K+"*([*^$|!~]?=)"+K+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+L+"))|)"+K+"*\\]",N=":("+L+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+M+")*)|.*)\\)|)",O=new RegExp(K+"+","g"),P=new RegExp("^"+K+"+|((?:^|[^\\\\])(?:\\\\.)*)"+K+"+$","g"),Q=new RegExp("^"+K+"*,"+K+"*"),R=new RegExp("^"+K+"*([>+~]|"+K+")"+K+"*"),S=new RegExp("="+K+"*([^\\]'\"]*?)"+K+"*\\]","g"),T=new RegExp(N),U=new RegExp("^"+L+"$"),V={ID:new RegExp("^#("+L+")"),CLASS:new RegExp("^\\.("+L+")"),TAG:new RegExp("^("+L+"|[*])"),ATTR:new RegExp("^"+M),PSEUDO:new RegExp("^"+N),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+K+"*(even|odd|(([+-]|)(\\d*)n|)"+K+"*(?:([+-]|)"+K+"*(\\d+)|))"+K+"*\\)|)","i"),bool:new RegExp("^(?:"+J+")$","i"),needsContext:new RegExp("^"+K+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+K+"*((?:-\\d)?\\d*)"+K+"*\\)|)(?=[^-]|$)","i")},W=/^(?:input|select|textarea|button)$/i,X=/^h\d$/i,Y=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,$=/[+~]/,_=new RegExp("\\\\([\\da-f]{1,6}"+K+"?|("+K+")|.)","ig"),aa=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:d<0?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ba=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,ca=function(a,b){return b?"\0"===a?"\ufffd":a.slice(0,-1)+"\\"+a.charCodeAt(a.length-1).toString(16)+" ":"\\"+a},da=function(){m()},ea=ta(function(a){return a.disabled===!0&&("form"in a||"label"in a)},{dir:"parentNode",next:"legend"});try{G.apply(D=H.call(v.childNodes),v.childNodes),D[v.childNodes.length].nodeType}catch(fa){G={apply:D.length?function(a,b){F.apply(a,H.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s=b&&b.ownerDocument,w=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==w&&9!==w&&11!==w)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==w&&(l=Z.exec(a)))if(f=l[1]){if(9===w){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(s&&(j=s.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(l[2])return G.apply(d,b.getElementsByTagName(a)),d;if((f=l[3])&&c.getElementsByClassName&&b.getElementsByClassName)return G.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==w)s=b,r=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(ba,ca):b.setAttribute("id",k=u),o=g(a),h=o.length;while(h--)o[h]="#"+k+" "+sa(o[h]);r=o.join(","),s=$.test(a)&&qa(b.parentNode)||b}if(r)try{return G.apply(d,s.querySelectorAll(r)),d}catch(x){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(P,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("fieldset");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&a.sourceIndex-b.sourceIndex;if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return function(b){return"form"in b?b.parentNode&&b.disabled===!1?"label"in b?"label"in b.parentNode?b.parentNode.disabled===a:b.disabled===a:b.isDisabled===a||b.isDisabled!==!a&&ea(b)===a:b.disabled===a:"label"in b&&b.disabled===a}}function pa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function qa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return!!b&&"HTML"!==b.nodeName},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),v!==n&&(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Y.test(n.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.filter.ID=function(a){var b=a.replace(_,aa);return function(a){return a.getAttribute("id")===b}},d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}}):(d.filter.ID=function(a){var b=a.replace(_,aa);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}},d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c,d,e,f=b.getElementById(a);if(f){if(c=f.getAttributeNode("id"),c&&c.value===a)return[f];e=b.getElementsByName(a),d=0;while(f=e[d++])if(c=f.getAttributeNode("id"),c&&c.value===a)return[f]}return[]}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){if("undefined"!=typeof b.getElementsByClassName&&p)return b.getElementsByClassName(a)},r=[],q=[],(c.qsa=Y.test(n.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+K+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+K+"*(?:value|"+J+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){a.innerHTML="<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+K+"*[*^$|!~]?="),2!==a.querySelectorAll(":enabled").length&&q.push(":enabled",":disabled"),o.appendChild(a).disabled=!0,2!==a.querySelectorAll(":disabled").length&&q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Y.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"*"),s.call(a,"[s!='']:x"),r.push("!=",N)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Y.test(o.compareDocumentPosition),t=b||Y.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?I(k,a)-I(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?I(k,a)-I(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?la(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(S,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&C.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.escape=function(a){return(a+"").replace(ba,ca)},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:V,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(_,aa),a[3]=(a[3]||a[4]||a[5]||"").replace(_,aa),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return V.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&T.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(_,aa).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+K+")"+a+"("+K+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:!b||(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(O," ")+" ").indexOf(c)>-1:"|="===b&&(e===c||e.slice(0,c.length+1)===c+"-"))}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=I(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(P,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(_,aa),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return U.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(_,aa).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:oa(!1),disabled:oa(!0),checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return X.test(a.nodeName)},input:function(a){return W.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:pa(function(){return[0]}),last:pa(function(a,b){return[b-1]}),eq:pa(function(a,b,c){return[c<0?c+b:c]}),even:pa(function(a,b){for(var c=0;c<b;c+=2)a.push(c);return a}),odd:pa(function(a,b){for(var c=1;c<b;c+=2)a.push(c);return a}),lt:pa(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;)a.push(d);return a}),gt:pa(function(a,b,c){for(var d=c<0?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function ra(){}ra.prototype=d.filters=d.pseudos,d.setFilters=new ra,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){c&&!(e=Q.exec(h))||(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=R.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(P," ")}),h=h.slice(c.length));for(g in d.filter)!(e=V[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function sa(a){for(var b=0,c=a.length,d="";b<c;b++)d+=a[b].value;return d}function ta(a,b,c){var d=b.dir,e=b.next,f=e||d,g=c&&"parentNode"===f,h=x++;return b.first?function(b,c,e){while(b=b[d])if(1===b.nodeType||g)return a(b,c,e);return!1}:function(b,c,i){var j,k,l,m=[w,h];if(i){while(b=b[d])if((1===b.nodeType||g)&&a(b,c,i))return!0}else while(b=b[d])if(1===b.nodeType||g)if(l=b[u]||(b[u]={}),k=l[b.uniqueID]||(l[b.uniqueID]={}),e&&e===b.nodeName.toLowerCase())b=b[d]||b;else{if((j=k[f])&&j[0]===w&&j[1]===h)return m[2]=j[2];if(k[f]=m,m[2]=a(b,c,i))return!0}return!1}}function ua(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function va(a,b,c){for(var d=0,e=b.length;d<e;d++)ga(a,b[d],c);return c}function wa(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;h<i;h++)(f=a[h])&&(c&&!c(f,d,e)||(g.push(f),j&&b.push(h)));return g}function xa(a,b,c,d,e,f){return d&&!d[u]&&(d=xa(d)),e&&!e[u]&&(e=xa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||va(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:wa(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=wa(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?I(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=wa(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):G.apply(g,r)})}function ya(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ta(function(a){return a===b},h,!0),l=ta(function(a){return I(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];i<f;i++)if(c=d.relative[a[i].type])m=[ta(ua(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;e<f;e++)if(d.relative[a[e].type])break;return xa(i>1&&ua(m),i>1&&sa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(P,"$1"),c,i<e&&ya(a.slice(i,e)),e<f&&ya(a=a.slice(e)),e<f&&sa(a))}m.push(c)}return ua(m)}function za(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=E.call(i));u=wa(u)}G.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&ga.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=ya(b[c]),f[u]?d.push(f):e.push(f);f=A(a,za(e,d)),f.selector=a}return f},i=ga.select=function(a,b,c,e){var f,i,j,k,l,m="function"==typeof a&&a,n=!e&&g(a=m.selector||a);if(c=c||[],1===n.length){if(i=n[0]=n[0].slice(0),i.length>2&&"ID"===(j=i[0]).type&&9===b.nodeType&&p&&d.relative[i[1].type]){if(b=(d.find.ID(j.matches[0].replace(_,aa),b)||[])[0],!b)return c;m&&(b=b.parentNode),a=a.slice(i.shift().value.length)}f=V.needsContext.test(a)?0:i.length;while(f--){if(j=i[f],d.relative[k=j.type])break;if((l=d.find[k])&&(e=l(j.matches[0].replace(_,aa),$.test(i[0].type)&&qa(b.parentNode)||b))){if(i.splice(f,1),a=e.length&&sa(i),!a)return G.apply(c,e),c;break}}}return(m||h(a,n))(e,b,!p,c,!b||$.test(a)&&qa(b.parentNode)||b),c},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("fieldset"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){if(!c)return a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){if(!c&&"input"===a.nodeName.toLowerCase())return a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(J,function(a,b,c){var d;if(!c)return a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);r.find=x,r.expr=x.selectors,r.expr[":"]=r.expr.pseudos,r.uniqueSort=r.unique=x.uniqueSort,r.text=x.getText,r.isXMLDoc=x.isXML,r.contains=x.contains,r.escapeSelector=x.escape;var y=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&r(a).is(c))break;d.push(a)}return d},z=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},A=r.expr.match.needsContext,B=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i,C=/^.[^:#\[\.,]*$/;function D(a,b,c){return r.isFunction(b)?r.grep(a,function(a,d){return!!b.call(a,d,a)!==c}):b.nodeType?r.grep(a,function(a){return a===b!==c}):"string"!=typeof b?r.grep(a,function(a){return i.call(b,a)>-1!==c}):C.test(b)?r.filter(b,a,c):(b=r.filter(b,a),r.grep(a,function(a){return i.call(b,a)>-1!==c&&1===a.nodeType}))}r.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?r.find.matchesSelector(d,a)?[d]:[]:r.find.matches(a,r.grep(b,function(a){return 1===a.nodeType}))},r.fn.extend({find:function(a){var b,c,d=this.length,e=this;if("string"!=typeof a)return this.pushStack(r(a).filter(function(){for(b=0;b<d;b++)if(r.contains(e[b],this))return!0}));for(c=this.pushStack([]),b=0;b<d;b++)r.find(a,e[b],c);return d>1?r.uniqueSort(c):c},filter:function(a){return this.pushStack(D(this,a||[],!1))},not:function(a){return this.pushStack(D(this,a||[],!0))},is:function(a){return!!D(this,"string"==typeof a&&A.test(a)?r(a):a||[],!1).length}});var E,F=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,G=r.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||E,"string"==typeof a){if(e="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:F.exec(a),!e||!e[1]&&b)return!b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof r?b[0]:b,r.merge(this,r.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),B.test(e[1])&&r.isPlainObject(b))for(e in b)r.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}return f=d.getElementById(e[2]),f&&(this[0]=f,this.length=1),this}return a.nodeType?(this[0]=a,this.length=1,this):r.isFunction(a)?void 0!==c.ready?c.ready(a):a(r):r.makeArray(a,this)};G.prototype=r.fn,E=r(d);var H=/^(?:parents|prev(?:Until|All))/,I={children:!0,contents:!0,next:!0,prev:!0};r.fn.extend({has:function(a){var b=r(a,this),c=b.length;return this.filter(function(){for(var a=0;a<c;a++)if(r.contains(this,b[a]))return!0})},closest:function(a,b){var c,d=0,e=this.length,f=[],g="string"!=typeof a&&r(a);if(!A.test(a))for(;d<e;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&r.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?r.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?i.call(r(a),this[0]):i.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(r.uniqueSort(r.merge(this.get(),r(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function J(a,b){while((a=a[b])&&1!==a.nodeType);return a}r.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return y(a,"parentNode")},parentsUntil:function(a,b,c){return y(a,"parentNode",c)},next:function(a){return J(a,"nextSibling")},prev:function(a){return J(a,"previousSibling")},nextAll:function(a){return y(a,"nextSibling")},prevAll:function(a){return y(a,"previousSibling")},nextUntil:function(a,b,c){return y(a,"nextSibling",c)},prevUntil:function(a,b,c){return y(a,"previousSibling",c)},siblings:function(a){return z((a.parentNode||{}).firstChild,a)},children:function(a){return z(a.firstChild)},contents:function(a){return a.contentDocument||r.merge([],a.childNodes)}},function(a,b){r.fn[a]=function(c,d){var e=r.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=r.filter(d,e)),this.length>1&&(I[a]||r.uniqueSort(e),H.test(a)&&e.reverse()),this.pushStack(e)}});var K=/[^\x20\t\r\n\f]+/g;function L(a){var b={};return r.each(a.match(K)||[],function(a,c){b[c]=!0}),b}r.Callbacks=function(a){a="string"==typeof a?L(a):r.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)f[h].apply(c[0],c[1])===!1&&a.stopOnFalse&&(h=f.length,c=!1)}a.memory||(c=!1),b=!1,e&&(f=c?[]:"")},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function d(b){r.each(b,function(b,c){r.isFunction(c)?a.unique&&j.has(c)||f.push(c):c&&c.length&&"string"!==r.type(c)&&d(c)})}(arguments),c&&!b&&i()),this},remove:function(){return r.each(arguments,function(a,b){var c;while((c=r.inArray(b,f,c))>-1)f.splice(c,1),c<=h&&h--}),this},has:function(a){return a?r.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return!f},lock:function(){return e=g=[],c||b||(f=c=""),this},locked:function(){return!!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return!!d}};return j};function M(a){return a}function N(a){throw a}function O(a,b,c){var d;try{a&&r.isFunction(d=a.promise)?d.call(a).done(b).fail(c):a&&r.isFunction(d=a.then)?d.call(a,b,c):b.call(void 0,a)}catch(a){c.call(void 0,a)}}r.extend({Deferred:function(b){var c=[["notify","progress",r.Callbacks("memory"),r.Callbacks("memory"),2],["resolve","done",r.Callbacks("once memory"),r.Callbacks("once memory"),0,"resolved"],["reject","fail",r.Callbacks("once memory"),r.Callbacks("once memory"),1,"rejected"]],d="pending",e={state:function(){return d},always:function(){return f.done(arguments).fail(arguments),this},"catch":function(a){return e.then(null,a)},pipe:function(){var a=arguments;return r.Deferred(function(b){r.each(c,function(c,d){var e=r.isFunction(a[d[4]])&&a[d[4]];f[d[1]](function(){var a=e&&e.apply(this,arguments);a&&r.isFunction(a.promise)?a.promise().progress(b.notify).done(b.resolve).fail(b.reject):b[d[0]+"With"](this,e?[a]:arguments)})}),a=null}).promise()},then:function(b,d,e){var f=0;function g(b,c,d,e){return function(){var h=this,i=arguments,j=function(){var a,j;if(!(b<f)){if(a=d.apply(h,i),a===c.promise())throw new TypeError("Thenable self-resolution");j=a&&("object"==typeof a||"function"==typeof a)&&a.then,r.isFunction(j)?e?j.call(a,g(f,c,M,e),g(f,c,N,e)):(f++,j.call(a,g(f,c,M,e),g(f,c,N,e),g(f,c,M,c.notifyWith))):(d!==M&&(h=void 0,i=[a]),(e||c.resolveWith)(h,i))}},k=e?j:function(){try{j()}catch(a){r.Deferred.exceptionHook&&r.Deferred.exceptionHook(a,k.stackTrace),b+1>=f&&(d!==N&&(h=void 0,i=[a]),c.rejectWith(h,i))}};b?k():(r.Deferred.getStackHook&&(k.stackTrace=r.Deferred.getStackHook()),a.setTimeout(k))}}return r.Deferred(function(a){c[0][3].add(g(0,a,r.isFunction(e)?e:M,a.notifyWith)),c[1][3].add(g(0,a,r.isFunction(b)?b:M)),c[2][3].add(g(0,a,r.isFunction(d)?d:N))}).promise()},promise:function(a){return null!=a?r.extend(a,e):e}},f={};return r.each(c,function(a,b){var g=b[2],h=b[5];e[b[1]]=g.add,h&&g.add(function(){d=h},c[3-a][2].disable,c[0][2].lock),g.add(b[3].fire),f[b[0]]=function(){return f[b[0]+"With"](this===f?void 0:this,arguments),this},f[b[0]+"With"]=g.fireWith}),e.promise(f),b&&b.call(f,f),f},when:function(a){var b=arguments.length,c=b,d=Array(c),e=f.call(arguments),g=r.Deferred(),h=function(a){return function(c){d[a]=this,e[a]=arguments.length>1?f.call(arguments):c,--b||g.resolveWith(d,e)}};if(b<=1&&(O(a,g.done(h(c)).resolve,g.reject),"pending"===g.state()||r.isFunction(e[c]&&e[c].then)))return g.then();while(c--)O(e[c],h(c),g.reject);return g.promise()}});var P=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;r.Deferred.exceptionHook=function(b,c){a.console&&a.console.warn&&b&&P.test(b.name)&&a.console.warn("jQuery.Deferred exception: "+b.message,b.stack,c)},r.readyException=function(b){a.setTimeout(function(){throw b})};var Q=r.Deferred();r.fn.ready=function(a){return Q.then(a)["catch"](function(a){r.readyException(a)}),this},r.extend({isReady:!1,readyWait:1,holdReady:function(a){a?r.readyWait++:r.ready(!0)},ready:function(a){(a===!0?--r.readyWait:r.isReady)||(r.isReady=!0,a!==!0&&--r.readyWait>0||Q.resolveWith(d,[r]))}}),r.ready.then=Q.then;function R(){d.removeEventListener("DOMContentLoaded",R),
	a.removeEventListener("load",R),r.ready()}"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll?a.setTimeout(r.ready):(d.addEventListener("DOMContentLoaded",R),a.addEventListener("load",R));var S=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===r.type(c)){e=!0;for(h in c)S(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,r.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(r(a),c)})),b))for(;h<i;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},T=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function U(){this.expando=r.expando+U.uid++}U.uid=1,U.prototype={cache:function(a){var b=a[this.expando];return b||(b={},T(a)&&(a.nodeType?a[this.expando]=b:Object.defineProperty(a,this.expando,{value:b,configurable:!0}))),b},set:function(a,b,c){var d,e=this.cache(a);if("string"==typeof b)e[r.camelCase(b)]=c;else for(d in b)e[r.camelCase(d)]=b[d];return e},get:function(a,b){return void 0===b?this.cache(a):a[this.expando]&&a[this.expando][r.camelCase(b)]},access:function(a,b,c){return void 0===b||b&&"string"==typeof b&&void 0===c?this.get(a,b):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d=a[this.expando];if(void 0!==d){if(void 0!==b){r.isArray(b)?b=b.map(r.camelCase):(b=r.camelCase(b),b=b in d?[b]:b.match(K)||[]),c=b.length;while(c--)delete d[b[c]]}(void 0===b||r.isEmptyObject(d))&&(a.nodeType?a[this.expando]=void 0:delete a[this.expando])}},hasData:function(a){var b=a[this.expando];return void 0!==b&&!r.isEmptyObject(b)}};var V=new U,W=new U,X=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,Y=/[A-Z]/g;function Z(a){return"true"===a||"false"!==a&&("null"===a?null:a===+a+""?+a:X.test(a)?JSON.parse(a):a)}function $(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(Y,"-$&").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c=Z(c)}catch(e){}W.set(a,b,c)}else c=void 0;return c}r.extend({hasData:function(a){return W.hasData(a)||V.hasData(a)},data:function(a,b,c){return W.access(a,b,c)},removeData:function(a,b){W.remove(a,b)},_data:function(a,b,c){return V.access(a,b,c)},_removeData:function(a,b){V.remove(a,b)}}),r.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=W.get(f),1===f.nodeType&&!V.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=r.camelCase(d.slice(5)),$(f,d,e[d])));V.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){W.set(this,a)}):S(this,function(b){var c;if(f&&void 0===b){if(c=W.get(f,a),void 0!==c)return c;if(c=$(f,a),void 0!==c)return c}else this.each(function(){W.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){W.remove(this,a)})}}),r.extend({queue:function(a,b,c){var d;if(a)return b=(b||"fx")+"queue",d=V.get(a,b),c&&(!d||r.isArray(c)?d=V.access(a,b,r.makeArray(c)):d.push(c)),d||[]},dequeue:function(a,b){b=b||"fx";var c=r.queue(a,b),d=c.length,e=c.shift(),f=r._queueHooks(a,b),g=function(){r.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return V.get(a,c)||V.access(a,c,{empty:r.Callbacks("once memory").add(function(){V.remove(a,[b+"queue",c])})})}}),r.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?r.queue(this[0],a):void 0===b?this:this.each(function(){var c=r.queue(this,a,b);r._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&r.dequeue(this,a)})},dequeue:function(a){return this.each(function(){r.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=r.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=V.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var _=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,aa=new RegExp("^(?:([+-])=|)("+_+")([a-z%]*)$","i"),ba=["Top","Right","Bottom","Left"],ca=function(a,b){return a=b||a,"none"===a.style.display||""===a.style.display&&r.contains(a.ownerDocument,a)&&"none"===r.css(a,"display")},da=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};function ea(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return r.css(a,b,"")},i=h(),j=c&&c[3]||(r.cssNumber[b]?"":"px"),k=(r.cssNumber[b]||"px"!==j&&+i)&&aa.exec(r.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do f=f||".5",k/=f,r.style(a,b,k+j);while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var fa={};function ga(a){var b,c=a.ownerDocument,d=a.nodeName,e=fa[d];return e?e:(b=c.body.appendChild(c.createElement(d)),e=r.css(b,"display"),b.parentNode.removeChild(b),"none"===e&&(e="block"),fa[d]=e,e)}function ha(a,b){for(var c,d,e=[],f=0,g=a.length;f<g;f++)d=a[f],d.style&&(c=d.style.display,b?("none"===c&&(e[f]=V.get(d,"display")||null,e[f]||(d.style.display="")),""===d.style.display&&ca(d)&&(e[f]=ga(d))):"none"!==c&&(e[f]="none",V.set(d,"display",c)));for(f=0;f<g;f++)null!=e[f]&&(a[f].style.display=e[f]);return a}r.fn.extend({show:function(){return ha(this,!0)},hide:function(){return ha(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){ca(this)?r(this).show():r(this).hide()})}});var ia=/^(?:checkbox|radio)$/i,ja=/<([a-z][^\/\0>\x20\t\r\n\f]+)/i,ka=/^$|\/(?:java|ecma)script/i,la={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};la.optgroup=la.option,la.tbody=la.tfoot=la.colgroup=la.caption=la.thead,la.th=la.td;function ma(a,b){var c;return c="undefined"!=typeof a.getElementsByTagName?a.getElementsByTagName(b||"*"):"undefined"!=typeof a.querySelectorAll?a.querySelectorAll(b||"*"):[],void 0===b||b&&r.nodeName(a,b)?r.merge([a],c):c}function na(a,b){for(var c=0,d=a.length;c<d;c++)V.set(a[c],"globalEval",!b||V.get(b[c],"globalEval"))}var oa=/<|&#?\w+;/;function pa(a,b,c,d,e){for(var f,g,h,i,j,k,l=b.createDocumentFragment(),m=[],n=0,o=a.length;n<o;n++)if(f=a[n],f||0===f)if("object"===r.type(f))r.merge(m,f.nodeType?[f]:f);else if(oa.test(f)){g=g||l.appendChild(b.createElement("div")),h=(ja.exec(f)||["",""])[1].toLowerCase(),i=la[h]||la._default,g.innerHTML=i[1]+r.htmlPrefilter(f)+i[2],k=i[0];while(k--)g=g.lastChild;r.merge(m,g.childNodes),g=l.firstChild,g.textContent=""}else m.push(b.createTextNode(f));l.textContent="",n=0;while(f=m[n++])if(d&&r.inArray(f,d)>-1)e&&e.push(f);else if(j=r.contains(f.ownerDocument,f),g=ma(l.appendChild(f),"script"),j&&na(g),c){k=0;while(f=g[k++])ka.test(f.type||"")&&c.push(f)}return l}!function(){var a=d.createDocumentFragment(),b=a.appendChild(d.createElement("div")),c=d.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),o.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",o.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var qa=d.documentElement,ra=/^key/,sa=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,ta=/^([^.]*)(?:\.(.+)|)/;function ua(){return!0}function va(){return!1}function wa(){try{return d.activeElement}catch(a){}}function xa(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)xa(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),e===!1)e=va;else if(!e)return a;return 1===f&&(g=e,e=function(a){return r().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=r.guid++)),a.each(function(){r.event.add(this,b,e,d,c)})}r.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=V.get(a);if(q){c.handler&&(f=c,c=f.handler,e=f.selector),e&&r.find.matchesSelector(qa,e),c.guid||(c.guid=r.guid++),(i=q.events)||(i=q.events={}),(g=q.handle)||(g=q.handle=function(b){return"undefined"!=typeof r&&r.event.triggered!==b.type?r.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(K)||[""],j=b.length;while(j--)h=ta.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n&&(l=r.event.special[n]||{},n=(e?l.delegateType:l.bindType)||n,l=r.event.special[n]||{},k=r.extend({type:n,origType:p,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&r.expr.match.needsContext.test(e),namespace:o.join(".")},f),(m=i[n])||(m=i[n]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,o,g)!==!1||a.addEventListener&&a.addEventListener(n,g)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),r.event.global[n]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=V.hasData(a)&&V.get(a);if(q&&(i=q.events)){b=(b||"").match(K)||[""],j=b.length;while(j--)if(h=ta.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n){l=r.event.special[n]||{},n=(d?l.delegateType:l.bindType)||n,m=i[n]||[],h=h[2]&&new RegExp("(^|\\.)"+o.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&p!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,o,q.handle)!==!1||r.removeEvent(a,n,q.handle),delete i[n])}else for(n in i)r.event.remove(a,n+b[j],c,d,!0);r.isEmptyObject(i)&&V.remove(a,"handle events")}},dispatch:function(a){var b=r.event.fix(a),c,d,e,f,g,h,i=new Array(arguments.length),j=(V.get(this,"events")||{})[b.type]||[],k=r.event.special[b.type]||{};for(i[0]=b,c=1;c<arguments.length;c++)i[c]=arguments[c];if(b.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,b)!==!1){h=r.event.handlers.call(this,b,j),c=0;while((f=h[c++])&&!b.isPropagationStopped()){b.currentTarget=f.elem,d=0;while((g=f.handlers[d++])&&!b.isImmediatePropagationStopped())b.rnamespace&&!b.rnamespace.test(g.namespace)||(b.handleObj=g,b.data=g.data,e=((r.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(b.result=e)===!1&&(b.preventDefault(),b.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,b),b.result}},handlers:function(a,b){var c,d,e,f,g,h=[],i=b.delegateCount,j=a.target;if(i&&j.nodeType&&!("click"===a.type&&a.button>=1))for(;j!==this;j=j.parentNode||this)if(1===j.nodeType&&("click"!==a.type||j.disabled!==!0)){for(f=[],g={},c=0;c<i;c++)d=b[c],e=d.selector+" ",void 0===g[e]&&(g[e]=d.needsContext?r(e,this).index(j)>-1:r.find(e,this,null,[j]).length),g[e]&&f.push(d);f.length&&h.push({elem:j,handlers:f})}return j=this,i<b.length&&h.push({elem:j,handlers:b.slice(i)}),h},addProp:function(a,b){Object.defineProperty(r.Event.prototype,a,{enumerable:!0,configurable:!0,get:r.isFunction(b)?function(){if(this.originalEvent)return b(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[a]},set:function(b){Object.defineProperty(this,a,{enumerable:!0,configurable:!0,writable:!0,value:b})}})},fix:function(a){return a[r.expando]?a:new r.Event(a)},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==wa()&&this.focus)return this.focus(),!1},delegateType:"focusin"},blur:{trigger:function(){if(this===wa()&&this.blur)return this.blur(),!1},delegateType:"focusout"},click:{trigger:function(){if("checkbox"===this.type&&this.click&&r.nodeName(this,"input"))return this.click(),!1},_default:function(a){return r.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}}},r.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c)},r.Event=function(a,b){return this instanceof r.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ua:va,this.target=a.target&&3===a.target.nodeType?a.target.parentNode:a.target,this.currentTarget=a.currentTarget,this.relatedTarget=a.relatedTarget):this.type=a,b&&r.extend(this,b),this.timeStamp=a&&a.timeStamp||r.now(),void(this[r.expando]=!0)):new r.Event(a,b)},r.Event.prototype={constructor:r.Event,isDefaultPrevented:va,isPropagationStopped:va,isImmediatePropagationStopped:va,isSimulated:!1,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ua,a&&!this.isSimulated&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ua,a&&!this.isSimulated&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ua,a&&!this.isSimulated&&a.stopImmediatePropagation(),this.stopPropagation()}},r.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:function(a){var b=a.button;return null==a.which&&ra.test(a.type)?null!=a.charCode?a.charCode:a.keyCode:!a.which&&void 0!==b&&sa.test(a.type)?1&b?1:2&b?3:4&b?2:0:a.which}},r.event.addProp),r.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){r.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return e&&(e===d||r.contains(d,e))||(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),r.fn.extend({on:function(a,b,c,d){return xa(this,a,b,c,d)},one:function(a,b,c,d){return xa(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,r(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return b!==!1&&"function"!=typeof b||(c=b,b=void 0),c===!1&&(c=va),this.each(function(){r.event.remove(this,a,c,b)})}});var ya=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,za=/<script|<style|<link/i,Aa=/checked\s*(?:[^=]|=\s*.checked.)/i,Ba=/^true\/(.*)/,Ca=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function Da(a,b){return r.nodeName(a,"table")&&r.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a:a}function Ea(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function Fa(a){var b=Ba.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Ga(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(V.hasData(a)&&(f=V.access(a),g=V.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;c<d;c++)r.event.add(b,e,j[e][c])}W.hasData(a)&&(h=W.access(a),i=r.extend({},h),W.set(b,i))}}function Ha(a,b){var c=b.nodeName.toLowerCase();"input"===c&&ia.test(a.type)?b.checked=a.checked:"input"!==c&&"textarea"!==c||(b.defaultValue=a.defaultValue)}function Ia(a,b,c,d){b=g.apply([],b);var e,f,h,i,j,k,l=0,m=a.length,n=m-1,q=b[0],s=r.isFunction(q);if(s||m>1&&"string"==typeof q&&!o.checkClone&&Aa.test(q))return a.each(function(e){var f=a.eq(e);s&&(b[0]=q.call(this,e,f.html())),Ia(f,b,c,d)});if(m&&(e=pa(b,a[0].ownerDocument,!1,a,d),f=e.firstChild,1===e.childNodes.length&&(e=f),f||d)){for(h=r.map(ma(e,"script"),Ea),i=h.length;l<m;l++)j=e,l!==n&&(j=r.clone(j,!0,!0),i&&r.merge(h,ma(j,"script"))),c.call(a[l],j,l);if(i)for(k=h[h.length-1].ownerDocument,r.map(h,Fa),l=0;l<i;l++)j=h[l],ka.test(j.type||"")&&!V.access(j,"globalEval")&&r.contains(k,j)&&(j.src?r._evalUrl&&r._evalUrl(j.src):p(j.textContent.replace(Ca,""),k))}return a}function Ja(a,b,c){for(var d,e=b?r.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||r.cleanData(ma(d)),d.parentNode&&(c&&r.contains(d.ownerDocument,d)&&na(ma(d,"script")),d.parentNode.removeChild(d));return a}r.extend({htmlPrefilter:function(a){return a.replace(ya,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=r.contains(a.ownerDocument,a);if(!(o.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||r.isXMLDoc(a)))for(g=ma(h),f=ma(a),d=0,e=f.length;d<e;d++)Ha(f[d],g[d]);if(b)if(c)for(f=f||ma(a),g=g||ma(h),d=0,e=f.length;d<e;d++)Ga(f[d],g[d]);else Ga(a,h);return g=ma(h,"script"),g.length>0&&na(g,!i&&ma(a,"script")),h},cleanData:function(a){for(var b,c,d,e=r.event.special,f=0;void 0!==(c=a[f]);f++)if(T(c)){if(b=c[V.expando]){if(b.events)for(d in b.events)e[d]?r.event.remove(c,d):r.removeEvent(c,d,b.handle);c[V.expando]=void 0}c[W.expando]&&(c[W.expando]=void 0)}}}),r.fn.extend({detach:function(a){return Ja(this,a,!0)},remove:function(a){return Ja(this,a)},text:function(a){return S(this,function(a){return void 0===a?r.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=a)})},null,a,arguments.length)},append:function(){return Ia(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Da(this,a);b.appendChild(a)}})},prepend:function(){return Ia(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Da(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return Ia(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return Ia(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(r.cleanData(ma(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null!=a&&a,b=null==b?a:b,this.map(function(){return r.clone(this,a,b)})},html:function(a){return S(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!za.test(a)&&!la[(ja.exec(a)||["",""])[1].toLowerCase()]){a=r.htmlPrefilter(a);try{for(;c<d;c++)b=this[c]||{},1===b.nodeType&&(r.cleanData(ma(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=[];return Ia(this,arguments,function(b){var c=this.parentNode;r.inArray(this,a)<0&&(r.cleanData(ma(this)),c&&c.replaceChild(b,this))},a)}}),r.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){r.fn[a]=function(a){for(var c,d=[],e=r(a),f=e.length-1,g=0;g<=f;g++)c=g===f?this:this.clone(!0),r(e[g])[b](c),h.apply(d,c.get());return this.pushStack(d)}});var Ka=/^margin/,La=new RegExp("^("+_+")(?!px)[a-z%]+$","i"),Ma=function(b){var c=b.ownerDocument.defaultView;return c&&c.opener||(c=a),c.getComputedStyle(b)};!function(){function b(){if(i){i.style.cssText="box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",i.innerHTML="",qa.appendChild(h);var b=a.getComputedStyle(i);c="1%"!==b.top,g="2px"===b.marginLeft,e="4px"===b.width,i.style.marginRight="50%",f="4px"===b.marginRight,qa.removeChild(h),i=null}}var c,e,f,g,h=d.createElement("div"),i=d.createElement("div");i.style&&(i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",o.clearCloneStyle="content-box"===i.style.backgroundClip,h.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",h.appendChild(i),r.extend(o,{pixelPosition:function(){return b(),c},boxSizingReliable:function(){return b(),e},pixelMarginRight:function(){return b(),f},reliableMarginLeft:function(){return b(),g}}))}();function Na(a,b,c){var d,e,f,g,h=a.style;return c=c||Ma(a),c&&(g=c.getPropertyValue(b)||c[b],""!==g||r.contains(a.ownerDocument,a)||(g=r.style(a,b)),!o.pixelMarginRight()&&La.test(g)&&Ka.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function Oa(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Pa=/^(none|table(?!-c[ea]).+)/,Qa={position:"absolute",visibility:"hidden",display:"block"},Ra={letterSpacing:"0",fontWeight:"400"},Sa=["Webkit","Moz","ms"],Ta=d.createElement("div").style;function Ua(a){if(a in Ta)return a;var b=a[0].toUpperCase()+a.slice(1),c=Sa.length;while(c--)if(a=Sa[c]+b,a in Ta)return a}function Va(a,b,c){var d=aa.exec(b);return d?Math.max(0,d[2]-(c||0))+(d[3]||"px"):b}function Wa(a,b,c,d,e){var f,g=0;for(f=c===(d?"border":"content")?4:"width"===b?1:0;f<4;f+=2)"margin"===c&&(g+=r.css(a,c+ba[f],!0,e)),d?("content"===c&&(g-=r.css(a,"padding"+ba[f],!0,e)),"margin"!==c&&(g-=r.css(a,"border"+ba[f]+"Width",!0,e))):(g+=r.css(a,"padding"+ba[f],!0,e),"padding"!==c&&(g+=r.css(a,"border"+ba[f]+"Width",!0,e)));return g}function Xa(a,b,c){var d,e=!0,f=Ma(a),g="border-box"===r.css(a,"boxSizing",!1,f);if(a.getClientRects().length&&(d=a.getBoundingClientRect()[b]),d<=0||null==d){if(d=Na(a,b,f),(d<0||null==d)&&(d=a.style[b]),La.test(d))return d;e=g&&(o.boxSizingReliable()||d===a.style[b]),d=parseFloat(d)||0}return d+Wa(a,b,c||(g?"border":"content"),e,f)+"px"}r.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Na(a,"opacity");return""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=r.camelCase(b),i=a.style;return b=r.cssProps[h]||(r.cssProps[h]=Ua(h)||h),g=r.cssHooks[b]||r.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=aa.exec(c))&&e[1]&&(c=ea(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(r.cssNumber[h]?"":"px")),o.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=r.camelCase(b);return b=r.cssProps[h]||(r.cssProps[h]=Ua(h)||h),g=r.cssHooks[b]||r.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=Na(a,b,d)),"normal"===e&&b in Ra&&(e=Ra[b]),""===c||c?(f=parseFloat(e),c===!0||isFinite(f)?f||0:e):e}}),r.each(["height","width"],function(a,b){r.cssHooks[b]={get:function(a,c,d){if(c)return!Pa.test(r.css(a,"display"))||a.getClientRects().length&&a.getBoundingClientRect().width?Xa(a,b,d):da(a,Qa,function(){return Xa(a,b,d)})},set:function(a,c,d){var e,f=d&&Ma(a),g=d&&Wa(a,b,d,"border-box"===r.css(a,"boxSizing",!1,f),f);return g&&(e=aa.exec(c))&&"px"!==(e[3]||"px")&&(a.style[b]=c,c=r.css(a,b)),Va(a,c,g)}}}),r.cssHooks.marginLeft=Oa(o.reliableMarginLeft,function(a,b){if(b)return(parseFloat(Na(a,"marginLeft"))||a.getBoundingClientRect().left-da(a,{marginLeft:0},function(){return a.getBoundingClientRect().left}))+"px"}),r.each({margin:"",padding:"",border:"Width"},function(a,b){r.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];d<4;d++)e[a+ba[d]+b]=f[d]||f[d-2]||f[0];return e}},Ka.test(a)||(r.cssHooks[a+b].set=Va)}),r.fn.extend({css:function(a,b){return S(this,function(a,b,c){var d,e,f={},g=0;if(r.isArray(b)){for(d=Ma(a),e=b.length;g<e;g++)f[b[g]]=r.css(a,b[g],!1,d);return f}return void 0!==c?r.style(a,b,c):r.css(a,b)},a,b,arguments.length>1)}});function Ya(a,b,c,d,e){return new Ya.prototype.init(a,b,c,d,e)}r.Tween=Ya,Ya.prototype={constructor:Ya,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||r.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(r.cssNumber[c]?"":"px")},cur:function(){var a=Ya.propHooks[this.prop];return a&&a.get?a.get(this):Ya.propHooks._default.get(this)},run:function(a){var b,c=Ya.propHooks[this.prop];return this.options.duration?this.pos=b=r.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Ya.propHooks._default.set(this),this}},Ya.prototype.init.prototype=Ya.prototype,Ya.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=r.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){r.fx.step[a.prop]?r.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[r.cssProps[a.prop]]&&!r.cssHooks[a.prop]?a.elem[a.prop]=a.now:r.style(a.elem,a.prop,a.now+a.unit)}}},Ya.propHooks.scrollTop=Ya.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},r.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},_default:"swing"},r.fx=Ya.prototype.init,r.fx.step={};var Za,$a,_a=/^(?:toggle|show|hide)$/,ab=/queueHooks$/;function bb(){$a&&(a.requestAnimationFrame(bb),r.fx.tick())}function cb(){return a.setTimeout(function(){Za=void 0}),Za=r.now()}function db(a,b){var c,d=0,e={height:a};for(b=b?1:0;d<4;d+=2-b)c=ba[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function eb(a,b,c){for(var d,e=(hb.tweeners[b]||[]).concat(hb.tweeners["*"]),f=0,g=e.length;f<g;f++)if(d=e[f].call(c,b,a))return d}function fb(a,b,c){var d,e,f,g,h,i,j,k,l="width"in b||"height"in b,m=this,n={},o=a.style,p=a.nodeType&&ca(a),q=V.get(a,"fxshow");c.queue||(g=r._queueHooks(a,"fx"),null==g.unqueued&&(g.unqueued=0,h=g.empty.fire,g.empty.fire=function(){g.unqueued||h()}),g.unqueued++,m.always(function(){m.always(function(){g.unqueued--,r.queue(a,"fx").length||g.empty.fire()})}));for(d in b)if(e=b[d],_a.test(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}n[d]=q&&q[d]||r.style(a,d)}if(i=!r.isEmptyObject(b),i||!r.isEmptyObject(n)){l&&1===a.nodeType&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=q&&q.display,null==j&&(j=V.get(a,"display")),k=r.css(a,"display"),"none"===k&&(j?k=j:(ha([a],!0),j=a.style.display||j,k=r.css(a,"display"),ha([a]))),("inline"===k||"inline-block"===k&&null!=j)&&"none"===r.css(a,"float")&&(i||(m.done(function(){o.display=j}),null==j&&(k=o.display,j="none"===k?"":k)),o.display="inline-block")),c.overflow&&(o.overflow="hidden",m.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]})),i=!1;for(d in n)i||(q?"hidden"in q&&(p=q.hidden):q=V.access(a,"fxshow",{display:j}),f&&(q.hidden=!p),p&&ha([a],!0),m.done(function(){p||ha([a]),V.remove(a,"fxshow");for(d in n)r.style(a,d,n[d])})),i=eb(p?q[d]:0,d,m),d in q||(q[d]=i.start,p&&(i.end=i.start,i.start=0))}}function gb(a,b){var c,d,e,f,g;for(c in a)if(d=r.camelCase(c),e=b[d],f=a[c],r.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=r.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function hb(a,b,c){var d,e,f=0,g=hb.prefilters.length,h=r.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Za||cb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;g<i;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),f<1&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:r.extend({},b),opts:r.extend(!0,{specialEasing:{},easing:r.easing._default},c),originalProperties:b,originalOptions:c,startTime:Za||cb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=r.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;c<d;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for(gb(k,j.opts.specialEasing);f<g;f++)if(d=hb.prefilters[f].call(j,a,k,j.opts))return r.isFunction(d.stop)&&(r._queueHooks(j.elem,j.opts.queue).stop=r.proxy(d.stop,d)),d;return r.map(k,eb,j),r.isFunction(j.opts.start)&&j.opts.start.call(a,j),r.fx.timer(r.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}r.Animation=r.extend(hb,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return ea(c.elem,a,aa.exec(b),c),c}]},tweener:function(a,b){r.isFunction(a)?(b=a,a=["*"]):a=a.match(K);for(var c,d=0,e=a.length;d<e;d++)c=a[d],hb.tweeners[c]=hb.tweeners[c]||[],hb.tweeners[c].unshift(b)},prefilters:[fb],prefilter:function(a,b){b?hb.prefilters.unshift(a):hb.prefilters.push(a)}}),r.speed=function(a,b,c){var e=a&&"object"==typeof a?r.extend({},a):{complete:c||!c&&b||r.isFunction(a)&&a,duration:a,easing:c&&b||b&&!r.isFunction(b)&&b};return r.fx.off||d.hidden?e.duration=0:"number"!=typeof e.duration&&(e.duration in r.fx.speeds?e.duration=r.fx.speeds[e.duration]:e.duration=r.fx.speeds._default),null!=e.queue&&e.queue!==!0||(e.queue="fx"),e.old=e.complete,e.complete=function(){r.isFunction(e.old)&&e.old.call(this),e.queue&&r.dequeue(this,e.queue)},e},r.fn.extend({fadeTo:function(a,b,c,d){return this.filter(ca).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=r.isEmptyObject(a),f=r.speed(b,c,d),g=function(){var b=hb(this,r.extend({},a),f);(e||V.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=r.timers,g=V.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&ab.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));!b&&c||r.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=V.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=r.timers,g=d?d.length:0;for(c.finish=!0,r.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;b<g;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),r.each(["toggle","show","hide"],function(a,b){var c=r.fn[b];r.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(db(b,!0),a,d,e)}}),r.each({slideDown:db("show"),slideUp:db("hide"),slideToggle:db("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){r.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),r.timers=[],r.fx.tick=function(){var a,b=0,c=r.timers;for(Za=r.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||r.fx.stop(),Za=void 0},r.fx.timer=function(a){r.timers.push(a),a()?r.fx.start():r.timers.pop()},r.fx.interval=13,r.fx.start=function(){$a||($a=a.requestAnimationFrame?a.requestAnimationFrame(bb):a.setInterval(r.fx.tick,r.fx.interval))},r.fx.stop=function(){a.cancelAnimationFrame?a.cancelAnimationFrame($a):a.clearInterval($a),$a=null},r.fx.speeds={slow:600,fast:200,_default:400},r.fn.delay=function(b,c){return b=r.fx?r.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e)}})},function(){var a=d.createElement("input"),b=d.createElement("select"),c=b.appendChild(d.createElement("option"));a.type="checkbox",o.checkOn=""!==a.value,o.optSelected=c.selected,a=d.createElement("input"),a.value="t",a.type="radio",o.radioValue="t"===a.value}();var ib,jb=r.expr.attrHandle;r.fn.extend({attr:function(a,b){return S(this,r.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){r.removeAttr(this,a)})}}),r.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return"undefined"==typeof a.getAttribute?r.prop(a,b,c):(1===f&&r.isXMLDoc(a)||(e=r.attrHooks[b.toLowerCase()]||(r.expr.match.bool.test(b)?ib:void 0)),
	void 0!==c?null===c?void r.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=r.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!o.radioValue&&"radio"===b&&r.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d=0,e=b&&b.match(K);if(e&&1===a.nodeType)while(c=e[d++])a.removeAttribute(c)}}),ib={set:function(a,b,c){return b===!1?r.removeAttr(a,c):a.setAttribute(c,c),c}},r.each(r.expr.match.bool.source.match(/\w+/g),function(a,b){var c=jb[b]||r.find.attr;jb[b]=function(a,b,d){var e,f,g=b.toLowerCase();return d||(f=jb[g],jb[g]=e,e=null!=c(a,b,d)?g:null,jb[g]=f),e}});var kb=/^(?:input|select|textarea|button)$/i,lb=/^(?:a|area)$/i;r.fn.extend({prop:function(a,b){return S(this,r.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[r.propFix[a]||a]})}}),r.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&r.isXMLDoc(a)||(b=r.propFix[b]||b,e=r.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=r.find.attr(a,"tabindex");return b?parseInt(b,10):kb.test(a.nodeName)||lb.test(a.nodeName)&&a.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),o.optSelected||(r.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null},set:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex)}}),r.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){r.propFix[this.toLowerCase()]=this});function mb(a){var b=a.match(K)||[];return b.join(" ")}function nb(a){return a.getAttribute&&a.getAttribute("class")||""}r.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(r.isFunction(a))return this.each(function(b){r(this).addClass(a.call(this,b,nb(this)))});if("string"==typeof a&&a){b=a.match(K)||[];while(c=this[i++])if(e=nb(c),d=1===c.nodeType&&" "+mb(e)+" "){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=mb(d),e!==h&&c.setAttribute("class",h)}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(r.isFunction(a))return this.each(function(b){r(this).removeClass(a.call(this,b,nb(this)))});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(K)||[];while(c=this[i++])if(e=nb(c),d=1===c.nodeType&&" "+mb(e)+" "){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=mb(d),e!==h&&c.setAttribute("class",h)}}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):r.isFunction(a)?this.each(function(c){r(this).toggleClass(a.call(this,c,nb(this),b),b)}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=r(this),f=a.match(K)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else void 0!==a&&"boolean"!==c||(b=nb(this),b&&V.set(this,"__className__",b),this.setAttribute&&this.setAttribute("class",b||a===!1?"":V.get(this,"__className__")||""))})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+mb(nb(c))+" ").indexOf(b)>-1)return!0;return!1}});var ob=/\r/g;r.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=r.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,r(this).val()):a,null==e?e="":"number"==typeof e?e+="":r.isArray(e)&&(e=r.map(e,function(a){return null==a?"":a+""})),b=r.valHooks[this.type]||r.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=r.valHooks[e.type]||r.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(ob,""):null==c?"":c)}}}),r.extend({valHooks:{option:{get:function(a){var b=r.find.attr(a,"value");return null!=b?b:mb(r.text(a))}},select:{get:function(a){var b,c,d,e=a.options,f=a.selectedIndex,g="select-one"===a.type,h=g?null:[],i=g?f+1:e.length;for(d=f<0?i:g?f:0;d<i;d++)if(c=e[d],(c.selected||d===f)&&!c.disabled&&(!c.parentNode.disabled||!r.nodeName(c.parentNode,"optgroup"))){if(b=r(c).val(),g)return b;h.push(b)}return h},set:function(a,b){var c,d,e=a.options,f=r.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=r.inArray(r.valHooks.option.get(d),f)>-1)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),r.each(["radio","checkbox"],function(){r.valHooks[this]={set:function(a,b){if(r.isArray(b))return a.checked=r.inArray(r(a).val(),b)>-1}},o.checkOn||(r.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var pb=/^(?:focusinfocus|focusoutblur)$/;r.extend(r.event,{trigger:function(b,c,e,f){var g,h,i,j,k,m,n,o=[e||d],p=l.call(b,"type")?b.type:b,q=l.call(b,"namespace")?b.namespace.split("."):[];if(h=i=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!pb.test(p+r.event.triggered)&&(p.indexOf(".")>-1&&(q=p.split("."),p=q.shift(),q.sort()),k=p.indexOf(":")<0&&"on"+p,b=b[r.expando]?b:new r.Event(p,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=q.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:r.makeArray(c,[b]),n=r.event.special[p]||{},f||!n.trigger||n.trigger.apply(e,c)!==!1)){if(!f&&!n.noBubble&&!r.isWindow(e)){for(j=n.delegateType||p,pb.test(j+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),i=h;i===(e.ownerDocument||d)&&o.push(i.defaultView||i.parentWindow||a)}g=0;while((h=o[g++])&&!b.isPropagationStopped())b.type=g>1?j:n.bindType||p,m=(V.get(h,"events")||{})[b.type]&&V.get(h,"handle"),m&&m.apply(h,c),m=k&&h[k],m&&m.apply&&T(h)&&(b.result=m.apply(h,c),b.result===!1&&b.preventDefault());return b.type=p,f||b.isDefaultPrevented()||n._default&&n._default.apply(o.pop(),c)!==!1||!T(e)||k&&r.isFunction(e[p])&&!r.isWindow(e)&&(i=e[k],i&&(e[k]=null),r.event.triggered=p,e[p](),r.event.triggered=void 0,i&&(e[k]=i)),b.result}},simulate:function(a,b,c){var d=r.extend(new r.Event,c,{type:a,isSimulated:!0});r.event.trigger(d,null,b)}}),r.fn.extend({trigger:function(a,b){return this.each(function(){r.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];if(c)return r.event.trigger(a,b,c,!0)}}),r.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(a,b){r.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),r.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),o.focusin="onfocusin"in a,o.focusin||r.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){r.event.simulate(b,a.target,r.event.fix(a))};r.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=V.access(d,b);e||d.addEventListener(a,c,!0),V.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=V.access(d,b)-1;e?V.access(d,b,e):(d.removeEventListener(a,c,!0),V.remove(d,b))}}});var qb=a.location,rb=r.now(),sb=/\?/;r.parseXML=function(b){var c;if(!b||"string"!=typeof b)return null;try{c=(new a.DOMParser).parseFromString(b,"text/xml")}catch(d){c=void 0}return c&&!c.getElementsByTagName("parsererror").length||r.error("Invalid XML: "+b),c};var tb=/\[\]$/,ub=/\r?\n/g,vb=/^(?:submit|button|image|reset|file)$/i,wb=/^(?:input|select|textarea|keygen)/i;function xb(a,b,c,d){var e;if(r.isArray(b))r.each(b,function(b,e){c||tb.test(a)?d(a,e):xb(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d)});else if(c||"object"!==r.type(b))d(a,b);else for(e in b)xb(a+"["+e+"]",b[e],c,d)}r.param=function(a,b){var c,d=[],e=function(a,b){var c=r.isFunction(b)?b():b;d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(null==c?"":c)};if(r.isArray(a)||a.jquery&&!r.isPlainObject(a))r.each(a,function(){e(this.name,this.value)});else for(c in a)xb(c,a[c],b,e);return d.join("&")},r.fn.extend({serialize:function(){return r.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=r.prop(this,"elements");return a?r.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!r(this).is(":disabled")&&wb.test(this.nodeName)&&!vb.test(a)&&(this.checked||!ia.test(a))}).map(function(a,b){var c=r(this).val();return null==c?null:r.isArray(c)?r.map(c,function(a){return{name:b.name,value:a.replace(ub,"\r\n")}}):{name:b.name,value:c.replace(ub,"\r\n")}}).get()}});var yb=/%20/g,zb=/#.*$/,Ab=/([?&])_=[^&]*/,Bb=/^(.*?):[ \t]*([^\r\n]*)$/gm,Cb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Db=/^(?:GET|HEAD)$/,Eb=/^\/\//,Fb={},Gb={},Hb="*/".concat("*"),Ib=d.createElement("a");Ib.href=qb.href;function Jb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(K)||[];if(r.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Kb(a,b,c,d){var e={},f=a===Gb;function g(h){var i;return e[h]=!0,r.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Lb(a,b){var c,d,e=r.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&r.extend(!0,a,d),a}function Mb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}if(f)return f!==i[0]&&i.unshift(f),c[f]}function Nb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}r.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:qb.href,type:"GET",isLocal:Cb.test(qb.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Hb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":r.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Lb(Lb(a,r.ajaxSettings),b):Lb(r.ajaxSettings,a)},ajaxPrefilter:Jb(Fb),ajaxTransport:Jb(Gb),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var e,f,g,h,i,j,k,l,m,n,o=r.ajaxSetup({},c),p=o.context||o,q=o.context&&(p.nodeType||p.jquery)?r(p):r.event,s=r.Deferred(),t=r.Callbacks("once memory"),u=o.statusCode||{},v={},w={},x="canceled",y={readyState:0,getResponseHeader:function(a){var b;if(k){if(!h){h={};while(b=Bb.exec(g))h[b[1].toLowerCase()]=b[2]}b=h[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return k?g:null},setRequestHeader:function(a,b){return null==k&&(a=w[a.toLowerCase()]=w[a.toLowerCase()]||a,v[a]=b),this},overrideMimeType:function(a){return null==k&&(o.mimeType=a),this},statusCode:function(a){var b;if(a)if(k)y.always(a[y.status]);else for(b in a)u[b]=[u[b],a[b]];return this},abort:function(a){var b=a||x;return e&&e.abort(b),A(0,b),this}};if(s.promise(y),o.url=((b||o.url||qb.href)+"").replace(Eb,qb.protocol+"//"),o.type=c.method||c.type||o.method||o.type,o.dataTypes=(o.dataType||"*").toLowerCase().match(K)||[""],null==o.crossDomain){j=d.createElement("a");try{j.href=o.url,j.href=j.href,o.crossDomain=Ib.protocol+"//"+Ib.host!=j.protocol+"//"+j.host}catch(z){o.crossDomain=!0}}if(o.data&&o.processData&&"string"!=typeof o.data&&(o.data=r.param(o.data,o.traditional)),Kb(Fb,o,c,y),k)return y;l=r.event&&o.global,l&&0===r.active++&&r.event.trigger("ajaxStart"),o.type=o.type.toUpperCase(),o.hasContent=!Db.test(o.type),f=o.url.replace(zb,""),o.hasContent?o.data&&o.processData&&0===(o.contentType||"").indexOf("application/x-www-form-urlencoded")&&(o.data=o.data.replace(yb,"+")):(n=o.url.slice(f.length),o.data&&(f+=(sb.test(f)?"&":"?")+o.data,delete o.data),o.cache===!1&&(f=f.replace(Ab,"$1"),n=(sb.test(f)?"&":"?")+"_="+rb++ +n),o.url=f+n),o.ifModified&&(r.lastModified[f]&&y.setRequestHeader("If-Modified-Since",r.lastModified[f]),r.etag[f]&&y.setRequestHeader("If-None-Match",r.etag[f])),(o.data&&o.hasContent&&o.contentType!==!1||c.contentType)&&y.setRequestHeader("Content-Type",o.contentType),y.setRequestHeader("Accept",o.dataTypes[0]&&o.accepts[o.dataTypes[0]]?o.accepts[o.dataTypes[0]]+("*"!==o.dataTypes[0]?", "+Hb+"; q=0.01":""):o.accepts["*"]);for(m in o.headers)y.setRequestHeader(m,o.headers[m]);if(o.beforeSend&&(o.beforeSend.call(p,y,o)===!1||k))return y.abort();if(x="abort",t.add(o.complete),y.done(o.success),y.fail(o.error),e=Kb(Gb,o,c,y)){if(y.readyState=1,l&&q.trigger("ajaxSend",[y,o]),k)return y;o.async&&o.timeout>0&&(i=a.setTimeout(function(){y.abort("timeout")},o.timeout));try{k=!1,e.send(v,A)}catch(z){if(k)throw z;A(-1,z)}}else A(-1,"No Transport");function A(b,c,d,h){var j,m,n,v,w,x=c;k||(k=!0,i&&a.clearTimeout(i),e=void 0,g=h||"",y.readyState=b>0?4:0,j=b>=200&&b<300||304===b,d&&(v=Mb(o,y,d)),v=Nb(o,v,y,j),j?(o.ifModified&&(w=y.getResponseHeader("Last-Modified"),w&&(r.lastModified[f]=w),w=y.getResponseHeader("etag"),w&&(r.etag[f]=w)),204===b||"HEAD"===o.type?x="nocontent":304===b?x="notmodified":(x=v.state,m=v.data,n=v.error,j=!n)):(n=x,!b&&x||(x="error",b<0&&(b=0))),y.status=b,y.statusText=(c||x)+"",j?s.resolveWith(p,[m,x,y]):s.rejectWith(p,[y,x,n]),y.statusCode(u),u=void 0,l&&q.trigger(j?"ajaxSuccess":"ajaxError",[y,o,j?m:n]),t.fireWith(p,[y,x]),l&&(q.trigger("ajaxComplete",[y,o]),--r.active||r.event.trigger("ajaxStop")))}return y},getJSON:function(a,b,c){return r.get(a,b,c,"json")},getScript:function(a,b){return r.get(a,void 0,b,"script")}}),r.each(["get","post"],function(a,b){r[b]=function(a,c,d,e){return r.isFunction(c)&&(e=e||d,d=c,c=void 0),r.ajax(r.extend({url:a,type:b,dataType:e,data:c,success:d},r.isPlainObject(a)&&a))}}),r._evalUrl=function(a){return r.ajax({url:a,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,"throws":!0})},r.fn.extend({wrapAll:function(a){var b;return this[0]&&(r.isFunction(a)&&(a=a.call(this[0])),b=r(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this},wrapInner:function(a){return r.isFunction(a)?this.each(function(b){r(this).wrapInner(a.call(this,b))}):this.each(function(){var b=r(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=r.isFunction(a);return this.each(function(c){r(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(a){return this.parent(a).not("body").each(function(){r(this).replaceWith(this.childNodes)}),this}}),r.expr.pseudos.hidden=function(a){return!r.expr.pseudos.visible(a)},r.expr.pseudos.visible=function(a){return!!(a.offsetWidth||a.offsetHeight||a.getClientRects().length)},r.ajaxSettings.xhr=function(){try{return new a.XMLHttpRequest}catch(b){}};var Ob={0:200,1223:204},Pb=r.ajaxSettings.xhr();o.cors=!!Pb&&"withCredentials"in Pb,o.ajax=Pb=!!Pb,r.ajaxTransport(function(b){var c,d;if(o.cors||Pb&&!b.crossDomain)return{send:function(e,f){var g,h=b.xhr();if(h.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(g in b.xhrFields)h[g]=b.xhrFields[g];b.mimeType&&h.overrideMimeType&&h.overrideMimeType(b.mimeType),b.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest");for(g in e)h.setRequestHeader(g,e[g]);c=function(a){return function(){c&&(c=d=h.onload=h.onerror=h.onabort=h.onreadystatechange=null,"abort"===a?h.abort():"error"===a?"number"!=typeof h.status?f(0,"error"):f(h.status,h.statusText):f(Ob[h.status]||h.status,h.statusText,"text"!==(h.responseType||"text")||"string"!=typeof h.responseText?{binary:h.response}:{text:h.responseText},h.getAllResponseHeaders()))}},h.onload=c(),d=h.onerror=c("error"),void 0!==h.onabort?h.onabort=d:h.onreadystatechange=function(){4===h.readyState&&a.setTimeout(function(){c&&d()})},c=c("abort");try{h.send(b.hasContent&&b.data||null)}catch(i){if(c)throw i}},abort:function(){c&&c()}}}),r.ajaxPrefilter(function(a){a.crossDomain&&(a.contents.script=!1)}),r.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return r.globalEval(a),a}}}),r.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),r.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(e,f){b=r("<script>").prop({charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&f("error"===a.type?404:200,a.type)}),d.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Qb=[],Rb=/(=)\?(?=&|$)|\?\?/;r.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Qb.pop()||r.expando+"_"+rb++;return this[a]=!0,a}}),r.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Rb.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Rb.test(b.data)&&"data");if(h||"jsonp"===b.dataTypes[0])return e=b.jsonpCallback=r.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Rb,"$1"+e):b.jsonp!==!1&&(b.url+=(sb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||r.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){void 0===f?r(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Qb.push(e)),g&&r.isFunction(f)&&f(g[0]),g=f=void 0}),"script"}),o.createHTMLDocument=function(){var a=d.implementation.createHTMLDocument("").body;return a.innerHTML="<form></form><form></form>",2===a.childNodes.length}(),r.parseHTML=function(a,b,c){if("string"!=typeof a)return[];"boolean"==typeof b&&(c=b,b=!1);var e,f,g;return b||(o.createHTMLDocument?(b=d.implementation.createHTMLDocument(""),e=b.createElement("base"),e.href=d.location.href,b.head.appendChild(e)):b=d),f=B.exec(a),g=!c&&[],f?[b.createElement(f[1])]:(f=pa([a],b,g),g&&g.length&&r(g).remove(),r.merge([],f.childNodes))},r.fn.load=function(a,b,c){var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=mb(a.slice(h)),a=a.slice(0,h)),r.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&r.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?r("<div>").append(r.parseHTML(a)).find(d):a)}).always(c&&function(a,b){g.each(function(){c.apply(this,f||[a.responseText,b,a])})}),this},r.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){r.fn[b]=function(a){return this.on(b,a)}}),r.expr.pseudos.animated=function(a){return r.grep(r.timers,function(b){return a===b.elem}).length};function Sb(a){return r.isWindow(a)?a:9===a.nodeType&&a.defaultView}r.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=r.css(a,"position"),l=r(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=r.css(a,"top"),i=r.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),r.isFunction(b)&&(b=b.call(a,c,r.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},r.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){r.offset.setOffset(this,a,b)});var b,c,d,e,f=this[0];if(f)return f.getClientRects().length?(d=f.getBoundingClientRect(),d.width||d.height?(e=f.ownerDocument,c=Sb(e),b=e.documentElement,{top:d.top+c.pageYOffset-b.clientTop,left:d.left+c.pageXOffset-b.clientLeft}):d):{top:0,left:0}},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===r.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),r.nodeName(a[0],"html")||(d=a.offset()),d={top:d.top+r.css(a[0],"borderTopWidth",!0),left:d.left+r.css(a[0],"borderLeftWidth",!0)}),{top:b.top-d.top-r.css(c,"marginTop",!0),left:b.left-d.left-r.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&"static"===r.css(a,"position"))a=a.offsetParent;return a||qa})}}),r.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c="pageYOffset"===b;r.fn[a]=function(d){return S(this,function(a,d,e){var f=Sb(a);return void 0===e?f?f[b]:a[d]:void(f?f.scrollTo(c?f.pageXOffset:e,c?e:f.pageYOffset):a[d]=e)},a,d,arguments.length)}}),r.each(["top","left"],function(a,b){r.cssHooks[b]=Oa(o.pixelPosition,function(a,c){if(c)return c=Na(a,b),La.test(c)?r(a).position()[b]+"px":c})}),r.each({Height:"height",Width:"width"},function(a,b){r.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){r.fn[d]=function(e,f){var g=arguments.length&&(c||"boolean"!=typeof e),h=c||(e===!0||f===!0?"margin":"border");return S(this,function(b,c,e){var f;return r.isWindow(b)?0===d.indexOf("outer")?b["inner"+a]:b.document.documentElement["client"+a]:9===b.nodeType?(f=b.documentElement,Math.max(b.body["scroll"+a],f["scroll"+a],b.body["offset"+a],f["offset"+a],f["client"+a])):void 0===e?r.css(b,c,h):r.style(b,c,e,h)},b,g?e:void 0,g)}})}),r.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}}),r.parseJSON=JSON.parse,"function"=="function"&&__webpack_require__(3)&&!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function(){return r}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));var Tb=a.jQuery,Ub=a.$;return r.noConflict=function(b){return a.$===r&&(a.$=Ub),b&&a.jQuery===r&&(a.jQuery=Tb),r},b||(a.jQuery=a.$=r),r});


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var THREE = __webpack_require__(5)
	var orbitcontrols = __webpack_require__(6)
	var OrbitControls = orbitcontrols.OrbitControls
	var sceneutils = __webpack_require__(7)
	var util = __webpack_require__(8)
	__webpack_require__(10)
	var helvetiker = __webpack_require__(11)
	var Cubie = __webpack_require__(12).Cubie
	var algorithm = __webpack_require__(13)

	var state = __webpack_require__(14)
	var solver = __webpack_require__(15)
	var model = __webpack_require__(9)
	var Axis = model.Axis
	var Face = model.Face
	var faces = model.faces

	var interpolation = __webpack_require__(17)
	var interpolators = interpolation.interpolators

	var defaults = __webpack_require__(18).defaults

	var PI = Math.PI

	var ORIGIN = new THREE.Vector3(0, 0, 0)

	var ROTATION_MATRIX = [
	  [Face.UP, Face.BACK, Face.DOWN, Face.FRONT], // X
	  [Face.UP, Face.RIGHT, Face.DOWN, Face.LEFT], // Y
	  [Face.FRONT, Face.RIGHT, Face.BACK, Face.LEFT], // Z
	]

	function Cube (canvas, options) {
	  if (!options)
	    options = {}
	  this.dt = 0,
	  this.scene = null
	  this.camera = null
	  this.clock = new THREE.Clock()
	  this.canvas = canvas
	  var o = { canvas: canvas, alpha: true }
	  if (util.webglAvailable()) {
	    this.renderer = new THREE.WebGLRenderer(o)
	  } else {
	    // this.renderer = new THREE.CanvasRenderer(o)
	  }
	  this.animationFrameId = null

	  this.size = options.size || defaults.size
	  this.cubieWidth = options.cubieWidth || defaults.cubieWidth
	  this.cubieSpacing = options.cubieSpacing || defaults.cubieSpacing
	  this.cubieSpacing = 0
	  this.labelMargin = options.labelMargin || defaults.labelMargin

	  this.colors = options.colors || defaults.colors
	  this._setStickers(options.stickers || defaults.stickers)
	  this.onCubieClick = options.onCubieClick || function(){return true}


	  this.click = (options.click !== undefined) ? options.click : defaults.click
	  this.longClick = (options.longClick !== undefined) ? options.longClick : defaults.longClick
	  this.longClickDelay = options.longClickDelay || defaults.longClickDelay

	  this.shouldShowLabels = (options.showLabels !== undefined) ? options.showLabels : defaults.showLabels
	  if (options.animation)
	    Object.keys(options.animation).forEach(function (key) {
	      this.anim[key] = options.animation[key]
	    })




	  this.shouldOptimizeQueue = true
	  this.cubies = []
	  this.active = null // init
	  this.labels = null

	  this.anim = Object.create(defaults.animation)


	  this.anim.animating = false
	  this.anim.current = null
	  this.anim.queue = []
	  this.anim.start = null
	  this.anim.interpolator = interpolation.get(this.anim.interpolator)

	  this.moveStartListener = options.moveStartListener || defaults.moveStartListener
	  this.moveEndListener = options.moveEndListener || defaults.moveEndListener

	  this.getColorSelectState = options.getColorSelectState
	  this.cancelColorSelect = options.cancelColorSelect

	  this.isInitialized = false

	  this.mouse = {
	    x: 0,
	    y: 0,
	    origX: 0,
	    origY: 0,
	    hasMoved: false,
	    down: false,
	    timeout: undefined
	  }

	  this.wireframe = defaults.wireframe


	  this.init()
	  if (options.state) this.setState(options.state)

	}

	// converts a sticker array [ULFRBD] to an object {1,2,3,-1,-2,-3} used internally
	Cube.prototype._setStickers = function _setStickers (stickers) {
	  var out = {}
	  out[Face.UP] = stickers[0]
	  out[Face.LEFT] = stickers[1]
	  out[Face.FRONT] = stickers[2]
	  out[Face.RIGHT] = stickers[3]
	  out[Face.BACK] = stickers[4]
	  out[Face.DOWN] = stickers[5]
	  out[Face.NONE] = this.colors.emptySticker
	  this.stickers = out
	}

	Cube.prototype.setStickerColors = function setStickerColors (colors) {
	  if (!(colors instanceof Array) || colors.length != 6)
	    throw Error('colors must be an array of length 6')

	  this._setStickers(colors)

	  for (var i = 0; i < this.size; i++) {
	    for (var j = 0; j < this.size; j++) {
	      for (var k = 0; k < this.size; k++) {
	        this.cubies[i][j][k].invalidateColors()
	      }
	    }
	  }
	}

	Cube.prototype.isAnimating = function isAnimating () { return this.anim.animating; }

	Cube.prototype.setAnimationDuration = function setAnimationDuration (duration) {
	  // Don't warn because this may be user input and we don't want
	  // developers to do the same checks as we do.
	  if (isNaN(duration) || !isFinite(duration)) return
	  if (this.isAnimating()) {
	    this.anim.duration = duration
	  } else {
	    this.anim.newDuration = duration
	  }
	}

	/*
	If we unfold the cube in the following layout:
	 U
	LFRB
	 D
	A State is the stickers of each face in order ULFRBD in reading order (ltr)
	The solved state would be:
	uuuuuullllllffffffrrrrrrbbbbbbdddddd

	Where u means the "up" color.

	*/
	Cube.prototype.getState = function getState () {
	  var s = this.size
	  var faces = ''
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      faces += util.faceToChar(this.cubies[j][s - 1 - i][s - 1].getSticker(Face.UP))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      faces += util.faceToChar(this.cubies[0][s - 1 - j][s - 1 - i].getSticker(Face.LEFT))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      faces += util.faceToChar(this.cubies[j][0][s - 1 - i].getSticker(Face.FRONT))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      faces += util.faceToChar(this.cubies[s - 1][j][s - 1 - i].getSticker(Face.RIGHT))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      faces += util.faceToChar(this.cubies[s - 1 - j][s - 1][s - 1 - i].getSticker(Face.BACK))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      faces += util.faceToChar(this.cubies[j][i][0].getSticker(Face.DOWN))
	  return faces
	}

	Cube.prototype.setState = function setState (state) {
	  var s = Math.sqrt(state.length / 6)
	  if (s % 1 !== 0) { console.log('Invalid state length (state=' + state + ')'); return; }
	  if (this.size != s) this.setSize(s)
	  var n = 0
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      this.cubies[j][s - 1 - i][s - 1].setSticker(Face.UP, util.charToFace(state[n++]))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      this.cubies[0][s - 1 - j][s - 1 - i].setSticker(Face.LEFT, util.charToFace(state[n++]))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      this.cubies[j][0][s - 1 - i].setSticker(Face.FRONT, util.charToFace(state[n++]))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      this.cubies[s - 1][j][s - 1 - i].setSticker(Face.RIGHT, util.charToFace(state[n++]))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      this.cubies[s - 1 - j][s - 1][s - 1 - i].setSticker(Face.BACK, util.charToFace(state[n++]))
	  for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
	      this.cubies[j][i][0].setSticker(Face.DOWN, util.charToFace(state[n++]))
	}

	Cube.prototype.setInterpolator = function setInterpolator (interpolator) {
	  this.anim.interpolator = interpolation.get(interpolator)
	}

	Cube.prototype._setupCamera = function _setupCamera () {
	  var camPos = this.cameraDistance
	  this.camera.position.set(-camPos, -camPos, camPos)
	  this.camera.up.set(0, 0, 1)
	  this.camera.lookAt(ORIGIN)
	}

	Cube.prototype.resetCamera = function resetCamera () {
	  this._setupCamera()

	  this.controls.center.set(0, 0, 0)
	}

	Cube.prototype._raycast = function _raycast () {
	  if (this.anim.animating) { console.log('not raycasting while animating!'); return; }

	  // create a Ray with origin at the mouse position
	  // and direction into the scene (camera direction)
	  var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1)
	  vector.unproject(this.camera)

	  var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())

	  var cubies = []
	  for (var i = 0; i < this.size; i++)
	    for (var j = 0; j < this.size; j++)
	      for (var k = 0; k < this.size; k++) {
	        cubies.push(this.cubies[i][j][k])
	  }
	  // cubies
	  var intersects = ray.intersectObjects(cubies)
	  if (intersects.length > 0) {
	    var elem = intersects[0]
	    // determine if we hit a cubie
	    // probably yes, since we only ask for intersection with cubies
	    if (!elem.object.hasOwnProperty('coords')) { console.log('Intersected with non-cubie'); return; }

	    var norm = new THREE.Matrix3().getNormalMatrix(elem.object.matrixWorld)
	    var dir = elem.face.normal.clone().applyMatrix3(norm)

	    return {"face":util.faceToChar(util.axisToFace(dir)), "object":elem.object}
	  }
	}


	Cube.prototype.scramble = function scramble (num) {
	  var turns = num || (this.size - 1) * 10
	  var expectedLength = this.anim.queue.length + turns

	  while (this.anim.queue.length < expectedLength) {
	    var move = 'ULFBRD'.charAt(randInt(0, 5))
	    if (randInt(0, 1) == 2) move += "'"
	    this.algorithm(move)
	    this._optimizeQueue()
	  }
	}

	Cube.prototype.getSolution = function getSolution () {
	  return solver.solve(new state.State(this.getState()))
	}

	Cube.prototype._optimizeQueue = function _optimizeQueue () {
	  var q = this.anim.queue
	  var count = q.length
	  // Remove all consecutive oposite moves
	  var found = true // enter the loop
	  while (found) {
	    found = false
	    for (var i = q.length - 2; i >= 0; i--) {
	      if (q[i].cancels(q[i + 1])) {
	        found = true
	        q.splice(i, 2)
	        i--
	      }
	    }
	  }

	  // Remove all 4 consecutive turns
	  found = true // enter the loop
	  while (found) {
	    found = false
	    for (var i = q.length - 4; i >= 0; i--) {
	      if ((q[i].equals(q[i + 1])) &&
	        (q[i].equals(q[i + 2])) &&
	        (q[i].equals(q[i + 3]))) {
	        found = true
	        q.splice(i, 4)
	        i -= 3
	      }
	    }
	  }

	  this.anim.queue = q
	  return count - q.length
	}

	function randInt (min, max) {
	  return Math.floor(Math.random() * (max - min + 1)) + min
	}

	function randFace () {
	  return faces[randInt(0, 5)]
	}

	Cube.prototype.setSize = function setSize (size) {
	  if (isNaN(size) || !isFinite(size)) throw new Error('Size must be a (finite) number')
	  if (size < 1) {
	    size = 1
	    console.warn('Size ' + size + ' is not valid, converting to 1')
	  }
	  this.size = size
	  if (this.isInitialized) {
	    this.destroy()
	    this.init()
	  }
	}
	Cube.prototype.width = function () {
	  return this.cubieWidth * (1 + this.cubieSpacing)
	  * this.SIZE - this.cubieWidth * this.cubieSpacing
	}

	Cube.prototype._setupCubies = function () {
	  var cubieGeometry = new THREE.BoxGeometry(this.cubieWidth, this.cubieWidth, this.cubieWidth)

	  var image = document.createElement('img')
	  var map = new THREE.Texture(image)
	  image.onload = function () {
	    map.needsUpdate = true
	  }
	  image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVklEQVRo3u3RsQ0AIAwDwYT9dzYlTIAUcd+l8ylV0t/1fSSZMbrP7DX9AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACSXrQBS9IDcNBhO+QAAAAASUVORK5CYII='

	  for (var i = 0; i < this.size; i++) {
	    this.cubies[i] = []
	    for (var j = 0; j < this.size; j++) {
	      this.cubies[i][j] = []
	      for (var k = 0; k < this.size; k++) {
	        var cubie = new Cubie(cubieGeometry, map, this, i, j, k)
	        cubie.position.set(
	          (i - (this.size - 1) / 2) * this.cubieWidth * (1 + this.cubieSpacing),
	          (j - (this.size - 1) / 2) * this.cubieWidth * (1 + this.cubieSpacing),
	          (k - (this.size - 1) / 2) * this.cubieWidth * (1 + this.cubieSpacing)
	        )
	        this.cubies[i][j][k] = cubie
	        this.scene.add(cubie)
	      }
	    }
	  }
	}

	Cube.prototype.lookAtFace = function lookAtFace (face) {
	  var dist = this.cameraDistance
	  dist = Math.sqrt(dist * dist * 3)
	  var v = util.faceToAxis(face)
	  v.multiplyScalar(dist)
	  this.camera.position.copy(v)
	  this.camera.lookAt(ORIGIN)
	}
	Cube.prototype.init = function init () {
	  this._init()
	}

	Cube.prototype._init = function _init () {
	  var self = this

	  this.scene = new THREE.Scene()
	  this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
	  this.cameraDistance = this.cubieWidth * (1 + this.cubieSpacing) * this.size / 2 * 4

	  this.projector = new THREE.Projector()

	  this.resizeListener = function (e) {
	    self._onResize(e)
	  }
	  window.addEventListener('resize', this.resizeListener)

	  this.renderer.setClearColor(0, 0)
	  this.renderer.setSize(window.innerWidth, window.innerHeight)

	  this.active = new THREE.Object3D()
	  this.scene.add(this.active)

	  this._setupCubies()

	  if (this.shouldShowLabels) {
	    this.showLabels()
	  }

	  this._setupCamera()
	  this.controls = new OrbitControls(this.camera, this.renderer.domElement)

	  this.onMouseDownListener = function onMouseDownListener (e) {
	    // update the mouse position
	    self.mouse.x = self.mouse.origX = (e.clientX / window.innerWidth) * 2 - 1
	    self.mouse.y = self.mouse.origY = -(e.clientY / window.innerHeight) * 2 + 1

	    self.mouse.hasMoved = false
	    self.mouse.down = true

	    self.cancelColorSelect();

	    self.mouse.timeout = setTimeout(function () {
	      if (!self.mouse.hasMoved && self.longClick) {
	        var rc = self._raycast()
	        if (rc != undefined) {
	          var face = rc.face
	          if (face !== undefined) self.algorithm(algorithm.invert(face))
	        }
	      }

	      self.mouse.down = false
	    }, self.longClickDelay)
	  }
	  self.onMouseMoveListener = function onMouseMoveListener (e) {
	    if (!self.mouse.down) return
	    // update the mouse position
	    self.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
	    self.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

	    var dx = self.mouse.x - self.mouse.origX
	    var dy = self.mouse.y - self.mouse.origY
	    var dst = Math.sqrt(dx * dx + dy * dy)
	    self.mouse.hasMoved = dst > 1. / 50
	  }
	  self.onMouseUpListener = function onMouseUpListener (e) {
	    if (!self.mouse.down) return // ignore if already processed by the timeout
	    // update the mouse position
	    self.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
	    self.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

	    if (!self.mouse.hasMoved && self.click) {
	      var rc = self._raycast()
	      if (rc != undefined) {
	        var face = rc.face
	        if (face !== undefined) {
	          if (e.button == 0)
	              self.onCubieClick(rc.face, rc.object, e.clientX, e.clientY)
	          else if (e.button == 2) {
	//              self.algorithm(face)
	          }
	        }
	      }
	    }

	    clearTimeout(self.mouse.timeout)
	    self.mouse.down = false
	  }

	  this.renderer.domElement.addEventListener('mousedown', this.onMouseDownListener)
	  this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveListener)
	  this.renderer.domElement.addEventListener('mouseup', this.onMouseUpListener)

	  this.keyPressListener = function (e) {
	    self._onKeyPress(e)
	  }
	  // var elm = document.getElementById("canvas-container")
	  var elm = this.renderer.domElement
	  elm.addEventListener('keypress', this.keyPressListener)

	  function render () {
	    self.dt = self.clock.getDelta()

	    self._updateLabelOrientation()

	    if (self.anim.animating) {
	      self._updateAnimation()
	    } else {
	      // see setAnimationDuration()
	      if (self.anim.newDuration) {
	        self.anim.duration = self.anim.newDuration
	        self.anim.newDuration = undefined
	      }
	      if (self.anim.queue.length != 0) {
	        self.anim.currDuration = self.anim.duration *
	        Math.max(0.3, Math.pow(0.9, self.anim.queue.length / 2))
	        self._startAnimation(self.anim.queue.shift())
	      }
	    }

	    self.renderer.render(self.scene, self.camera)
	    self.animationFrameId = requestAnimationFrame(render)
	  }

	  render()
	  this.isInitialized = true
	}

	Cube.prototype.width = function width () {
	  return (1 + this.cubieSpacing) * this.cubieWidth * this.size
	}

	Cube.prototype.destroy = function destroy () {
	  cancelAnimationFrame(this.animationFrameId)
	  this.scene = null
	  this.camera = null
	  this.controls = null
	  this.labels = null
	  util.empty(this.active)
	  this.cubies = []
	  this.anim.queue = []
	  this.anim.animating = false

	  this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownListener)
	  this.renderer.domElement.removeEventListener('keypress', this.keyPressListener)
	  window.removeEventListener('resize', this.resizeListener)
	}

	Cube.prototype._onResize = function _onResize () {
	  this.camera.aspect = window.innerWidth / window.innerHeight
	  this.camera.updateProjectionMatrix()

	  this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	Cube.prototype._updateLabelOrientation = function _updateLabelOrientation () {
	  if (!this.labels) return
	  for (var i = 0; i < this.labels.children.length; i++) {
	    this.labels.children[i].quaternion.copy(this.camera.quaternion)
	  }
	}

	Cube.prototype.setLabels = function setLabels (labelsVisible) {
	  if (labelsVisible) this.showLabels()
	  else this.hideLabels()
	}

	Cube.prototype.showLabels = function showLabels () {
	  this.hideLabels(); // cleanup if they're there already
	  this.labels = new THREE.Object3D()
	  var pos = this.width() / 2 + this.labelMargin * this.cubieWidth * this.size
	  var s = this.width() / 5

	  var font = new THREE.Font(helvetiker)
	  for (var i = 0; i < faces.length; i++) {
	    // var shape = THREE.FontUtils.generateShapes(util.faceToChar(face), {size: s})
	    // var geo = new THREE.ShapeGeometry(shape)
	    var geo = new THREE.TextGeometry(util.faceToChar(faces[i]), {
	      font: font,
	      size: s,
	      height: 1
	    })

	    geo.computeBoundingBox()
	    var w = geo.boundingBox.max.x;
	    var h = geo.boundingBox.max.y;

	    geo.applyMatrix(new THREE.Matrix4().makeTranslation(-w/2,-h/2,0))

	    var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: this.colors.label }))
	    m.position.copy(util.faceToAxis(faces[i])).multiplyScalar(pos)

	    this.labels.add(m)
	  }
	  this.scene.add(this.labels)
	  this.shouldShowLabels = true
	}

	Cube.prototype.hideLabels = function hideLabels () {
	  if (!this.labels) return
	  this.scene.remove(this.labels)
	  this.labels = null
	  this.shouldShowLabels = false
	}

	Cube.prototype._alignCubies = function _alignCubies () {
	  for (var i = 0; i < this.size; i++) {
	    for (var j = 0; j < this.size; j++) {
	      for (var k = 0; k < this.size; k++) {
	        this.cubies[i][j][k].roundRotation()
	        this.cubies[i][j][k].coords.set(i, j, k)
	        this.cubies[i][j][k].position.set(
	          (i - (this.size - 1) / 2) * this.cubieWidth * (1 + this.cubieSpacing),
	          (j - (this.size - 1) / 2) * this.cubieWidth * (1 + this.cubieSpacing),
	          (k - (this.size - 1) / 2) * this.cubieWidth * (1 + this.cubieSpacing)
	        )
	      }
	    }
	  }
	}

	// var layerNumber = 0
	Cube.prototype._onKeyPress = function onKeyPress (e) {
	  var key = String.fromCharCode(e.keyCode ? e.keyCode : e.which)
	  var inv = key !== key.toUpperCase() && !e.shiftKey
	  var alg = key.toUpperCase() + (inv ? "'" : '')

	  this.algorithm(alg)
	}

	Cube.prototype.algorithm = function _algorithm (alg) {
	  var moves = alg.split(' ')
	  for (var i = 0; i < moves.length; i++) {
	    var move = moves[i].trim()
	    if (move == '') continue

	    var c = move.charAt(0)
	    var face = util.charToFace(c)
	    var axis = util.charToAxis(c)
	    var rot = 1
	    var cw = !algorithm.isPrime(move)
	    var two = algorithm.isTwo(move)
	    if (two) rot *= 2

	    var layerNumber = 0
	    if (face) {
	      var layer = (face == Face.FRONT || face == Face.LEFT || face == Face.DOWN)
	        ? layerNumber
	        : this.size - 1 - layerNumber
	      var layers = [layer]
	      this._enqueueAnimation(new Animation(cw ? face : -face, layers, move, rot), false)
	    } else if (axis) {
	      var layers = []
	      for (var j = 0; j < this.size; j++) layers.push(j)
	      this._enqueueAnimation(new Animation(cw ? axis : -axis, layers, move, rot), false)
	    }
	  }
	}

	function Animation (axis, layers, move, rot) {
	  this.move = move
	  this.targetAngle = (PI / 2) * Math.abs(rot)
	  this.angle = 0
	  this.axisVector = util.faceToAxis(axis)
	  this.axisVector.multiplyScalar(-1)

	  this.axis = axis
	  this.layers = layers
	}

	// Returns true if this animation is the opposite of anim,
	// That is, if this and anim were queued one after the other
	// the state after the animation would be the same as the current state
	Animation.prototype.cancels = function cancels (anim) {
	  return this.axis + anim.axis == 0
	  && util.deepArrayEquals(this.layers.sort(), anim.layers.sort())
	}

	Animation.prototype.equals = function equals (anim) {
	  return this.axis == anim.axis
	  && util.deepArrayEquals(this.layers.sort(), anim.layers.sort())
	}

	Cube.prototype._enqueueAnimation = function _enqueueAnimation (anim, optimize) {
	  this.anim.queue.push(anim)
	  if (this.shouldOptimizeQueue && optimize !== false) {
	    this._optimizeQueue()
	  }
	}

	Cube.prototype._startAnimation = function _startAnimation (animation) {
	  this.anim.current = animation
	  this.active.rotation.set(0, 0, 0)
	  this.active.updateMatrixWorld()
	  this._addLayersToActiveGroup(this.anim.current.axis, this.anim.current.layers)
	  this.anim.start = this.clock.getElapsedTime()
	  this.anim.animating = true

	  if (this.moveStartListener) this.moveStartListener(this.anim.current.move)
	}

	Cube.prototype._updateAnimation = function _updateAnimation () {
	  var dt = (this.clock.getElapsedTime() - this.anim.start)
	  var dur = this.anim.currDuration / 1000
	  var pct = dt / dur
	  if (pct > 1.0) {
	    pct = 1.0
	    this.anim.animating = false
	  }
	  pct = this.anim.interpolator(pct)

	  var angle = this.anim.current.targetAngle * pct

	  this.active.rotation.x = angle * this.anim.current.axisVector.x
	  this.active.rotation.y = angle * this.anim.current.axisVector.y
	  this.active.rotation.z = angle * this.anim.current.axisVector.z

	  if (!this.anim.animating) this._onAnimationEnd()
	}

	Cube.prototype._onAnimationEnd = function _onAnimationEnd () {
	  this.active.updateMatrixWorld()

	  // Re-add items to the scene
	  while (this.active.children.length > 0) {
	    var child = this.active.children[0]
	    var num = algorithm.isTwo(this.anim.current.move) ? 2 : 1
	    for (var n = 0; n < num; n++)
	      child._rotateStickers(this.anim.current.axis)
	    sceneutils.detach(child, this.active, this.scene)
	  }
	  this._updateCubiesRotation(this.anim.current.move)
	  this._alignCubies()
	  this.anim.animating = false

	  if (this.moveEndListener) this.moveEndListener(this.anim.current.move)

	  this.anim.current = undefined
	}

	Cube.prototype._updateCubiesRotation = function _updateCubiesRotation (move) {
	  var num = algorithm.isTwo(move) ? 2 : 1
	  var axis = this.anim.current.axis
	  var userCw = this.anim.current.axis > 0
	  var layers = this.anim.current.layers

	  for (var n = 0; n < num; n++)
	    for (var i = 0; i < layers.length; i++) {
	      util.rotateLayer(this.cubies, axis, layers[i], userCw)
	  }
	}

	// If layers is not provided, all are selected
	Cube.prototype._addLayersToActiveGroup = function _addLayersToActiveGroup (face, layers) {
	  for (var i = 0; i < layers.length; i++) {
	    this._addLayerToActiveGroup(face, layers[i])
	  }
	}

	Cube.prototype._addLayerToActiveGroup = function addLayerToActiveGroup (face, layer) {
	  if (layer == null) { layer = 0; }
	  if (layer < 0 || layer >= this.size) throw 'Invalid layer: ' + layer
	  var x, y, z
	  x = y = z = -1
	  switch (face) {
	    case Face.LEFT:
	    case Face.RIGHT:
	      x = layer
	      break
	    case Face.FRONT:
	    case Face.BACK:
	      y = layer
	      break
	    case Face.DOWN:
	    case Face.UP:
	      z = layer
	      break
	  }
	  for (var i = 0; i < this.size; i++) {
	    for (var j = 0; j < this.size; j++) {
	      for (var k = 0; k < this.size; k++) {
	        if ((i == x || x == -1) &&
	          (j == y || y == -1) &&
	          (k == z || z == -1)) {
	          sceneutils.attach(this.cubies[i][j][k], this.scene, this.active)
	        }
	      }
	    }
	  }
	}

	module.exports = {
	  defaults: defaults,
	  Cube: Cube,
	  Animation: Animation
	}


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// threejs.org/license
	'use strict';var THREE={REVISION:"77"}; true?!(__WEBPACK_AMD_DEFINE_FACTORY__ = (THREE), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)):"undefined"!==typeof exports&&"undefined"!==typeof module&&(module.exports=THREE);void 0===Number.EPSILON&&(Number.EPSILON=Math.pow(2,-52));void 0===Math.sign&&(Math.sign=function(a){return 0>a?-1:0<a?1:+a});void 0===Function.prototype.name&&Object.defineProperty(Function.prototype,"name",{get:function(){return this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]}});
	void 0===Object.assign&&function(){Object.assign=function(a){if(void 0===a||null===a)throw new TypeError("Cannot convert undefined or null to object");for(var b=Object(a),c=1;c<arguments.length;c++){var d=arguments[c];if(void 0!==d&&null!==d)for(var e in d)Object.prototype.hasOwnProperty.call(d,e)&&(b[e]=d[e])}return b}}();
	Object.assign(THREE,{MOUSE:{LEFT:0,MIDDLE:1,RIGHT:2},CullFaceNone:0,CullFaceBack:1,CullFaceFront:2,CullFaceFrontBack:3,FrontFaceDirectionCW:0,FrontFaceDirectionCCW:1,BasicShadowMap:0,PCFShadowMap:1,PCFSoftShadowMap:2,FrontSide:0,BackSide:1,DoubleSide:2,FlatShading:1,SmoothShading:2,NoColors:0,FaceColors:1,VertexColors:2,NoBlending:0,NormalBlending:1,AdditiveBlending:2,SubtractiveBlending:3,MultiplyBlending:4,CustomBlending:5,AddEquation:100,SubtractEquation:101,ReverseSubtractEquation:102,MinEquation:103,
	MaxEquation:104,ZeroFactor:200,OneFactor:201,SrcColorFactor:202,OneMinusSrcColorFactor:203,SrcAlphaFactor:204,OneMinusSrcAlphaFactor:205,DstAlphaFactor:206,OneMinusDstAlphaFactor:207,DstColorFactor:208,OneMinusDstColorFactor:209,SrcAlphaSaturateFactor:210,NeverDepth:0,AlwaysDepth:1,LessDepth:2,LessEqualDepth:3,EqualDepth:4,GreaterEqualDepth:5,GreaterDepth:6,NotEqualDepth:7,MultiplyOperation:0,MixOperation:1,AddOperation:2,NoToneMapping:0,LinearToneMapping:1,ReinhardToneMapping:2,Uncharted2ToneMapping:3,
	CineonToneMapping:4,UVMapping:300,CubeReflectionMapping:301,CubeRefractionMapping:302,EquirectangularReflectionMapping:303,EquirectangularRefractionMapping:304,SphericalReflectionMapping:305,CubeUVReflectionMapping:306,CubeUVRefractionMapping:307,RepeatWrapping:1E3,ClampToEdgeWrapping:1001,MirroredRepeatWrapping:1002,NearestFilter:1003,NearestMipMapNearestFilter:1004,NearestMipMapLinearFilter:1005,LinearFilter:1006,LinearMipMapNearestFilter:1007,LinearMipMapLinearFilter:1008,UnsignedByteType:1009,
	ByteType:1010,ShortType:1011,UnsignedShortType:1012,IntType:1013,UnsignedIntType:1014,FloatType:1015,HalfFloatType:1025,UnsignedShort4444Type:1016,UnsignedShort5551Type:1017,UnsignedShort565Type:1018,AlphaFormat:1019,RGBFormat:1020,RGBAFormat:1021,LuminanceFormat:1022,LuminanceAlphaFormat:1023,RGBEFormat:THREE.RGBAFormat,DepthFormat:1026,RGB_S3TC_DXT1_Format:2001,RGBA_S3TC_DXT1_Format:2002,RGBA_S3TC_DXT3_Format:2003,RGBA_S3TC_DXT5_Format:2004,RGB_PVRTC_4BPPV1_Format:2100,RGB_PVRTC_2BPPV1_Format:2101,
	RGBA_PVRTC_4BPPV1_Format:2102,RGBA_PVRTC_2BPPV1_Format:2103,RGB_ETC1_Format:2151,LoopOnce:2200,LoopRepeat:2201,LoopPingPong:2202,InterpolateDiscrete:2300,InterpolateLinear:2301,InterpolateSmooth:2302,ZeroCurvatureEnding:2400,ZeroSlopeEnding:2401,WrapAroundEnding:2402,TrianglesDrawMode:0,TriangleStripDrawMode:1,TriangleFanDrawMode:2,LinearEncoding:3E3,sRGBEncoding:3001,GammaEncoding:3007,RGBEEncoding:3002,LogLuvEncoding:3003,RGBM7Encoding:3004,RGBM16Encoding:3005,RGBDEncoding:3006,BasicDepthPacking:3200,
	RGBADepthPacking:3201});THREE.Color=function(a,b,c){return void 0===b&&void 0===c?this.set(a):this.setRGB(a,b,c)};
	THREE.Color.prototype={constructor:THREE.Color,r:1,g:1,b:1,set:function(a){a instanceof THREE.Color?this.copy(a):"number"===typeof a?this.setHex(a):"string"===typeof a&&this.setStyle(a);return this},setScalar:function(a){this.b=this.g=this.r=a},setHex:function(a){a=Math.floor(a);this.r=(a>>16&255)/255;this.g=(a>>8&255)/255;this.b=(a&255)/255;return this},setRGB:function(a,b,c){this.r=a;this.g=b;this.b=c;return this},setHSL:function(){function a(a,c,d){0>d&&(d+=1);1<d&&(d-=1);return d<1/6?a+6*(c-a)*
	d:.5>d?c:d<2/3?a+6*(c-a)*(2/3-d):a}return function(b,c,d){b=THREE.Math.euclideanModulo(b,1);c=THREE.Math.clamp(c,0,1);d=THREE.Math.clamp(d,0,1);0===c?this.r=this.g=this.b=d:(c=.5>=d?d*(1+c):d+c-d*c,d=2*d-c,this.r=a(d,c,b+1/3),this.g=a(d,c,b),this.b=a(d,c,b-1/3));return this}}(),setStyle:function(a){function b(b){void 0!==b&&1>parseFloat(b)&&console.warn("THREE.Color: Alpha component of "+a+" will be ignored.")}var c;if(c=/^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec(a)){var d=c[2];switch(c[1]){case "rgb":case "rgba":if(c=
	/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(d))return this.r=Math.min(255,parseInt(c[1],10))/255,this.g=Math.min(255,parseInt(c[2],10))/255,this.b=Math.min(255,parseInt(c[3],10))/255,b(c[5]),this;if(c=/^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(d))return this.r=Math.min(100,parseInt(c[1],10))/100,this.g=Math.min(100,parseInt(c[2],10))/100,this.b=Math.min(100,parseInt(c[3],10))/100,b(c[5]),this;break;case "hsl":case "hsla":if(c=/^([0-9]*\.?[0-9]+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(d)){var d=
	parseFloat(c[1])/360,e=parseInt(c[2],10)/100,f=parseInt(c[3],10)/100;b(c[5]);return this.setHSL(d,e,f)}}}else if(c=/^\#([A-Fa-f0-9]+)$/.exec(a)){c=c[1];d=c.length;if(3===d)return this.r=parseInt(c.charAt(0)+c.charAt(0),16)/255,this.g=parseInt(c.charAt(1)+c.charAt(1),16)/255,this.b=parseInt(c.charAt(2)+c.charAt(2),16)/255,this;if(6===d)return this.r=parseInt(c.charAt(0)+c.charAt(1),16)/255,this.g=parseInt(c.charAt(2)+c.charAt(3),16)/255,this.b=parseInt(c.charAt(4)+c.charAt(5),16)/255,this}a&&0<a.length&&
	(c=THREE.ColorKeywords[a],void 0!==c?this.setHex(c):console.warn("THREE.Color: Unknown color "+a));return this},clone:function(){return new this.constructor(this.r,this.g,this.b)},copy:function(a){this.r=a.r;this.g=a.g;this.b=a.b;return this},copyGammaToLinear:function(a,b){void 0===b&&(b=2);this.r=Math.pow(a.r,b);this.g=Math.pow(a.g,b);this.b=Math.pow(a.b,b);return this},copyLinearToGamma:function(a,b){void 0===b&&(b=2);var c=0<b?1/b:1;this.r=Math.pow(a.r,c);this.g=Math.pow(a.g,c);this.b=Math.pow(a.b,
	c);return this},convertGammaToLinear:function(){var a=this.r,b=this.g,c=this.b;this.r=a*a;this.g=b*b;this.b=c*c;return this},convertLinearToGamma:function(){this.r=Math.sqrt(this.r);this.g=Math.sqrt(this.g);this.b=Math.sqrt(this.b);return this},getHex:function(){return 255*this.r<<16^255*this.g<<8^255*this.b<<0},getHexString:function(){return("000000"+this.getHex().toString(16)).slice(-6)},getHSL:function(a){a=a||{h:0,s:0,l:0};var b=this.r,c=this.g,d=this.b,e=Math.max(b,c,d),f=Math.min(b,c,d),g,h=
	(f+e)/2;if(f===e)f=g=0;else{var k=e-f,f=.5>=h?k/(e+f):k/(2-e-f);switch(e){case b:g=(c-d)/k+(c<d?6:0);break;case c:g=(d-b)/k+2;break;case d:g=(b-c)/k+4}g/=6}a.h=g;a.s=f;a.l=h;return a},getStyle:function(){return"rgb("+(255*this.r|0)+","+(255*this.g|0)+","+(255*this.b|0)+")"},offsetHSL:function(a,b,c){var d=this.getHSL();d.h+=a;d.s+=b;d.l+=c;this.setHSL(d.h,d.s,d.l);return this},add:function(a){this.r+=a.r;this.g+=a.g;this.b+=a.b;return this},addColors:function(a,b){this.r=a.r+b.r;this.g=a.g+b.g;this.b=
	a.b+b.b;return this},addScalar:function(a){this.r+=a;this.g+=a;this.b+=a;return this},multiply:function(a){this.r*=a.r;this.g*=a.g;this.b*=a.b;return this},multiplyScalar:function(a){this.r*=a;this.g*=a;this.b*=a;return this},lerp:function(a,b){this.r+=(a.r-this.r)*b;this.g+=(a.g-this.g)*b;this.b+=(a.b-this.b)*b;return this},equals:function(a){return a.r===this.r&&a.g===this.g&&a.b===this.b},fromArray:function(a,b){void 0===b&&(b=0);this.r=a[b];this.g=a[b+1];this.b=a[b+2];return this},toArray:function(a,
	b){void 0===a&&(a=[]);void 0===b&&(b=0);a[b]=this.r;a[b+1]=this.g;a[b+2]=this.b;return a}};
	THREE.ColorKeywords={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,
	darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,
	grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,
	lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,
	palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,
	tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};THREE.Quaternion=function(a,b,c,d){this._x=a||0;this._y=b||0;this._z=c||0;this._w=void 0!==d?d:1};
	THREE.Quaternion.prototype={constructor:THREE.Quaternion,get x(){return this._x},set x(a){this._x=a;this.onChangeCallback()},get y(){return this._y},set y(a){this._y=a;this.onChangeCallback()},get z(){return this._z},set z(a){this._z=a;this.onChangeCallback()},get w(){return this._w},set w(a){this._w=a;this.onChangeCallback()},set:function(a,b,c,d){this._x=a;this._y=b;this._z=c;this._w=d;this.onChangeCallback();return this},clone:function(){return new this.constructor(this._x,this._y,this._z,this._w)},
	copy:function(a){this._x=a.x;this._y=a.y;this._z=a.z;this._w=a.w;this.onChangeCallback();return this},setFromEuler:function(a,b){if(!1===a instanceof THREE.Euler)throw Error("THREE.Quaternion: .setFromEuler() now expects a Euler rotation rather than a Vector3 and order.");var c=Math.cos(a._x/2),d=Math.cos(a._y/2),e=Math.cos(a._z/2),f=Math.sin(a._x/2),g=Math.sin(a._y/2),h=Math.sin(a._z/2),k=a.order;"XYZ"===k?(this._x=f*d*e+c*g*h,this._y=c*g*e-f*d*h,this._z=c*d*h+f*g*e,this._w=c*d*e-f*g*h):"YXZ"===
	k?(this._x=f*d*e+c*g*h,this._y=c*g*e-f*d*h,this._z=c*d*h-f*g*e,this._w=c*d*e+f*g*h):"ZXY"===k?(this._x=f*d*e-c*g*h,this._y=c*g*e+f*d*h,this._z=c*d*h+f*g*e,this._w=c*d*e-f*g*h):"ZYX"===k?(this._x=f*d*e-c*g*h,this._y=c*g*e+f*d*h,this._z=c*d*h-f*g*e,this._w=c*d*e+f*g*h):"YZX"===k?(this._x=f*d*e+c*g*h,this._y=c*g*e+f*d*h,this._z=c*d*h-f*g*e,this._w=c*d*e-f*g*h):"XZY"===k&&(this._x=f*d*e-c*g*h,this._y=c*g*e-f*d*h,this._z=c*d*h+f*g*e,this._w=c*d*e+f*g*h);if(!1!==b)this.onChangeCallback();return this},setFromAxisAngle:function(a,
	b){var c=b/2,d=Math.sin(c);this._x=a.x*d;this._y=a.y*d;this._z=a.z*d;this._w=Math.cos(c);this.onChangeCallback();return this},setFromRotationMatrix:function(a){var b=a.elements,c=b[0];a=b[4];var d=b[8],e=b[1],f=b[5],g=b[9],h=b[2],k=b[6],b=b[10],l=c+f+b;0<l?(c=.5/Math.sqrt(l+1),this._w=.25/c,this._x=(k-g)*c,this._y=(d-h)*c,this._z=(e-a)*c):c>f&&c>b?(c=2*Math.sqrt(1+c-f-b),this._w=(k-g)/c,this._x=.25*c,this._y=(a+e)/c,this._z=(d+h)/c):f>b?(c=2*Math.sqrt(1+f-c-b),this._w=(d-h)/c,this._x=(a+e)/c,this._y=
	.25*c,this._z=(g+k)/c):(c=2*Math.sqrt(1+b-c-f),this._w=(e-a)/c,this._x=(d+h)/c,this._y=(g+k)/c,this._z=.25*c);this.onChangeCallback();return this},setFromUnitVectors:function(){var a,b;return function(c,d){void 0===a&&(a=new THREE.Vector3);b=c.dot(d)+1;1E-6>b?(b=0,Math.abs(c.x)>Math.abs(c.z)?a.set(-c.y,c.x,0):a.set(0,-c.z,c.y)):a.crossVectors(c,d);this._x=a.x;this._y=a.y;this._z=a.z;this._w=b;return this.normalize()}}(),inverse:function(){return this.conjugate().normalize()},conjugate:function(){this._x*=
	-1;this._y*=-1;this._z*=-1;this.onChangeCallback();return this},dot:function(a){return this._x*a._x+this._y*a._y+this._z*a._z+this._w*a._w},lengthSq:function(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w},length:function(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)},normalize:function(){var a=this.length();0===a?(this._z=this._y=this._x=0,this._w=1):(a=1/a,this._x*=a,this._y*=a,this._z*=a,this._w*=a);this.onChangeCallback();return this},
	multiply:function(a,b){return void 0!==b?(console.warn("THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead."),this.multiplyQuaternions(a,b)):this.multiplyQuaternions(this,a)},premultiply:function(a){return this.multiplyQuaternions(a,this)},multiplyQuaternions:function(a,b){var c=a._x,d=a._y,e=a._z,f=a._w,g=b._x,h=b._y,k=b._z,l=b._w;this._x=c*l+f*g+d*k-e*h;this._y=d*l+f*h+e*g-c*k;this._z=e*l+f*k+c*h-d*g;this._w=f*l-c*g-d*h-e*k;this.onChangeCallback();
	return this},slerp:function(a,b){if(0===b)return this;if(1===b)return this.copy(a);var c=this._x,d=this._y,e=this._z,f=this._w,g=f*a._w+c*a._x+d*a._y+e*a._z;0>g?(this._w=-a._w,this._x=-a._x,this._y=-a._y,this._z=-a._z,g=-g):this.copy(a);if(1<=g)return this._w=f,this._x=c,this._y=d,this._z=e,this;var h=Math.sqrt(1-g*g);if(.001>Math.abs(h))return this._w=.5*(f+this._w),this._x=.5*(c+this._x),this._y=.5*(d+this._y),this._z=.5*(e+this._z),this;var k=Math.atan2(h,g),g=Math.sin((1-b)*k)/h,h=Math.sin(b*
	k)/h;this._w=f*g+this._w*h;this._x=c*g+this._x*h;this._y=d*g+this._y*h;this._z=e*g+this._z*h;this.onChangeCallback();return this},equals:function(a){return a._x===this._x&&a._y===this._y&&a._z===this._z&&a._w===this._w},fromArray:function(a,b){void 0===b&&(b=0);this._x=a[b];this._y=a[b+1];this._z=a[b+2];this._w=a[b+3];this.onChangeCallback();return this},toArray:function(a,b){void 0===a&&(a=[]);void 0===b&&(b=0);a[b]=this._x;a[b+1]=this._y;a[b+2]=this._z;a[b+3]=this._w;return a},onChange:function(a){this.onChangeCallback=
	a;return this},onChangeCallback:function(){}};
	Object.assign(THREE.Quaternion,{slerp:function(a,b,c,d){return c.copy(a).slerp(b,d)},slerpFlat:function(a,b,c,d,e,f,g){var h=c[d+0],k=c[d+1],l=c[d+2];c=c[d+3];d=e[f+0];var n=e[f+1],p=e[f+2];e=e[f+3];if(c!==e||h!==d||k!==n||l!==p){f=1-g;var m=h*d+k*n+l*p+c*e,q=0<=m?1:-1,r=1-m*m;r>Number.EPSILON&&(r=Math.sqrt(r),m=Math.atan2(r,m*q),f=Math.sin(f*m)/r,g=Math.sin(g*m)/r);q*=g;h=h*f+d*q;k=k*f+n*q;l=l*f+p*q;c=c*f+e*q;f===1-g&&(g=1/Math.sqrt(h*h+k*k+l*l+c*c),h*=g,k*=g,l*=g,c*=g)}a[b]=h;a[b+1]=k;a[b+2]=l;
	a[b+3]=c}});THREE.Vector2=function(a,b){this.x=a||0;this.y=b||0};
	THREE.Vector2.prototype={constructor:THREE.Vector2,get width(){return this.x},set width(a){this.x=a},get height(){return this.y},set height(a){this.y=a},set:function(a,b){this.x=a;this.y=b;return this},setScalar:function(a){this.y=this.x=a;return this},setX:function(a){this.x=a;return this},setY:function(a){this.y=a;return this},setComponent:function(a,b){switch(a){case 0:this.x=b;break;case 1:this.y=b;break;default:throw Error("index is out of range: "+a);}},getComponent:function(a){switch(a){case 0:return this.x;
	case 1:return this.y;default:throw Error("index is out of range: "+a);}},clone:function(){return new this.constructor(this.x,this.y)},copy:function(a){this.x=a.x;this.y=a.y;return this},add:function(a,b){if(void 0!==b)return console.warn("THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(a,b);this.x+=a.x;this.y+=a.y;return this},addScalar:function(a){this.x+=a;this.y+=a;return this},addVectors:function(a,b){this.x=a.x+b.x;this.y=a.y+b.y;return this},
	addScaledVector:function(a,b){this.x+=a.x*b;this.y+=a.y*b;return this},sub:function(a,b){if(void 0!==b)return console.warn("THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(a,b);this.x-=a.x;this.y-=a.y;return this},subScalar:function(a){this.x-=a;this.y-=a;return this},subVectors:function(a,b){this.x=a.x-b.x;this.y=a.y-b.y;return this},multiply:function(a){this.x*=a.x;this.y*=a.y;return this},multiplyScalar:function(a){isFinite(a)?(this.x*=a,
	this.y*=a):this.y=this.x=0;return this},divide:function(a){this.x/=a.x;this.y/=a.y;return this},divideScalar:function(a){return this.multiplyScalar(1/a)},min:function(a){this.x=Math.min(this.x,a.x);this.y=Math.min(this.y,a.y);return this},max:function(a){this.x=Math.max(this.x,a.x);this.y=Math.max(this.y,a.y);return this},clamp:function(a,b){this.x=Math.max(a.x,Math.min(b.x,this.x));this.y=Math.max(a.y,Math.min(b.y,this.y));return this},clampScalar:function(){var a,b;return function(c,d){void 0===
	a&&(a=new THREE.Vector2,b=new THREE.Vector2);a.set(c,c);b.set(d,d);return this.clamp(a,b)}}(),clampLength:function(a,b){var c=this.length();return this.multiplyScalar(Math.max(a,Math.min(b,c))/c)},floor:function(){this.x=Math.floor(this.x);this.y=Math.floor(this.y);return this},ceil:function(){this.x=Math.ceil(this.x);this.y=Math.ceil(this.y);return this},round:function(){this.x=Math.round(this.x);this.y=Math.round(this.y);return this},roundToZero:function(){this.x=0>this.x?Math.ceil(this.x):Math.floor(this.x);
	this.y=0>this.y?Math.ceil(this.y):Math.floor(this.y);return this},negate:function(){this.x=-this.x;this.y=-this.y;return this},dot:function(a){return this.x*a.x+this.y*a.y},lengthSq:function(){return this.x*this.x+this.y*this.y},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},lengthManhattan:function(){return Math.abs(this.x)+Math.abs(this.y)},normalize:function(){return this.divideScalar(this.length())},angle:function(){var a=Math.atan2(this.y,this.x);0>a&&(a+=2*Math.PI);return a},
	distanceTo:function(a){return Math.sqrt(this.distanceToSquared(a))},distanceToSquared:function(a){var b=this.x-a.x;a=this.y-a.y;return b*b+a*a},setLength:function(a){return this.multiplyScalar(a/this.length())},lerp:function(a,b){this.x+=(a.x-this.x)*b;this.y+=(a.y-this.y)*b;return this},lerpVectors:function(a,b,c){return this.subVectors(b,a).multiplyScalar(c).add(a)},equals:function(a){return a.x===this.x&&a.y===this.y},fromArray:function(a,b){void 0===b&&(b=0);this.x=a[b];this.y=a[b+1];return this},
	toArray:function(a,b){void 0===a&&(a=[]);void 0===b&&(b=0);a[b]=this.x;a[b+1]=this.y;return a},fromAttribute:function(a,b,c){void 0===c&&(c=0);b=b*a.itemSize+c;this.x=a.array[b];this.y=a.array[b+1];return this},rotateAround:function(a,b){var c=Math.cos(b),d=Math.sin(b),e=this.x-a.x,f=this.y-a.y;this.x=e*c-f*d+a.x;this.y=e*d+f*c+a.y;return this}};THREE.Vector3=function(a,b,c){this.x=a||0;this.y=b||0;this.z=c||0};
	THREE.Vector3.prototype={constructor:THREE.Vector3,set:function(a,b,c){this.x=a;this.y=b;this.z=c;return this},setScalar:function(a){this.z=this.y=this.x=a;return this},setX:function(a){this.x=a;return this},setY:function(a){this.y=a;return this},setZ:function(a){this.z=a;return this},setComponent:function(a,b){switch(a){case 0:this.x=b;break;case 1:this.y=b;break;case 2:this.z=b;break;default:throw Error("index is out of range: "+a);}},getComponent:function(a){switch(a){case 0:return this.x;case 1:return this.y;
	case 2:return this.z;default:throw Error("index is out of range: "+a);}},clone:function(){return new this.constructor(this.x,this.y,this.z)},copy:function(a){this.x=a.x;this.y=a.y;this.z=a.z;return this},add:function(a,b){if(void 0!==b)return console.warn("THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(a,b);this.x+=a.x;this.y+=a.y;this.z+=a.z;return this},addScalar:function(a){this.x+=a;this.y+=a;this.z+=a;return this},addVectors:function(a,
	b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;return this},addScaledVector:function(a,b){this.x+=a.x*b;this.y+=a.y*b;this.z+=a.z*b;return this},sub:function(a,b){if(void 0!==b)return console.warn("THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(a,b);this.x-=a.x;this.y-=a.y;this.z-=a.z;return this},subScalar:function(a){this.x-=a;this.y-=a;this.z-=a;return this},subVectors:function(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this},
	multiply:function(a,b){if(void 0!==b)return console.warn("THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead."),this.multiplyVectors(a,b);this.x*=a.x;this.y*=a.y;this.z*=a.z;return this},multiplyScalar:function(a){isFinite(a)?(this.x*=a,this.y*=a,this.z*=a):this.z=this.y=this.x=0;return this},multiplyVectors:function(a,b){this.x=a.x*b.x;this.y=a.y*b.y;this.z=a.z*b.z;return this},applyEuler:function(){var a;return function(b){!1===b instanceof THREE.Euler&&
	console.error("THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.");void 0===a&&(a=new THREE.Quaternion);return this.applyQuaternion(a.setFromEuler(b))}}(),applyAxisAngle:function(){var a;return function(b,c){void 0===a&&(a=new THREE.Quaternion);return this.applyQuaternion(a.setFromAxisAngle(b,c))}}(),applyMatrix3:function(a){var b=this.x,c=this.y,d=this.z;a=a.elements;this.x=a[0]*b+a[3]*c+a[6]*d;this.y=a[1]*b+a[4]*c+a[7]*d;this.z=a[2]*b+a[5]*c+a[8]*d;return this},
	applyMatrix4:function(a){var b=this.x,c=this.y,d=this.z;a=a.elements;this.x=a[0]*b+a[4]*c+a[8]*d+a[12];this.y=a[1]*b+a[5]*c+a[9]*d+a[13];this.z=a[2]*b+a[6]*c+a[10]*d+a[14];return this},applyProjection:function(a){var b=this.x,c=this.y,d=this.z;a=a.elements;var e=1/(a[3]*b+a[7]*c+a[11]*d+a[15]);this.x=(a[0]*b+a[4]*c+a[8]*d+a[12])*e;this.y=(a[1]*b+a[5]*c+a[9]*d+a[13])*e;this.z=(a[2]*b+a[6]*c+a[10]*d+a[14])*e;return this},applyQuaternion:function(a){var b=this.x,c=this.y,d=this.z,e=a.x,f=a.y,g=a.z;a=
	a.w;var h=a*b+f*d-g*c,k=a*c+g*b-e*d,l=a*d+e*c-f*b,b=-e*b-f*c-g*d;this.x=h*a+b*-e+k*-g-l*-f;this.y=k*a+b*-f+l*-e-h*-g;this.z=l*a+b*-g+h*-f-k*-e;return this},project:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.multiplyMatrices(b.projectionMatrix,a.getInverse(b.matrixWorld));return this.applyProjection(a)}}(),unproject:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.multiplyMatrices(b.matrixWorld,a.getInverse(b.projectionMatrix));return this.applyProjection(a)}}(),
	transformDirection:function(a){var b=this.x,c=this.y,d=this.z;a=a.elements;this.x=a[0]*b+a[4]*c+a[8]*d;this.y=a[1]*b+a[5]*c+a[9]*d;this.z=a[2]*b+a[6]*c+a[10]*d;return this.normalize()},divide:function(a){this.x/=a.x;this.y/=a.y;this.z/=a.z;return this},divideScalar:function(a){return this.multiplyScalar(1/a)},min:function(a){this.x=Math.min(this.x,a.x);this.y=Math.min(this.y,a.y);this.z=Math.min(this.z,a.z);return this},max:function(a){this.x=Math.max(this.x,a.x);this.y=Math.max(this.y,a.y);this.z=
	Math.max(this.z,a.z);return this},clamp:function(a,b){this.x=Math.max(a.x,Math.min(b.x,this.x));this.y=Math.max(a.y,Math.min(b.y,this.y));this.z=Math.max(a.z,Math.min(b.z,this.z));return this},clampScalar:function(){var a,b;return function(c,d){void 0===a&&(a=new THREE.Vector3,b=new THREE.Vector3);a.set(c,c,c);b.set(d,d,d);return this.clamp(a,b)}}(),clampLength:function(a,b){var c=this.length();return this.multiplyScalar(Math.max(a,Math.min(b,c))/c)},floor:function(){this.x=Math.floor(this.x);this.y=
	Math.floor(this.y);this.z=Math.floor(this.z);return this},ceil:function(){this.x=Math.ceil(this.x);this.y=Math.ceil(this.y);this.z=Math.ceil(this.z);return this},round:function(){this.x=Math.round(this.x);this.y=Math.round(this.y);this.z=Math.round(this.z);return this},roundToZero:function(){this.x=0>this.x?Math.ceil(this.x):Math.floor(this.x);this.y=0>this.y?Math.ceil(this.y):Math.floor(this.y);this.z=0>this.z?Math.ceil(this.z):Math.floor(this.z);return this},negate:function(){this.x=-this.x;this.y=
	-this.y;this.z=-this.z;return this},dot:function(a){return this.x*a.x+this.y*a.y+this.z*a.z},lengthSq:function(){return this.x*this.x+this.y*this.y+this.z*this.z},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)},lengthManhattan:function(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)},normalize:function(){return this.divideScalar(this.length())},setLength:function(a){return this.multiplyScalar(a/this.length())},lerp:function(a,b){this.x+=(a.x-this.x)*b;this.y+=
	(a.y-this.y)*b;this.z+=(a.z-this.z)*b;return this},lerpVectors:function(a,b,c){return this.subVectors(b,a).multiplyScalar(c).add(a)},cross:function(a,b){if(void 0!==b)return console.warn("THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead."),this.crossVectors(a,b);var c=this.x,d=this.y,e=this.z;this.x=d*a.z-e*a.y;this.y=e*a.x-c*a.z;this.z=c*a.y-d*a.x;return this},crossVectors:function(a,b){var c=a.x,d=a.y,e=a.z,f=b.x,g=b.y,h=b.z;this.x=d*h-e*g;this.y=e*f-c*h;
	this.z=c*g-d*f;return this},projectOnVector:function(){var a,b;return function(c){void 0===a&&(a=new THREE.Vector3);a.copy(c).normalize();b=this.dot(a);return this.copy(a).multiplyScalar(b)}}(),projectOnPlane:function(){var a;return function(b){void 0===a&&(a=new THREE.Vector3);a.copy(this).projectOnVector(b);return this.sub(a)}}(),reflect:function(){var a;return function(b){void 0===a&&(a=new THREE.Vector3);return this.sub(a.copy(b).multiplyScalar(2*this.dot(b)))}}(),angleTo:function(a){a=this.dot(a)/
	Math.sqrt(this.lengthSq()*a.lengthSq());return Math.acos(THREE.Math.clamp(a,-1,1))},distanceTo:function(a){return Math.sqrt(this.distanceToSquared(a))},distanceToSquared:function(a){var b=this.x-a.x,c=this.y-a.y;a=this.z-a.z;return b*b+c*c+a*a},setFromSpherical:function(a){var b=Math.sin(a.phi)*a.radius;this.x=b*Math.sin(a.theta);this.y=Math.cos(a.phi)*a.radius;this.z=b*Math.cos(a.theta);return this},setFromMatrixPosition:function(a){return this.setFromMatrixColumn(a,3)},setFromMatrixScale:function(a){var b=
	this.setFromMatrixColumn(a,0).length(),c=this.setFromMatrixColumn(a,1).length();a=this.setFromMatrixColumn(a,2).length();this.x=b;this.y=c;this.z=a;return this},setFromMatrixColumn:function(a,b){if("number"===typeof a){console.warn("THREE.Vector3: setFromMatrixColumn now expects ( matrix, index ).");var c=a;a=b;b=c}return this.fromArray(a.elements,4*b)},equals:function(a){return a.x===this.x&&a.y===this.y&&a.z===this.z},fromArray:function(a,b){void 0===b&&(b=0);this.x=a[b];this.y=a[b+1];this.z=a[b+
	2];return this},toArray:function(a,b){void 0===a&&(a=[]);void 0===b&&(b=0);a[b]=this.x;a[b+1]=this.y;a[b+2]=this.z;return a},fromAttribute:function(a,b,c){void 0===c&&(c=0);b=b*a.itemSize+c;this.x=a.array[b];this.y=a.array[b+1];this.z=a.array[b+2];return this}};THREE.Vector4=function(a,b,c,d){this.x=a||0;this.y=b||0;this.z=c||0;this.w=void 0!==d?d:1};
	THREE.Vector4.prototype={constructor:THREE.Vector4,set:function(a,b,c,d){this.x=a;this.y=b;this.z=c;this.w=d;return this},setScalar:function(a){this.w=this.z=this.y=this.x=a;return this},setX:function(a){this.x=a;return this},setY:function(a){this.y=a;return this},setZ:function(a){this.z=a;return this},setW:function(a){this.w=a;return this},setComponent:function(a,b){switch(a){case 0:this.x=b;break;case 1:this.y=b;break;case 2:this.z=b;break;case 3:this.w=b;break;default:throw Error("index is out of range: "+
	a);}},getComponent:function(a){switch(a){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("index is out of range: "+a);}},clone:function(){return new this.constructor(this.x,this.y,this.z,this.w)},copy:function(a){this.x=a.x;this.y=a.y;this.z=a.z;this.w=void 0!==a.w?a.w:1;return this},add:function(a,b){if(void 0!==b)return console.warn("THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(a,b);
	this.x+=a.x;this.y+=a.y;this.z+=a.z;this.w+=a.w;return this},addScalar:function(a){this.x+=a;this.y+=a;this.z+=a;this.w+=a;return this},addVectors:function(a,b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;this.w=a.w+b.w;return this},addScaledVector:function(a,b){this.x+=a.x*b;this.y+=a.y*b;this.z+=a.z*b;this.w+=a.w*b;return this},sub:function(a,b){if(void 0!==b)return console.warn("THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(a,b);this.x-=
	a.x;this.y-=a.y;this.z-=a.z;this.w-=a.w;return this},subScalar:function(a){this.x-=a;this.y-=a;this.z-=a;this.w-=a;return this},subVectors:function(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;this.w=a.w-b.w;return this},multiplyScalar:function(a){isFinite(a)?(this.x*=a,this.y*=a,this.z*=a,this.w*=a):this.w=this.z=this.y=this.x=0;return this},applyMatrix4:function(a){var b=this.x,c=this.y,d=this.z,e=this.w;a=a.elements;this.x=a[0]*b+a[4]*c+a[8]*d+a[12]*e;this.y=a[1]*b+a[5]*c+a[9]*d+a[13]*e;this.z=
	a[2]*b+a[6]*c+a[10]*d+a[14]*e;this.w=a[3]*b+a[7]*c+a[11]*d+a[15]*e;return this},divideScalar:function(a){return this.multiplyScalar(1/a)},setAxisAngleFromQuaternion:function(a){this.w=2*Math.acos(a.w);var b=Math.sqrt(1-a.w*a.w);1E-4>b?(this.x=1,this.z=this.y=0):(this.x=a.x/b,this.y=a.y/b,this.z=a.z/b);return this},setAxisAngleFromRotationMatrix:function(a){var b,c,d;a=a.elements;var e=a[0];d=a[4];var f=a[8],g=a[1],h=a[5],k=a[9];c=a[2];b=a[6];var l=a[10];if(.01>Math.abs(d-g)&&.01>Math.abs(f-c)&&.01>
	Math.abs(k-b)){if(.1>Math.abs(d+g)&&.1>Math.abs(f+c)&&.1>Math.abs(k+b)&&.1>Math.abs(e+h+l-3))return this.set(1,0,0,0),this;a=Math.PI;e=(e+1)/2;h=(h+1)/2;l=(l+1)/2;d=(d+g)/4;f=(f+c)/4;k=(k+b)/4;e>h&&e>l?.01>e?(b=0,d=c=.707106781):(b=Math.sqrt(e),c=d/b,d=f/b):h>l?.01>h?(b=.707106781,c=0,d=.707106781):(c=Math.sqrt(h),b=d/c,d=k/c):.01>l?(c=b=.707106781,d=0):(d=Math.sqrt(l),b=f/d,c=k/d);this.set(b,c,d,a);return this}a=Math.sqrt((b-k)*(b-k)+(f-c)*(f-c)+(g-d)*(g-d));.001>Math.abs(a)&&(a=1);this.x=(b-k)/
	a;this.y=(f-c)/a;this.z=(g-d)/a;this.w=Math.acos((e+h+l-1)/2);return this},min:function(a){this.x=Math.min(this.x,a.x);this.y=Math.min(this.y,a.y);this.z=Math.min(this.z,a.z);this.w=Math.min(this.w,a.w);return this},max:function(a){this.x=Math.max(this.x,a.x);this.y=Math.max(this.y,a.y);this.z=Math.max(this.z,a.z);this.w=Math.max(this.w,a.w);return this},clamp:function(a,b){this.x=Math.max(a.x,Math.min(b.x,this.x));this.y=Math.max(a.y,Math.min(b.y,this.y));this.z=Math.max(a.z,Math.min(b.z,this.z));
	this.w=Math.max(a.w,Math.min(b.w,this.w));return this},clampScalar:function(){var a,b;return function(c,d){void 0===a&&(a=new THREE.Vector4,b=new THREE.Vector4);a.set(c,c,c,c);b.set(d,d,d,d);return this.clamp(a,b)}}(),floor:function(){this.x=Math.floor(this.x);this.y=Math.floor(this.y);this.z=Math.floor(this.z);this.w=Math.floor(this.w);return this},ceil:function(){this.x=Math.ceil(this.x);this.y=Math.ceil(this.y);this.z=Math.ceil(this.z);this.w=Math.ceil(this.w);return this},round:function(){this.x=
	Math.round(this.x);this.y=Math.round(this.y);this.z=Math.round(this.z);this.w=Math.round(this.w);return this},roundToZero:function(){this.x=0>this.x?Math.ceil(this.x):Math.floor(this.x);this.y=0>this.y?Math.ceil(this.y):Math.floor(this.y);this.z=0>this.z?Math.ceil(this.z):Math.floor(this.z);this.w=0>this.w?Math.ceil(this.w):Math.floor(this.w);return this},negate:function(){this.x=-this.x;this.y=-this.y;this.z=-this.z;this.w=-this.w;return this},dot:function(a){return this.x*a.x+this.y*a.y+this.z*
	a.z+this.w*a.w},lengthSq:function(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)},lengthManhattan:function(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)},normalize:function(){return this.divideScalar(this.length())},setLength:function(a){return this.multiplyScalar(a/this.length())},lerp:function(a,b){this.x+=(a.x-this.x)*b;this.y+=(a.y-this.y)*b;this.z+=(a.z-
	this.z)*b;this.w+=(a.w-this.w)*b;return this},lerpVectors:function(a,b,c){return this.subVectors(b,a).multiplyScalar(c).add(a)},equals:function(a){return a.x===this.x&&a.y===this.y&&a.z===this.z&&a.w===this.w},fromArray:function(a,b){void 0===b&&(b=0);this.x=a[b];this.y=a[b+1];this.z=a[b+2];this.w=a[b+3];return this},toArray:function(a,b){void 0===a&&(a=[]);void 0===b&&(b=0);a[b]=this.x;a[b+1]=this.y;a[b+2]=this.z;a[b+3]=this.w;return a},fromAttribute:function(a,b,c){void 0===c&&(c=0);b=b*a.itemSize+
	c;this.x=a.array[b];this.y=a.array[b+1];this.z=a.array[b+2];this.w=a.array[b+3];return this}};THREE.Euler=function(a,b,c,d){this._x=a||0;this._y=b||0;this._z=c||0;this._order=d||THREE.Euler.DefaultOrder};THREE.Euler.RotationOrders="XYZ YZX ZXY XZY YXZ ZYX".split(" ");THREE.Euler.DefaultOrder="XYZ";
	THREE.Euler.prototype={constructor:THREE.Euler,get x(){return this._x},set x(a){this._x=a;this.onChangeCallback()},get y(){return this._y},set y(a){this._y=a;this.onChangeCallback()},get z(){return this._z},set z(a){this._z=a;this.onChangeCallback()},get order(){return this._order},set order(a){this._order=a;this.onChangeCallback()},set:function(a,b,c,d){this._x=a;this._y=b;this._z=c;this._order=d||this._order;this.onChangeCallback();return this},clone:function(){return new this.constructor(this._x,
	this._y,this._z,this._order)},copy:function(a){this._x=a._x;this._y=a._y;this._z=a._z;this._order=a._order;this.onChangeCallback();return this},setFromRotationMatrix:function(a,b,c){var d=THREE.Math.clamp,e=a.elements;a=e[0];var f=e[4],g=e[8],h=e[1],k=e[5],l=e[9],n=e[2],p=e[6],e=e[10];b=b||this._order;"XYZ"===b?(this._y=Math.asin(d(g,-1,1)),.99999>Math.abs(g)?(this._x=Math.atan2(-l,e),this._z=Math.atan2(-f,a)):(this._x=Math.atan2(p,k),this._z=0)):"YXZ"===b?(this._x=Math.asin(-d(l,-1,1)),.99999>Math.abs(l)?
	(this._y=Math.atan2(g,e),this._z=Math.atan2(h,k)):(this._y=Math.atan2(-n,a),this._z=0)):"ZXY"===b?(this._x=Math.asin(d(p,-1,1)),.99999>Math.abs(p)?(this._y=Math.atan2(-n,e),this._z=Math.atan2(-f,k)):(this._y=0,this._z=Math.atan2(h,a))):"ZYX"===b?(this._y=Math.asin(-d(n,-1,1)),.99999>Math.abs(n)?(this._x=Math.atan2(p,e),this._z=Math.atan2(h,a)):(this._x=0,this._z=Math.atan2(-f,k))):"YZX"===b?(this._z=Math.asin(d(h,-1,1)),.99999>Math.abs(h)?(this._x=Math.atan2(-l,k),this._y=Math.atan2(-n,a)):(this._x=
	0,this._y=Math.atan2(g,e))):"XZY"===b?(this._z=Math.asin(-d(f,-1,1)),.99999>Math.abs(f)?(this._x=Math.atan2(p,k),this._y=Math.atan2(g,a)):(this._x=Math.atan2(-l,e),this._y=0)):console.warn("THREE.Euler: .setFromRotationMatrix() given unsupported order: "+b);this._order=b;if(!1!==c)this.onChangeCallback();return this},setFromQuaternion:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Matrix4);a.makeRotationFromQuaternion(b);return this.setFromRotationMatrix(a,c,d)}}(),setFromVector3:function(a,
	b){return this.set(a.x,a.y,a.z,b||this._order)},reorder:function(){var a=new THREE.Quaternion;return function(b){a.setFromEuler(this);return this.setFromQuaternion(a,b)}}(),equals:function(a){return a._x===this._x&&a._y===this._y&&a._z===this._z&&a._order===this._order},fromArray:function(a){this._x=a[0];this._y=a[1];this._z=a[2];void 0!==a[3]&&(this._order=a[3]);this.onChangeCallback();return this},toArray:function(a,b){void 0===a&&(a=[]);void 0===b&&(b=0);a[b]=this._x;a[b+1]=this._y;a[b+2]=this._z;
	a[b+3]=this._order;return a},toVector3:function(a){return a?a.set(this._x,this._y,this._z):new THREE.Vector3(this._x,this._y,this._z)},onChange:function(a){this.onChangeCallback=a;return this},onChangeCallback:function(){}};THREE.Line3=function(a,b){this.start=void 0!==a?a:new THREE.Vector3;this.end=void 0!==b?b:new THREE.Vector3};
	THREE.Line3.prototype={constructor:THREE.Line3,set:function(a,b){this.start.copy(a);this.end.copy(b);return this},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.start.copy(a.start);this.end.copy(a.end);return this},center:function(a){return(a||new THREE.Vector3).addVectors(this.start,this.end).multiplyScalar(.5)},delta:function(a){return(a||new THREE.Vector3).subVectors(this.end,this.start)},distanceSq:function(){return this.start.distanceToSquared(this.end)},distance:function(){return this.start.distanceTo(this.end)},
	at:function(a,b){var c=b||new THREE.Vector3;return this.delta(c).multiplyScalar(a).add(this.start)},closestPointToPointParameter:function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(c,d){a.subVectors(c,this.start);b.subVectors(this.end,this.start);var e=b.dot(b),e=b.dot(a)/e;d&&(e=THREE.Math.clamp(e,0,1));return e}}(),closestPointToPoint:function(a,b,c){a=this.closestPointToPointParameter(a,b);c=c||new THREE.Vector3;return this.delta(c).multiplyScalar(a).add(this.start)},applyMatrix4:function(a){this.start.applyMatrix4(a);
	this.end.applyMatrix4(a);return this},equals:function(a){return a.start.equals(this.start)&&a.end.equals(this.end)}};THREE.Box2=function(a,b){this.min=void 0!==a?a:new THREE.Vector2(Infinity,Infinity);this.max=void 0!==b?b:new THREE.Vector2(-Infinity,-Infinity)};
	THREE.Box2.prototype={constructor:THREE.Box2,set:function(a,b){this.min.copy(a);this.max.copy(b);return this},setFromPoints:function(a){this.makeEmpty();for(var b=0,c=a.length;b<c;b++)this.expandByPoint(a[b]);return this},setFromCenterAndSize:function(){var a=new THREE.Vector2;return function(b,c){var d=a.copy(c).multiplyScalar(.5);this.min.copy(b).sub(d);this.max.copy(b).add(d);return this}}(),clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.min.copy(a.min);this.max.copy(a.max);
	return this},makeEmpty:function(){this.min.x=this.min.y=Infinity;this.max.x=this.max.y=-Infinity;return this},isEmpty:function(){return this.max.x<this.min.x||this.max.y<this.min.y},center:function(a){return(a||new THREE.Vector2).addVectors(this.min,this.max).multiplyScalar(.5)},size:function(a){return(a||new THREE.Vector2).subVectors(this.max,this.min)},expandByPoint:function(a){this.min.min(a);this.max.max(a);return this},expandByVector:function(a){this.min.sub(a);this.max.add(a);return this},expandByScalar:function(a){this.min.addScalar(-a);
	this.max.addScalar(a);return this},containsPoint:function(a){return a.x<this.min.x||a.x>this.max.x||a.y<this.min.y||a.y>this.max.y?!1:!0},containsBox:function(a){return this.min.x<=a.min.x&&a.max.x<=this.max.x&&this.min.y<=a.min.y&&a.max.y<=this.max.y?!0:!1},getParameter:function(a,b){return(b||new THREE.Vector2).set((a.x-this.min.x)/(this.max.x-this.min.x),(a.y-this.min.y)/(this.max.y-this.min.y))},intersectsBox:function(a){return a.max.x<this.min.x||a.min.x>this.max.x||a.max.y<this.min.y||a.min.y>
	this.max.y?!1:!0},clampPoint:function(a,b){return(b||new THREE.Vector2).copy(a).clamp(this.min,this.max)},distanceToPoint:function(){var a=new THREE.Vector2;return function(b){return a.copy(b).clamp(this.min,this.max).sub(b).length()}}(),intersect:function(a){this.min.max(a.min);this.max.min(a.max);return this},union:function(a){this.min.min(a.min);this.max.max(a.max);return this},translate:function(a){this.min.add(a);this.max.add(a);return this},equals:function(a){return a.min.equals(this.min)&&
	a.max.equals(this.max)}};THREE.Box3=function(a,b){this.min=void 0!==a?a:new THREE.Vector3(Infinity,Infinity,Infinity);this.max=void 0!==b?b:new THREE.Vector3(-Infinity,-Infinity,-Infinity)};
	THREE.Box3.prototype={constructor:THREE.Box3,set:function(a,b){this.min.copy(a);this.max.copy(b);return this},setFromArray:function(a){for(var b=Infinity,c=Infinity,d=Infinity,e=-Infinity,f=-Infinity,g=-Infinity,h=0,k=a.length;h<k;h+=3){var l=a[h],n=a[h+1],p=a[h+2];l<b&&(b=l);n<c&&(c=n);p<d&&(d=p);l>e&&(e=l);n>f&&(f=n);p>g&&(g=p)}this.min.set(b,c,d);this.max.set(e,f,g)},setFromPoints:function(a){this.makeEmpty();for(var b=0,c=a.length;b<c;b++)this.expandByPoint(a[b]);return this},setFromCenterAndSize:function(){var a=
	new THREE.Vector3;return function(b,c){var d=a.copy(c).multiplyScalar(.5);this.min.copy(b).sub(d);this.max.copy(b).add(d);return this}}(),setFromObject:function(){var a=new THREE.Vector3;return function(b){var c=this;b.updateMatrixWorld(!0);this.makeEmpty();b.traverse(function(b){var e=b.geometry;if(void 0!==e)if(e instanceof THREE.Geometry)for(var f=e.vertices,e=0,g=f.length;e<g;e++)a.copy(f[e]),a.applyMatrix4(b.matrixWorld),c.expandByPoint(a);else if(e instanceof THREE.BufferGeometry&&void 0!==
	e.attributes.position)for(f=e.attributes.position.array,e=0,g=f.length;e<g;e+=3)a.fromArray(f,e),a.applyMatrix4(b.matrixWorld),c.expandByPoint(a)});return this}}(),clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.min.copy(a.min);this.max.copy(a.max);return this},makeEmpty:function(){this.min.x=this.min.y=this.min.z=Infinity;this.max.x=this.max.y=this.max.z=-Infinity;return this},isEmpty:function(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z},
	center:function(a){return(a||new THREE.Vector3).addVectors(this.min,this.max).multiplyScalar(.5)},size:function(a){return(a||new THREE.Vector3).subVectors(this.max,this.min)},expandByPoint:function(a){this.min.min(a);this.max.max(a);return this},expandByVector:function(a){this.min.sub(a);this.max.add(a);return this},expandByScalar:function(a){this.min.addScalar(-a);this.max.addScalar(a);return this},containsPoint:function(a){return a.x<this.min.x||a.x>this.max.x||a.y<this.min.y||a.y>this.max.y||a.z<
	this.min.z||a.z>this.max.z?!1:!0},containsBox:function(a){return this.min.x<=a.min.x&&a.max.x<=this.max.x&&this.min.y<=a.min.y&&a.max.y<=this.max.y&&this.min.z<=a.min.z&&a.max.z<=this.max.z?!0:!1},getParameter:function(a,b){return(b||new THREE.Vector3).set((a.x-this.min.x)/(this.max.x-this.min.x),(a.y-this.min.y)/(this.max.y-this.min.y),(a.z-this.min.z)/(this.max.z-this.min.z))},intersectsBox:function(a){return a.max.x<this.min.x||a.min.x>this.max.x||a.max.y<this.min.y||a.min.y>this.max.y||a.max.z<
	this.min.z||a.min.z>this.max.z?!1:!0},intersectsSphere:function(){var a;return function(b){void 0===a&&(a=new THREE.Vector3);this.clampPoint(b.center,a);return a.distanceToSquared(b.center)<=b.radius*b.radius}}(),intersectsPlane:function(a){var b,c;0<a.normal.x?(b=a.normal.x*this.min.x,c=a.normal.x*this.max.x):(b=a.normal.x*this.max.x,c=a.normal.x*this.min.x);0<a.normal.y?(b+=a.normal.y*this.min.y,c+=a.normal.y*this.max.y):(b+=a.normal.y*this.max.y,c+=a.normal.y*this.min.y);0<a.normal.z?(b+=a.normal.z*
	this.min.z,c+=a.normal.z*this.max.z):(b+=a.normal.z*this.max.z,c+=a.normal.z*this.min.z);return b<=a.constant&&c>=a.constant},clampPoint:function(a,b){return(b||new THREE.Vector3).copy(a).clamp(this.min,this.max)},distanceToPoint:function(){var a=new THREE.Vector3;return function(b){return a.copy(b).clamp(this.min,this.max).sub(b).length()}}(),getBoundingSphere:function(){var a=new THREE.Vector3;return function(b){b=b||new THREE.Sphere;b.center=this.center();b.radius=.5*this.size(a).length();return b}}(),
	intersect:function(a){this.min.max(a.min);this.max.min(a.max);this.isEmpty()&&this.makeEmpty();return this},union:function(a){this.min.min(a.min);this.max.max(a.max);return this},applyMatrix4:function(){var a=[new THREE.Vector3,new THREE.Vector3,new THREE.Vector3,new THREE.Vector3,new THREE.Vector3,new THREE.Vector3,new THREE.Vector3,new THREE.Vector3];return function(b){if(this.isEmpty())return this;a[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(b);a[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(b);
	a[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(b);a[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(b);a[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(b);a[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(b);a[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(b);a[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(b);this.setFromPoints(a);return this}}(),translate:function(a){this.min.add(a);this.max.add(a);return this},equals:function(a){return a.min.equals(this.min)&&
	a.max.equals(this.max)}};THREE.Matrix3=function(){this.elements=new Float32Array([1,0,0,0,1,0,0,0,1]);0<arguments.length&&console.error("THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.")};
	THREE.Matrix3.prototype={constructor:THREE.Matrix3,set:function(a,b,c,d,e,f,g,h,k){var l=this.elements;l[0]=a;l[1]=d;l[2]=g;l[3]=b;l[4]=e;l[5]=h;l[6]=c;l[7]=f;l[8]=k;return this},identity:function(){this.set(1,0,0,0,1,0,0,0,1);return this},clone:function(){return(new this.constructor).fromArray(this.elements)},copy:function(a){a=a.elements;this.set(a[0],a[3],a[6],a[1],a[4],a[7],a[2],a[5],a[8]);return this},setFromMatrix4:function(a){a=a.elements;this.set(a[0],a[4],a[8],a[1],a[5],a[9],a[2],a[6],a[10]);
	return this},applyToVector3Array:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Vector3);void 0===c&&(c=0);void 0===d&&(d=b.length);for(var e=0;e<d;e+=3,c+=3)a.fromArray(b,c),a.applyMatrix3(this),a.toArray(b,c);return b}}(),applyToBuffer:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Vector3);void 0===c&&(c=0);void 0===d&&(d=b.length/b.itemSize);for(var e=0;e<d;e++,c++)a.x=b.getX(c),a.y=b.getY(c),a.z=b.getZ(c),a.applyMatrix3(this),b.setXYZ(a.x,a.y,a.z);return b}}(),
	multiplyScalar:function(a){var b=this.elements;b[0]*=a;b[3]*=a;b[6]*=a;b[1]*=a;b[4]*=a;b[7]*=a;b[2]*=a;b[5]*=a;b[8]*=a;return this},determinant:function(){var a=this.elements,b=a[0],c=a[1],d=a[2],e=a[3],f=a[4],g=a[5],h=a[6],k=a[7],a=a[8];return b*f*a-b*g*k-c*e*a+c*g*h+d*e*k-d*f*h},getInverse:function(a,b){a instanceof THREE.Matrix4&&console.error("THREE.Matrix3.getInverse no longer takes a Matrix4 argument.");var c=a.elements,d=this.elements,e=c[0],f=c[1],g=c[2],h=c[3],k=c[4],l=c[5],n=c[6],p=c[7],
	c=c[8],m=c*k-l*p,q=l*n-c*h,r=p*h-k*n,s=e*m+f*q+g*r;if(0===s){if(b)throw Error("THREE.Matrix3.getInverse(): can't invert matrix, determinant is 0");console.warn("THREE.Matrix3.getInverse(): can't invert matrix, determinant is 0");return this.identity()}s=1/s;d[0]=m*s;d[1]=(g*p-c*f)*s;d[2]=(l*f-g*k)*s;d[3]=q*s;d[4]=(c*e-g*n)*s;d[5]=(g*h-l*e)*s;d[6]=r*s;d[7]=(f*n-p*e)*s;d[8]=(k*e-f*h)*s;return this},transpose:function(){var a,b=this.elements;a=b[1];b[1]=b[3];b[3]=a;a=b[2];b[2]=b[6];b[6]=a;a=b[5];b[5]=
	b[7];b[7]=a;return this},flattenToArrayOffset:function(a,b){console.warn("THREE.Matrix3: .flattenToArrayOffset is deprecated - just use .toArray instead.");return this.toArray(a,b)},getNormalMatrix:function(a){return this.setFromMatrix4(a).getInverse(this).transpose()},transposeIntoArray:function(a){var b=this.elements;a[0]=b[0];a[1]=b[3];a[2]=b[6];a[3]=b[1];a[4]=b[4];a[5]=b[7];a[6]=b[2];a[7]=b[5];a[8]=b[8];return this},fromArray:function(a){this.elements.set(a);return this},toArray:function(a,b){void 0===
	a&&(a=[]);void 0===b&&(b=0);var c=this.elements;a[b]=c[0];a[b+1]=c[1];a[b+2]=c[2];a[b+3]=c[3];a[b+4]=c[4];a[b+5]=c[5];a[b+6]=c[6];a[b+7]=c[7];a[b+8]=c[8];return a}};THREE.Matrix4=function(){this.elements=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);0<arguments.length&&console.error("THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.")};
	THREE.Matrix4.prototype={constructor:THREE.Matrix4,set:function(a,b,c,d,e,f,g,h,k,l,n,p,m,q,r,s){var u=this.elements;u[0]=a;u[4]=b;u[8]=c;u[12]=d;u[1]=e;u[5]=f;u[9]=g;u[13]=h;u[2]=k;u[6]=l;u[10]=n;u[14]=p;u[3]=m;u[7]=q;u[11]=r;u[15]=s;return this},identity:function(){this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);return this},clone:function(){return(new THREE.Matrix4).fromArray(this.elements)},copy:function(a){this.elements.set(a.elements);return this},copyPosition:function(a){var b=this.elements;a=a.elements;
	b[12]=a[12];b[13]=a[13];b[14]=a[14];return this},extractBasis:function(a,b,c){a.setFromMatrixColumn(this,0);b.setFromMatrixColumn(this,1);c.setFromMatrixColumn(this,2);return this},makeBasis:function(a,b,c){this.set(a.x,b.x,c.x,0,a.y,b.y,c.y,0,a.z,b.z,c.z,0,0,0,0,1);return this},extractRotation:function(){var a;return function(b){void 0===a&&(a=new THREE.Vector3);var c=this.elements,d=b.elements,e=1/a.setFromMatrixColumn(b,0).length(),f=1/a.setFromMatrixColumn(b,1).length();b=1/a.setFromMatrixColumn(b,
	2).length();c[0]=d[0]*e;c[1]=d[1]*e;c[2]=d[2]*e;c[4]=d[4]*f;c[5]=d[5]*f;c[6]=d[6]*f;c[8]=d[8]*b;c[9]=d[9]*b;c[10]=d[10]*b;return this}}(),makeRotationFromEuler:function(a){!1===a instanceof THREE.Euler&&console.error("THREE.Matrix: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.");var b=this.elements,c=a.x,d=a.y,e=a.z,f=Math.cos(c),c=Math.sin(c),g=Math.cos(d),d=Math.sin(d),h=Math.cos(e),e=Math.sin(e);if("XYZ"===a.order){a=f*h;var k=f*e,l=c*h,n=c*e;b[0]=g*h;b[4]=
	-g*e;b[8]=d;b[1]=k+l*d;b[5]=a-n*d;b[9]=-c*g;b[2]=n-a*d;b[6]=l+k*d;b[10]=f*g}else"YXZ"===a.order?(a=g*h,k=g*e,l=d*h,n=d*e,b[0]=a+n*c,b[4]=l*c-k,b[8]=f*d,b[1]=f*e,b[5]=f*h,b[9]=-c,b[2]=k*c-l,b[6]=n+a*c,b[10]=f*g):"ZXY"===a.order?(a=g*h,k=g*e,l=d*h,n=d*e,b[0]=a-n*c,b[4]=-f*e,b[8]=l+k*c,b[1]=k+l*c,b[5]=f*h,b[9]=n-a*c,b[2]=-f*d,b[6]=c,b[10]=f*g):"ZYX"===a.order?(a=f*h,k=f*e,l=c*h,n=c*e,b[0]=g*h,b[4]=l*d-k,b[8]=a*d+n,b[1]=g*e,b[5]=n*d+a,b[9]=k*d-l,b[2]=-d,b[6]=c*g,b[10]=f*g):"YZX"===a.order?(a=f*g,k=f*
	d,l=c*g,n=c*d,b[0]=g*h,b[4]=n-a*e,b[8]=l*e+k,b[1]=e,b[5]=f*h,b[9]=-c*h,b[2]=-d*h,b[6]=k*e+l,b[10]=a-n*e):"XZY"===a.order&&(a=f*g,k=f*d,l=c*g,n=c*d,b[0]=g*h,b[4]=-e,b[8]=d*h,b[1]=a*e+n,b[5]=f*h,b[9]=k*e-l,b[2]=l*e-k,b[6]=c*h,b[10]=n*e+a);b[3]=0;b[7]=0;b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return this},makeRotationFromQuaternion:function(a){var b=this.elements,c=a.x,d=a.y,e=a.z,f=a.w,g=c+c,h=d+d,k=e+e;a=c*g;var l=c*h,c=c*k,n=d*h,d=d*k,e=e*k,g=f*g,h=f*h,f=f*k;b[0]=1-(n+e);b[4]=l-f;b[8]=c+h;b[1]=l+
	f;b[5]=1-(a+e);b[9]=d-g;b[2]=c-h;b[6]=d+g;b[10]=1-(a+n);b[3]=0;b[7]=0;b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return this},lookAt:function(){var a,b,c;return function(d,e,f){void 0===a&&(a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Vector3);var g=this.elements;c.subVectors(d,e).normalize();0===c.lengthSq()&&(c.z=1);a.crossVectors(f,c).normalize();0===a.lengthSq()&&(c.z+=1E-4,a.crossVectors(f,c).normalize());b.crossVectors(c,a);g[0]=a.x;g[4]=b.x;g[8]=c.x;g[1]=a.y;g[5]=b.y;g[9]=c.y;g[2]=a.z;
	g[6]=b.z;g[10]=c.z;return this}}(),multiply:function(a,b){return void 0!==b?(console.warn("THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead."),this.multiplyMatrices(a,b)):this.multiplyMatrices(this,a)},premultiply:function(a){return this.multiplyMatrices(a,this)},multiplyMatrices:function(a,b){var c=a.elements,d=b.elements,e=this.elements,f=c[0],g=c[4],h=c[8],k=c[12],l=c[1],n=c[5],p=c[9],m=c[13],q=c[2],r=c[6],s=c[10],u=c[14],x=c[3],v=c[7],C=c[11],c=c[15],
	w=d[0],D=d[4],A=d[8],y=d[12],B=d[1],G=d[5],z=d[9],H=d[13],M=d[2],O=d[6],N=d[10],E=d[14],K=d[3],I=d[7],L=d[11],d=d[15];e[0]=f*w+g*B+h*M+k*K;e[4]=f*D+g*G+h*O+k*I;e[8]=f*A+g*z+h*N+k*L;e[12]=f*y+g*H+h*E+k*d;e[1]=l*w+n*B+p*M+m*K;e[5]=l*D+n*G+p*O+m*I;e[9]=l*A+n*z+p*N+m*L;e[13]=l*y+n*H+p*E+m*d;e[2]=q*w+r*B+s*M+u*K;e[6]=q*D+r*G+s*O+u*I;e[10]=q*A+r*z+s*N+u*L;e[14]=q*y+r*H+s*E+u*d;e[3]=x*w+v*B+C*M+c*K;e[7]=x*D+v*G+C*O+c*I;e[11]=x*A+v*z+C*N+c*L;e[15]=x*y+v*H+C*E+c*d;return this},multiplyToArray:function(a,b,
	c){var d=this.elements;this.multiplyMatrices(a,b);c[0]=d[0];c[1]=d[1];c[2]=d[2];c[3]=d[3];c[4]=d[4];c[5]=d[5];c[6]=d[6];c[7]=d[7];c[8]=d[8];c[9]=d[9];c[10]=d[10];c[11]=d[11];c[12]=d[12];c[13]=d[13];c[14]=d[14];c[15]=d[15];return this},multiplyScalar:function(a){var b=this.elements;b[0]*=a;b[4]*=a;b[8]*=a;b[12]*=a;b[1]*=a;b[5]*=a;b[9]*=a;b[13]*=a;b[2]*=a;b[6]*=a;b[10]*=a;b[14]*=a;b[3]*=a;b[7]*=a;b[11]*=a;b[15]*=a;return this},applyToVector3Array:function(){var a;return function(b,c,d){void 0===a&&
	(a=new THREE.Vector3);void 0===c&&(c=0);void 0===d&&(d=b.length);for(var e=0;e<d;e+=3,c+=3)a.fromArray(b,c),a.applyMatrix4(this),a.toArray(b,c);return b}}(),applyToBuffer:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Vector3);void 0===c&&(c=0);void 0===d&&(d=b.length/b.itemSize);for(var e=0;e<d;e++,c++)a.x=b.getX(c),a.y=b.getY(c),a.z=b.getZ(c),a.applyMatrix4(this),b.setXYZ(a.x,a.y,a.z);return b}}(),determinant:function(){var a=this.elements,b=a[0],c=a[4],d=a[8],e=a[12],f=a[1],g=
	a[5],h=a[9],k=a[13],l=a[2],n=a[6],p=a[10],m=a[14];return a[3]*(+e*h*n-d*k*n-e*g*p+c*k*p+d*g*m-c*h*m)+a[7]*(+b*h*m-b*k*p+e*f*p-d*f*m+d*k*l-e*h*l)+a[11]*(+b*k*n-b*g*m-e*f*n+c*f*m+e*g*l-c*k*l)+a[15]*(-d*g*l-b*h*n+b*g*p+d*f*n-c*f*p+c*h*l)},transpose:function(){var a=this.elements,b;b=a[1];a[1]=a[4];a[4]=b;b=a[2];a[2]=a[8];a[8]=b;b=a[6];a[6]=a[9];a[9]=b;b=a[3];a[3]=a[12];a[12]=b;b=a[7];a[7]=a[13];a[13]=b;b=a[11];a[11]=a[14];a[14]=b;return this},flattenToArrayOffset:function(a,b){console.warn("THREE.Matrix3: .flattenToArrayOffset is deprecated - just use .toArray instead.");
	return this.toArray(a,b)},getPosition:function(){var a;return function(){void 0===a&&(a=new THREE.Vector3);console.warn("THREE.Matrix4: .getPosition() has been removed. Use Vector3.setFromMatrixPosition( matrix ) instead.");return a.setFromMatrixColumn(this,3)}}(),setPosition:function(a){var b=this.elements;b[12]=a.x;b[13]=a.y;b[14]=a.z;return this},getInverse:function(a,b){var c=this.elements,d=a.elements,e=d[0],f=d[1],g=d[2],h=d[3],k=d[4],l=d[5],n=d[6],p=d[7],m=d[8],q=d[9],r=d[10],s=d[11],u=d[12],
	x=d[13],v=d[14],d=d[15],C=q*v*p-x*r*p+x*n*s-l*v*s-q*n*d+l*r*d,w=u*r*p-m*v*p-u*n*s+k*v*s+m*n*d-k*r*d,D=m*x*p-u*q*p+u*l*s-k*x*s-m*l*d+k*q*d,A=u*q*n-m*x*n-u*l*r+k*x*r+m*l*v-k*q*v,y=e*C+f*w+g*D+h*A;if(0===y){if(b)throw Error("THREE.Matrix4.getInverse(): can't invert matrix, determinant is 0");console.warn("THREE.Matrix4.getInverse(): can't invert matrix, determinant is 0");return this.identity()}y=1/y;c[0]=C*y;c[1]=(x*r*h-q*v*h-x*g*s+f*v*s+q*g*d-f*r*d)*y;c[2]=(l*v*h-x*n*h+x*g*p-f*v*p-l*g*d+f*n*d)*y;c[3]=
	(q*n*h-l*r*h-q*g*p+f*r*p+l*g*s-f*n*s)*y;c[4]=w*y;c[5]=(m*v*h-u*r*h+u*g*s-e*v*s-m*g*d+e*r*d)*y;c[6]=(u*n*h-k*v*h-u*g*p+e*v*p+k*g*d-e*n*d)*y;c[7]=(k*r*h-m*n*h+m*g*p-e*r*p-k*g*s+e*n*s)*y;c[8]=D*y;c[9]=(u*q*h-m*x*h-u*f*s+e*x*s+m*f*d-e*q*d)*y;c[10]=(k*x*h-u*l*h+u*f*p-e*x*p-k*f*d+e*l*d)*y;c[11]=(m*l*h-k*q*h-m*f*p+e*q*p+k*f*s-e*l*s)*y;c[12]=A*y;c[13]=(m*x*g-u*q*g+u*f*r-e*x*r-m*f*v+e*q*v)*y;c[14]=(u*l*g-k*x*g-u*f*n+e*x*n+k*f*v-e*l*v)*y;c[15]=(k*q*g-m*l*g+m*f*n-e*q*n-k*f*r+e*l*r)*y;return this},scale:function(a){var b=
	this.elements,c=a.x,d=a.y;a=a.z;b[0]*=c;b[4]*=d;b[8]*=a;b[1]*=c;b[5]*=d;b[9]*=a;b[2]*=c;b[6]*=d;b[10]*=a;b[3]*=c;b[7]*=d;b[11]*=a;return this},getMaxScaleOnAxis:function(){var a=this.elements;return Math.sqrt(Math.max(a[0]*a[0]+a[1]*a[1]+a[2]*a[2],a[4]*a[4]+a[5]*a[5]+a[6]*a[6],a[8]*a[8]+a[9]*a[9]+a[10]*a[10]))},makeTranslation:function(a,b,c){this.set(1,0,0,a,0,1,0,b,0,0,1,c,0,0,0,1);return this},makeRotationX:function(a){var b=Math.cos(a);a=Math.sin(a);this.set(1,0,0,0,0,b,-a,0,0,a,b,0,0,0,0,1);
	return this},makeRotationY:function(a){var b=Math.cos(a);a=Math.sin(a);this.set(b,0,a,0,0,1,0,0,-a,0,b,0,0,0,0,1);return this},makeRotationZ:function(a){var b=Math.cos(a);a=Math.sin(a);this.set(b,-a,0,0,a,b,0,0,0,0,1,0,0,0,0,1);return this},makeRotationAxis:function(a,b){var c=Math.cos(b),d=Math.sin(b),e=1-c,f=a.x,g=a.y,h=a.z,k=e*f,l=e*g;this.set(k*f+c,k*g-d*h,k*h+d*g,0,k*g+d*h,l*g+c,l*h-d*f,0,k*h-d*g,l*h+d*f,e*h*h+c,0,0,0,0,1);return this},makeScale:function(a,b,c){this.set(a,0,0,0,0,b,0,0,0,0,c,
	0,0,0,0,1);return this},compose:function(a,b,c){this.makeRotationFromQuaternion(b);this.scale(c);this.setPosition(a);return this},decompose:function(){var a,b;return function(c,d,e){void 0===a&&(a=new THREE.Vector3,b=new THREE.Matrix4);var f=this.elements,g=a.set(f[0],f[1],f[2]).length(),h=a.set(f[4],f[5],f[6]).length(),k=a.set(f[8],f[9],f[10]).length();0>this.determinant()&&(g=-g);c.x=f[12];c.y=f[13];c.z=f[14];b.elements.set(this.elements);c=1/g;var f=1/h,l=1/k;b.elements[0]*=c;b.elements[1]*=c;
	b.elements[2]*=c;b.elements[4]*=f;b.elements[5]*=f;b.elements[6]*=f;b.elements[8]*=l;b.elements[9]*=l;b.elements[10]*=l;d.setFromRotationMatrix(b);e.x=g;e.y=h;e.z=k;return this}}(),makeFrustum:function(a,b,c,d,e,f){var g=this.elements;g[0]=2*e/(b-a);g[4]=0;g[8]=(b+a)/(b-a);g[12]=0;g[1]=0;g[5]=2*e/(d-c);g[9]=(d+c)/(d-c);g[13]=0;g[2]=0;g[6]=0;g[10]=-(f+e)/(f-e);g[14]=-2*f*e/(f-e);g[3]=0;g[7]=0;g[11]=-1;g[15]=0;return this},makePerspective:function(a,b,c,d){a=c*Math.tan(THREE.Math.DEG2RAD*a*.5);var e=
	-a;return this.makeFrustum(e*b,a*b,e,a,c,d)},makeOrthographic:function(a,b,c,d,e,f){var g=this.elements,h=1/(b-a),k=1/(c-d),l=1/(f-e);g[0]=2*h;g[4]=0;g[8]=0;g[12]=-((b+a)*h);g[1]=0;g[5]=2*k;g[9]=0;g[13]=-((c+d)*k);g[2]=0;g[6]=0;g[10]=-2*l;g[14]=-((f+e)*l);g[3]=0;g[7]=0;g[11]=0;g[15]=1;return this},equals:function(a){var b=this.elements;a=a.elements;for(var c=0;16>c;c++)if(b[c]!==a[c])return!1;return!0},fromArray:function(a){this.elements.set(a);return this},toArray:function(a,b){void 0===a&&(a=[]);
	void 0===b&&(b=0);var c=this.elements;a[b]=c[0];a[b+1]=c[1];a[b+2]=c[2];a[b+3]=c[3];a[b+4]=c[4];a[b+5]=c[5];a[b+6]=c[6];a[b+7]=c[7];a[b+8]=c[8];a[b+9]=c[9];a[b+10]=c[10];a[b+11]=c[11];a[b+12]=c[12];a[b+13]=c[13];a[b+14]=c[14];a[b+15]=c[15];return a}};THREE.Ray=function(a,b){this.origin=void 0!==a?a:new THREE.Vector3;this.direction=void 0!==b?b:new THREE.Vector3};
	THREE.Ray.prototype={constructor:THREE.Ray,set:function(a,b){this.origin.copy(a);this.direction.copy(b);return this},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.origin.copy(a.origin);this.direction.copy(a.direction);return this},at:function(a,b){return(b||new THREE.Vector3).copy(this.direction).multiplyScalar(a).add(this.origin)},lookAt:function(a){this.direction.copy(a).sub(this.origin).normalize();return this},recast:function(){var a=new THREE.Vector3;return function(b){this.origin.copy(this.at(b,
	a));return this}}(),closestPointToPoint:function(a,b){var c=b||new THREE.Vector3;c.subVectors(a,this.origin);var d=c.dot(this.direction);return 0>d?c.copy(this.origin):c.copy(this.direction).multiplyScalar(d).add(this.origin)},distanceToPoint:function(a){return Math.sqrt(this.distanceSqToPoint(a))},distanceSqToPoint:function(){var a=new THREE.Vector3;return function(b){var c=a.subVectors(b,this.origin).dot(this.direction);if(0>c)return this.origin.distanceToSquared(b);a.copy(this.direction).multiplyScalar(c).add(this.origin);
	return a.distanceToSquared(b)}}(),distanceSqToSegment:function(){var a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Vector3;return function(d,e,f,g){a.copy(d).add(e).multiplyScalar(.5);b.copy(e).sub(d).normalize();c.copy(this.origin).sub(a);var h=.5*d.distanceTo(e),k=-this.direction.dot(b),l=c.dot(this.direction),n=-c.dot(b),p=c.lengthSq(),m=Math.abs(1-k*k),q;0<m?(d=k*n-l,e=k*l-n,q=h*m,0<=d?e>=-q?e<=q?(h=1/m,d*=h,e*=h,k=d*(d+k*e+2*l)+e*(k*d+e+2*n)+p):(e=h,d=Math.max(0,-(k*e+l)),k=-d*d+e*(e+2*
	n)+p):(e=-h,d=Math.max(0,-(k*e+l)),k=-d*d+e*(e+2*n)+p):e<=-q?(d=Math.max(0,-(-k*h+l)),e=0<d?-h:Math.min(Math.max(-h,-n),h),k=-d*d+e*(e+2*n)+p):e<=q?(d=0,e=Math.min(Math.max(-h,-n),h),k=e*(e+2*n)+p):(d=Math.max(0,-(k*h+l)),e=0<d?h:Math.min(Math.max(-h,-n),h),k=-d*d+e*(e+2*n)+p)):(e=0<k?-h:h,d=Math.max(0,-(k*e+l)),k=-d*d+e*(e+2*n)+p);f&&f.copy(this.direction).multiplyScalar(d).add(this.origin);g&&g.copy(b).multiplyScalar(e).add(a);return k}}(),intersectSphere:function(){var a=new THREE.Vector3;return function(b,
	c){a.subVectors(b.center,this.origin);var d=a.dot(this.direction),e=a.dot(a)-d*d,f=b.radius*b.radius;if(e>f)return null;f=Math.sqrt(f-e);e=d-f;d+=f;return 0>e&&0>d?null:0>e?this.at(d,c):this.at(e,c)}}(),intersectsSphere:function(a){return this.distanceToPoint(a.center)<=a.radius},distanceToPlane:function(a){var b=a.normal.dot(this.direction);if(0===b)return 0===a.distanceToPoint(this.origin)?0:null;a=-(this.origin.dot(a.normal)+a.constant)/b;return 0<=a?a:null},intersectPlane:function(a,b){var c=
	this.distanceToPlane(a);return null===c?null:this.at(c,b)},intersectsPlane:function(a){var b=a.distanceToPoint(this.origin);return 0===b||0>a.normal.dot(this.direction)*b?!0:!1},intersectBox:function(a,b){var c,d,e,f,g;d=1/this.direction.x;f=1/this.direction.y;g=1/this.direction.z;var h=this.origin;0<=d?(c=(a.min.x-h.x)*d,d*=a.max.x-h.x):(c=(a.max.x-h.x)*d,d*=a.min.x-h.x);0<=f?(e=(a.min.y-h.y)*f,f*=a.max.y-h.y):(e=(a.max.y-h.y)*f,f*=a.min.y-h.y);if(c>f||e>d)return null;if(e>c||c!==c)c=e;if(f<d||d!==
	d)d=f;0<=g?(e=(a.min.z-h.z)*g,g*=a.max.z-h.z):(e=(a.max.z-h.z)*g,g*=a.min.z-h.z);if(c>g||e>d)return null;if(e>c||c!==c)c=e;if(g<d||d!==d)d=g;return 0>d?null:this.at(0<=c?c:d,b)},intersectsBox:function(){var a=new THREE.Vector3;return function(b){return null!==this.intersectBox(b,a)}}(),intersectTriangle:function(){var a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Vector3,d=new THREE.Vector3;return function(e,f,g,h,k){b.subVectors(f,e);c.subVectors(g,e);d.crossVectors(b,c);f=this.direction.dot(d);
	if(0<f){if(h)return null;h=1}else if(0>f)h=-1,f=-f;else return null;a.subVectors(this.origin,e);e=h*this.direction.dot(c.crossVectors(a,c));if(0>e)return null;g=h*this.direction.dot(b.cross(a));if(0>g||e+g>f)return null;e=-h*a.dot(d);return 0>e?null:this.at(e/f,k)}}(),applyMatrix4:function(a){this.direction.add(this.origin).applyMatrix4(a);this.origin.applyMatrix4(a);this.direction.sub(this.origin);this.direction.normalize();return this},equals:function(a){return a.origin.equals(this.origin)&&a.direction.equals(this.direction)}};
	THREE.Sphere=function(a,b){this.center=void 0!==a?a:new THREE.Vector3;this.radius=void 0!==b?b:0};
	THREE.Sphere.prototype={constructor:THREE.Sphere,set:function(a,b){this.center.copy(a);this.radius=b;return this},setFromPoints:function(){var a=new THREE.Box3;return function(b,c){var d=this.center;void 0!==c?d.copy(c):a.setFromPoints(b).center(d);for(var e=0,f=0,g=b.length;f<g;f++)e=Math.max(e,d.distanceToSquared(b[f]));this.radius=Math.sqrt(e);return this}}(),clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.center.copy(a.center);this.radius=a.radius;return this},
	empty:function(){return 0>=this.radius},containsPoint:function(a){return a.distanceToSquared(this.center)<=this.radius*this.radius},distanceToPoint:function(a){return a.distanceTo(this.center)-this.radius},intersectsSphere:function(a){var b=this.radius+a.radius;return a.center.distanceToSquared(this.center)<=b*b},intersectsBox:function(a){return a.intersectsSphere(this)},intersectsPlane:function(a){return Math.abs(this.center.dot(a.normal)-a.constant)<=this.radius},clampPoint:function(a,b){var c=
	this.center.distanceToSquared(a),d=b||new THREE.Vector3;d.copy(a);c>this.radius*this.radius&&(d.sub(this.center).normalize(),d.multiplyScalar(this.radius).add(this.center));return d},getBoundingBox:function(a){a=a||new THREE.Box3;a.set(this.center,this.center);a.expandByScalar(this.radius);return a},applyMatrix4:function(a){this.center.applyMatrix4(a);this.radius*=a.getMaxScaleOnAxis();return this},translate:function(a){this.center.add(a);return this},equals:function(a){return a.center.equals(this.center)&&
	a.radius===this.radius}};THREE.Frustum=function(a,b,c,d,e,f){this.planes=[void 0!==a?a:new THREE.Plane,void 0!==b?b:new THREE.Plane,void 0!==c?c:new THREE.Plane,void 0!==d?d:new THREE.Plane,void 0!==e?e:new THREE.Plane,void 0!==f?f:new THREE.Plane]};
	THREE.Frustum.prototype={constructor:THREE.Frustum,set:function(a,b,c,d,e,f){var g=this.planes;g[0].copy(a);g[1].copy(b);g[2].copy(c);g[3].copy(d);g[4].copy(e);g[5].copy(f);return this},clone:function(){return(new this.constructor).copy(this)},copy:function(a){for(var b=this.planes,c=0;6>c;c++)b[c].copy(a.planes[c]);return this},setFromMatrix:function(a){var b=this.planes,c=a.elements;a=c[0];var d=c[1],e=c[2],f=c[3],g=c[4],h=c[5],k=c[6],l=c[7],n=c[8],p=c[9],m=c[10],q=c[11],r=c[12],s=c[13],u=c[14],
	c=c[15];b[0].setComponents(f-a,l-g,q-n,c-r).normalize();b[1].setComponents(f+a,l+g,q+n,c+r).normalize();b[2].setComponents(f+d,l+h,q+p,c+s).normalize();b[3].setComponents(f-d,l-h,q-p,c-s).normalize();b[4].setComponents(f-e,l-k,q-m,c-u).normalize();b[5].setComponents(f+e,l+k,q+m,c+u).normalize();return this},intersectsObject:function(){var a=new THREE.Sphere;return function(b){var c=b.geometry;null===c.boundingSphere&&c.computeBoundingSphere();a.copy(c.boundingSphere).applyMatrix4(b.matrixWorld);return this.intersectsSphere(a)}}(),
	intersectsSprite:function(){var a=new THREE.Sphere;return function(b){a.center.set(0,0,0);a.radius=.7071067811865476;a.applyMatrix4(b.matrixWorld);return this.intersectsSphere(a)}}(),intersectsSphere:function(a){var b=this.planes,c=a.center;a=-a.radius;for(var d=0;6>d;d++)if(b[d].distanceToPoint(c)<a)return!1;return!0},intersectsBox:function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(c){for(var d=this.planes,e=0;6>e;e++){var f=d[e];a.x=0<f.normal.x?c.min.x:c.max.x;b.x=0<f.normal.x?
	c.max.x:c.min.x;a.y=0<f.normal.y?c.min.y:c.max.y;b.y=0<f.normal.y?c.max.y:c.min.y;a.z=0<f.normal.z?c.min.z:c.max.z;b.z=0<f.normal.z?c.max.z:c.min.z;var g=f.distanceToPoint(a),f=f.distanceToPoint(b);if(0>g&&0>f)return!1}return!0}}(),containsPoint:function(a){for(var b=this.planes,c=0;6>c;c++)if(0>b[c].distanceToPoint(a))return!1;return!0}};THREE.Plane=function(a,b){this.normal=void 0!==a?a:new THREE.Vector3(1,0,0);this.constant=void 0!==b?b:0};
	THREE.Plane.prototype={constructor:THREE.Plane,set:function(a,b){this.normal.copy(a);this.constant=b;return this},setComponents:function(a,b,c,d){this.normal.set(a,b,c);this.constant=d;return this},setFromNormalAndCoplanarPoint:function(a,b){this.normal.copy(a);this.constant=-b.dot(this.normal);return this},setFromCoplanarPoints:function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(c,d,e){d=a.subVectors(e,d).cross(b.subVectors(c,d)).normalize();this.setFromNormalAndCoplanarPoint(d,
	c);return this}}(),clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.normal.copy(a.normal);this.constant=a.constant;return this},normalize:function(){var a=1/this.normal.length();this.normal.multiplyScalar(a);this.constant*=a;return this},negate:function(){this.constant*=-1;this.normal.negate();return this},distanceToPoint:function(a){return this.normal.dot(a)+this.constant},distanceToSphere:function(a){return this.distanceToPoint(a.center)-a.radius},projectPoint:function(a,
	b){return this.orthoPoint(a,b).sub(a).negate()},orthoPoint:function(a,b){var c=this.distanceToPoint(a);return(b||new THREE.Vector3).copy(this.normal).multiplyScalar(c)},intersectLine:function(){var a=new THREE.Vector3;return function(b,c){var d=c||new THREE.Vector3,e=b.delta(a),f=this.normal.dot(e);if(0===f){if(0===this.distanceToPoint(b.start))return d.copy(b.start)}else return f=-(b.start.dot(this.normal)+this.constant)/f,0>f||1<f?void 0:d.copy(e).multiplyScalar(f).add(b.start)}}(),intersectsLine:function(a){var b=
	this.distanceToPoint(a.start);a=this.distanceToPoint(a.end);return 0>b&&0<a||0>a&&0<b},intersectsBox:function(a){return a.intersectsPlane(this)},intersectsSphere:function(a){return a.intersectsPlane(this)},coplanarPoint:function(a){return(a||new THREE.Vector3).copy(this.normal).multiplyScalar(-this.constant)},applyMatrix4:function(){var a=new THREE.Vector3,b=new THREE.Matrix3;return function(c,d){var e=this.coplanarPoint(a).applyMatrix4(c),f=d||b.getNormalMatrix(c),f=this.normal.applyMatrix3(f).normalize();
	this.constant=-e.dot(f);return this}}(),translate:function(a){this.constant-=a.dot(this.normal);return this},equals:function(a){return a.normal.equals(this.normal)&&a.constant===this.constant}};THREE.Spherical=function(a,b,c){this.radius=void 0!==a?a:1;this.phi=void 0!==b?b:0;this.theta=void 0!==c?c:0;return this};
	THREE.Spherical.prototype={constructor:THREE.Spherical,set:function(a,b,c){this.radius=a;this.phi=b;this.theta=c;return this},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.radius.copy(a.radius);this.phi.copy(a.phi);this.theta.copy(a.theta);return this},makeSafe:function(){this.phi=Math.max(1E-6,Math.min(Math.PI-1E-6,this.phi));return this},setFromVector3:function(a){this.radius=a.length();0===this.radius?this.phi=this.theta=0:(this.theta=Math.atan2(a.x,a.z),this.phi=
	Math.acos(THREE.Math.clamp(a.y/this.radius,-1,1)));return this}};
	THREE.Math={DEG2RAD:Math.PI/180,RAD2DEG:180/Math.PI,generateUUID:function(){var a="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),b=Array(36),c=0,d;return function(){for(var e=0;36>e;e++)8===e||13===e||18===e||23===e?b[e]="-":14===e?b[e]="4":(2>=c&&(c=33554432+16777216*Math.random()|0),d=c&15,c>>=4,b[e]=a[19===e?d&3|8:d]);return b.join("")}}(),clamp:function(a,b,c){return Math.max(b,Math.min(c,a))},euclideanModulo:function(a,b){return(a%b+b)%b},mapLinear:function(a,b,c,
	d,e){return d+(a-b)*(e-d)/(c-b)},smoothstep:function(a,b,c){if(a<=b)return 0;if(a>=c)return 1;a=(a-b)/(c-b);return a*a*(3-2*a)},smootherstep:function(a,b,c){if(a<=b)return 0;if(a>=c)return 1;a=(a-b)/(c-b);return a*a*a*(a*(6*a-15)+10)},random16:function(){console.warn("THREE.Math.random16() has been deprecated. Use Math.random() instead.");return Math.random()},randInt:function(a,b){return a+Math.floor(Math.random()*(b-a+1))},randFloat:function(a,b){return a+Math.random()*(b-a)},randFloatSpread:function(a){return a*
	(.5-Math.random())},degToRad:function(a){return a*THREE.Math.DEG2RAD},radToDeg:function(a){return a*THREE.Math.RAD2DEG},isPowerOfTwo:function(a){return 0===(a&a-1)&&0!==a},nearestPowerOfTwo:function(a){return Math.pow(2,Math.round(Math.log(a)/Math.LN2))},nextPowerOfTwo:function(a){a--;a|=a>>1;a|=a>>2;a|=a>>4;a|=a>>8;a|=a>>16;a++;return a}};
	THREE.Spline=function(a){function b(a,b,c,d,e,f,g){a=.5*(c-a);d=.5*(d-b);return(2*(b-c)+a+d)*g+(-3*(b-c)-2*a-d)*f+a*e+b}this.points=a;var c=[],d={x:0,y:0,z:0},e,f,g,h,k,l,n,p,m;this.initFromArray=function(a){this.points=[];for(var b=0;b<a.length;b++)this.points[b]={x:a[b][0],y:a[b][1],z:a[b][2]}};this.getPoint=function(a){e=(this.points.length-1)*a;f=Math.floor(e);g=e-f;c[0]=0===f?f:f-1;c[1]=f;c[2]=f>this.points.length-2?this.points.length-1:f+1;c[3]=f>this.points.length-3?this.points.length-1:f+
	2;l=this.points[c[0]];n=this.points[c[1]];p=this.points[c[2]];m=this.points[c[3]];h=g*g;k=g*h;d.x=b(l.x,n.x,p.x,m.x,g,h,k);d.y=b(l.y,n.y,p.y,m.y,g,h,k);d.z=b(l.z,n.z,p.z,m.z,g,h,k);return d};this.getControlPointsArray=function(){var a,b,c=this.points.length,d=[];for(a=0;a<c;a++)b=this.points[a],d[a]=[b.x,b.y,b.z];return d};this.getLength=function(a){var b,c,d,e=b=b=0,f=new THREE.Vector3,g=new THREE.Vector3,h=[],k=0;h[0]=0;a||(a=100);c=this.points.length*a;f.copy(this.points[0]);for(a=1;a<c;a++)b=
	a/c,d=this.getPoint(b),g.copy(d),k+=g.distanceTo(f),f.copy(d),b*=this.points.length-1,b=Math.floor(b),b!==e&&(h[b]=k,e=b);h[h.length]=k;return{chunks:h,total:k}};this.reparametrizeByArcLength=function(a){var b,c,d,e,f,g,h=[],k=new THREE.Vector3,m=this.getLength();h.push(k.copy(this.points[0]).clone());for(b=1;b<this.points.length;b++){c=m.chunks[b]-m.chunks[b-1];g=Math.ceil(a*c/m.total);e=(b-1)/(this.points.length-1);f=b/(this.points.length-1);for(c=1;c<g-1;c++)d=e+1/g*c*(f-e),d=this.getPoint(d),
	h.push(k.copy(d).clone());h.push(k.copy(this.points[b]).clone())}this.points=h}};THREE.Triangle=function(a,b,c){this.a=void 0!==a?a:new THREE.Vector3;this.b=void 0!==b?b:new THREE.Vector3;this.c=void 0!==c?c:new THREE.Vector3};THREE.Triangle.normal=function(){var a=new THREE.Vector3;return function(b,c,d,e){e=e||new THREE.Vector3;e.subVectors(d,c);a.subVectors(b,c);e.cross(a);b=e.lengthSq();return 0<b?e.multiplyScalar(1/Math.sqrt(b)):e.set(0,0,0)}}();
	THREE.Triangle.barycoordFromPoint=function(){var a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Vector3;return function(d,e,f,g,h){a.subVectors(g,e);b.subVectors(f,e);c.subVectors(d,e);d=a.dot(a);e=a.dot(b);f=a.dot(c);var k=b.dot(b);g=b.dot(c);var l=d*k-e*e;h=h||new THREE.Vector3;if(0===l)return h.set(-2,-1,-1);l=1/l;k=(k*f-e*g)*l;d=(d*g-e*f)*l;return h.set(1-k-d,d,k)}}();
	THREE.Triangle.containsPoint=function(){var a=new THREE.Vector3;return function(b,c,d,e){b=THREE.Triangle.barycoordFromPoint(b,c,d,e,a);return 0<=b.x&&0<=b.y&&1>=b.x+b.y}}();
	THREE.Triangle.prototype={constructor:THREE.Triangle,set:function(a,b,c){this.a.copy(a);this.b.copy(b);this.c.copy(c);return this},setFromPointsAndIndices:function(a,b,c,d){this.a.copy(a[b]);this.b.copy(a[c]);this.c.copy(a[d]);return this},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.a.copy(a.a);this.b.copy(a.b);this.c.copy(a.c);return this},area:function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(){a.subVectors(this.c,this.b);b.subVectors(this.a,
	this.b);return.5*a.cross(b).length()}}(),midpoint:function(a){return(a||new THREE.Vector3).addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)},normal:function(a){return THREE.Triangle.normal(this.a,this.b,this.c,a)},plane:function(a){return(a||new THREE.Plane).setFromCoplanarPoints(this.a,this.b,this.c)},barycoordFromPoint:function(a,b){return THREE.Triangle.barycoordFromPoint(a,this.a,this.b,this.c,b)},containsPoint:function(a){return THREE.Triangle.containsPoint(a,this.a,this.b,this.c)},
	closestPointToPoint:function(){var a,b,c,d;return function(e,f){void 0===a&&(a=new THREE.Plane,b=[new THREE.Line3,new THREE.Line3,new THREE.Line3],c=new THREE.Vector3,d=new THREE.Vector3);var g=f||new THREE.Vector3,h=Infinity;a.setFromCoplanarPoints(this.a,this.b,this.c);a.projectPoint(e,c);if(!0===this.containsPoint(c))g.copy(c);else{b[0].set(this.a,this.b);b[1].set(this.b,this.c);b[2].set(this.c,this.a);for(var k=0;k<b.length;k++){b[k].closestPointToPoint(c,!0,d);var l=c.distanceToSquared(d);l<
	h&&(h=l,g.copy(d))}}return g}}(),equals:function(a){return a.a.equals(this.a)&&a.b.equals(this.b)&&a.c.equals(this.c)}};THREE.Interpolant=function(a,b,c,d){this.parameterPositions=a;this._cachedIndex=0;this.resultBuffer=void 0!==d?d:new b.constructor(c);this.sampleValues=b;this.valueSize=c};
	THREE.Interpolant.prototype={constructor:THREE.Interpolant,evaluate:function(a){var b=this.parameterPositions,c=this._cachedIndex,d=b[c],e=b[c-1];a:{b:{c:{d:if(!(a<d)){for(var f=c+2;;){if(void 0===d){if(a<e)break d;this._cachedIndex=c=b.length;return this.afterEnd_(c-1,a,e)}if(c===f)break;e=d;d=b[++c];if(a<d)break b}d=b.length;break c}if(a>=e)break a;else{f=b[1];a<f&&(c=2,e=f);for(f=c-2;;){if(void 0===e)return this._cachedIndex=0,this.beforeStart_(0,a,d);if(c===f)break;d=e;e=b[--c-1];if(a>=e)break b}d=
	c;c=0}}for(;c<d;)e=c+d>>>1,a<b[e]?d=e:c=e+1;d=b[c];e=b[c-1];if(void 0===e)return this._cachedIndex=0,this.beforeStart_(0,a,d);if(void 0===d)return this._cachedIndex=c=b.length,this.afterEnd_(c-1,e,a)}this._cachedIndex=c;this.intervalChanged_(c,e,d)}return this.interpolate_(c,e,a,d)},settings:null,DefaultSettings_:{},getSettings_:function(){return this.settings||this.DefaultSettings_},copySampleValue_:function(a){var b=this.resultBuffer,c=this.sampleValues,d=this.valueSize;a*=d;for(var e=0;e!==d;++e)b[e]=
	c[a+e];return b},interpolate_:function(a,b,c,d){throw Error("call to abstract method");},intervalChanged_:function(a,b,c){}};Object.assign(THREE.Interpolant.prototype,{beforeStart_:THREE.Interpolant.prototype.copySampleValue_,afterEnd_:THREE.Interpolant.prototype.copySampleValue_});THREE.CubicInterpolant=function(a,b,c,d){THREE.Interpolant.call(this,a,b,c,d);this._offsetNext=this._weightNext=this._offsetPrev=this._weightPrev=-0};
	THREE.CubicInterpolant.prototype=Object.assign(Object.create(THREE.Interpolant.prototype),{constructor:THREE.CubicInterpolant,DefaultSettings_:{endingStart:THREE.ZeroCurvatureEnding,endingEnd:THREE.ZeroCurvatureEnding},intervalChanged_:function(a,b,c){var d=this.parameterPositions,e=a-2,f=a+1,g=d[e],h=d[f];if(void 0===g)switch(this.getSettings_().endingStart){case THREE.ZeroSlopeEnding:e=a;g=2*b-c;break;case THREE.WrapAroundEnding:e=d.length-2;g=b+d[e]-d[e+1];break;default:e=a,g=c}if(void 0===h)switch(this.getSettings_().endingEnd){case THREE.ZeroSlopeEnding:f=
	a;h=2*c-b;break;case THREE.WrapAroundEnding:f=1;h=c+d[1]-d[0];break;default:f=a-1,h=b}a=.5*(c-b);d=this.valueSize;this._weightPrev=a/(b-g);this._weightNext=a/(h-c);this._offsetPrev=e*d;this._offsetNext=f*d},interpolate_:function(a,b,c,d){var e=this.resultBuffer,f=this.sampleValues,g=this.valueSize;a*=g;var h=a-g,k=this._offsetPrev,l=this._offsetNext,n=this._weightPrev,p=this._weightNext,m=(c-b)/(d-b);c=m*m;d=c*m;b=-n*d+2*n*c-n*m;n=(1+n)*d+(-1.5-2*n)*c+(-.5+n)*m+1;m=(-1-p)*d+(1.5+p)*c+.5*m;p=p*d-p*
	c;for(c=0;c!==g;++c)e[c]=b*f[k+c]+n*f[h+c]+m*f[a+c]+p*f[l+c];return e}});THREE.DiscreteInterpolant=function(a,b,c,d){THREE.Interpolant.call(this,a,b,c,d)};THREE.DiscreteInterpolant.prototype=Object.assign(Object.create(THREE.Interpolant.prototype),{constructor:THREE.DiscreteInterpolant,interpolate_:function(a,b,c,d){return this.copySampleValue_(a-1)}});THREE.LinearInterpolant=function(a,b,c,d){THREE.Interpolant.call(this,a,b,c,d)};
	THREE.LinearInterpolant.prototype=Object.assign(Object.create(THREE.Interpolant.prototype),{constructor:THREE.LinearInterpolant,interpolate_:function(a,b,c,d){var e=this.resultBuffer,f=this.sampleValues,g=this.valueSize;a*=g;var h=a-g;b=(c-b)/(d-b);c=1-b;for(d=0;d!==g;++d)e[d]=f[h+d]*c+f[a+d]*b;return e}});THREE.QuaternionLinearInterpolant=function(a,b,c,d){THREE.Interpolant.call(this,a,b,c,d)};
	THREE.QuaternionLinearInterpolant.prototype=Object.assign(Object.create(THREE.Interpolant.prototype),{constructor:THREE.QuaternionLinearInterpolant,interpolate_:function(a,b,c,d){var e=this.resultBuffer,f=this.sampleValues,g=this.valueSize;a*=g;b=(c-b)/(d-b);for(c=a+g;a!==c;a+=4)THREE.Quaternion.slerpFlat(e,0,f,a-g,f,a,b);return e}});THREE.Clock=function(a){this.autoStart=void 0!==a?a:!0;this.elapsedTime=this.oldTime=this.startTime=0;this.running=!1};
	THREE.Clock.prototype={constructor:THREE.Clock,start:function(){this.oldTime=this.startTime=(performance||Date).now();this.running=!0},stop:function(){this.getElapsedTime();this.running=!1},getElapsedTime:function(){this.getDelta();return this.elapsedTime},getDelta:function(){var a=0;this.autoStart&&!this.running&&this.start();if(this.running){var b=(performance||Date).now(),a=(b-this.oldTime)/1E3;this.oldTime=b;this.elapsedTime+=a}return a}};THREE.EventDispatcher=function(){};
	Object.assign(THREE.EventDispatcher.prototype,{addEventListener:function(a,b){void 0===this._listeners&&(this._listeners={});var c=this._listeners;void 0===c[a]&&(c[a]=[]);-1===c[a].indexOf(b)&&c[a].push(b)},hasEventListener:function(a,b){if(void 0===this._listeners)return!1;var c=this._listeners;return void 0!==c[a]&&-1!==c[a].indexOf(b)?!0:!1},removeEventListener:function(a,b){if(void 0!==this._listeners){var c=this._listeners[a];if(void 0!==c){var d=c.indexOf(b);-1!==d&&c.splice(d,1)}}},dispatchEvent:function(a){if(void 0!==
	this._listeners){var b=this._listeners[a.type];if(void 0!==b){a.target=this;for(var c=[],d=0,e=b.length,d=0;d<e;d++)c[d]=b[d];for(d=0;d<e;d++)c[d].call(this,a)}}}});THREE.Layers=function(){this.mask=1};THREE.Layers.prototype={constructor:THREE.Layers,set:function(a){this.mask=1<<a},enable:function(a){this.mask|=1<<a},toggle:function(a){this.mask^=1<<a},disable:function(a){this.mask&=~(1<<a)},test:function(a){return 0!==(this.mask&a.mask)}};
	(function(a){function b(a,b){return a.distance-b.distance}function c(a,b,f,g){if(!1!==a.visible&&(a.raycast(b,f),!0===g)){a=a.children;g=0;for(var h=a.length;g<h;g++)c(a[g],b,f,!0)}}a.Raycaster=function(b,c,f,g){this.ray=new a.Ray(b,c);this.near=f||0;this.far=g||Infinity;this.params={Mesh:{},Line:{},LOD:{},Points:{threshold:1},Sprite:{}};Object.defineProperties(this.params,{PointCloud:{get:function(){console.warn("THREE.Raycaster: params.PointCloud has been renamed to params.Points.");return this.Points}}})};
	a.Raycaster.prototype={constructor:a.Raycaster,linePrecision:1,set:function(a,b){this.ray.set(a,b)},setFromCamera:function(b,c){c instanceof a.PerspectiveCamera?(this.ray.origin.setFromMatrixPosition(c.matrixWorld),this.ray.direction.set(b.x,b.y,.5).unproject(c).sub(this.ray.origin).normalize()):c instanceof a.OrthographicCamera?(this.ray.origin.set(b.x,b.y,-1).unproject(c),this.ray.direction.set(0,0,-1).transformDirection(c.matrixWorld)):console.error("THREE.Raycaster: Unsupported camera type.")},
	intersectObject:function(a,e){var f=[];c(a,this,f,e);f.sort(b);return f},intersectObjects:function(a,e){var f=[];if(!1===Array.isArray(a))return console.warn("THREE.Raycaster.intersectObjects: objects is not an Array."),f;for(var g=0,h=a.length;g<h;g++)c(a[g],this,f,e);f.sort(b);return f}}})(THREE);
	THREE.Object3D=function(){Object.defineProperty(this,"id",{value:THREE.Object3DIdCount++});this.uuid=THREE.Math.generateUUID();this.name="";this.type="Object3D";this.parent=null;this.children=[];this.up=THREE.Object3D.DefaultUp.clone();var a=new THREE.Vector3,b=new THREE.Euler,c=new THREE.Quaternion,d=new THREE.Vector3(1,1,1);b.onChange(function(){c.setFromEuler(b,!1)});c.onChange(function(){b.setFromQuaternion(c,void 0,!1)});Object.defineProperties(this,{position:{enumerable:!0,value:a},rotation:{enumerable:!0,
	value:b},quaternion:{enumerable:!0,value:c},scale:{enumerable:!0,value:d},modelViewMatrix:{value:new THREE.Matrix4},normalMatrix:{value:new THREE.Matrix3}});this.matrix=new THREE.Matrix4;this.matrixWorld=new THREE.Matrix4;this.matrixAutoUpdate=THREE.Object3D.DefaultMatrixAutoUpdate;this.matrixWorldNeedsUpdate=!1;this.layers=new THREE.Layers;this.visible=!0;this.receiveShadow=this.castShadow=!1;this.frustumCulled=!0;this.renderOrder=0;this.userData={}};
	THREE.Object3D.DefaultUp=new THREE.Vector3(0,1,0);THREE.Object3D.DefaultMatrixAutoUpdate=!0;
	Object.assign(THREE.Object3D.prototype,THREE.EventDispatcher.prototype,{applyMatrix:function(a){this.matrix.multiplyMatrices(a,this.matrix);this.matrix.decompose(this.position,this.quaternion,this.scale)},setRotationFromAxisAngle:function(a,b){this.quaternion.setFromAxisAngle(a,b)},setRotationFromEuler:function(a){this.quaternion.setFromEuler(a,!0)},setRotationFromMatrix:function(a){this.quaternion.setFromRotationMatrix(a)},setRotationFromQuaternion:function(a){this.quaternion.copy(a)},rotateOnAxis:function(){var a=
	new THREE.Quaternion;return function(b,c){a.setFromAxisAngle(b,c);this.quaternion.multiply(a);return this}}(),rotateX:function(){var a=new THREE.Vector3(1,0,0);return function(b){return this.rotateOnAxis(a,b)}}(),rotateY:function(){var a=new THREE.Vector3(0,1,0);return function(b){return this.rotateOnAxis(a,b)}}(),rotateZ:function(){var a=new THREE.Vector3(0,0,1);return function(b){return this.rotateOnAxis(a,b)}}(),translateOnAxis:function(){var a=new THREE.Vector3;return function(b,c){a.copy(b).applyQuaternion(this.quaternion);
	this.position.add(a.multiplyScalar(c));return this}}(),translateX:function(){var a=new THREE.Vector3(1,0,0);return function(b){return this.translateOnAxis(a,b)}}(),translateY:function(){var a=new THREE.Vector3(0,1,0);return function(b){return this.translateOnAxis(a,b)}}(),translateZ:function(){var a=new THREE.Vector3(0,0,1);return function(b){return this.translateOnAxis(a,b)}}(),localToWorld:function(a){return a.applyMatrix4(this.matrixWorld)},worldToLocal:function(){var a=new THREE.Matrix4;return function(b){return b.applyMatrix4(a.getInverse(this.matrixWorld))}}(),
	lookAt:function(){var a=new THREE.Matrix4;return function(b){a.lookAt(b,this.position,this.up);this.quaternion.setFromRotationMatrix(a)}}(),add:function(a){if(1<arguments.length){for(var b=0;b<arguments.length;b++)this.add(arguments[b]);return this}if(a===this)return console.error("THREE.Object3D.add: object can't be added as a child of itself.",a),this;a instanceof THREE.Object3D?(null!==a.parent&&a.parent.remove(a),a.parent=this,a.dispatchEvent({type:"added"}),this.children.push(a)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",
	a);return this},remove:function(a){if(1<arguments.length)for(var b=0;b<arguments.length;b++)this.remove(arguments[b]);b=this.children.indexOf(a);-1!==b&&(a.parent=null,a.dispatchEvent({type:"removed"}),this.children.splice(b,1))},getObjectById:function(a){return this.getObjectByProperty("id",a)},getObjectByName:function(a){return this.getObjectByProperty("name",a)},getObjectByProperty:function(a,b){if(this[a]===b)return this;for(var c=0,d=this.children.length;c<d;c++){var e=this.children[c].getObjectByProperty(a,
	b);if(void 0!==e)return e}},getWorldPosition:function(a){a=a||new THREE.Vector3;this.updateMatrixWorld(!0);return a.setFromMatrixPosition(this.matrixWorld)},getWorldQuaternion:function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(c){c=c||new THREE.Quaternion;this.updateMatrixWorld(!0);this.matrixWorld.decompose(a,c,b);return c}}(),getWorldRotation:function(){var a=new THREE.Quaternion;return function(b){b=b||new THREE.Euler;this.getWorldQuaternion(a);return b.setFromQuaternion(a,
	this.rotation.order,!1)}}(),getWorldScale:function(){var a=new THREE.Vector3,b=new THREE.Quaternion;return function(c){c=c||new THREE.Vector3;this.updateMatrixWorld(!0);this.matrixWorld.decompose(a,b,c);return c}}(),getWorldDirection:function(){var a=new THREE.Quaternion;return function(b){b=b||new THREE.Vector3;this.getWorldQuaternion(a);return b.set(0,0,1).applyQuaternion(a)}}(),raycast:function(){},traverse:function(a){a(this);for(var b=this.children,c=0,d=b.length;c<d;c++)b[c].traverse(a)},traverseVisible:function(a){if(!1!==
	this.visible){a(this);for(var b=this.children,c=0,d=b.length;c<d;c++)b[c].traverseVisible(a)}},traverseAncestors:function(a){var b=this.parent;null!==b&&(a(b),b.traverseAncestors(a))},updateMatrix:function(){this.matrix.compose(this.position,this.quaternion,this.scale);this.matrixWorldNeedsUpdate=!0},updateMatrixWorld:function(a){!0===this.matrixAutoUpdate&&this.updateMatrix();if(!0===this.matrixWorldNeedsUpdate||!0===a)null===this.parent?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,
	this.matrix),this.matrixWorldNeedsUpdate=!1,a=!0;for(var b=0,c=this.children.length;b<c;b++)this.children[b].updateMatrixWorld(a)},toJSON:function(a){function b(a){var b=[],c;for(c in a){var d=a[c];delete d.metadata;b.push(d)}return b}var c=void 0===a||""===a,d={};c&&(a={geometries:{},materials:{},textures:{},images:{}},d.metadata={version:4.4,type:"Object",generator:"Object3D.toJSON"});var e={};e.uuid=this.uuid;e.type=this.type;""!==this.name&&(e.name=this.name);"{}"!==JSON.stringify(this.userData)&&
	(e.userData=this.userData);!0===this.castShadow&&(e.castShadow=!0);!0===this.receiveShadow&&(e.receiveShadow=!0);!1===this.visible&&(e.visible=!1);e.matrix=this.matrix.toArray();void 0!==this.geometry&&(void 0===a.geometries[this.geometry.uuid]&&(a.geometries[this.geometry.uuid]=this.geometry.toJSON(a)),e.geometry=this.geometry.uuid);void 0!==this.material&&(void 0===a.materials[this.material.uuid]&&(a.materials[this.material.uuid]=this.material.toJSON(a)),e.material=this.material.uuid);if(0<this.children.length){e.children=
	[];for(var f=0;f<this.children.length;f++)e.children.push(this.children[f].toJSON(a).object)}if(c){var c=b(a.geometries),f=b(a.materials),g=b(a.textures);a=b(a.images);0<c.length&&(d.geometries=c);0<f.length&&(d.materials=f);0<g.length&&(d.textures=g);0<a.length&&(d.images=a)}d.object=e;return d},clone:function(a){return(new this.constructor).copy(this,a)},copy:function(a,b){void 0===b&&(b=!0);this.name=a.name;this.up.copy(a.up);this.position.copy(a.position);this.quaternion.copy(a.quaternion);this.scale.copy(a.scale);
	this.matrix.copy(a.matrix);this.matrixWorld.copy(a.matrixWorld);this.matrixAutoUpdate=a.matrixAutoUpdate;this.matrixWorldNeedsUpdate=a.matrixWorldNeedsUpdate;this.visible=a.visible;this.castShadow=a.castShadow;this.receiveShadow=a.receiveShadow;this.frustumCulled=a.frustumCulled;this.renderOrder=a.renderOrder;this.userData=JSON.parse(JSON.stringify(a.userData));if(!0===b)for(var c=0;c<a.children.length;c++)this.add(a.children[c].clone());return this}});THREE.Object3DIdCount=0;
	THREE.Face3=function(a,b,c,d,e,f){this.a=a;this.b=b;this.c=c;this.normal=d instanceof THREE.Vector3?d:new THREE.Vector3;this.vertexNormals=Array.isArray(d)?d:[];this.color=e instanceof THREE.Color?e:new THREE.Color;this.vertexColors=Array.isArray(e)?e:[];this.materialIndex=void 0!==f?f:0};
	THREE.Face3.prototype={constructor:THREE.Face3,clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.a=a.a;this.b=a.b;this.c=a.c;this.normal.copy(a.normal);this.color.copy(a.color);this.materialIndex=a.materialIndex;for(var b=0,c=a.vertexNormals.length;b<c;b++)this.vertexNormals[b]=a.vertexNormals[b].clone();b=0;for(c=a.vertexColors.length;b<c;b++)this.vertexColors[b]=a.vertexColors[b].clone();return this}};
	THREE.BufferAttribute=function(a,b,c){this.uuid=THREE.Math.generateUUID();this.array=a;this.itemSize=b;this.dynamic=!1;this.updateRange={offset:0,count:-1};this.version=0;this.normalized=!0===c};
	THREE.BufferAttribute.prototype={constructor:THREE.BufferAttribute,get count(){return this.array.length/this.itemSize},set needsUpdate(a){!0===a&&this.version++},setDynamic:function(a){this.dynamic=a;return this},copy:function(a){this.array=new a.array.constructor(a.array);this.itemSize=a.itemSize;this.dynamic=a.dynamic;return this},copyAt:function(a,b,c){a*=this.itemSize;c*=b.itemSize;for(var d=0,e=this.itemSize;d<e;d++)this.array[a+d]=b.array[c+d];return this},copyArray:function(a){this.array.set(a);
	return this},copyColorsArray:function(a){for(var b=this.array,c=0,d=0,e=a.length;d<e;d++){var f=a[d];void 0===f&&(console.warn("THREE.BufferAttribute.copyColorsArray(): color is undefined",d),f=new THREE.Color);b[c++]=f.r;b[c++]=f.g;b[c++]=f.b}return this},copyIndicesArray:function(a){for(var b=this.array,c=0,d=0,e=a.length;d<e;d++){var f=a[d];b[c++]=f.a;b[c++]=f.b;b[c++]=f.c}return this},copyVector2sArray:function(a){for(var b=this.array,c=0,d=0,e=a.length;d<e;d++){var f=a[d];void 0===f&&(console.warn("THREE.BufferAttribute.copyVector2sArray(): vector is undefined",
	d),f=new THREE.Vector2);b[c++]=f.x;b[c++]=f.y}return this},copyVector3sArray:function(a){for(var b=this.array,c=0,d=0,e=a.length;d<e;d++){var f=a[d];void 0===f&&(console.warn("THREE.BufferAttribute.copyVector3sArray(): vector is undefined",d),f=new THREE.Vector3);b[c++]=f.x;b[c++]=f.y;b[c++]=f.z}return this},copyVector4sArray:function(a){for(var b=this.array,c=0,d=0,e=a.length;d<e;d++){var f=a[d];void 0===f&&(console.warn("THREE.BufferAttribute.copyVector4sArray(): vector is undefined",d),f=new THREE.Vector4);
	b[c++]=f.x;b[c++]=f.y;b[c++]=f.z;b[c++]=f.w}return this},set:function(a,b){void 0===b&&(b=0);this.array.set(a,b);return this},getX:function(a){return this.array[a*this.itemSize]},setX:function(a,b){this.array[a*this.itemSize]=b;return this},getY:function(a){return this.array[a*this.itemSize+1]},setY:function(a,b){this.array[a*this.itemSize+1]=b;return this},getZ:function(a){return this.array[a*this.itemSize+2]},setZ:function(a,b){this.array[a*this.itemSize+2]=b;return this},getW:function(a){return this.array[a*
	this.itemSize+3]},setW:function(a,b){this.array[a*this.itemSize+3]=b;return this},setXY:function(a,b,c){a*=this.itemSize;this.array[a+0]=b;this.array[a+1]=c;return this},setXYZ:function(a,b,c,d){a*=this.itemSize;this.array[a+0]=b;this.array[a+1]=c;this.array[a+2]=d;return this},setXYZW:function(a,b,c,d,e){a*=this.itemSize;this.array[a+0]=b;this.array[a+1]=c;this.array[a+2]=d;this.array[a+3]=e;return this},clone:function(){return(new this.constructor).copy(this)}};
	THREE.Int8Attribute=function(a,b){return new THREE.BufferAttribute(new Int8Array(a),b)};THREE.Uint8Attribute=function(a,b){return new THREE.BufferAttribute(new Uint8Array(a),b)};THREE.Uint8ClampedAttribute=function(a,b){return new THREE.BufferAttribute(new Uint8ClampedArray(a),b)};THREE.Int16Attribute=function(a,b){return new THREE.BufferAttribute(new Int16Array(a),b)};THREE.Uint16Attribute=function(a,b){return new THREE.BufferAttribute(new Uint16Array(a),b)};
	THREE.Int32Attribute=function(a,b){return new THREE.BufferAttribute(new Int32Array(a),b)};THREE.Uint32Attribute=function(a,b){return new THREE.BufferAttribute(new Uint32Array(a),b)};THREE.Float32Attribute=function(a,b){return new THREE.BufferAttribute(new Float32Array(a),b)};THREE.Float64Attribute=function(a,b){return new THREE.BufferAttribute(new Float64Array(a),b)};
	THREE.DynamicBufferAttribute=function(a,b){console.warn("THREE.DynamicBufferAttribute has been removed. Use new THREE.BufferAttribute().setDynamic( true ) instead.");return(new THREE.BufferAttribute(a,b)).setDynamic(!0)};THREE.InstancedBufferAttribute=function(a,b,c){THREE.BufferAttribute.call(this,a,b);this.meshPerAttribute=c||1};THREE.InstancedBufferAttribute.prototype=Object.create(THREE.BufferAttribute.prototype);THREE.InstancedBufferAttribute.prototype.constructor=THREE.InstancedBufferAttribute;
	THREE.InstancedBufferAttribute.prototype.copy=function(a){THREE.BufferAttribute.prototype.copy.call(this,a);this.meshPerAttribute=a.meshPerAttribute;return this};THREE.InterleavedBuffer=function(a,b){this.uuid=THREE.Math.generateUUID();this.array=a;this.stride=b;this.dynamic=!1;this.updateRange={offset:0,count:-1};this.version=0};
	THREE.InterleavedBuffer.prototype={constructor:THREE.InterleavedBuffer,get length(){return this.array.length},get count(){return this.array.length/this.stride},set needsUpdate(a){!0===a&&this.version++},setDynamic:function(a){this.dynamic=a;return this},copy:function(a){this.array=new a.array.constructor(a.array);this.stride=a.stride;this.dynamic=a.dynamic;return this},copyAt:function(a,b,c){a*=this.stride;c*=b.stride;for(var d=0,e=this.stride;d<e;d++)this.array[a+d]=b.array[c+d];return this},set:function(a,
	b){void 0===b&&(b=0);this.array.set(a,b);return this},clone:function(){return(new this.constructor).copy(this)}};THREE.InstancedInterleavedBuffer=function(a,b,c){THREE.InterleavedBuffer.call(this,a,b);this.meshPerAttribute=c||1};THREE.InstancedInterleavedBuffer.prototype=Object.create(THREE.InterleavedBuffer.prototype);THREE.InstancedInterleavedBuffer.prototype.constructor=THREE.InstancedInterleavedBuffer;
	THREE.InstancedInterleavedBuffer.prototype.copy=function(a){THREE.InterleavedBuffer.prototype.copy.call(this,a);this.meshPerAttribute=a.meshPerAttribute;return this};THREE.InterleavedBufferAttribute=function(a,b,c){this.uuid=THREE.Math.generateUUID();this.data=a;this.itemSize=b;this.offset=c};
	THREE.InterleavedBufferAttribute.prototype={constructor:THREE.InterleavedBufferAttribute,get length(){console.warn("THREE.BufferAttribute: .length has been deprecated. Please use .count.");return this.array.length},get count(){return this.data.count},setX:function(a,b){this.data.array[a*this.data.stride+this.offset]=b;return this},setY:function(a,b){this.data.array[a*this.data.stride+this.offset+1]=b;return this},setZ:function(a,b){this.data.array[a*this.data.stride+this.offset+2]=b;return this},
	setW:function(a,b){this.data.array[a*this.data.stride+this.offset+3]=b;return this},getX:function(a){return this.data.array[a*this.data.stride+this.offset]},getY:function(a){return this.data.array[a*this.data.stride+this.offset+1]},getZ:function(a){return this.data.array[a*this.data.stride+this.offset+2]},getW:function(a){return this.data.array[a*this.data.stride+this.offset+3]},setXY:function(a,b,c){a=a*this.data.stride+this.offset;this.data.array[a+0]=b;this.data.array[a+1]=c;return this},setXYZ:function(a,
	b,c,d){a=a*this.data.stride+this.offset;this.data.array[a+0]=b;this.data.array[a+1]=c;this.data.array[a+2]=d;return this},setXYZW:function(a,b,c,d,e){a=a*this.data.stride+this.offset;this.data.array[a+0]=b;this.data.array[a+1]=c;this.data.array[a+2]=d;this.data.array[a+3]=e;return this}};
	THREE.Geometry=function(){Object.defineProperty(this,"id",{value:THREE.GeometryIdCount++});this.uuid=THREE.Math.generateUUID();this.name="";this.type="Geometry";this.vertices=[];this.colors=[];this.faces=[];this.faceVertexUvs=[[]];this.morphTargets=[];this.morphNormals=[];this.skinWeights=[];this.skinIndices=[];this.lineDistances=[];this.boundingSphere=this.boundingBox=null;this.groupsNeedUpdate=this.lineDistancesNeedUpdate=this.colorsNeedUpdate=this.normalsNeedUpdate=this.uvsNeedUpdate=this.elementsNeedUpdate=
	this.verticesNeedUpdate=!1};
	Object.assign(THREE.Geometry.prototype,THREE.EventDispatcher.prototype,{applyMatrix:function(a){for(var b=(new THREE.Matrix3).getNormalMatrix(a),c=0,d=this.vertices.length;c<d;c++)this.vertices[c].applyMatrix4(a);c=0;for(d=this.faces.length;c<d;c++){a=this.faces[c];a.normal.applyMatrix3(b).normalize();for(var e=0,f=a.vertexNormals.length;e<f;e++)a.vertexNormals[e].applyMatrix3(b).normalize()}null!==this.boundingBox&&this.computeBoundingBox();null!==this.boundingSphere&&this.computeBoundingSphere();
	this.normalsNeedUpdate=this.verticesNeedUpdate=!0;return this},rotateX:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.makeRotationX(b);this.applyMatrix(a);return this}}(),rotateY:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.makeRotationY(b);this.applyMatrix(a);return this}}(),rotateZ:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.makeRotationZ(b);this.applyMatrix(a);return this}}(),translate:function(){var a;return function(b,
	c,d){void 0===a&&(a=new THREE.Matrix4);a.makeTranslation(b,c,d);this.applyMatrix(a);return this}}(),scale:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Matrix4);a.makeScale(b,c,d);this.applyMatrix(a);return this}}(),lookAt:function(){var a;return function(b){void 0===a&&(a=new THREE.Object3D);a.lookAt(b);a.updateMatrix();this.applyMatrix(a.matrix)}}(),fromBufferGeometry:function(a){function b(a,b,d,e){var f=void 0!==g?[n[a].clone(),n[b].clone(),n[d].clone()]:[],q=void 0!==h?[c.colors[a].clone(),
	c.colors[b].clone(),c.colors[d].clone()]:[];e=new THREE.Face3(a,b,d,f,q,e);c.faces.push(e);void 0!==k&&c.faceVertexUvs[0].push([p[a].clone(),p[b].clone(),p[d].clone()]);void 0!==l&&c.faceVertexUvs[1].push([m[a].clone(),m[b].clone(),m[d].clone()])}var c=this,d=null!==a.index?a.index.array:void 0,e=a.attributes,f=e.position.array,g=void 0!==e.normal?e.normal.array:void 0,h=void 0!==e.color?e.color.array:void 0,k=void 0!==e.uv?e.uv.array:void 0,l=void 0!==e.uv2?e.uv2.array:void 0;void 0!==l&&(this.faceVertexUvs[1]=
	[]);for(var n=[],p=[],m=[],q=e=0;e<f.length;e+=3,q+=2)c.vertices.push(new THREE.Vector3(f[e],f[e+1],f[e+2])),void 0!==g&&n.push(new THREE.Vector3(g[e],g[e+1],g[e+2])),void 0!==h&&c.colors.push(new THREE.Color(h[e],h[e+1],h[e+2])),void 0!==k&&p.push(new THREE.Vector2(k[q],k[q+1])),void 0!==l&&m.push(new THREE.Vector2(l[q],l[q+1]));if(void 0!==d)if(f=a.groups,0<f.length)for(e=0;e<f.length;e++)for(var r=f[e],s=r.start,u=r.count,q=s,s=s+u;q<s;q+=3)b(d[q],d[q+1],d[q+2],r.materialIndex);else for(e=0;e<
	d.length;e+=3)b(d[e],d[e+1],d[e+2]);else for(e=0;e<f.length/3;e+=3)b(e,e+1,e+2);this.computeFaceNormals();null!==a.boundingBox&&(this.boundingBox=a.boundingBox.clone());null!==a.boundingSphere&&(this.boundingSphere=a.boundingSphere.clone());return this},center:function(){this.computeBoundingBox();var a=this.boundingBox.center().negate();this.translate(a.x,a.y,a.z);return a},normalize:function(){this.computeBoundingSphere();var a=this.boundingSphere.center,b=this.boundingSphere.radius,b=0===b?1:1/
	b,c=new THREE.Matrix4;c.set(b,0,0,-b*a.x,0,b,0,-b*a.y,0,0,b,-b*a.z,0,0,0,1);this.applyMatrix(c);return this},computeFaceNormals:function(){for(var a=new THREE.Vector3,b=new THREE.Vector3,c=0,d=this.faces.length;c<d;c++){var e=this.faces[c],f=this.vertices[e.a],g=this.vertices[e.b];a.subVectors(this.vertices[e.c],g);b.subVectors(f,g);a.cross(b);a.normalize();e.normal.copy(a)}},computeVertexNormals:function(a){void 0===a&&(a=!0);var b,c,d;d=Array(this.vertices.length);b=0;for(c=this.vertices.length;b<
	c;b++)d[b]=new THREE.Vector3;if(a){var e,f,g,h=new THREE.Vector3,k=new THREE.Vector3;a=0;for(b=this.faces.length;a<b;a++)c=this.faces[a],e=this.vertices[c.a],f=this.vertices[c.b],g=this.vertices[c.c],h.subVectors(g,f),k.subVectors(e,f),h.cross(k),d[c.a].add(h),d[c.b].add(h),d[c.c].add(h)}else for(a=0,b=this.faces.length;a<b;a++)c=this.faces[a],d[c.a].add(c.normal),d[c.b].add(c.normal),d[c.c].add(c.normal);b=0;for(c=this.vertices.length;b<c;b++)d[b].normalize();a=0;for(b=this.faces.length;a<b;a++)c=
	this.faces[a],e=c.vertexNormals,3===e.length?(e[0].copy(d[c.a]),e[1].copy(d[c.b]),e[2].copy(d[c.c])):(e[0]=d[c.a].clone(),e[1]=d[c.b].clone(),e[2]=d[c.c].clone());0<this.faces.length&&(this.normalsNeedUpdate=!0)},computeMorphNormals:function(){var a,b,c,d,e;c=0;for(d=this.faces.length;c<d;c++)for(e=this.faces[c],e.__originalFaceNormal?e.__originalFaceNormal.copy(e.normal):e.__originalFaceNormal=e.normal.clone(),e.__originalVertexNormals||(e.__originalVertexNormals=[]),a=0,b=e.vertexNormals.length;a<
	b;a++)e.__originalVertexNormals[a]?e.__originalVertexNormals[a].copy(e.vertexNormals[a]):e.__originalVertexNormals[a]=e.vertexNormals[a].clone();var f=new THREE.Geometry;f.faces=this.faces;a=0;for(b=this.morphTargets.length;a<b;a++){if(!this.morphNormals[a]){this.morphNormals[a]={};this.morphNormals[a].faceNormals=[];this.morphNormals[a].vertexNormals=[];e=this.morphNormals[a].faceNormals;var g=this.morphNormals[a].vertexNormals,h,k;c=0;for(d=this.faces.length;c<d;c++)h=new THREE.Vector3,k={a:new THREE.Vector3,
	b:new THREE.Vector3,c:new THREE.Vector3},e.push(h),g.push(k)}g=this.morphNormals[a];f.vertices=this.morphTargets[a].vertices;f.computeFaceNormals();f.computeVertexNormals();c=0;for(d=this.faces.length;c<d;c++)e=this.faces[c],h=g.faceNormals[c],k=g.vertexNormals[c],h.copy(e.normal),k.a.copy(e.vertexNormals[0]),k.b.copy(e.vertexNormals[1]),k.c.copy(e.vertexNormals[2])}c=0;for(d=this.faces.length;c<d;c++)e=this.faces[c],e.normal=e.__originalFaceNormal,e.vertexNormals=e.__originalVertexNormals},computeTangents:function(){console.warn("THREE.Geometry: .computeTangents() has been removed.")},
	computeLineDistances:function(){for(var a=0,b=this.vertices,c=0,d=b.length;c<d;c++)0<c&&(a+=b[c].distanceTo(b[c-1])),this.lineDistances[c]=a},computeBoundingBox:function(){null===this.boundingBox&&(this.boundingBox=new THREE.Box3);this.boundingBox.setFromPoints(this.vertices)},computeBoundingSphere:function(){null===this.boundingSphere&&(this.boundingSphere=new THREE.Sphere);this.boundingSphere.setFromPoints(this.vertices)},merge:function(a,b,c){if(!1===a instanceof THREE.Geometry)console.error("THREE.Geometry.merge(): geometry not an instance of THREE.Geometry.",
	a);else{var d,e=this.vertices.length,f=this.vertices,g=a.vertices,h=this.faces,k=a.faces,l=this.faceVertexUvs[0];a=a.faceVertexUvs[0];void 0===c&&(c=0);void 0!==b&&(d=(new THREE.Matrix3).getNormalMatrix(b));for(var n=0,p=g.length;n<p;n++){var m=g[n].clone();void 0!==b&&m.applyMatrix4(b);f.push(m)}n=0;for(p=k.length;n<p;n++){var g=k[n],q,r=g.vertexNormals,s=g.vertexColors,m=new THREE.Face3(g.a+e,g.b+e,g.c+e);m.normal.copy(g.normal);void 0!==d&&m.normal.applyMatrix3(d).normalize();b=0;for(f=r.length;b<
	f;b++)q=r[b].clone(),void 0!==d&&q.applyMatrix3(d).normalize(),m.vertexNormals.push(q);m.color.copy(g.color);b=0;for(f=s.length;b<f;b++)q=s[b],m.vertexColors.push(q.clone());m.materialIndex=g.materialIndex+c;h.push(m)}n=0;for(p=a.length;n<p;n++)if(c=a[n],d=[],void 0!==c){b=0;for(f=c.length;b<f;b++)d.push(c[b].clone());l.push(d)}}},mergeMesh:function(a){!1===a instanceof THREE.Mesh?console.error("THREE.Geometry.mergeMesh(): mesh not an instance of THREE.Mesh.",a):(a.matrixAutoUpdate&&a.updateMatrix(),
	this.merge(a.geometry,a.matrix))},mergeVertices:function(){var a={},b=[],c=[],d,e=Math.pow(10,4),f,g;f=0;for(g=this.vertices.length;f<g;f++)d=this.vertices[f],d=Math.round(d.x*e)+"_"+Math.round(d.y*e)+"_"+Math.round(d.z*e),void 0===a[d]?(a[d]=f,b.push(this.vertices[f]),c[f]=b.length-1):c[f]=c[a[d]];a=[];f=0;for(g=this.faces.length;f<g;f++)for(e=this.faces[f],e.a=c[e.a],e.b=c[e.b],e.c=c[e.c],e=[e.a,e.b,e.c],d=0;3>d;d++)if(e[d]===e[(d+1)%3]){a.push(f);break}for(f=a.length-1;0<=f;f--)for(e=a[f],this.faces.splice(e,
	1),c=0,g=this.faceVertexUvs.length;c<g;c++)this.faceVertexUvs[c].splice(e,1);f=this.vertices.length-b.length;this.vertices=b;return f},sortFacesByMaterialIndex:function(){for(var a=this.faces,b=a.length,c=0;c<b;c++)a[c]._id=c;a.sort(function(a,b){return a.materialIndex-b.materialIndex});var d=this.faceVertexUvs[0],e=this.faceVertexUvs[1],f,g;d&&d.length===b&&(f=[]);e&&e.length===b&&(g=[]);for(c=0;c<b;c++){var h=a[c]._id;f&&f.push(d[h]);g&&g.push(e[h])}f&&(this.faceVertexUvs[0]=f);g&&(this.faceVertexUvs[1]=
	g)},toJSON:function(){function a(a,b,c){return c?a|1<<b:a&~(1<<b)}function b(a){var b=a.x.toString()+a.y.toString()+a.z.toString();if(void 0!==l[b])return l[b];l[b]=k.length/3;k.push(a.x,a.y,a.z);return l[b]}function c(a){var b=a.r.toString()+a.g.toString()+a.b.toString();if(void 0!==p[b])return p[b];p[b]=n.length;n.push(a.getHex());return p[b]}function d(a){var b=a.x.toString()+a.y.toString();if(void 0!==q[b])return q[b];q[b]=m.length/2;m.push(a.x,a.y);return q[b]}var e={metadata:{version:4.4,type:"Geometry",
	generator:"Geometry.toJSON"}};e.uuid=this.uuid;e.type=this.type;""!==this.name&&(e.name=this.name);if(void 0!==this.parameters){var f=this.parameters,g;for(g in f)void 0!==f[g]&&(e[g]=f[g]);return e}f=[];for(g=0;g<this.vertices.length;g++){var h=this.vertices[g];f.push(h.x,h.y,h.z)}var h=[],k=[],l={},n=[],p={},m=[],q={};for(g=0;g<this.faces.length;g++){var r=this.faces[g],s=void 0!==this.faceVertexUvs[0][g],u=0<r.normal.length(),x=0<r.vertexNormals.length,v=1!==r.color.r||1!==r.color.g||1!==r.color.b,
	C=0<r.vertexColors.length,w=0,w=a(w,0,0),w=a(w,1,!0),w=a(w,2,!1),w=a(w,3,s),w=a(w,4,u),w=a(w,5,x),w=a(w,6,v),w=a(w,7,C);h.push(w);h.push(r.a,r.b,r.c);h.push(r.materialIndex);s&&(s=this.faceVertexUvs[0][g],h.push(d(s[0]),d(s[1]),d(s[2])));u&&h.push(b(r.normal));x&&(u=r.vertexNormals,h.push(b(u[0]),b(u[1]),b(u[2])));v&&h.push(c(r.color));C&&(r=r.vertexColors,h.push(c(r[0]),c(r[1]),c(r[2])))}e.data={};e.data.vertices=f;e.data.normals=k;0<n.length&&(e.data.colors=n);0<m.length&&(e.data.uvs=[m]);e.data.faces=
	h;return e},clone:function(){return(new THREE.Geometry).copy(this)},copy:function(a){this.vertices=[];this.faces=[];this.faceVertexUvs=[[]];for(var b=a.vertices,c=0,d=b.length;c<d;c++)this.vertices.push(b[c].clone());b=a.faces;c=0;for(d=b.length;c<d;c++)this.faces.push(b[c].clone());c=0;for(d=a.faceVertexUvs.length;c<d;c++){b=a.faceVertexUvs[c];void 0===this.faceVertexUvs[c]&&(this.faceVertexUvs[c]=[]);for(var e=0,f=b.length;e<f;e++){for(var g=b[e],h=[],k=0,l=g.length;k<l;k++)h.push(g[k].clone());
	this.faceVertexUvs[c].push(h)}}return this},dispose:function(){this.dispatchEvent({type:"dispose"})}});THREE.GeometryIdCount=0;
	THREE.DirectGeometry=function(){Object.defineProperty(this,"id",{value:THREE.GeometryIdCount++});this.uuid=THREE.Math.generateUUID();this.name="";this.type="DirectGeometry";this.indices=[];this.vertices=[];this.normals=[];this.colors=[];this.uvs=[];this.uvs2=[];this.groups=[];this.morphTargets={};this.skinWeights=[];this.skinIndices=[];this.boundingSphere=this.boundingBox=null;this.groupsNeedUpdate=this.uvsNeedUpdate=this.colorsNeedUpdate=this.normalsNeedUpdate=this.verticesNeedUpdate=!1};
	Object.assign(THREE.DirectGeometry.prototype,THREE.EventDispatcher.prototype,{computeBoundingBox:THREE.Geometry.prototype.computeBoundingBox,computeBoundingSphere:THREE.Geometry.prototype.computeBoundingSphere,computeFaceNormals:function(){console.warn("THREE.DirectGeometry: computeFaceNormals() is not a method of this type of geometry.")},computeVertexNormals:function(){console.warn("THREE.DirectGeometry: computeVertexNormals() is not a method of this type of geometry.")},computeGroups:function(a){var b,
	c=[],d;a=a.faces;for(var e=0;e<a.length;e++){var f=a[e];f.materialIndex!==d&&(d=f.materialIndex,void 0!==b&&(b.count=3*e-b.start,c.push(b)),b={start:3*e,materialIndex:d})}void 0!==b&&(b.count=3*e-b.start,c.push(b));this.groups=c},fromGeometry:function(a){var b=a.faces,c=a.vertices,d=a.faceVertexUvs,e=d[0]&&0<d[0].length,f=d[1]&&0<d[1].length,g=a.morphTargets,h=g.length,k;if(0<h){k=[];for(var l=0;l<h;l++)k[l]=[];this.morphTargets.position=k}var n=a.morphNormals,p=n.length,m;if(0<p){m=[];for(l=0;l<
	p;l++)m[l]=[];this.morphTargets.normal=m}for(var q=a.skinIndices,r=a.skinWeights,s=q.length===c.length,u=r.length===c.length,l=0;l<b.length;l++){var x=b[l];this.vertices.push(c[x.a],c[x.b],c[x.c]);var v=x.vertexNormals;3===v.length?this.normals.push(v[0],v[1],v[2]):(v=x.normal,this.normals.push(v,v,v));v=x.vertexColors;3===v.length?this.colors.push(v[0],v[1],v[2]):(v=x.color,this.colors.push(v,v,v));!0===e&&(v=d[0][l],void 0!==v?this.uvs.push(v[0],v[1],v[2]):(console.warn("THREE.DirectGeometry.fromGeometry(): Undefined vertexUv ",
	l),this.uvs.push(new THREE.Vector2,new THREE.Vector2,new THREE.Vector2)));!0===f&&(v=d[1][l],void 0!==v?this.uvs2.push(v[0],v[1],v[2]):(console.warn("THREE.DirectGeometry.fromGeometry(): Undefined vertexUv2 ",l),this.uvs2.push(new THREE.Vector2,new THREE.Vector2,new THREE.Vector2)));for(v=0;v<h;v++){var C=g[v].vertices;k[v].push(C[x.a],C[x.b],C[x.c])}for(v=0;v<p;v++)C=n[v].vertexNormals[l],m[v].push(C.a,C.b,C.c);s&&this.skinIndices.push(q[x.a],q[x.b],q[x.c]);u&&this.skinWeights.push(r[x.a],r[x.b],
	r[x.c])}this.computeGroups(a);this.verticesNeedUpdate=a.verticesNeedUpdate;this.normalsNeedUpdate=a.normalsNeedUpdate;this.colorsNeedUpdate=a.colorsNeedUpdate;this.uvsNeedUpdate=a.uvsNeedUpdate;this.groupsNeedUpdate=a.groupsNeedUpdate;return this},dispose:function(){this.dispatchEvent({type:"dispose"})}});
	THREE.BufferGeometry=function(){Object.defineProperty(this,"id",{value:THREE.GeometryIdCount++});this.uuid=THREE.Math.generateUUID();this.name="";this.type="BufferGeometry";this.index=null;this.attributes={};this.morphAttributes={};this.groups=[];this.boundingSphere=this.boundingBox=null;this.drawRange={start:0,count:Infinity}};
	Object.assign(THREE.BufferGeometry.prototype,THREE.EventDispatcher.prototype,{getIndex:function(){return this.index},setIndex:function(a){this.index=a},addAttribute:function(a,b,c){if(!1===b instanceof THREE.BufferAttribute&&!1===b instanceof THREE.InterleavedBufferAttribute)console.warn("THREE.BufferGeometry: .addAttribute() now expects ( name, attribute )."),this.addAttribute(a,new THREE.BufferAttribute(b,c));else if("index"===a)console.warn("THREE.BufferGeometry.addAttribute: Use .setIndex() for index attribute."),
	this.setIndex(b);else return this.attributes[a]=b,this},getAttribute:function(a){return this.attributes[a]},removeAttribute:function(a){delete this.attributes[a];return this},addGroup:function(a,b,c){this.groups.push({start:a,count:b,materialIndex:void 0!==c?c:0})},clearGroups:function(){this.groups=[]},setDrawRange:function(a,b){this.drawRange.start=a;this.drawRange.count=b},applyMatrix:function(a){var b=this.attributes.position;void 0!==b&&(a.applyToVector3Array(b.array),b.needsUpdate=!0);b=this.attributes.normal;
	void 0!==b&&((new THREE.Matrix3).getNormalMatrix(a).applyToVector3Array(b.array),b.needsUpdate=!0);null!==this.boundingBox&&this.computeBoundingBox();null!==this.boundingSphere&&this.computeBoundingSphere();return this},rotateX:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.makeRotationX(b);this.applyMatrix(a);return this}}(),rotateY:function(){var a;return function(b){void 0===a&&(a=new THREE.Matrix4);a.makeRotationY(b);this.applyMatrix(a);return this}}(),rotateZ:function(){var a;
	return function(b){void 0===a&&(a=new THREE.Matrix4);a.makeRotationZ(b);this.applyMatrix(a);return this}}(),translate:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Matrix4);a.makeTranslation(b,c,d);this.applyMatrix(a);return this}}(),scale:function(){var a;return function(b,c,d){void 0===a&&(a=new THREE.Matrix4);a.makeScale(b,c,d);this.applyMatrix(a);return this}}(),lookAt:function(){var a;return function(b){void 0===a&&(a=new THREE.Object3D);a.lookAt(b);a.updateMatrix();this.applyMatrix(a.matrix)}}(),
	center:function(){this.computeBoundingBox();var a=this.boundingBox.center().negate();this.translate(a.x,a.y,a.z);return a},setFromObject:function(a){var b=a.geometry;if(a instanceof THREE.Points||a instanceof THREE.Line){a=new THREE.Float32Attribute(3*b.vertices.length,3);var c=new THREE.Float32Attribute(3*b.colors.length,3);this.addAttribute("position",a.copyVector3sArray(b.vertices));this.addAttribute("color",c.copyColorsArray(b.colors));b.lineDistances&&b.lineDistances.length===b.vertices.length&&
	(a=new THREE.Float32Attribute(b.lineDistances.length,1),this.addAttribute("lineDistance",a.copyArray(b.lineDistances)));null!==b.boundingSphere&&(this.boundingSphere=b.boundingSphere.clone());null!==b.boundingBox&&(this.boundingBox=b.boundingBox.clone())}else a instanceof THREE.Mesh&&b instanceof THREE.Geometry&&this.fromGeometry(b);return this},updateFromObject:function(a){var b=a.geometry;if(a instanceof THREE.Mesh){var c=b.__directGeometry;if(void 0===c)return this.fromGeometry(b);c.verticesNeedUpdate=
	b.verticesNeedUpdate;c.normalsNeedUpdate=b.normalsNeedUpdate;c.colorsNeedUpdate=b.colorsNeedUpdate;c.uvsNeedUpdate=b.uvsNeedUpdate;c.groupsNeedUpdate=b.groupsNeedUpdate;b.verticesNeedUpdate=!1;b.normalsNeedUpdate=!1;b.colorsNeedUpdate=!1;b.uvsNeedUpdate=!1;b.groupsNeedUpdate=!1;b=c}!0===b.verticesNeedUpdate&&(c=this.attributes.position,void 0!==c&&(c.copyVector3sArray(b.vertices),c.needsUpdate=!0),b.verticesNeedUpdate=!1);!0===b.normalsNeedUpdate&&(c=this.attributes.normal,void 0!==c&&(c.copyVector3sArray(b.normals),
	c.needsUpdate=!0),b.normalsNeedUpdate=!1);!0===b.colorsNeedUpdate&&(c=this.attributes.color,void 0!==c&&(c.copyColorsArray(b.colors),c.needsUpdate=!0),b.colorsNeedUpdate=!1);b.uvsNeedUpdate&&(c=this.attributes.uv,void 0!==c&&(c.copyVector2sArray(b.uvs),c.needsUpdate=!0),b.uvsNeedUpdate=!1);b.lineDistancesNeedUpdate&&(c=this.attributes.lineDistance,void 0!==c&&(c.copyArray(b.lineDistances),c.needsUpdate=!0),b.lineDistancesNeedUpdate=!1);b.groupsNeedUpdate&&(b.computeGroups(a.geometry),this.groups=
	b.groups,b.groupsNeedUpdate=!1);return this},fromGeometry:function(a){a.__directGeometry=(new THREE.DirectGeometry).fromGeometry(a);return this.fromDirectGeometry(a.__directGeometry)},fromDirectGeometry:function(a){var b=new Float32Array(3*a.vertices.length);this.addAttribute("position",(new THREE.BufferAttribute(b,3)).copyVector3sArray(a.vertices));0<a.normals.length&&(b=new Float32Array(3*a.normals.length),this.addAttribute("normal",(new THREE.BufferAttribute(b,3)).copyVector3sArray(a.normals)));
	0<a.colors.length&&(b=new Float32Array(3*a.colors.length),this.addAttribute("color",(new THREE.BufferAttribute(b,3)).copyColorsArray(a.colors)));0<a.uvs.length&&(b=new Float32Array(2*a.uvs.length),this.addAttribute("uv",(new THREE.BufferAttribute(b,2)).copyVector2sArray(a.uvs)));0<a.uvs2.length&&(b=new Float32Array(2*a.uvs2.length),this.addAttribute("uv2",(new THREE.BufferAttribute(b,2)).copyVector2sArray(a.uvs2)));0<a.indices.length&&(b=new (65535<a.vertices.length?Uint32Array:Uint16Array)(3*a.indices.length),
	this.setIndex((new THREE.BufferAttribute(b,1)).copyIndicesArray(a.indices)));this.groups=a.groups;for(var c in a.morphTargets){for(var b=[],d=a.morphTargets[c],e=0,f=d.length;e<f;e++){var g=d[e],h=new THREE.Float32Attribute(3*g.length,3);b.push(h.copyVector3sArray(g))}this.morphAttributes[c]=b}0<a.skinIndices.length&&(c=new THREE.Float32Attribute(4*a.skinIndices.length,4),this.addAttribute("skinIndex",c.copyVector4sArray(a.skinIndices)));0<a.skinWeights.length&&(c=new THREE.Float32Attribute(4*a.skinWeights.length,
	4),this.addAttribute("skinWeight",c.copyVector4sArray(a.skinWeights)));null!==a.boundingSphere&&(this.boundingSphere=a.boundingSphere.clone());null!==a.boundingBox&&(this.boundingBox=a.boundingBox.clone());return this},computeBoundingBox:function(){null===this.boundingBox&&(this.boundingBox=new THREE.Box3);var a=this.attributes.position.array;void 0!==a?this.boundingBox.setFromArray(a):this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&
	console.error('THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)},computeBoundingSphere:function(){var a=new THREE.Box3,b=new THREE.Vector3;return function(){null===this.boundingSphere&&(this.boundingSphere=new THREE.Sphere);var c=this.attributes.position.array;if(c){var d=this.boundingSphere.center;a.setFromArray(c);a.center(d);for(var e=0,f=0,g=c.length;f<g;f+=3)b.fromArray(c,f),e=Math.max(e,d.distanceToSquared(b));
	this.boundingSphere.radius=Math.sqrt(e);isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}}(),computeFaceNormals:function(){},computeVertexNormals:function(){var a=this.index,b=this.attributes,c=this.groups;if(b.position){var d=b.position.array;if(void 0===b.normal)this.addAttribute("normal",new THREE.BufferAttribute(new Float32Array(d.length),3));else for(var e=b.normal.array,
	f=0,g=e.length;f<g;f++)e[f]=0;var e=b.normal.array,h,k,l,n=new THREE.Vector3,p=new THREE.Vector3,m=new THREE.Vector3,q=new THREE.Vector3,r=new THREE.Vector3;if(a){a=a.array;0===c.length&&this.addGroup(0,a.length);for(var s=0,u=c.length;s<u;++s)for(f=c[s],g=f.start,h=f.count,f=g,g+=h;f<g;f+=3)h=3*a[f+0],k=3*a[f+1],l=3*a[f+2],n.fromArray(d,h),p.fromArray(d,k),m.fromArray(d,l),q.subVectors(m,p),r.subVectors(n,p),q.cross(r),e[h]+=q.x,e[h+1]+=q.y,e[h+2]+=q.z,e[k]+=q.x,e[k+1]+=q.y,e[k+2]+=q.z,e[l]+=q.x,
	e[l+1]+=q.y,e[l+2]+=q.z}else for(f=0,g=d.length;f<g;f+=9)n.fromArray(d,f),p.fromArray(d,f+3),m.fromArray(d,f+6),q.subVectors(m,p),r.subVectors(n,p),q.cross(r),e[f]=q.x,e[f+1]=q.y,e[f+2]=q.z,e[f+3]=q.x,e[f+4]=q.y,e[f+5]=q.z,e[f+6]=q.x,e[f+7]=q.y,e[f+8]=q.z;this.normalizeNormals();b.normal.needsUpdate=!0}},merge:function(a,b){if(!1===a instanceof THREE.BufferGeometry)console.error("THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.",a);else{void 0===b&&(b=0);var c=this.attributes,
	d;for(d in c)if(void 0!==a.attributes[d])for(var e=c[d].array,f=a.attributes[d],g=f.array,h=0,f=f.itemSize*b;h<g.length;h++,f++)e[f]=g[h];return this}},normalizeNormals:function(){for(var a=this.attributes.normal.array,b,c,d,e=0,f=a.length;e<f;e+=3)b=a[e],c=a[e+1],d=a[e+2],b=1/Math.sqrt(b*b+c*c+d*d),a[e]*=b,a[e+1]*=b,a[e+2]*=b},toNonIndexed:function(){if(null===this.index)return console.warn("THREE.BufferGeometry.toNonIndexed(): Geometry is already non-indexed."),this;var a=new THREE.BufferGeometry,
	b=this.index.array,c=this.attributes,d;for(d in c){for(var e=c[d],f=e.array,e=e.itemSize,g=new f.constructor(b.length*e),h=0,k=0,l=0,n=b.length;l<n;l++)for(var h=b[l]*e,p=0;p<e;p++)g[k++]=f[h++];a.addAttribute(d,new THREE.BufferAttribute(g,e))}return a},toJSON:function(){var a={metadata:{version:4.4,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};a.uuid=this.uuid;a.type=this.type;""!==this.name&&(a.name=this.name);if(void 0!==this.parameters){var b=this.parameters,c;for(c in b)void 0!==
	b[c]&&(a[c]=b[c]);return a}a.data={attributes:{}};var d=this.index;null!==d&&(b=Array.prototype.slice.call(d.array),a.data.index={type:d.array.constructor.name,array:b});d=this.attributes;for(c in d){var e=d[c],b=Array.prototype.slice.call(e.array);a.data.attributes[c]={itemSize:e.itemSize,type:e.array.constructor.name,array:b,normalized:e.normalized}}c=this.groups;0<c.length&&(a.data.groups=JSON.parse(JSON.stringify(c)));c=this.boundingSphere;null!==c&&(a.data.boundingSphere={center:c.center.toArray(),
	radius:c.radius});return a},clone:function(){return(new THREE.BufferGeometry).copy(this)},copy:function(a){var b=a.index;null!==b&&this.setIndex(b.clone());var b=a.attributes,c;for(c in b)this.addAttribute(c,b[c].clone());a=a.groups;c=0;for(b=a.length;c<b;c++){var d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}return this},dispose:function(){this.dispatchEvent({type:"dispose"})}});THREE.BufferGeometry.MaxIndex=65535;
	THREE.InstancedBufferGeometry=function(){THREE.BufferGeometry.call(this);this.type="InstancedBufferGeometry";this.maxInstancedCount=void 0};THREE.InstancedBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.InstancedBufferGeometry.prototype.constructor=THREE.InstancedBufferGeometry;THREE.InstancedBufferGeometry.prototype.addGroup=function(a,b,c){this.groups.push({start:a,count:b,instances:c})};
	THREE.InstancedBufferGeometry.prototype.copy=function(a){var b=a.index;null!==b&&this.setIndex(b.clone());var b=a.attributes,c;for(c in b)this.addAttribute(c,b[c].clone());a=a.groups;c=0;for(b=a.length;c<b;c++){var d=a[c];this.addGroup(d.start,d.count,d.instances)}return this};THREE.Uniform=function(a,b){"string"===typeof a&&(console.warn("THREE.Uniform: Type parameter is no longer needed."),a=b);this.value=a;this.dynamic=!1};
	THREE.Uniform.prototype={constructor:THREE.Uniform,onUpdate:function(a){this.dynamic=!0;this.onUpdateCallback=a;return this}};THREE.AnimationAction=function(){throw Error("THREE.AnimationAction: Use mixer.clipAction for construction.");};
	THREE.AnimationAction._new=function(a,b,c){this._mixer=a;this._clip=b;this._localRoot=c||null;a=b.tracks;b=a.length;c=Array(b);for(var d={endingStart:THREE.ZeroCurvatureEnding,endingEnd:THREE.ZeroCurvatureEnding},e=0;e!==b;++e){var f=a[e].createInterpolant(null);c[e]=f;f.settings=d}this._interpolantSettings=d;this._interpolants=c;this._propertyBindings=Array(b);this._weightInterpolant=this._timeScaleInterpolant=this._byClipCacheIndex=this._cacheIndex=null;this.loop=THREE.LoopRepeat;this._loopCount=
	-1;this._startTime=null;this.time=0;this._effectiveWeight=this.weight=this._effectiveTimeScale=this.timeScale=1;this.repetitions=Infinity;this.paused=!1;this.enabled=!0;this.clampWhenFinished=!1;this.zeroSlopeAtEnd=this.zeroSlopeAtStart=!0};
	THREE.AnimationAction._new.prototype={constructor:THREE.AnimationAction._new,play:function(){this._mixer._activateAction(this);return this},stop:function(){this._mixer._deactivateAction(this);return this.reset()},reset:function(){this.paused=!1;this.enabled=!0;this.time=0;this._loopCount=-1;this._startTime=null;return this.stopFading().stopWarping()},isRunning:function(){return this.enabled&&!this.paused&&0!==this.timeScale&&null===this._startTime&&this._mixer._isActiveAction(this)},isScheduled:function(){return this._mixer._isActiveAction(this)},
	startAt:function(a){this._startTime=a;return this},setLoop:function(a,b){this.loop=a;this.repetitions=b;return this},setEffectiveWeight:function(a){this.weight=a;this._effectiveWeight=this.enabled?a:0;return this.stopFading()},getEffectiveWeight:function(){return this._effectiveWeight},fadeIn:function(a){return this._scheduleFading(a,0,1)},fadeOut:function(a){return this._scheduleFading(a,1,0)},crossFadeFrom:function(a,b,c){a.fadeOut(b);this.fadeIn(b);if(c){c=this._clip.duration;var d=a._clip.duration,
	e=c/d;a.warp(1,d/c,b);this.warp(e,1,b)}return this},crossFadeTo:function(a,b,c){return a.crossFadeFrom(this,b,c)},stopFading:function(){var a=this._weightInterpolant;null!==a&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(a));return this},setEffectiveTimeScale:function(a){this.timeScale=a;this._effectiveTimeScale=this.paused?0:a;return this.stopWarping()},getEffectiveTimeScale:function(){return this._effectiveTimeScale},setDuration:function(a){this.timeScale=this._clip.duration/
	a;return this.stopWarping()},syncWith:function(a){this.time=a.time;this.timeScale=a.timeScale;return this.stopWarping()},halt:function(a){return this.warp(this._effectiveTimeScale,0,a)},warp:function(a,b,c){var d=this._mixer,e=d.time,f=this._timeScaleInterpolant,g=this.timeScale;null===f&&(this._timeScaleInterpolant=f=d._lendControlInterpolant());d=f.parameterPositions;f=f.sampleValues;d[0]=e;d[1]=e+c;f[0]=a/g;f[1]=b/g;return this},stopWarping:function(){var a=this._timeScaleInterpolant;null!==a&&
	(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(a));return this},getMixer:function(){return this._mixer},getClip:function(){return this._clip},getRoot:function(){return this._localRoot||this._mixer._root},_update:function(a,b,c,d){var e=this._startTime;if(null!==e){b=(a-e)*c;if(0>b||0===c)return;this._startTime=null;b*=c}b*=this._updateTimeScale(a);c=this._updateTime(b);a=this._updateWeight(a);if(0<a){b=this._interpolants;for(var e=this._propertyBindings,f=0,g=b.length;f!==
	g;++f)b[f].evaluate(c),e[f].accumulate(d,a)}},_updateWeight:function(a){var b=0;if(this.enabled){var b=this.weight,c=this._weightInterpolant;if(null!==c){var d=c.evaluate(a)[0],b=b*d;a>c.parameterPositions[1]&&(this.stopFading(),0===d&&(this.enabled=!1))}}return this._effectiveWeight=b},_updateTimeScale:function(a){var b=0;if(!this.paused){var b=this.timeScale,c=this._timeScaleInterpolant;if(null!==c){var d=c.evaluate(a)[0],b=b*d;a>c.parameterPositions[1]&&(this.stopWarping(),0===b?this.pause=!0:
	this.timeScale=b)}}return this._effectiveTimeScale=b},_updateTime:function(a){var b=this.time+a;if(0===a)return b;var c=this._clip.duration,d=this.loop,e=this._loopCount;if(d===THREE.LoopOnce)a:{if(-1===e&&(this.loopCount=0,this._setEndings(!0,!0,!1)),b>=c)b=c;else if(0>b)b=0;else break a;this.clampWhenFinished?this.pause=!0:this.enabled=!1;this._mixer.dispatchEvent({type:"finished",action:this,direction:0>a?-1:1})}else{d=d===THREE.LoopPingPong;-1===e&&(0<=a?(e=0,this._setEndings(!0,0===this.repetitions,
	d)):this._setEndings(0===this.repetitions,!0,d));if(b>=c||0>b){var f=Math.floor(b/c),b=b-c*f,e=e+Math.abs(f),g=this.repetitions-e;0>g?(this.clampWhenFinished?this.paused=!0:this.enabled=!1,b=0<a?c:0,this._mixer.dispatchEvent({type:"finished",action:this,direction:0<a?1:-1})):(0===g?(a=0>a,this._setEndings(a,!a,d)):this._setEndings(!1,!1,d),this._loopCount=e,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:f}))}if(d&&1===(e&1))return this.time=b,c-b}return this.time=b},_setEndings:function(a,
	b,c){var d=this._interpolantSettings;c?(d.endingStart=THREE.ZeroSlopeEnding,d.endingEnd=THREE.ZeroSlopeEnding):(d.endingStart=a?this.zeroSlopeAtStart?THREE.ZeroSlopeEnding:THREE.ZeroCurvatureEnding:THREE.WrapAroundEnding,d.endingEnd=b?this.zeroSlopeAtEnd?THREE.ZeroSlopeEnding:THREE.ZeroCurvatureEnding:THREE.WrapAroundEnding)},_scheduleFading:function(a,b,c){var d=this._mixer,e=d.time,f=this._weightInterpolant;null===f&&(this._weightInterpolant=f=d._lendControlInterpolant());d=f.parameterPositions;
	f=f.sampleValues;d[0]=e;f[0]=b;d[1]=e+a;f[1]=c;return this}};THREE.AnimationClip=function(a,b,c){this.name=a;this.tracks=c;this.duration=void 0!==b?b:-1;this.uuid=THREE.Math.generateUUID();0>this.duration&&this.resetDuration();this.trim();this.optimize()};
	THREE.AnimationClip.prototype={constructor:THREE.AnimationClip,resetDuration:function(){for(var a=0,b=0,c=this.tracks.length;b!==c;++b)var d=this.tracks[b],a=Math.max(a,d.times[d.times.length-1]);this.duration=a},trim:function(){for(var a=0;a<this.tracks.length;a++)this.tracks[a].trim(0,this.duration);return this},optimize:function(){for(var a=0;a<this.tracks.length;a++)this.tracks[a].optimize();return this}};
	Object.assign(THREE.AnimationClip,{parse:function(a){for(var b=[],c=a.tracks,d=1/(a.fps||1),e=0,f=c.length;e!==f;++e)b.push(THREE.KeyframeTrack.parse(c[e]).scale(d));return new THREE.AnimationClip(a.name,a.duration,b)},toJSON:function(a){var b=[],c=a.tracks;a={name:a.name,duration:a.duration,tracks:b};for(var d=0,e=c.length;d!==e;++d)b.push(THREE.KeyframeTrack.toJSON(c[d]));return a},CreateFromMorphTargetSequence:function(a,b,c,d){for(var e=b.length,f=[],g=0;g<e;g++){var h=[],k=[];h.push((g+e-1)%
	e,g,(g+1)%e);k.push(0,1,0);var l=THREE.AnimationUtils.getKeyframeOrder(h),h=THREE.AnimationUtils.sortedArray(h,1,l),k=THREE.AnimationUtils.sortedArray(k,1,l);d||0!==h[0]||(h.push(e),k.push(k[0]));f.push((new THREE.NumberKeyframeTrack(".morphTargetInfluences["+b[g].name+"]",h,k)).scale(1/c))}return new THREE.AnimationClip(a,-1,f)},findByName:function(a,b){var c=a;Array.isArray(a)||(c=a.geometry&&a.geometry.animations||a.animations);for(var d=0;d<c.length;d++)if(c[d].name===b)return c[d];return null},
	CreateClipsFromMorphTargetSequences:function(a,b,c){for(var d={},e=/^([\w-]*?)([\d]+)$/,f=0,g=a.length;f<g;f++){var h=a[f],k=h.name.match(e);if(k&&1<k.length){var l=k[1];(k=d[l])||(d[l]=k=[]);k.push(h)}}a=[];for(l in d)a.push(THREE.AnimationClip.CreateFromMorphTargetSequence(l,d[l],b,c));return a},parseAnimation:function(a,b,c){if(!a)return console.error("  no animation in JSONLoader data"),null;c=function(a,b,c,d,e){if(0!==c.length){var f=[],g=[];THREE.AnimationUtils.flattenJSON(c,f,g,d);0!==f.length&&
	e.push(new a(b,f,g))}};var d=[],e=a.name||"default",f=a.length||-1,g=a.fps||30;a=a.hierarchy||[];for(var h=0;h<a.length;h++){var k=a[h].keys;if(k&&0!==k.length)if(k[0].morphTargets){for(var f={},l=0;l<k.length;l++)if(k[l].morphTargets)for(var n=0;n<k[l].morphTargets.length;n++)f[k[l].morphTargets[n]]=-1;for(var p in f){for(var m=[],q=[],n=0;n!==k[l].morphTargets.length;++n){var r=k[l];m.push(r.time);q.push(r.morphTarget===p?1:0)}d.push(new THREE.NumberKeyframeTrack(".morphTargetInfluence["+p+"]",
	m,q))}f=f.length*(g||1)}else l=".bones["+b[h].name+"]",c(THREE.VectorKeyframeTrack,l+".position",k,"pos",d),c(THREE.QuaternionKeyframeTrack,l+".quaternion",k,"rot",d),c(THREE.VectorKeyframeTrack,l+".scale",k,"scl",d)}return 0===d.length?null:new THREE.AnimationClip(e,f,d)}});THREE.AnimationMixer=function(a){this._root=a;this._initMemoryManager();this.time=this._accuIndex=0;this.timeScale=1};
	Object.assign(THREE.AnimationMixer.prototype,THREE.EventDispatcher.prototype,{clipAction:function(a,b){var c=b||this._root,d=c.uuid,e="string"===typeof a?THREE.AnimationClip.findByName(c,a):a,c=null!==e?e.uuid:a,f=this._actionsByClip[c],g=null;if(void 0!==f){g=f.actionByRoot[d];if(void 0!==g)return g;g=f.knownActions[0];null===e&&(e=g._clip)}if(null===e)return null;e=new THREE.AnimationMixer._Action(this,e,b);this._bindAction(e,g);this._addInactiveAction(e,c,d);return e},existingAction:function(a,
	b){var c=b||this._root,d=c.uuid,c="string"===typeof a?THREE.AnimationClip.findByName(c,a):a,c=this._actionsByClip[c?c.uuid:a];return void 0!==c?c.actionByRoot[d]||null:null},stopAllAction:function(){for(var a=this._actions,b=this._nActiveActions,c=this._bindings,d=this._nActiveBindings,e=this._nActiveBindings=this._nActiveActions=0;e!==b;++e)a[e].reset();for(e=0;e!==d;++e)c[e].useCount=0;return this},update:function(a){a*=this.timeScale;for(var b=this._actions,c=this._nActiveActions,d=this.time+=
	a,e=Math.sign(a),f=this._accuIndex^=1,g=0;g!==c;++g){var h=b[g];h.enabled&&h._update(d,a,e,f)}a=this._bindings;b=this._nActiveBindings;for(g=0;g!==b;++g)a[g].apply(f);return this},getRoot:function(){return this._root},uncacheClip:function(a){var b=this._actions;a=a.uuid;var c=this._actionsByClip,d=c[a];if(void 0!==d){for(var d=d.knownActions,e=0,f=d.length;e!==f;++e){var g=d[e];this._deactivateAction(g);var h=g._cacheIndex,k=b[b.length-1];g._cacheIndex=null;g._byClipCacheIndex=null;k._cacheIndex=
	h;b[h]=k;b.pop();this._removeInactiveBindingsForAction(g)}delete c[a]}},uncacheRoot:function(a){a=a.uuid;var b=this._actionsByClip,c;for(c in b){var d=b[c].actionByRoot[a];void 0!==d&&(this._deactivateAction(d),this._removeInactiveAction(d))}c=this._bindingsByRootAndName[a];if(void 0!==c)for(var e in c)a=c[e],a.restoreOriginalState(),this._removeInactiveBinding(a)},uncacheAction:function(a,b){var c=this.existingAction(a,b);null!==c&&(this._deactivateAction(c),this._removeInactiveAction(c))}});
	THREE.AnimationMixer._Action=THREE.AnimationAction._new;
	Object.assign(THREE.AnimationMixer.prototype,{_bindAction:function(a,b){var c=a._localRoot||this._root,d=a._clip.tracks,e=d.length,f=a._propertyBindings,g=a._interpolants,h=c.uuid,k=this._bindingsByRootAndName,l=k[h];void 0===l&&(l={},k[h]=l);for(k=0;k!==e;++k){var n=d[k],p=n.name,m=l[p];if(void 0===m){m=f[k];if(void 0!==m){null===m._cacheIndex&&(++m.referenceCount,this._addInactiveBinding(m,h,p));continue}m=new THREE.PropertyMixer(THREE.PropertyBinding.create(c,p,b&&b._propertyBindings[k].binding.parsedPath),
	n.ValueTypeName,n.getValueSize());++m.referenceCount;this._addInactiveBinding(m,h,p)}f[k]=m;g[k].resultBuffer=m.buffer}},_activateAction:function(a){if(!this._isActiveAction(a)){if(null===a._cacheIndex){var b=(a._localRoot||this._root).uuid,c=a._clip.uuid,d=this._actionsByClip[c];this._bindAction(a,d&&d.knownActions[0]);this._addInactiveAction(a,c,b)}b=a._propertyBindings;c=0;for(d=b.length;c!==d;++c){var e=b[c];0===e.useCount++&&(this._lendBinding(e),e.saveOriginalState())}this._lendAction(a)}},
	_deactivateAction:function(a){if(this._isActiveAction(a)){for(var b=a._propertyBindings,c=0,d=b.length;c!==d;++c){var e=b[c];0===--e.useCount&&(e.restoreOriginalState(),this._takeBackBinding(e))}this._takeBackAction(a)}},_initMemoryManager:function(){this._actions=[];this._nActiveActions=0;this._actionsByClip={};this._bindings=[];this._nActiveBindings=0;this._bindingsByRootAndName={};this._controlInterpolants=[];this._nActiveControlInterpolants=0;var a=this;this.stats={actions:{get total(){return a._actions.length},
	get inUse(){return a._nActiveActions}},bindings:{get total(){return a._bindings.length},get inUse(){return a._nActiveBindings}},controlInterpolants:{get total(){return a._controlInterpolants.length},get inUse(){return a._nActiveControlInterpolants}}}},_isActiveAction:function(a){a=a._cacheIndex;return null!==a&&a<this._nActiveActions},_addInactiveAction:function(a,b,c){var d=this._actions,e=this._actionsByClip,f=e[b];void 0===f?(f={knownActions:[a],actionByRoot:{}},a._byClipCacheIndex=0,e[b]=f):(b=
	f.knownActions,a._byClipCacheIndex=b.length,b.push(a));a._cacheIndex=d.length;d.push(a);f.actionByRoot[c]=a},_removeInactiveAction:function(a){var b=this._actions,c=b[b.length-1],d=a._cacheIndex;c._cacheIndex=d;b[d]=c;b.pop();a._cacheIndex=null;var c=a._clip.uuid,d=this._actionsByClip,e=d[c],f=e.knownActions,g=f[f.length-1],h=a._byClipCacheIndex;g._byClipCacheIndex=h;f[h]=g;f.pop();a._byClipCacheIndex=null;delete e.actionByRoot[(b._localRoot||this._root).uuid];0===f.length&&delete d[c];this._removeInactiveBindingsForAction(a)},
	_removeInactiveBindingsForAction:function(a){a=a._propertyBindings;for(var b=0,c=a.length;b!==c;++b){var d=a[b];0===--d.referenceCount&&this._removeInactiveBinding(d)}},_lendAction:function(a){var b=this._actions,c=a._cacheIndex,d=this._nActiveActions++,e=b[d];a._cacheIndex=d;b[d]=a;e._cacheIndex=c;b[c]=e},_takeBackAction:function(a){var b=this._actions,c=a._cacheIndex,d=--this._nActiveActions,e=b[d];a._cacheIndex=d;b[d]=a;e._cacheIndex=c;b[c]=e},_addInactiveBinding:function(a,b,c){var d=this._bindingsByRootAndName,
	e=d[b],f=this._bindings;void 0===e&&(e={},d[b]=e);e[c]=a;a._cacheIndex=f.length;f.push(a)},_removeInactiveBinding:function(a){var b=this._bindings,c=a.binding,d=c.rootNode.uuid,c=c.path,e=this._bindingsByRootAndName,f=e[d],g=b[b.length-1];a=a._cacheIndex;g._cacheIndex=a;b[a]=g;b.pop();delete f[c];a:{for(var h in f)break a;delete e[d]}},_lendBinding:function(a){var b=this._bindings,c=a._cacheIndex,d=this._nActiveBindings++,e=b[d];a._cacheIndex=d;b[d]=a;e._cacheIndex=c;b[c]=e},_takeBackBinding:function(a){var b=
	this._bindings,c=a._cacheIndex,d=--this._nActiveBindings,e=b[d];a._cacheIndex=d;b[d]=a;e._cacheIndex=c;b[c]=e},_lendControlInterpolant:function(){var a=this._controlInterpolants,b=this._nActiveControlInterpolants++,c=a[b];void 0===c&&(c=new THREE.LinearInterpolant(new Float32Array(2),new Float32Array(2),1,this._controlInterpolantsResultBuffer),c.__cacheIndex=b,a[b]=c);return c},_takeBackControlInterpolant:function(a){var b=this._controlInterpolants,c=a.__cacheIndex,d=--this._nActiveControlInterpolants,
	e=b[d];a.__cacheIndex=d;b[d]=a;e.__cacheIndex=c;b[c]=e},_controlInterpolantsResultBuffer:new Float32Array(1)});
	THREE.AnimationObjectGroup=function(a){this.uuid=THREE.Math.generateUUID();this._objects=Array.prototype.slice.call(arguments);this.nCachedObjects_=0;var b={};this._indicesByUUID=b;for(var c=0,d=arguments.length;c!==d;++c)b[arguments[c].uuid]=c;this._paths=[];this._parsedPaths=[];this._bindings=[];this._bindingsIndicesByPath={};var e=this;this.stats={objects:{get total(){return e._objects.length},get inUse(){return this.total-e.nCachedObjects_}},get bindingsPerObject(){return e._bindings.length}}};
	THREE.AnimationObjectGroup.prototype={constructor:THREE.AnimationObjectGroup,add:function(a){for(var b=this._objects,c=b.length,d=this.nCachedObjects_,e=this._indicesByUUID,f=this._paths,g=this._parsedPaths,h=this._bindings,k=h.length,l=0,n=arguments.length;l!==n;++l){var p=arguments[l],m=p.uuid,q=e[m];if(void 0===q){q=c++;e[m]=q;b.push(p);for(var m=0,r=k;m!==r;++m)h[m].push(new THREE.PropertyBinding(p,f[m],g[m]))}else if(q<d){var s=b[q],u=--d,r=b[u];e[r.uuid]=q;b[q]=r;e[m]=u;b[u]=p;m=0;for(r=k;m!==
	r;++m){var x=h[m],v=x[q];x[q]=x[u];void 0===v&&(v=new THREE.PropertyBinding(p,f[m],g[m]));x[u]=v}}else b[q]!==s&&console.error("Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes...")}this.nCachedObjects_=d},remove:function(a){for(var b=this._objects,c=this.nCachedObjects_,d=this._indicesByUUID,e=this._bindings,f=e.length,g=0,h=arguments.length;g!==h;++g){var k=arguments[g],l=k.uuid,n=d[l];if(void 0!==n&&n>=c){var p=c++,m=b[p];d[m.uuid]=
	n;b[n]=m;d[l]=p;b[p]=k;k=0;for(l=f;k!==l;++k){var m=e[k],q=m[n];m[n]=m[p];m[p]=q}}}this.nCachedObjects_=c},uncache:function(a){for(var b=this._objects,c=b.length,d=this.nCachedObjects_,e=this._indicesByUUID,f=this._bindings,g=f.length,h=0,k=arguments.length;h!==k;++h){var l=arguments[h].uuid,n=e[l];if(void 0!==n)if(delete e[l],n<d){var l=--d,p=b[l],m=--c,q=b[m];e[p.uuid]=n;b[n]=p;e[q.uuid]=l;b[l]=q;b.pop();p=0;for(q=g;p!==q;++p){var r=f[p],s=r[m];r[n]=r[l];r[l]=s;r.pop()}}else for(m=--c,q=b[m],e[q.uuid]=
	n,b[n]=q,b.pop(),p=0,q=g;p!==q;++p)r=f[p],r[n]=r[m],r.pop()}this.nCachedObjects_=d},subscribe_:function(a,b){var c=this._bindingsIndicesByPath,d=c[a],e=this._bindings;if(void 0!==d)return e[d];var f=this._paths,g=this._parsedPaths,h=this._objects,k=this.nCachedObjects_,l=Array(h.length),d=e.length;c[a]=d;f.push(a);g.push(b);e.push(l);c=k;for(d=h.length;c!==d;++c)l[c]=new THREE.PropertyBinding(h[c],a,b);return l},unsubscribe_:function(a){var b=this._bindingsIndicesByPath,c=b[a];if(void 0!==c){var d=
	this._paths,e=this._parsedPaths,f=this._bindings,g=f.length-1,h=f[g];b[a[g]]=c;f[c]=h;f.pop();e[c]=e[g];e.pop();d[c]=d[g];d.pop()}}};
	THREE.AnimationUtils={arraySlice:function(a,b,c){return THREE.AnimationUtils.isTypedArray(a)?new a.constructor(a.subarray(b,c)):a.slice(b,c)},convertArray:function(a,b,c){return!a||!c&&a.constructor===b?a:"number"===typeof b.BYTES_PER_ELEMENT?new b(a):Array.prototype.slice.call(a)},isTypedArray:function(a){return ArrayBuffer.isView(a)&&!(a instanceof DataView)},getKeyframeOrder:function(a){for(var b=a.length,c=Array(b),d=0;d!==b;++d)c[d]=d;c.sort(function(b,c){return a[b]-a[c]});return c},sortedArray:function(a,
	b,c){for(var d=a.length,e=new a.constructor(d),f=0,g=0;g!==d;++f)for(var h=c[f]*b,k=0;k!==b;++k)e[g++]=a[h+k];return e},flattenJSON:function(a,b,c,d){for(var e=1,f=a[0];void 0!==f&&void 0===f[d];)f=a[e++];if(void 0!==f){var g=f[d];if(void 0!==g)if(Array.isArray(g)){do g=f[d],void 0!==g&&(b.push(f.time),c.push.apply(c,g)),f=a[e++];while(void 0!==f)}else if(void 0!==g.toArray){do g=f[d],void 0!==g&&(b.push(f.time),g.toArray(c,c.length)),f=a[e++];while(void 0!==f)}else{do g=f[d],void 0!==g&&(b.push(f.time),
	c.push(g)),f=a[e++];while(void 0!==f)}}}};THREE.KeyframeTrack=function(a,b,c,d){if(void 0===a)throw Error("track name is undefined");if(void 0===b||0===b.length)throw Error("no keyframes in track named "+a);this.name=a;this.times=THREE.AnimationUtils.convertArray(b,this.TimeBufferType);this.values=THREE.AnimationUtils.convertArray(c,this.ValueBufferType);this.setInterpolation(d||this.DefaultInterpolation);this.validate();this.optimize()};
	THREE.KeyframeTrack.prototype={constructor:THREE.KeyframeTrack,TimeBufferType:Float32Array,ValueBufferType:Float32Array,DefaultInterpolation:THREE.InterpolateLinear,InterpolantFactoryMethodDiscrete:function(a){return new THREE.DiscreteInterpolant(this.times,this.values,this.getValueSize(),a)},InterpolantFactoryMethodLinear:function(a){return new THREE.LinearInterpolant(this.times,this.values,this.getValueSize(),a)},InterpolantFactoryMethodSmooth:function(a){return new THREE.CubicInterpolant(this.times,
	this.values,this.getValueSize(),a)},setInterpolation:function(a){var b;switch(a){case THREE.InterpolateDiscrete:b=this.InterpolantFactoryMethodDiscrete;break;case THREE.InterpolateLinear:b=this.InterpolantFactoryMethodLinear;break;case THREE.InterpolateSmooth:b=this.InterpolantFactoryMethodSmooth}if(void 0===b){b="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(void 0===this.createInterpolant)if(a!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);
	else throw Error(b);console.warn(b)}else this.createInterpolant=b},getInterpolation:function(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return THREE.InterpolateDiscrete;case this.InterpolantFactoryMethodLinear:return THREE.InterpolateLinear;case this.InterpolantFactoryMethodSmooth:return THREE.InterpolateSmooth}},getValueSize:function(){return this.values.length/this.times.length},shift:function(a){if(0!==a)for(var b=this.times,c=0,d=b.length;c!==d;++c)b[c]+=a;return this},
	scale:function(a){if(1!==a)for(var b=this.times,c=0,d=b.length;c!==d;++c)b[c]*=a;return this},trim:function(a,b){for(var c=this.times,d=c.length,e=0,f=d-1;e!==d&&c[e]<a;)++e;for(;-1!==f&&c[f]>b;)--f;++f;if(0!==e||f!==d)e>=f&&(f=Math.max(f,1),e=f-1),d=this.getValueSize(),this.times=THREE.AnimationUtils.arraySlice(c,e,f),this.values=THREE.AnimationUtils.arraySlice(this.values,e*d,f*d);return this},validate:function(){var a=!0,b=this.getValueSize();0!==b-Math.floor(b)&&(console.error("invalid value size in track",
	this),a=!1);var c=this.times,b=this.values,d=c.length;0===d&&(console.error("track is empty",this),a=!1);for(var e=null,f=0;f!==d;f++){var g=c[f];if("number"===typeof g&&isNaN(g)){console.error("time is not a valid number",this,f,g);a=!1;break}if(null!==e&&e>g){console.error("out of order keys",this,f,g,e);a=!1;break}e=g}if(void 0!==b&&THREE.AnimationUtils.isTypedArray(b))for(f=0,c=b.length;f!==c;++f)if(d=b[f],isNaN(d)){console.error("value is not a valid number",this,f,d);a=!1;break}return a},optimize:function(){for(var a=
	this.times,b=this.values,c=this.getValueSize(),d=1,e=1,f=a.length-1;e<=f;++e){var g=!1,h=a[e];if(h!==a[e+1]&&(1!==e||h!==h[0]))for(var k=e*c,l=k-c,n=k+c,h=0;h!==c;++h){var p=b[k+h];if(p!==b[l+h]||p!==b[n+h]){g=!0;break}}if(g){if(e!==d)for(a[d]=a[e],g=e*c,k=d*c,h=0;h!==c;++h)b[k+h]=b[g+h];++d}}d!==a.length&&(this.times=THREE.AnimationUtils.arraySlice(a,0,d),this.values=THREE.AnimationUtils.arraySlice(b,0,d*c));return this}};
	Object.assign(THREE.KeyframeTrack,{parse:function(a){if(void 0===a.type)throw Error("track type undefined, can not parse");var b=THREE.KeyframeTrack._getTrackTypeForValueTypeName(a.type);if(void 0===a.times){var c=[],d=[];THREE.AnimationUtils.flattenJSON(a.keys,c,d,"value");a.times=c;a.values=d}return void 0!==b.parse?b.parse(a):new b(a.name,a.times,a.values,a.interpolation)},toJSON:function(a){var b=a.constructor;if(void 0!==b.toJSON)b=b.toJSON(a);else{var b={name:a.name,times:THREE.AnimationUtils.convertArray(a.times,
	Array),values:THREE.AnimationUtils.convertArray(a.values,Array)},c=a.getInterpolation();c!==a.DefaultInterpolation&&(b.interpolation=c)}b.type=a.ValueTypeName;return b},_getTrackTypeForValueTypeName:function(a){switch(a.toLowerCase()){case "scalar":case "double":case "float":case "number":case "integer":return THREE.NumberKeyframeTrack;case "vector":case "vector2":case "vector3":case "vector4":return THREE.VectorKeyframeTrack;case "color":return THREE.ColorKeyframeTrack;case "quaternion":return THREE.QuaternionKeyframeTrack;
	case "bool":case "boolean":return THREE.BooleanKeyframeTrack;case "string":return THREE.StringKeyframeTrack}throw Error("Unsupported typeName: "+a);}});THREE.PropertyBinding=function(a,b,c){this.path=b;this.parsedPath=c||THREE.PropertyBinding.parseTrackName(b);this.node=THREE.PropertyBinding.findNode(a,this.parsedPath.nodeName)||a;this.rootNode=a};
	THREE.PropertyBinding.prototype={constructor:THREE.PropertyBinding,getValue:function(a,b){this.bind();this.getValue(a,b)},setValue:function(a,b){this.bind();this.setValue(a,b)},bind:function(){var a=this.node,b=this.parsedPath,c=b.objectName,d=b.propertyName,e=b.propertyIndex;a||(this.node=a=THREE.PropertyBinding.findNode(this.rootNode,b.nodeName)||this.rootNode);this.getValue=this._getValue_unavailable;this.setValue=this._setValue_unavailable;if(a){if(c){var f=b.objectIndex;switch(c){case "materials":if(!a.material){console.error("  can not bind to material as node does not have a material",
	this);return}if(!a.material.materials){console.error("  can not bind to material.materials as node.material does not have a materials array",this);return}a=a.material.materials;break;case "bones":if(!a.skeleton){console.error("  can not bind to bones as node does not have a skeleton",this);return}a=a.skeleton.bones;for(c=0;c<a.length;c++)if(a[c].name===f){f=c;break}break;default:if(void 0===a[c]){console.error("  can not bind to objectName of node, undefined",this);return}a=a[c]}if(void 0!==f){if(void 0===
	a[f]){console.error("  trying to bind to objectIndex of objectName, but is undefined:",this,a);return}a=a[f]}}if(f=a[d]){b=this.Versioning.None;void 0!==a.needsUpdate?(b=this.Versioning.NeedsUpdate,this.targetObject=a):void 0!==a.matrixWorldNeedsUpdate&&(b=this.Versioning.MatrixWorldNeedsUpdate,this.targetObject=a);c=this.BindingType.Direct;if(void 0!==e){if("morphTargetInfluences"===d){if(!a.geometry){console.error("  can not bind to morphTargetInfluences becasuse node does not have a geometry",
	this);return}if(!a.geometry.morphTargets){console.error("  can not bind to morphTargetInfluences becasuse node does not have a geometry.morphTargets",this);return}for(c=0;c<this.node.geometry.morphTargets.length;c++)if(a.geometry.morphTargets[c].name===e){e=c;break}}c=this.BindingType.ArrayElement;this.resolvedProperty=f;this.propertyIndex=e}else void 0!==f.fromArray&&void 0!==f.toArray?(c=this.BindingType.HasFromToArray,this.resolvedProperty=f):void 0!==f.length?(c=this.BindingType.EntireArray,this.resolvedProperty=
	f):this.propertyName=d;this.getValue=this.GetterByBindingType[c];this.setValue=this.SetterByBindingTypeAndVersioning[c][b]}else console.error("  trying to update property for track: "+b.nodeName+"."+d+" but it wasn't found.",a)}else console.error("  trying to update node for track: "+this.path+" but it wasn't found.")},unbind:function(){this.node=null;this.getValue=this._getValue_unbound;this.setValue=this._setValue_unbound}};
	Object.assign(THREE.PropertyBinding.prototype,{_getValue_unavailable:function(){},_setValue_unavailable:function(){},_getValue_unbound:THREE.PropertyBinding.prototype.getValue,_setValue_unbound:THREE.PropertyBinding.prototype.setValue,BindingType:{Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Versioning:{None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},GetterByBindingType:[function(a,b){a[b]=this.node[this.propertyName]},function(a,b){for(var c=this.resolvedProperty,d=0,e=c.length;d!==e;++d)a[b++]=
	c[d]},function(a,b){a[b]=this.resolvedProperty[this.propertyIndex]},function(a,b){this.resolvedProperty.toArray(a,b)}],SetterByBindingTypeAndVersioning:[[function(a,b){this.node[this.propertyName]=a[b]},function(a,b){this.node[this.propertyName]=a[b];this.targetObject.needsUpdate=!0},function(a,b){this.node[this.propertyName]=a[b];this.targetObject.matrixWorldNeedsUpdate=!0}],[function(a,b){for(var c=this.resolvedProperty,d=0,e=c.length;d!==e;++d)c[d]=a[b++]},function(a,b){for(var c=this.resolvedProperty,
	d=0,e=c.length;d!==e;++d)c[d]=a[b++];this.targetObject.needsUpdate=!0},function(a,b){for(var c=this.resolvedProperty,d=0,e=c.length;d!==e;++d)c[d]=a[b++];this.targetObject.matrixWorldNeedsUpdate=!0}],[function(a,b){this.resolvedProperty[this.propertyIndex]=a[b]},function(a,b){this.resolvedProperty[this.propertyIndex]=a[b];this.targetObject.needsUpdate=!0},function(a,b){this.resolvedProperty[this.propertyIndex]=a[b];this.targetObject.matrixWorldNeedsUpdate=!0}],[function(a,b){this.resolvedProperty.fromArray(a,
	b)},function(a,b){this.resolvedProperty.fromArray(a,b);this.targetObject.needsUpdate=!0},function(a,b){this.resolvedProperty.fromArray(a,b);this.targetObject.matrixWorldNeedsUpdate=!0}]]});THREE.PropertyBinding.Composite=function(a,b,c){c=c||THREE.PropertyBinding.parseTrackName(b);this._targetGroup=a;this._bindings=a.subscribe_(b,c)};
	THREE.PropertyBinding.Composite.prototype={constructor:THREE.PropertyBinding.Composite,getValue:function(a,b){this.bind();var c=this._bindings[this._targetGroup.nCachedObjects_];void 0!==c&&c.getValue(a,b)},setValue:function(a,b){for(var c=this._bindings,d=this._targetGroup.nCachedObjects_,e=c.length;d!==e;++d)c[d].setValue(a,b)},bind:function(){for(var a=this._bindings,b=this._targetGroup.nCachedObjects_,c=a.length;b!==c;++b)a[b].bind()},unbind:function(){for(var a=this._bindings,b=this._targetGroup.nCachedObjects_,
	c=a.length;b!==c;++b)a[b].unbind()}};THREE.PropertyBinding.create=function(a,b,c){return a instanceof THREE.AnimationObjectGroup?new THREE.PropertyBinding.Composite(a,b,c):new THREE.PropertyBinding(a,b,c)};
	THREE.PropertyBinding.parseTrackName=function(a){var b=/^(([\w]+\/)*)([\w-\d]+)?(\.([\w]+)(\[([\w\d\[\]\_.:\- ]+)\])?)?(\.([\w.]+)(\[([\w\d\[\]\_. ]+)\])?)$/,c=b.exec(a);if(!c)throw Error("cannot parse trackName at all: "+a);c.index===b.lastIndex&&b.lastIndex++;b={nodeName:c[3],objectName:c[5],objectIndex:c[7],propertyName:c[9],propertyIndex:c[11]};if(null===b.propertyName||0===b.propertyName.length)throw Error("can not parse propertyName from trackName: "+a);return b};
	THREE.PropertyBinding.findNode=function(a,b){if(!b||""===b||"root"===b||"."===b||-1===b||b===a.name||b===a.uuid)return a;if(a.skeleton){var c=function(a){for(var c=0;c<a.bones.length;c++){var d=a.bones[c];if(d.name===b)return d}return null}(a.skeleton);if(c)return c}if(a.children){var d=function(a){for(var c=0;c<a.length;c++){var g=a[c];if(g.name===b||g.uuid===b||(g=d(g.children)))return g}return null};if(c=d(a.children))return c}return null};
	THREE.PropertyMixer=function(a,b,c){this.binding=a;this.valueSize=c;a=Float64Array;switch(b){case "quaternion":b=this._slerp;break;case "string":case "bool":a=Array;b=this._select;break;default:b=this._lerp}this.buffer=new a(4*c);this._mixBufferRegion=b;this.referenceCount=this.useCount=this.cumulativeWeight=0};
	THREE.PropertyMixer.prototype={constructor:THREE.PropertyMixer,accumulate:function(a,b){var c=this.buffer,d=this.valueSize,e=a*d+d,f=this.cumulativeWeight;if(0===f){for(f=0;f!==d;++f)c[e+f]=c[f];f=b}else f+=b,this._mixBufferRegion(c,e,0,b/f,d);this.cumulativeWeight=f},apply:function(a){var b=this.valueSize,c=this.buffer;a=a*b+b;var d=this.cumulativeWeight,e=this.binding;this.cumulativeWeight=0;1>d&&this._mixBufferRegion(c,a,3*b,1-d,b);for(var d=b,f=b+b;d!==f;++d)if(c[d]!==c[d+b]){e.setValue(c,a);
	break}},saveOriginalState:function(){var a=this.buffer,b=this.valueSize,c=3*b;this.binding.getValue(a,c);for(var d=b;d!==c;++d)a[d]=a[c+d%b];this.cumulativeWeight=0},restoreOriginalState:function(){this.binding.setValue(this.buffer,3*this.valueSize)},_select:function(a,b,c,d,e){if(.5<=d)for(d=0;d!==e;++d)a[b+d]=a[c+d]},_slerp:function(a,b,c,d,e){THREE.Quaternion.slerpFlat(a,b,a,b,a,c,d)},_lerp:function(a,b,c,d,e){for(var f=1-d,g=0;g!==e;++g){var h=b+g;a[h]=a[h]*f+a[c+g]*d}}};
	THREE.BooleanKeyframeTrack=function(a,b,c){THREE.KeyframeTrack.call(this,a,b,c)};THREE.BooleanKeyframeTrack.prototype=Object.assign(Object.create(THREE.KeyframeTrack.prototype),{constructor:THREE.BooleanKeyframeTrack,ValueTypeName:"bool",ValueBufferType:Array,DefaultInterpolation:THREE.InterpolateDiscrete,InterpolantFactoryMethodLinear:void 0,InterpolantFactoryMethodSmooth:void 0});THREE.ColorKeyframeTrack=function(a,b,c,d){THREE.KeyframeTrack.call(this,a,b,c,d)};
	THREE.ColorKeyframeTrack.prototype=Object.assign(Object.create(THREE.KeyframeTrack.prototype),{constructor:THREE.ColorKeyframeTrack,ValueTypeName:"color"});THREE.NumberKeyframeTrack=function(a,b,c,d){THREE.KeyframeTrack.call(this,a,b,c,d)};THREE.NumberKeyframeTrack.prototype=Object.assign(Object.create(THREE.KeyframeTrack.prototype),{constructor:THREE.NumberKeyframeTrack,ValueTypeName:"number"});THREE.QuaternionKeyframeTrack=function(a,b,c,d){THREE.KeyframeTrack.call(this,a,b,c,d)};
	THREE.QuaternionKeyframeTrack.prototype=Object.assign(Object.create(THREE.KeyframeTrack.prototype),{constructor:THREE.QuaternionKeyframeTrack,ValueTypeName:"quaternion",DefaultInterpolation:THREE.InterpolateLinear,InterpolantFactoryMethodLinear:function(a){return new THREE.QuaternionLinearInterpolant(this.times,this.values,this.getValueSize(),a)},InterpolantFactoryMethodSmooth:void 0});THREE.StringKeyframeTrack=function(a,b,c,d){THREE.KeyframeTrack.call(this,a,b,c,d)};
	THREE.StringKeyframeTrack.prototype=Object.assign(Object.create(THREE.KeyframeTrack.prototype),{constructor:THREE.StringKeyframeTrack,ValueTypeName:"string",ValueBufferType:Array,DefaultInterpolation:THREE.InterpolateDiscrete,InterpolantFactoryMethodLinear:void 0,InterpolantFactoryMethodSmooth:void 0});THREE.VectorKeyframeTrack=function(a,b,c,d){THREE.KeyframeTrack.call(this,a,b,c,d)};
	THREE.VectorKeyframeTrack.prototype=Object.assign(Object.create(THREE.KeyframeTrack.prototype),{constructor:THREE.VectorKeyframeTrack,ValueTypeName:"vector"});
	THREE.Audio=function(a){THREE.Object3D.call(this);this.type="Audio";this.context=a.context;this.source=this.context.createBufferSource();this.source.onended=this.onEnded.bind(this);this.gain=this.context.createGain();this.gain.connect(a.getInput());this.autoplay=!1;this.startTime=0;this.playbackRate=1;this.isPlaying=!1;this.hasPlaybackControl=!0;this.sourceType="empty";this.filters=[]};
	THREE.Audio.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Audio,getOutput:function(){return this.gain},setNodeSource:function(a){this.hasPlaybackControl=!1;this.sourceType="audioNode";this.source=a;this.connect();return this},setBuffer:function(a){this.source.buffer=a;this.sourceType="buffer";this.autoplay&&this.play();return this},play:function(){if(!0===this.isPlaying)console.warn("THREE.Audio: Audio is already playing.");else if(!1===this.hasPlaybackControl)console.warn("THREE.Audio: this Audio has no playback control.");
	else{var a=this.context.createBufferSource();a.buffer=this.source.buffer;a.loop=this.source.loop;a.onended=this.source.onended;a.start(0,this.startTime);a.playbackRate.value=this.playbackRate;this.isPlaying=!0;this.source=a;return this.connect()}},pause:function(){if(!1===this.hasPlaybackControl)console.warn("THREE.Audio: this Audio has no playback control.");else return this.source.stop(),this.startTime=this.context.currentTime,this},stop:function(){if(!1===this.hasPlaybackControl)console.warn("THREE.Audio: this Audio has no playback control.");
	else return this.source.stop(),this.startTime=0,this},connect:function(){if(0<this.filters.length){this.source.connect(this.filters[0]);for(var a=1,b=this.filters.length;a<b;a++)this.filters[a-1].connect(this.filters[a]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this},disconnect:function(){if(0<this.filters.length){this.source.disconnect(this.filters[0]);for(var a=1,b=this.filters.length;a<b;a++)this.filters[a-1].disconnect(this.filters[a]);
	this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this},getFilters:function(){return this.filters},setFilters:function(a){a||(a=[]);!0===this.isPlaying?(this.disconnect(),this.filters=a,this.connect()):this.filters=a;return this},getFilter:function(){return this.getFilters()[0]},setFilter:function(a){return this.setFilters(a?[a]:[])},setPlaybackRate:function(a){if(!1===this.hasPlaybackControl)console.warn("THREE.Audio: this Audio has no playback control.");
	else return this.playbackRate=a,!0===this.isPlaying&&(this.source.playbackRate.value=this.playbackRate),this},getPlaybackRate:function(){return this.playbackRate},onEnded:function(){this.isPlaying=!1},getLoop:function(){return!1===this.hasPlaybackControl?(console.warn("THREE.Audio: this Audio has no playback control."),!1):this.source.loop},setLoop:function(a){!1===this.hasPlaybackControl?console.warn("THREE.Audio: this Audio has no playback control."):this.source.loop=a},getVolume:function(){return this.gain.gain.value},
	setVolume:function(a){this.gain.gain.value=a;return this}});THREE.AudioAnalyser=function(a,b){this.analyser=a.context.createAnalyser();this.analyser.fftSize=void 0!==b?b:2048;this.data=new Uint8Array(this.analyser.frequencyBinCount);a.getOutput().connect(this.analyser)};
	Object.assign(THREE.AudioAnalyser.prototype,{getFrequencyData:function(){this.analyser.getByteFrequencyData(this.data);return this.data},getAverageFrequency:function(){for(var a=0,b=this.getFrequencyData(),c=0;c<b.length;c++)a+=b[c];return a/b.length}});Object.defineProperty(THREE,"AudioContext",{get:function(){var a;return function(){void 0===a&&(a=new (window.AudioContext||window.webkitAudioContext));return a}}()});
	THREE.PositionalAudio=function(a){THREE.Audio.call(this,a);this.panner=this.context.createPanner();this.panner.connect(this.gain)};
	THREE.PositionalAudio.prototype=Object.assign(Object.create(THREE.Audio.prototype),{constructor:THREE.PositionalAudio,getOutput:function(){return this.panner},getRefDistance:function(){return this.panner.refDistance},setRefDistance:function(a){this.panner.refDistance=a},getRolloffFactor:function(){return this.panner.rolloffFactor},setRolloffFactor:function(a){this.panner.rolloffFactor=a},getDistanceModel:function(){return this.panner.distanceModel},setDistanceModel:function(a){this.panner.distanceModel=
	a},getMaxDistance:function(){return this.panner.maxDistance},setMaxDistance:function(a){this.panner.maxDistance=a},updateMatrixWorld:function(){var a=new THREE.Vector3;return function(b){THREE.Object3D.prototype.updateMatrixWorld.call(this,b);a.setFromMatrixPosition(this.matrixWorld);this.panner.setPosition(a.x,a.y,a.z)}}()});
	THREE.AudioListener=function(){THREE.Object3D.call(this);this.type="AudioListener";this.context=THREE.AudioContext;this.gain=this.context.createGain();this.gain.connect(this.context.destination);this.filter=null};
	THREE.AudioListener.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.AudioListener,getInput:function(){return this.gain},removeFilter:function(){null!==this.filter&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null)},getFilter:function(){return this.filter},setFilter:function(a){null!==this.filter?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):
	this.gain.disconnect(this.context.destination);this.filter=a;this.gain.connect(this.filter);this.filter.connect(this.context.destination)},getMasterVolume:function(){return this.gain.gain.value},setMasterVolume:function(a){this.gain.gain.value=a},updateMatrixWorld:function(){var a=new THREE.Vector3,b=new THREE.Quaternion,c=new THREE.Vector3,d=new THREE.Vector3;return function(e){THREE.Object3D.prototype.updateMatrixWorld.call(this,e);e=this.context.listener;var f=this.up;this.matrixWorld.decompose(a,
	b,c);d.set(0,0,-1).applyQuaternion(b);e.setPosition(a.x,a.y,a.z);e.setOrientation(d.x,d.y,d.z,f.x,f.y,f.z)}}()});THREE.Camera=function(){THREE.Object3D.call(this);this.type="Camera";this.matrixWorldInverse=new THREE.Matrix4;this.projectionMatrix=new THREE.Matrix4};THREE.Camera.prototype=Object.create(THREE.Object3D.prototype);THREE.Camera.prototype.constructor=THREE.Camera;
	THREE.Camera.prototype.getWorldDirection=function(){var a=new THREE.Quaternion;return function(b){b=b||new THREE.Vector3;this.getWorldQuaternion(a);return b.set(0,0,-1).applyQuaternion(a)}}();THREE.Camera.prototype.lookAt=function(){var a=new THREE.Matrix4;return function(b){a.lookAt(this.position,b,this.up);this.quaternion.setFromRotationMatrix(a)}}();THREE.Camera.prototype.clone=function(){return(new this.constructor).copy(this)};
	THREE.Camera.prototype.copy=function(a){THREE.Object3D.prototype.copy.call(this,a);this.matrixWorldInverse.copy(a.matrixWorldInverse);this.projectionMatrix.copy(a.projectionMatrix);return this};
	THREE.CubeCamera=function(a,b,c){THREE.Object3D.call(this);this.type="CubeCamera";var d=new THREE.PerspectiveCamera(90,1,a,b);d.up.set(0,-1,0);d.lookAt(new THREE.Vector3(1,0,0));this.add(d);var e=new THREE.PerspectiveCamera(90,1,a,b);e.up.set(0,-1,0);e.lookAt(new THREE.Vector3(-1,0,0));this.add(e);var f=new THREE.PerspectiveCamera(90,1,a,b);f.up.set(0,0,1);f.lookAt(new THREE.Vector3(0,1,0));this.add(f);var g=new THREE.PerspectiveCamera(90,1,a,b);g.up.set(0,0,-1);g.lookAt(new THREE.Vector3(0,-1,0));
	this.add(g);var h=new THREE.PerspectiveCamera(90,1,a,b);h.up.set(0,-1,0);h.lookAt(new THREE.Vector3(0,0,1));this.add(h);var k=new THREE.PerspectiveCamera(90,1,a,b);k.up.set(0,-1,0);k.lookAt(new THREE.Vector3(0,0,-1));this.add(k);this.renderTarget=new THREE.WebGLRenderTargetCube(c,c,{format:THREE.RGBFormat,magFilter:THREE.LinearFilter,minFilter:THREE.LinearFilter});this.updateCubeMap=function(a,b){null===this.parent&&this.updateMatrixWorld();var c=this.renderTarget,m=c.texture.generateMipmaps;c.texture.generateMipmaps=
	!1;c.activeCubeFace=0;a.render(b,d,c);c.activeCubeFace=1;a.render(b,e,c);c.activeCubeFace=2;a.render(b,f,c);c.activeCubeFace=3;a.render(b,g,c);c.activeCubeFace=4;a.render(b,h,c);c.texture.generateMipmaps=m;c.activeCubeFace=5;a.render(b,k,c);a.setRenderTarget(null)}};THREE.CubeCamera.prototype=Object.create(THREE.Object3D.prototype);THREE.CubeCamera.prototype.constructor=THREE.CubeCamera;
	THREE.OrthographicCamera=function(a,b,c,d,e,f){THREE.Camera.call(this);this.type="OrthographicCamera";this.zoom=1;this.left=a;this.right=b;this.top=c;this.bottom=d;this.near=void 0!==e?e:.1;this.far=void 0!==f?f:2E3;this.updateProjectionMatrix()};
	THREE.OrthographicCamera.prototype=Object.assign(Object.create(THREE.Camera.prototype),{constructor:THREE.OrthographicCamera,copy:function(a){THREE.Camera.prototype.copy.call(this,a);this.left=a.left;this.right=a.right;this.top=a.top;this.bottom=a.bottom;this.near=a.near;this.far=a.far;this.zoom=a.zoom;return this},updateProjectionMatrix:function(){var a=(this.right-this.left)/(2*this.zoom),b=(this.top-this.bottom)/(2*this.zoom),c=(this.right+this.left)/2,d=(this.top+this.bottom)/2;this.projectionMatrix.makeOrthographic(c-
	a,c+a,d+b,d-b,this.near,this.far)},toJSON:function(a){a=THREE.Object3D.prototype.toJSON.call(this,a);a.object.zoom=this.zoom;a.object.left=this.left;a.object.right=this.right;a.object.top=this.top;a.object.bottom=this.bottom;a.object.near=this.near;a.object.far=this.far;return a}});
	THREE.PerspectiveCamera=function(a,b,c,d){THREE.Camera.call(this);this.type="PerspectiveCamera";this.fov=void 0!==a?a:50;this.zoom=1;this.near=void 0!==c?c:.1;this.far=void 0!==d?d:2E3;this.focus=10;this.aspect=void 0!==b?b:1;this.view=null;this.filmGauge=35;this.filmOffset=0;this.updateProjectionMatrix()};
	THREE.PerspectiveCamera.prototype=Object.assign(Object.create(THREE.Camera.prototype),{constructor:THREE.PerspectiveCamera,copy:function(a){THREE.Camera.prototype.copy.call(this,a);this.fov=a.fov;this.zoom=a.zoom;this.near=a.near;this.far=a.far;this.focus=a.focus;this.aspect=a.aspect;this.view=null===a.view?null:Object.assign({},a.view);this.filmGauge=a.filmGauge;this.filmOffset=a.filmOffset;return this},setFocalLength:function(a){a=.5*this.getFilmHeight()/a;this.fov=2*THREE.Math.RAD2DEG*Math.atan(a);
	this.updateProjectionMatrix()},getFocalLength:function(){var a=Math.tan(.5*THREE.Math.DEG2RAD*this.fov);return.5*this.getFilmHeight()/a},getEffectiveFOV:function(){return 2*THREE.Math.RAD2DEG*Math.atan(Math.tan(.5*THREE.Math.DEG2RAD*this.fov)/this.zoom)},getFilmWidth:function(){return this.filmGauge*Math.min(this.aspect,1)},getFilmHeight:function(){return this.filmGauge/Math.max(this.aspect,1)},setViewOffset:function(a,b,c,d,e,f){this.aspect=a/b;this.view={fullWidth:a,fullHeight:b,offsetX:c,offsetY:d,
	width:e,height:f};this.updateProjectionMatrix()},clearViewOffset:function(){this.view=null;this.updateProjectionMatrix()},updateProjectionMatrix:function(){var a=this.near,b=a*Math.tan(.5*THREE.Math.DEG2RAD*this.fov)/this.zoom,c=2*b,d=this.aspect*c,e=-.5*d,f=this.view;if(null!==f)var g=f.fullWidth,h=f.fullHeight,e=e+f.offsetX*d/g,b=b-f.offsetY*c/h,d=f.width/g*d,c=f.height/h*c;f=this.filmOffset;0!==f&&(e+=a*f/this.getFilmWidth());this.projectionMatrix.makeFrustum(e,e+d,b-c,b,a,this.far)},toJSON:function(a){a=
	THREE.Object3D.prototype.toJSON.call(this,a);a.object.fov=this.fov;a.object.zoom=this.zoom;a.object.near=this.near;a.object.far=this.far;a.object.focus=this.focus;a.object.aspect=this.aspect;null!==this.view&&(a.object.view=Object.assign({},this.view));a.object.filmGauge=this.filmGauge;a.object.filmOffset=this.filmOffset;return a}});
	THREE.StereoCamera=function(){this.type="StereoCamera";this.aspect=1;this.cameraL=new THREE.PerspectiveCamera;this.cameraL.layers.enable(1);this.cameraL.matrixAutoUpdate=!1;this.cameraR=new THREE.PerspectiveCamera;this.cameraR.layers.enable(2);this.cameraR.matrixAutoUpdate=!1};
	Object.assign(THREE.StereoCamera.prototype,{update:function(){var a,b,c,d,e,f=new THREE.Matrix4,g=new THREE.Matrix4;return function(h){if(a!==h.focus||b!==h.fov||c!==h.aspect*this.aspect||d!==h.near||e!==h.far){a=h.focus;b=h.fov;c=h.aspect*this.aspect;d=h.near;e=h.far;var k=h.projectionMatrix.clone(),l=.032*d/a,n=d*Math.tan(THREE.Math.DEG2RAD*b*.5),p,m;g.elements[12]=-.032;f.elements[12]=.032;p=-n*c+l;m=n*c+l;k.elements[0]=2*d/(m-p);k.elements[8]=(m+p)/(m-p);this.cameraL.projectionMatrix.copy(k);
	p=-n*c-l;m=n*c-l;k.elements[0]=2*d/(m-p);k.elements[8]=(m+p)/(m-p);this.cameraR.projectionMatrix.copy(k)}this.cameraL.matrixWorld.copy(h.matrixWorld).multiply(g);this.cameraR.matrixWorld.copy(h.matrixWorld).multiply(f)}}()});THREE.Light=function(a,b){THREE.Object3D.call(this);this.type="Light";this.color=new THREE.Color(a);this.intensity=void 0!==b?b:1;this.receiveShadow=void 0};
	THREE.Light.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Light,copy:function(a){THREE.Object3D.prototype.copy.call(this,a);this.color.copy(a.color);this.intensity=a.intensity;return this},toJSON:function(a){a=THREE.Object3D.prototype.toJSON.call(this,a);a.object.color=this.color.getHex();a.object.intensity=this.intensity;void 0!==this.groundColor&&(a.object.groundColor=this.groundColor.getHex());void 0!==this.distance&&(a.object.distance=this.distance);void 0!==
	this.angle&&(a.object.angle=this.angle);void 0!==this.decay&&(a.object.decay=this.decay);void 0!==this.penumbra&&(a.object.penumbra=this.penumbra);return a}});THREE.LightShadow=function(a){this.camera=a;this.bias=0;this.radius=1;this.mapSize=new THREE.Vector2(512,512);this.map=null;this.matrix=new THREE.Matrix4};Object.assign(THREE.LightShadow.prototype,{copy:function(a){this.camera=a.camera.clone();this.bias=a.bias;this.radius=a.radius;this.mapSize.copy(a.mapSize);return this},clone:function(){return(new this.constructor).copy(this)}});
	THREE.AmbientLight=function(a,b){THREE.Light.call(this,a,b);this.type="AmbientLight";this.castShadow=void 0};THREE.AmbientLight.prototype=Object.assign(Object.create(THREE.Light.prototype),{constructor:THREE.AmbientLight});THREE.DirectionalLight=function(a,b){THREE.Light.call(this,a,b);this.type="DirectionalLight";this.position.set(0,1,0);this.updateMatrix();this.target=new THREE.Object3D;this.shadow=new THREE.DirectionalLightShadow};
	THREE.DirectionalLight.prototype=Object.assign(Object.create(THREE.Light.prototype),{constructor:THREE.DirectionalLight,copy:function(a){THREE.Light.prototype.copy.call(this,a);this.target=a.target.clone();this.shadow=a.shadow.clone();return this}});THREE.DirectionalLightShadow=function(a){THREE.LightShadow.call(this,new THREE.OrthographicCamera(-5,5,5,-5,.5,500))};THREE.DirectionalLightShadow.prototype=Object.assign(Object.create(THREE.LightShadow.prototype),{constructor:THREE.DirectionalLightShadow});
	THREE.HemisphereLight=function(a,b,c){THREE.Light.call(this,a,c);this.type="HemisphereLight";this.castShadow=void 0;this.position.set(0,1,0);this.updateMatrix();this.groundColor=new THREE.Color(b)};THREE.HemisphereLight.prototype=Object.assign(Object.create(THREE.Light.prototype),{constructor:THREE.HemisphereLight,copy:function(a){THREE.Light.prototype.copy.call(this,a);this.groundColor.copy(a.groundColor);return this}});
	THREE.PointLight=function(a,b,c,d){THREE.Light.call(this,a,b);this.type="PointLight";Object.defineProperty(this,"power",{get:function(){return 4*this.intensity*Math.PI},set:function(a){this.intensity=a/(4*Math.PI)}});this.distance=void 0!==c?c:0;this.decay=void 0!==d?d:1;this.shadow=new THREE.LightShadow(new THREE.PerspectiveCamera(90,1,.5,500))};
	THREE.PointLight.prototype=Object.assign(Object.create(THREE.Light.prototype),{constructor:THREE.PointLight,copy:function(a){THREE.Light.prototype.copy.call(this,a);this.distance=a.distance;this.decay=a.decay;this.shadow=a.shadow.clone();return this}});
	THREE.SpotLight=function(a,b,c,d,e,f){THREE.Light.call(this,a,b);this.type="SpotLight";this.position.set(0,1,0);this.updateMatrix();this.target=new THREE.Object3D;Object.defineProperty(this,"power",{get:function(){return this.intensity*Math.PI},set:function(a){this.intensity=a/Math.PI}});this.distance=void 0!==c?c:0;this.angle=void 0!==d?d:Math.PI/3;this.penumbra=void 0!==e?e:0;this.decay=void 0!==f?f:1;this.shadow=new THREE.SpotLightShadow};
	THREE.SpotLight.prototype=Object.assign(Object.create(THREE.Light.prototype),{constructor:THREE.SpotLight,copy:function(a){THREE.Light.prototype.copy.call(this,a);this.distance=a.distance;this.angle=a.angle;this.penumbra=a.penumbra;this.decay=a.decay;this.target=a.target.clone();this.shadow=a.shadow.clone();return this}});THREE.SpotLightShadow=function(){THREE.LightShadow.call(this,new THREE.PerspectiveCamera(50,1,.5,500))};
	THREE.SpotLightShadow.prototype=Object.assign(Object.create(THREE.LightShadow.prototype),{constructor:THREE.SpotLightShadow,update:function(a){var b=2*THREE.Math.RAD2DEG*a.angle,c=this.mapSize.width/this.mapSize.height;a=a.distance||500;var d=this.camera;if(b!==d.fov||c!==d.aspect||a!==d.far)d.fov=b,d.aspect=c,d.far=a,d.updateProjectionMatrix()}});THREE.AudioLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};
	THREE.AudioLoader.prototype={constructor:THREE.AudioLoader,load:function(a,b,c,d){var e=new THREE.XHRLoader(this.manager);e.setResponseType("arraybuffer");e.load(a,function(a){THREE.AudioContext.decodeAudioData(a,function(a){b(a)})},c,d)}};THREE.Cache={enabled:!1,files:{},add:function(a,b){!1!==this.enabled&&(this.files[a]=b)},get:function(a){if(!1!==this.enabled)return this.files[a]},remove:function(a){delete this.files[a]},clear:function(){this.files={}}};
	THREE.Loader=function(){this.onLoadStart=function(){};this.onLoadProgress=function(){};this.onLoadComplete=function(){}};
	THREE.Loader.prototype={constructor:THREE.Loader,crossOrigin:void 0,extractUrlBase:function(a){a=a.split("/");if(1===a.length)return"./";a.pop();return a.join("/")+"/"},initMaterials:function(a,b,c){for(var d=[],e=0;e<a.length;++e)d[e]=this.createMaterial(a[e],b,c);return d},createMaterial:function(){var a,b,c;return function(d,e,f){function g(a,c,d,g,k){a=e+a;var l=THREE.Loader.Handlers.get(a);null!==l?a=l.load(a):(b.setCrossOrigin(f),a=b.load(a));void 0!==c&&(a.repeat.fromArray(c),1!==c[0]&&(a.wrapS=
	THREE.RepeatWrapping),1!==c[1]&&(a.wrapT=THREE.RepeatWrapping));void 0!==d&&a.offset.fromArray(d);void 0!==g&&("repeat"===g[0]&&(a.wrapS=THREE.RepeatWrapping),"mirror"===g[0]&&(a.wrapS=THREE.MirroredRepeatWrapping),"repeat"===g[1]&&(a.wrapT=THREE.RepeatWrapping),"mirror"===g[1]&&(a.wrapT=THREE.MirroredRepeatWrapping));void 0!==k&&(a.anisotropy=k);c=THREE.Math.generateUUID();h[c]=a;return c}void 0===a&&(a=new THREE.Color);void 0===b&&(b=new THREE.TextureLoader);void 0===c&&(c=new THREE.MaterialLoader);
	var h={},k={uuid:THREE.Math.generateUUID(),type:"MeshLambertMaterial"},l;for(l in d){var n=d[l];switch(l){case "DbgColor":case "DbgIndex":case "opticalDensity":case "illumination":break;case "DbgName":k.name=n;break;case "blending":k.blending=THREE[n];break;case "colorAmbient":case "mapAmbient":console.warn("THREE.Loader.createMaterial:",l,"is no longer supported.");break;case "colorDiffuse":k.color=a.fromArray(n).getHex();break;case "colorSpecular":k.specular=a.fromArray(n).getHex();break;case "colorEmissive":k.emissive=
	a.fromArray(n).getHex();break;case "specularCoef":k.shininess=n;break;case "shading":"basic"===n.toLowerCase()&&(k.type="MeshBasicMaterial");"phong"===n.toLowerCase()&&(k.type="MeshPhongMaterial");break;case "mapDiffuse":k.map=g(n,d.mapDiffuseRepeat,d.mapDiffuseOffset,d.mapDiffuseWrap,d.mapDiffuseAnisotropy);break;case "mapDiffuseRepeat":case "mapDiffuseOffset":case "mapDiffuseWrap":case "mapDiffuseAnisotropy":break;case "mapLight":k.lightMap=g(n,d.mapLightRepeat,d.mapLightOffset,d.mapLightWrap,d.mapLightAnisotropy);
	break;case "mapLightRepeat":case "mapLightOffset":case "mapLightWrap":case "mapLightAnisotropy":break;case "mapAO":k.aoMap=g(n,d.mapAORepeat,d.mapAOOffset,d.mapAOWrap,d.mapAOAnisotropy);break;case "mapAORepeat":case "mapAOOffset":case "mapAOWrap":case "mapAOAnisotropy":break;case "mapBump":k.bumpMap=g(n,d.mapBumpRepeat,d.mapBumpOffset,d.mapBumpWrap,d.mapBumpAnisotropy);break;case "mapBumpScale":k.bumpScale=n;break;case "mapBumpRepeat":case "mapBumpOffset":case "mapBumpWrap":case "mapBumpAnisotropy":break;
	case "mapNormal":k.normalMap=g(n,d.mapNormalRepeat,d.mapNormalOffset,d.mapNormalWrap,d.mapNormalAnisotropy);break;case "mapNormalFactor":k.normalScale=[n,n];break;case "mapNormalRepeat":case "mapNormalOffset":case "mapNormalWrap":case "mapNormalAnisotropy":break;case "mapSpecular":k.specularMap=g(n,d.mapSpecularRepeat,d.mapSpecularOffset,d.mapSpecularWrap,d.mapSpecularAnisotropy);break;case "mapSpecularRepeat":case "mapSpecularOffset":case "mapSpecularWrap":case "mapSpecularAnisotropy":break;case "mapAlpha":k.alphaMap=
	g(n,d.mapAlphaRepeat,d.mapAlphaOffset,d.mapAlphaWrap,d.mapAlphaAnisotropy);break;case "mapAlphaRepeat":case "mapAlphaOffset":case "mapAlphaWrap":case "mapAlphaAnisotropy":break;case "flipSided":k.side=THREE.BackSide;break;case "doubleSided":k.side=THREE.DoubleSide;break;case "transparency":console.warn("THREE.Loader.createMaterial: transparency has been renamed to opacity");k.opacity=n;break;case "depthTest":case "depthWrite":case "colorWrite":case "opacity":case "reflectivity":case "transparent":case "visible":case "wireframe":k[l]=
	n;break;case "vertexColors":!0===n&&(k.vertexColors=THREE.VertexColors);"face"===n&&(k.vertexColors=THREE.FaceColors);break;default:console.error("THREE.Loader.createMaterial: Unsupported",l,n)}}"MeshBasicMaterial"===k.type&&delete k.emissive;"MeshPhongMaterial"!==k.type&&delete k.specular;1>k.opacity&&(k.transparent=!0);c.setTextures(h);return c.parse(k)}}()};
	THREE.Loader.Handlers={handlers:[],add:function(a,b){this.handlers.push(a,b)},get:function(a){for(var b=this.handlers,c=0,d=b.length;c<d;c+=2){var e=b[c+1];if(b[c].test(a))return e}return null}};THREE.XHRLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};
	THREE.XHRLoader.prototype={constructor:THREE.XHRLoader,load:function(a,b,c,d){void 0!==this.path&&(a=this.path+a);var e=this,f=THREE.Cache.get(a);if(void 0!==f)return b&&setTimeout(function(){b(f)},0),f;var g=new XMLHttpRequest;g.overrideMimeType("text/plain");g.open("GET",a,!0);g.addEventListener("load",function(c){var f=c.target.response;THREE.Cache.add(a,f);200===this.status?(b&&b(f),e.manager.itemEnd(a)):0===this.status?(console.warn("THREE.XHRLoader: HTTP Status 0 received."),b&&b(f),e.manager.itemEnd(a)):
	(d&&d(c),e.manager.itemError(a))},!1);void 0!==c&&g.addEventListener("progress",function(a){c(a)},!1);g.addEventListener("error",function(b){d&&d(b);e.manager.itemError(a)},!1);void 0!==this.responseType&&(g.responseType=this.responseType);void 0!==this.withCredentials&&(g.withCredentials=this.withCredentials);g.send(null);e.manager.itemStart(a);return g},setPath:function(a){this.path=a},setResponseType:function(a){this.responseType=a},setWithCredentials:function(a){this.withCredentials=a}};
	THREE.FontLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};THREE.FontLoader.prototype={constructor:THREE.FontLoader,load:function(a,b,c,d){var e=this;(new THREE.XHRLoader(this.manager)).load(a,function(a){var c;try{c=JSON.parse(a)}catch(d){console.warn("THREE.FontLoader: typeface.js support is being deprecated. Use typeface.json instead."),c=JSON.parse(a.substring(65,a.length-2))}a=e.parse(c);b&&b(a)},c,d)},parse:function(a){return new THREE.Font(a)}};
	THREE.ImageLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};
	THREE.ImageLoader.prototype={constructor:THREE.ImageLoader,load:function(a,b,c,d){void 0!==this.path&&(a=this.path+a);var e=this,f=THREE.Cache.get(a);if(void 0!==f)return e.manager.itemStart(a),b?setTimeout(function(){b(f);e.manager.itemEnd(a)},0):e.manager.itemEnd(a),f;var g=document.createElement("img");g.addEventListener("load",function(c){THREE.Cache.add(a,this);b&&b(this);e.manager.itemEnd(a)},!1);void 0!==c&&g.addEventListener("progress",function(a){c(a)},!1);g.addEventListener("error",function(b){d&&
	d(b);e.manager.itemError(a)},!1);void 0!==this.crossOrigin&&(g.crossOrigin=this.crossOrigin);e.manager.itemStart(a);g.src=a;return g},setCrossOrigin:function(a){this.crossOrigin=a},setPath:function(a){this.path=a}};THREE.JSONLoader=function(a){"boolean"===typeof a&&(console.warn("THREE.JSONLoader: showStatus parameter has been removed from constructor."),a=void 0);this.manager=void 0!==a?a:THREE.DefaultLoadingManager;this.withCredentials=!1};
	THREE.JSONLoader.prototype={constructor:THREE.JSONLoader,get statusDomElement(){void 0===this._statusDomElement&&(this._statusDomElement=document.createElement("div"));console.warn("THREE.JSONLoader: .statusDomElement has been removed.");return this._statusDomElement},load:function(a,b,c,d){var e=this,f=this.texturePath&&"string"===typeof this.texturePath?this.texturePath:THREE.Loader.prototype.extractUrlBase(a),g=new THREE.XHRLoader(this.manager);g.setWithCredentials(this.withCredentials);g.load(a,
	function(c){c=JSON.parse(c);var d=c.metadata;if(void 0!==d&&(d=d.type,void 0!==d)){if("object"===d.toLowerCase()){console.error("THREE.JSONLoader: "+a+" should be loaded with THREE.ObjectLoader instead.");return}if("scene"===d.toLowerCase()){console.error("THREE.JSONLoader: "+a+" should be loaded with THREE.SceneLoader instead.");return}}c=e.parse(c,f);b(c.geometry,c.materials)},c,d)},setTexturePath:function(a){this.texturePath=a},parse:function(a,b){var c=new THREE.Geometry,d=void 0!==a.scale?1/
	a.scale:1;(function(b){var d,g,h,k,l,n,p,m,q,r,s,u,x,v=a.faces;n=a.vertices;var C=a.normals,w=a.colors,D=0;if(void 0!==a.uvs){for(d=0;d<a.uvs.length;d++)a.uvs[d].length&&D++;for(d=0;d<D;d++)c.faceVertexUvs[d]=[]}k=0;for(l=n.length;k<l;)d=new THREE.Vector3,d.x=n[k++]*b,d.y=n[k++]*b,d.z=n[k++]*b,c.vertices.push(d);k=0;for(l=v.length;k<l;)if(b=v[k++],q=b&1,h=b&2,d=b&8,p=b&16,r=b&32,n=b&64,b&=128,q){q=new THREE.Face3;q.a=v[k];q.b=v[k+1];q.c=v[k+3];s=new THREE.Face3;s.a=v[k+1];s.b=v[k+2];s.c=v[k+3];k+=
	4;h&&(h=v[k++],q.materialIndex=h,s.materialIndex=h);h=c.faces.length;if(d)for(d=0;d<D;d++)for(u=a.uvs[d],c.faceVertexUvs[d][h]=[],c.faceVertexUvs[d][h+1]=[],g=0;4>g;g++)m=v[k++],x=u[2*m],m=u[2*m+1],x=new THREE.Vector2(x,m),2!==g&&c.faceVertexUvs[d][h].push(x),0!==g&&c.faceVertexUvs[d][h+1].push(x);p&&(p=3*v[k++],q.normal.set(C[p++],C[p++],C[p]),s.normal.copy(q.normal));if(r)for(d=0;4>d;d++)p=3*v[k++],r=new THREE.Vector3(C[p++],C[p++],C[p]),2!==d&&q.vertexNormals.push(r),0!==d&&s.vertexNormals.push(r);
	n&&(n=v[k++],n=w[n],q.color.setHex(n),s.color.setHex(n));if(b)for(d=0;4>d;d++)n=v[k++],n=w[n],2!==d&&q.vertexColors.push(new THREE.Color(n)),0!==d&&s.vertexColors.push(new THREE.Color(n));c.faces.push(q);c.faces.push(s)}else{q=new THREE.Face3;q.a=v[k++];q.b=v[k++];q.c=v[k++];h&&(h=v[k++],q.materialIndex=h);h=c.faces.length;if(d)for(d=0;d<D;d++)for(u=a.uvs[d],c.faceVertexUvs[d][h]=[],g=0;3>g;g++)m=v[k++],x=u[2*m],m=u[2*m+1],x=new THREE.Vector2(x,m),c.faceVertexUvs[d][h].push(x);p&&(p=3*v[k++],q.normal.set(C[p++],
	C[p++],C[p]));if(r)for(d=0;3>d;d++)p=3*v[k++],r=new THREE.Vector3(C[p++],C[p++],C[p]),q.vertexNormals.push(r);n&&(n=v[k++],q.color.setHex(w[n]));if(b)for(d=0;3>d;d++)n=v[k++],q.vertexColors.push(new THREE.Color(w[n]));c.faces.push(q)}})(d);(function(){var b=void 0!==a.influencesPerVertex?a.influencesPerVertex:2;if(a.skinWeights)for(var d=0,g=a.skinWeights.length;d<g;d+=b)c.skinWeights.push(new THREE.Vector4(a.skinWeights[d],1<b?a.skinWeights[d+1]:0,2<b?a.skinWeights[d+2]:0,3<b?a.skinWeights[d+3]:
	0));if(a.skinIndices)for(d=0,g=a.skinIndices.length;d<g;d+=b)c.skinIndices.push(new THREE.Vector4(a.skinIndices[d],1<b?a.skinIndices[d+1]:0,2<b?a.skinIndices[d+2]:0,3<b?a.skinIndices[d+3]:0));c.bones=a.bones;c.bones&&0<c.bones.length&&(c.skinWeights.length!==c.skinIndices.length||c.skinIndices.length!==c.vertices.length)&&console.warn("When skinning, number of vertices ("+c.vertices.length+"), skinIndices ("+c.skinIndices.length+"), and skinWeights ("+c.skinWeights.length+") should match.")})();(function(b){if(void 0!==
	a.morphTargets)for(var d=0,g=a.morphTargets.length;d<g;d++){c.morphTargets[d]={};c.morphTargets[d].name=a.morphTargets[d].name;c.morphTargets[d].vertices=[];for(var h=c.morphTargets[d].vertices,k=a.morphTargets[d].vertices,l=0,n=k.length;l<n;l+=3){var p=new THREE.Vector3;p.x=k[l]*b;p.y=k[l+1]*b;p.z=k[l+2]*b;h.push(p)}}if(void 0!==a.morphColors&&0<a.morphColors.length)for(console.warn('THREE.JSONLoader: "morphColors" no longer supported. Using them as face colors.'),b=c.faces,h=a.morphColors[0].colors,
	d=0,g=b.length;d<g;d++)b[d].color.fromArray(h,3*d)})(d);(function(){var b=[],d=[];void 0!==a.animation&&d.push(a.animation);void 0!==a.animations&&(a.animations.length?d=d.concat(a.animations):d.push(a.animations));for(var g=0;g<d.length;g++){var h=THREE.AnimationClip.parseAnimation(d[g],c.bones);h&&b.push(h)}c.morphTargets&&(d=THREE.AnimationClip.CreateClipsFromMorphTargetSequences(c.morphTargets,10),b=b.concat(d));0<b.length&&(c.animations=b)})();c.computeFaceNormals();c.computeBoundingSphere();
	if(void 0===a.materials||0===a.materials.length)return{geometry:c};d=THREE.Loader.prototype.initMaterials(a.materials,b,this.crossOrigin);return{geometry:c,materials:d}}};
	THREE.LoadingManager=function(a,b,c){var d=this,e=!1,f=0,g=0;this.onStart=void 0;this.onLoad=a;this.onProgress=b;this.onError=c;this.itemStart=function(a){g++;if(!1===e&&void 0!==d.onStart)d.onStart(a,f,g);e=!0};this.itemEnd=function(a){f++;if(void 0!==d.onProgress)d.onProgress(a,f,g);if(f===g&&(e=!1,void 0!==d.onLoad))d.onLoad()};this.itemError=function(a){if(void 0!==d.onError)d.onError(a)}};THREE.DefaultLoadingManager=new THREE.LoadingManager;
	THREE.BufferGeometryLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};
	THREE.BufferGeometryLoader.prototype={constructor:THREE.BufferGeometryLoader,load:function(a,b,c,d){var e=this;(new THREE.XHRLoader(e.manager)).load(a,function(a){b(e.parse(JSON.parse(a)))},c,d)},parse:function(a){var b=new THREE.BufferGeometry,c=a.data.index,d={Int8Array:Int8Array,Uint8Array:Uint8Array,Uint8ClampedArray:Uint8ClampedArray,Int16Array:Int16Array,Uint16Array:Uint16Array,Int32Array:Int32Array,Uint32Array:Uint32Array,Float32Array:Float32Array,Float64Array:Float64Array};void 0!==c&&(c=
	new d[c.type](c.array),b.setIndex(new THREE.BufferAttribute(c,1)));var e=a.data.attributes,f;for(f in e){var g=e[f],c=new d[g.type](g.array);b.addAttribute(f,new THREE.BufferAttribute(c,g.itemSize,g.normalized))}d=a.data.groups||a.data.drawcalls||a.data.offsets;if(void 0!==d)for(f=0,c=d.length;f!==c;++f)e=d[f],b.addGroup(e.start,e.count,e.materialIndex);a=a.data.boundingSphere;void 0!==a&&(d=new THREE.Vector3,void 0!==a.center&&d.fromArray(a.center),b.boundingSphere=new THREE.Sphere(d,a.radius));
	return b}};THREE.MaterialLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager;this.textures={}};
	THREE.MaterialLoader.prototype={constructor:THREE.MaterialLoader,load:function(a,b,c,d){var e=this;(new THREE.XHRLoader(e.manager)).load(a,function(a){b(e.parse(JSON.parse(a)))},c,d)},setTextures:function(a){this.textures=a},getTexture:function(a){var b=this.textures;void 0===b[a]&&console.warn("THREE.MaterialLoader: Undefined texture",a);return b[a]},parse:function(a){var b=new THREE[a.type];void 0!==a.uuid&&(b.uuid=a.uuid);void 0!==a.name&&(b.name=a.name);void 0!==a.color&&b.color.setHex(a.color);
	void 0!==a.roughness&&(b.roughness=a.roughness);void 0!==a.metalness&&(b.metalness=a.metalness);void 0!==a.emissive&&b.emissive.setHex(a.emissive);void 0!==a.specular&&b.specular.setHex(a.specular);void 0!==a.shininess&&(b.shininess=a.shininess);void 0!==a.uniforms&&(b.uniforms=a.uniforms);void 0!==a.vertexShader&&(b.vertexShader=a.vertexShader);void 0!==a.fragmentShader&&(b.fragmentShader=a.fragmentShader);void 0!==a.vertexColors&&(b.vertexColors=a.vertexColors);void 0!==a.shading&&(b.shading=a.shading);
	void 0!==a.blending&&(b.blending=a.blending);void 0!==a.side&&(b.side=a.side);void 0!==a.opacity&&(b.opacity=a.opacity);void 0!==a.transparent&&(b.transparent=a.transparent);void 0!==a.alphaTest&&(b.alphaTest=a.alphaTest);void 0!==a.depthTest&&(b.depthTest=a.depthTest);void 0!==a.depthWrite&&(b.depthWrite=a.depthWrite);void 0!==a.colorWrite&&(b.colorWrite=a.colorWrite);void 0!==a.wireframe&&(b.wireframe=a.wireframe);void 0!==a.wireframeLinewidth&&(b.wireframeLinewidth=a.wireframeLinewidth);void 0!==
	a.size&&(b.size=a.size);void 0!==a.sizeAttenuation&&(b.sizeAttenuation=a.sizeAttenuation);void 0!==a.map&&(b.map=this.getTexture(a.map));void 0!==a.alphaMap&&(b.alphaMap=this.getTexture(a.alphaMap),b.transparent=!0);void 0!==a.bumpMap&&(b.bumpMap=this.getTexture(a.bumpMap));void 0!==a.bumpScale&&(b.bumpScale=a.bumpScale);void 0!==a.normalMap&&(b.normalMap=this.getTexture(a.normalMap));if(void 0!==a.normalScale){var c=a.normalScale;!1===Array.isArray(c)&&(c=[c,c]);b.normalScale=(new THREE.Vector2).fromArray(c)}void 0!==
	a.displacementMap&&(b.displacementMap=this.getTexture(a.displacementMap));void 0!==a.displacementScale&&(b.displacementScale=a.displacementScale);void 0!==a.displacementBias&&(b.displacementBias=a.displacementBias);void 0!==a.roughnessMap&&(b.roughnessMap=this.getTexture(a.roughnessMap));void 0!==a.metalnessMap&&(b.metalnessMap=this.getTexture(a.metalnessMap));void 0!==a.emissiveMap&&(b.emissiveMap=this.getTexture(a.emissiveMap));void 0!==a.emissiveIntensity&&(b.emissiveIntensity=a.emissiveIntensity);
	void 0!==a.specularMap&&(b.specularMap=this.getTexture(a.specularMap));void 0!==a.envMap&&(b.envMap=this.getTexture(a.envMap),b.combine=THREE.MultiplyOperation);a.reflectivity&&(b.reflectivity=a.reflectivity);void 0!==a.lightMap&&(b.lightMap=this.getTexture(a.lightMap));void 0!==a.lightMapIntensity&&(b.lightMapIntensity=a.lightMapIntensity);void 0!==a.aoMap&&(b.aoMap=this.getTexture(a.aoMap));void 0!==a.aoMapIntensity&&(b.aoMapIntensity=a.aoMapIntensity);if(void 0!==a.materials)for(var c=0,d=a.materials.length;c<
	d;c++)b.materials.push(this.parse(a.materials[c]));return b}};THREE.ObjectLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager;this.texturePath=""};
	THREE.ObjectLoader.prototype={constructor:THREE.ObjectLoader,load:function(a,b,c,d){""===this.texturePath&&(this.texturePath=a.substring(0,a.lastIndexOf("/")+1));var e=this;(new THREE.XHRLoader(e.manager)).load(a,function(a){e.parse(JSON.parse(a),b)},c,d)},setTexturePath:function(a){this.texturePath=a},setCrossOrigin:function(a){this.crossOrigin=a},parse:function(a,b){var c=this.parseGeometries(a.geometries),d=this.parseImages(a.images,function(){void 0!==b&&b(e)}),d=this.parseTextures(a.textures,
	d),d=this.parseMaterials(a.materials,d),e=this.parseObject(a.object,c,d);a.animations&&(e.animations=this.parseAnimations(a.animations));void 0!==a.images&&0!==a.images.length||void 0===b||b(e);return e},parseGeometries:function(a){var b={};if(void 0!==a)for(var c=new THREE.JSONLoader,d=new THREE.BufferGeometryLoader,e=0,f=a.length;e<f;e++){var g,h=a[e];switch(h.type){case "PlaneGeometry":case "PlaneBufferGeometry":g=new THREE[h.type](h.width,h.height,h.widthSegments,h.heightSegments);break;case "BoxGeometry":case "BoxBufferGeometry":case "CubeGeometry":g=
	new THREE[h.type](h.width,h.height,h.depth,h.widthSegments,h.heightSegments,h.depthSegments);break;case "CircleGeometry":case "CircleBufferGeometry":g=new THREE[h.type](h.radius,h.segments,h.thetaStart,h.thetaLength);break;case "CylinderGeometry":case "CylinderBufferGeometry":g=new THREE[h.type](h.radiusTop,h.radiusBottom,h.height,h.radialSegments,h.heightSegments,h.openEnded,h.thetaStart,h.thetaLength);break;case "ConeGeometry":case "ConeBufferGeometry":g=new THREE[h.type](h.radius,h.height,h.radialSegments,
	h.heightSegments,h.openEnded,h.thetaStart,h.thetaLength);break;case "SphereGeometry":case "SphereBufferGeometry":g=new THREE[h.type](h.radius,h.widthSegments,h.heightSegments,h.phiStart,h.phiLength,h.thetaStart,h.thetaLength);break;case "DodecahedronGeometry":case "IcosahedronGeometry":case "OctahedronGeometry":case "TetrahedronGeometry":g=new THREE[h.type](h.radius,h.detail);break;case "RingGeometry":case "RingBufferGeometry":g=new THREE[h.type](h.innerRadius,h.outerRadius,h.thetaSegments,h.phiSegments,
	h.thetaStart,h.thetaLength);break;case "TorusGeometry":case "TorusBufferGeometry":g=new THREE[h.type](h.radius,h.tube,h.radialSegments,h.tubularSegments,h.arc);break;case "TorusKnotGeometry":case "TorusKnotBufferGeometry":g=new THREE[h.type](h.radius,h.tube,h.tubularSegments,h.radialSegments,h.p,h.q);break;case "LatheGeometry":case "LatheBufferGeometry":g=new THREE[h.type](h.points,h.segments,h.phiStart,h.phiLength);break;case "BufferGeometry":g=d.parse(h);break;case "Geometry":g=c.parse(h.data,this.texturePath).geometry;
	break;default:console.warn('THREE.ObjectLoader: Unsupported geometry type "'+h.type+'"');continue}g.uuid=h.uuid;void 0!==h.name&&(g.name=h.name);b[h.uuid]=g}return b},parseMaterials:function(a,b){var c={};if(void 0!==a){var d=new THREE.MaterialLoader;d.setTextures(b);for(var e=0,f=a.length;e<f;e++){var g=d.parse(a[e]);c[g.uuid]=g}}return c},parseAnimations:function(a){for(var b=[],c=0;c<a.length;c++){var d=THREE.AnimationClip.parse(a[c]);b.push(d)}return b},parseImages:function(a,b){function c(a){d.manager.itemStart(a);
	return g.load(a,function(){d.manager.itemEnd(a)})}var d=this,e={};if(void 0!==a&&0<a.length){var f=new THREE.LoadingManager(b),g=new THREE.ImageLoader(f);g.setCrossOrigin(this.crossOrigin);for(var f=0,h=a.length;f<h;f++){var k=a[f],l=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(k.url)?k.url:d.texturePath+k.url;e[k.uuid]=c(l)}}return e},parseTextures:function(a,b){function c(a){if("number"===typeof a)return a;console.warn("THREE.ObjectLoader.parseTexture: Constant should be in numeric form.",a);return THREE[a]}
	var d={};if(void 0!==a)for(var e=0,f=a.length;e<f;e++){var g=a[e];void 0===g.image&&console.warn('THREE.ObjectLoader: No "image" specified for',g.uuid);void 0===b[g.image]&&console.warn("THREE.ObjectLoader: Undefined image",g.image);var h=new THREE.Texture(b[g.image]);h.needsUpdate=!0;h.uuid=g.uuid;void 0!==g.name&&(h.name=g.name);void 0!==g.mapping&&(h.mapping=c(g.mapping));void 0!==g.offset&&(h.offset=new THREE.Vector2(g.offset[0],g.offset[1]));void 0!==g.repeat&&(h.repeat=new THREE.Vector2(g.repeat[0],
	g.repeat[1]));void 0!==g.minFilter&&(h.minFilter=c(g.minFilter));void 0!==g.magFilter&&(h.magFilter=c(g.magFilter));void 0!==g.anisotropy&&(h.anisotropy=g.anisotropy);Array.isArray(g.wrap)&&(h.wrapS=c(g.wrap[0]),h.wrapT=c(g.wrap[1]));d[g.uuid]=h}return d},parseObject:function(){var a=new THREE.Matrix4;return function(b,c,d){function e(a){void 0===c[a]&&console.warn("THREE.ObjectLoader: Undefined geometry",a);return c[a]}function f(a){if(void 0!==a)return void 0===d[a]&&console.warn("THREE.ObjectLoader: Undefined material",
	a),d[a]}var g;switch(b.type){case "Scene":g=new THREE.Scene;break;case "PerspectiveCamera":g=new THREE.PerspectiveCamera(b.fov,b.aspect,b.near,b.far);void 0!==b.focus&&(g.focus=b.focus);void 0!==b.zoom&&(g.zoom=b.zoom);void 0!==b.filmGauge&&(g.filmGauge=b.filmGauge);void 0!==b.filmOffset&&(g.filmOffset=b.filmOffset);void 0!==b.view&&(g.view=Object.assign({},b.view));break;case "OrthographicCamera":g=new THREE.OrthographicCamera(b.left,b.right,b.top,b.bottom,b.near,b.far);break;case "AmbientLight":g=
	new THREE.AmbientLight(b.color,b.intensity);break;case "DirectionalLight":g=new THREE.DirectionalLight(b.color,b.intensity);break;case "PointLight":g=new THREE.PointLight(b.color,b.intensity,b.distance,b.decay);break;case "SpotLight":g=new THREE.SpotLight(b.color,b.intensity,b.distance,b.angle,b.penumbra,b.decay);break;case "HemisphereLight":g=new THREE.HemisphereLight(b.color,b.groundColor,b.intensity);break;case "Mesh":g=e(b.geometry);var h=f(b.material);g=g.bones&&0<g.bones.length?new THREE.SkinnedMesh(g,
	h):new THREE.Mesh(g,h);break;case "LOD":g=new THREE.LOD;break;case "Line":g=new THREE.Line(e(b.geometry),f(b.material),b.mode);break;case "PointCloud":case "Points":g=new THREE.Points(e(b.geometry),f(b.material));break;case "Sprite":g=new THREE.Sprite(f(b.material));break;case "Group":g=new THREE.Group;break;default:g=new THREE.Object3D}g.uuid=b.uuid;void 0!==b.name&&(g.name=b.name);void 0!==b.matrix?(a.fromArray(b.matrix),a.decompose(g.position,g.quaternion,g.scale)):(void 0!==b.position&&g.position.fromArray(b.position),
	void 0!==b.rotation&&g.rotation.fromArray(b.rotation),void 0!==b.scale&&g.scale.fromArray(b.scale));void 0!==b.castShadow&&(g.castShadow=b.castShadow);void 0!==b.receiveShadow&&(g.receiveShadow=b.receiveShadow);void 0!==b.visible&&(g.visible=b.visible);void 0!==b.userData&&(g.userData=b.userData);if(void 0!==b.children)for(var k in b.children)g.add(this.parseObject(b.children[k],c,d));if("LOD"===b.type)for(b=b.levels,h=0;h<b.length;h++){var l=b[h];k=g.getObjectByProperty("uuid",l.object);void 0!==
	k&&g.addLevel(k,l.distance)}return g}}()};THREE.TextureLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};THREE.TextureLoader.prototype={constructor:THREE.TextureLoader,load:function(a,b,c,d){var e=new THREE.Texture,f=new THREE.ImageLoader(this.manager);f.setCrossOrigin(this.crossOrigin);f.setPath(this.path);f.load(a,function(a){e.image=a;e.needsUpdate=!0;void 0!==b&&b(e)},c,d);return e},setCrossOrigin:function(a){this.crossOrigin=a},setPath:function(a){this.path=a}};
	THREE.CubeTextureLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager};
	THREE.CubeTextureLoader.prototype={constructor:THREE.CubeTextureLoader,load:function(a,b,c,d){function e(c){g.load(a[c],function(a){f.images[c]=a;h++;6===h&&(f.needsUpdate=!0,b&&b(f))},void 0,d)}var f=new THREE.CubeTexture,g=new THREE.ImageLoader(this.manager);g.setCrossOrigin(this.crossOrigin);g.setPath(this.path);var h=0;for(c=0;c<a.length;++c)e(c);return f},setCrossOrigin:function(a){this.crossOrigin=a},setPath:function(a){this.path=a}};
	THREE.DataTextureLoader=THREE.BinaryTextureLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager;this._parser=null};
	THREE.BinaryTextureLoader.prototype={constructor:THREE.BinaryTextureLoader,load:function(a,b,c,d){var e=this,f=new THREE.DataTexture,g=new THREE.XHRLoader(this.manager);g.setResponseType("arraybuffer");g.load(a,function(a){if(a=e._parser(a))void 0!==a.image?f.image=a.image:void 0!==a.data&&(f.image.width=a.width,f.image.height=a.height,f.image.data=a.data),f.wrapS=void 0!==a.wrapS?a.wrapS:THREE.ClampToEdgeWrapping,f.wrapT=void 0!==a.wrapT?a.wrapT:THREE.ClampToEdgeWrapping,f.magFilter=void 0!==a.magFilter?
	a.magFilter:THREE.LinearFilter,f.minFilter=void 0!==a.minFilter?a.minFilter:THREE.LinearMipMapLinearFilter,f.anisotropy=void 0!==a.anisotropy?a.anisotropy:1,void 0!==a.format&&(f.format=a.format),void 0!==a.type&&(f.type=a.type),void 0!==a.mipmaps&&(f.mipmaps=a.mipmaps),1===a.mipmapCount&&(f.minFilter=THREE.LinearFilter),f.needsUpdate=!0,b&&b(f,a)},c,d);return f}};THREE.CompressedTextureLoader=function(a){this.manager=void 0!==a?a:THREE.DefaultLoadingManager;this._parser=null};
	THREE.CompressedTextureLoader.prototype={constructor:THREE.CompressedTextureLoader,load:function(a,b,c,d){function e(e){k.load(a[e],function(a){a=f._parser(a,!0);g[e]={width:a.width,height:a.height,format:a.format,mipmaps:a.mipmaps};l+=1;6===l&&(1===a.mipmapCount&&(h.minFilter=THREE.LinearFilter),h.format=a.format,h.needsUpdate=!0,b&&b(h))},c,d)}var f=this,g=[],h=new THREE.CompressedTexture;h.image=g;var k=new THREE.XHRLoader(this.manager);k.setPath(this.path);k.setResponseType("arraybuffer");if(Array.isArray(a))for(var l=
	0,n=0,p=a.length;n<p;++n)e(n);else k.load(a,function(a){a=f._parser(a,!0);if(a.isCubemap)for(var c=a.mipmaps.length/a.mipmapCount,d=0;d<c;d++){g[d]={mipmaps:[]};for(var e=0;e<a.mipmapCount;e++)g[d].mipmaps.push(a.mipmaps[d*a.mipmapCount+e]),g[d].format=a.format,g[d].width=a.width,g[d].height=a.height}else h.image.width=a.width,h.image.height=a.height,h.mipmaps=a.mipmaps;1===a.mipmapCount&&(h.minFilter=THREE.LinearFilter);h.format=a.format;h.needsUpdate=!0;b&&b(h)},c,d);return h},setPath:function(a){this.path=
	a}};
	THREE.Material=function(){Object.defineProperty(this,"id",{value:THREE.MaterialIdCount++});this.uuid=THREE.Math.generateUUID();this.name="";this.type="Material";this.lights=this.fog=!0;this.blending=THREE.NormalBlending;this.side=THREE.FrontSide;this.shading=THREE.SmoothShading;this.vertexColors=THREE.NoColors;this.opacity=1;this.transparent=!1;this.blendSrc=THREE.SrcAlphaFactor;this.blendDst=THREE.OneMinusSrcAlphaFactor;this.blendEquation=THREE.AddEquation;this.blendEquationAlpha=this.blendDstAlpha=this.blendSrcAlpha=
	null;this.depthFunc=THREE.LessEqualDepth;this.depthWrite=this.depthTest=!0;this.clippingPlanes=null;this.clipShadows=!1;this.colorWrite=!0;this.precision=null;this.polygonOffset=!1;this.alphaTest=this.polygonOffsetUnits=this.polygonOffsetFactor=0;this.premultipliedAlpha=!1;this.overdraw=0;this._needsUpdate=this.visible=!0};
	THREE.Material.prototype={constructor:THREE.Material,get needsUpdate(){return this._needsUpdate},set needsUpdate(a){!0===a&&this.update();this._needsUpdate=a},setValues:function(a){if(void 0!==a)for(var b in a){var c=a[b];if(void 0===c)console.warn("THREE.Material: '"+b+"' parameter is undefined.");else{var d=this[b];void 0===d?console.warn("THREE."+this.type+": '"+b+"' is not a property of this material."):d instanceof THREE.Color?d.set(c):d instanceof THREE.Vector3&&c instanceof THREE.Vector3?d.copy(c):
	this[b]="overdraw"===b?Number(c):c}}},toJSON:function(a){function b(a){var b=[],c;for(c in a){var d=a[c];delete d.metadata;b.push(d)}return b}var c=void 0===a;c&&(a={textures:{},images:{}});var d={metadata:{version:4.4,type:"Material",generator:"Material.toJSON"}};d.uuid=this.uuid;d.type=this.type;""!==this.name&&(d.name=this.name);this.color instanceof THREE.Color&&(d.color=this.color.getHex());.5!==this.roughness&&(d.roughness=this.roughness);.5!==this.metalness&&(d.metalness=this.metalness);this.emissive instanceof
	THREE.Color&&(d.emissive=this.emissive.getHex());this.specular instanceof THREE.Color&&(d.specular=this.specular.getHex());void 0!==this.shininess&&(d.shininess=this.shininess);this.map instanceof THREE.Texture&&(d.map=this.map.toJSON(a).uuid);this.alphaMap instanceof THREE.Texture&&(d.alphaMap=this.alphaMap.toJSON(a).uuid);this.lightMap instanceof THREE.Texture&&(d.lightMap=this.lightMap.toJSON(a).uuid);this.bumpMap instanceof THREE.Texture&&(d.bumpMap=this.bumpMap.toJSON(a).uuid,d.bumpScale=this.bumpScale);
	this.normalMap instanceof THREE.Texture&&(d.normalMap=this.normalMap.toJSON(a).uuid,d.normalScale=this.normalScale.toArray());this.displacementMap instanceof THREE.Texture&&(d.displacementMap=this.displacementMap.toJSON(a).uuid,d.displacementScale=this.displacementScale,d.displacementBias=this.displacementBias);this.roughnessMap instanceof THREE.Texture&&(d.roughnessMap=this.roughnessMap.toJSON(a).uuid);this.metalnessMap instanceof THREE.Texture&&(d.metalnessMap=this.metalnessMap.toJSON(a).uuid);
	this.emissiveMap instanceof THREE.Texture&&(d.emissiveMap=this.emissiveMap.toJSON(a).uuid);this.specularMap instanceof THREE.Texture&&(d.specularMap=this.specularMap.toJSON(a).uuid);this.envMap instanceof THREE.Texture&&(d.envMap=this.envMap.toJSON(a).uuid,d.reflectivity=this.reflectivity);void 0!==this.size&&(d.size=this.size);void 0!==this.sizeAttenuation&&(d.sizeAttenuation=this.sizeAttenuation);this.blending!==THREE.NormalBlending&&(d.blending=this.blending);this.shading!==THREE.SmoothShading&&
	(d.shading=this.shading);this.side!==THREE.FrontSide&&(d.side=this.side);this.vertexColors!==THREE.NoColors&&(d.vertexColors=this.vertexColors);1>this.opacity&&(d.opacity=this.opacity);!0===this.transparent&&(d.transparent=this.transparent);0<this.alphaTest&&(d.alphaTest=this.alphaTest);!0===this.premultipliedAlpha&&(d.premultipliedAlpha=this.premultipliedAlpha);!0===this.wireframe&&(d.wireframe=this.wireframe);1<this.wireframeLinewidth&&(d.wireframeLinewidth=this.wireframeLinewidth);c&&(c=b(a.textures),
	a=b(a.images),0<c.length&&(d.textures=c),0<a.length&&(d.images=a));return d},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.name=a.name;this.fog=a.fog;this.lights=a.lights;this.blending=a.blending;this.side=a.side;this.vertexColors=a.vertexColors;this.opacity=a.opacity;this.transparent=a.transparent;this.blendSrc=a.blendSrc;this.blendDst=a.blendDst;this.blendEquation=a.blendEquation;this.blendSrcAlpha=a.blendSrcAlpha;this.blendDstAlpha=a.blendDstAlpha;this.blendEquationAlpha=
	a.blendEquationAlpha;this.depthFunc=a.depthFunc;this.depthTest=a.depthTest;this.depthWrite=a.depthWrite;this.colorWrite=a.colorWrite;this.precision=a.precision;this.polygonOffset=a.polygonOffset;this.polygonOffsetFactor=a.polygonOffsetFactor;this.polygonOffsetUnits=a.polygonOffsetUnits;this.alphaTest=a.alphaTest;this.premultipliedAlpha=a.premultipliedAlpha;this.overdraw=a.overdraw;this.visible=a.visible;this.clipShadows=a.clipShadows;a=a.clippingPlanes;var b=null;if(null!==a)for(var c=a.length,b=
	Array(c),d=0;d!==c;++d)b[d]=a[d].clone();this.clippingPlanes=b;return this},update:function(){this.dispatchEvent({type:"update"})},dispose:function(){this.dispatchEvent({type:"dispose"})}};Object.assign(THREE.Material.prototype,THREE.EventDispatcher.prototype);THREE.MaterialIdCount=0;THREE.LineBasicMaterial=function(a){THREE.Material.call(this);this.type="LineBasicMaterial";this.color=new THREE.Color(16777215);this.linewidth=1;this.linejoin=this.linecap="round";this.lights=!1;this.setValues(a)};
	THREE.LineBasicMaterial.prototype=Object.create(THREE.Material.prototype);THREE.LineBasicMaterial.prototype.constructor=THREE.LineBasicMaterial;THREE.LineBasicMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.linewidth=a.linewidth;this.linecap=a.linecap;this.linejoin=a.linejoin;return this};
	THREE.LineDashedMaterial=function(a){THREE.Material.call(this);this.type="LineDashedMaterial";this.color=new THREE.Color(16777215);this.scale=this.linewidth=1;this.dashSize=3;this.gapSize=1;this.lights=!1;this.setValues(a)};THREE.LineDashedMaterial.prototype=Object.create(THREE.Material.prototype);THREE.LineDashedMaterial.prototype.constructor=THREE.LineDashedMaterial;
	THREE.LineDashedMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.linewidth=a.linewidth;this.scale=a.scale;this.dashSize=a.dashSize;this.gapSize=a.gapSize;return this};
	THREE.MeshBasicMaterial=function(a){THREE.Material.call(this);this.type="MeshBasicMaterial";this.color=new THREE.Color(16777215);this.aoMap=this.map=null;this.aoMapIntensity=1;this.envMap=this.alphaMap=this.specularMap=null;this.combine=THREE.MultiplyOperation;this.reflectivity=1;this.refractionRatio=.98;this.wireframe=!1;this.wireframeLinewidth=1;this.wireframeLinejoin=this.wireframeLinecap="round";this.lights=this.morphTargets=this.skinning=!1;this.setValues(a)};
	THREE.MeshBasicMaterial.prototype=Object.create(THREE.Material.prototype);THREE.MeshBasicMaterial.prototype.constructor=THREE.MeshBasicMaterial;
	THREE.MeshBasicMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.map=a.map;this.aoMap=a.aoMap;this.aoMapIntensity=a.aoMapIntensity;this.specularMap=a.specularMap;this.alphaMap=a.alphaMap;this.envMap=a.envMap;this.combine=a.combine;this.reflectivity=a.reflectivity;this.refractionRatio=a.refractionRatio;this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;this.wireframeLinecap=a.wireframeLinecap;this.wireframeLinejoin=a.wireframeLinejoin;
	this.skinning=a.skinning;this.morphTargets=a.morphTargets;return this};THREE.MeshDepthMaterial=function(a){THREE.Material.call(this);this.type="MeshDepthMaterial";this.depthPacking=THREE.BasicDepthPacking;this.morphTargets=this.skinning=!1;this.displacementMap=this.alphaMap=this.map=null;this.displacementScale=1;this.displacementBias=0;this.wireframe=!1;this.wireframeLinewidth=1;this.lights=this.fog=!1;this.setValues(a)};THREE.MeshDepthMaterial.prototype=Object.create(THREE.Material.prototype);
	THREE.MeshDepthMaterial.prototype.constructor=THREE.MeshDepthMaterial;THREE.MeshDepthMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.depthPacking=a.depthPacking;this.skinning=a.skinning;this.morphTargets=a.morphTargets;this.map=a.map;this.alphaMap=a.alphaMap;this.displacementMap=a.displacementMap;this.displacementScale=a.displacementScale;this.displacementBias=a.displacementBias;this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;return this};
	THREE.MeshLambertMaterial=function(a){THREE.Material.call(this);this.type="MeshLambertMaterial";this.color=new THREE.Color(16777215);this.lightMap=this.map=null;this.lightMapIntensity=1;this.aoMap=null;this.aoMapIntensity=1;this.emissive=new THREE.Color(0);this.emissiveIntensity=1;this.envMap=this.alphaMap=this.specularMap=this.emissiveMap=null;this.combine=THREE.MultiplyOperation;this.reflectivity=1;this.refractionRatio=.98;this.wireframe=!1;this.wireframeLinewidth=1;this.wireframeLinejoin=this.wireframeLinecap=
	"round";this.morphNormals=this.morphTargets=this.skinning=!1;this.setValues(a)};THREE.MeshLambertMaterial.prototype=Object.create(THREE.Material.prototype);THREE.MeshLambertMaterial.prototype.constructor=THREE.MeshLambertMaterial;
	THREE.MeshLambertMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.map=a.map;this.lightMap=a.lightMap;this.lightMapIntensity=a.lightMapIntensity;this.aoMap=a.aoMap;this.aoMapIntensity=a.aoMapIntensity;this.emissive.copy(a.emissive);this.emissiveMap=a.emissiveMap;this.emissiveIntensity=a.emissiveIntensity;this.specularMap=a.specularMap;this.alphaMap=a.alphaMap;this.envMap=a.envMap;this.combine=a.combine;this.reflectivity=a.reflectivity;this.refractionRatio=
	a.refractionRatio;this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;this.wireframeLinecap=a.wireframeLinecap;this.wireframeLinejoin=a.wireframeLinejoin;this.skinning=a.skinning;this.morphTargets=a.morphTargets;this.morphNormals=a.morphNormals;return this};THREE.MeshNormalMaterial=function(a){THREE.Material.call(this,a);this.type="MeshNormalMaterial";this.wireframe=!1;this.wireframeLinewidth=1;this.morphTargets=this.lights=this.fog=!1;this.setValues(a)};
	THREE.MeshNormalMaterial.prototype=Object.create(THREE.Material.prototype);THREE.MeshNormalMaterial.prototype.constructor=THREE.MeshNormalMaterial;THREE.MeshNormalMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;return this};
	THREE.MeshPhongMaterial=function(a){THREE.Material.call(this);this.type="MeshPhongMaterial";this.color=new THREE.Color(16777215);this.specular=new THREE.Color(1118481);this.shininess=30;this.lightMap=this.map=null;this.lightMapIntensity=1;this.aoMap=null;this.aoMapIntensity=1;this.emissive=new THREE.Color(0);this.emissiveIntensity=1;this.bumpMap=this.emissiveMap=null;this.bumpScale=1;this.normalMap=null;this.normalScale=new THREE.Vector2(1,1);this.displacementMap=null;this.displacementScale=1;this.displacementBias=
	0;this.envMap=this.alphaMap=this.specularMap=null;this.combine=THREE.MultiplyOperation;this.reflectivity=1;this.refractionRatio=.98;this.wireframe=!1;this.wireframeLinewidth=1;this.wireframeLinejoin=this.wireframeLinecap="round";this.morphNormals=this.morphTargets=this.skinning=!1;this.setValues(a)};THREE.MeshPhongMaterial.prototype=Object.create(THREE.Material.prototype);THREE.MeshPhongMaterial.prototype.constructor=THREE.MeshPhongMaterial;
	THREE.MeshPhongMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.specular.copy(a.specular);this.shininess=a.shininess;this.map=a.map;this.lightMap=a.lightMap;this.lightMapIntensity=a.lightMapIntensity;this.aoMap=a.aoMap;this.aoMapIntensity=a.aoMapIntensity;this.emissive.copy(a.emissive);this.emissiveMap=a.emissiveMap;this.emissiveIntensity=a.emissiveIntensity;this.bumpMap=a.bumpMap;this.bumpScale=a.bumpScale;this.normalMap=a.normalMap;this.normalScale.copy(a.normalScale);
	this.displacementMap=a.displacementMap;this.displacementScale=a.displacementScale;this.displacementBias=a.displacementBias;this.specularMap=a.specularMap;this.alphaMap=a.alphaMap;this.envMap=a.envMap;this.combine=a.combine;this.reflectivity=a.reflectivity;this.refractionRatio=a.refractionRatio;this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;this.wireframeLinecap=a.wireframeLinecap;this.wireframeLinejoin=a.wireframeLinejoin;this.skinning=a.skinning;this.morphTargets=a.morphTargets;
	this.morphNormals=a.morphNormals;return this};
	THREE.MeshStandardMaterial=function(a){THREE.Material.call(this);this.defines={STANDARD:""};this.type="MeshStandardMaterial";this.color=new THREE.Color(16777215);this.metalness=this.roughness=.5;this.lightMap=this.map=null;this.lightMapIntensity=1;this.aoMap=null;this.aoMapIntensity=1;this.emissive=new THREE.Color(0);this.emissiveIntensity=1;this.bumpMap=this.emissiveMap=null;this.bumpScale=1;this.normalMap=null;this.normalScale=new THREE.Vector2(1,1);this.displacementMap=null;this.displacementScale=
	1;this.displacementBias=0;this.envMap=this.alphaMap=this.metalnessMap=this.roughnessMap=null;this.envMapIntensity=1;this.refractionRatio=.98;this.wireframe=!1;this.wireframeLinewidth=1;this.wireframeLinejoin=this.wireframeLinecap="round";this.morphNormals=this.morphTargets=this.skinning=!1;this.setValues(a)};THREE.MeshStandardMaterial.prototype=Object.create(THREE.Material.prototype);THREE.MeshStandardMaterial.prototype.constructor=THREE.MeshStandardMaterial;
	THREE.MeshStandardMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.defines={STANDARD:""};this.color.copy(a.color);this.roughness=a.roughness;this.metalness=a.metalness;this.map=a.map;this.lightMap=a.lightMap;this.lightMapIntensity=a.lightMapIntensity;this.aoMap=a.aoMap;this.aoMapIntensity=a.aoMapIntensity;this.emissive.copy(a.emissive);this.emissiveMap=a.emissiveMap;this.emissiveIntensity=a.emissiveIntensity;this.bumpMap=a.bumpMap;this.bumpScale=a.bumpScale;this.normalMap=
	a.normalMap;this.normalScale.copy(a.normalScale);this.displacementMap=a.displacementMap;this.displacementScale=a.displacementScale;this.displacementBias=a.displacementBias;this.roughnessMap=a.roughnessMap;this.metalnessMap=a.metalnessMap;this.alphaMap=a.alphaMap;this.envMap=a.envMap;this.envMapIntensity=a.envMapIntensity;this.refractionRatio=a.refractionRatio;this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;this.wireframeLinecap=a.wireframeLinecap;this.wireframeLinejoin=a.wireframeLinejoin;
	this.skinning=a.skinning;this.morphTargets=a.morphTargets;this.morphNormals=a.morphNormals;return this};THREE.MeshPhysicalMaterial=function(a){THREE.MeshStandardMaterial.call(this);this.defines={PHYSICAL:""};this.type="MeshPhysicalMaterial";this.reflectivity=.5;this.setValues(a)};THREE.MeshPhysicalMaterial.prototype=Object.create(THREE.MeshStandardMaterial.prototype);THREE.MeshPhysicalMaterial.prototype.constructor=THREE.MeshPhysicalMaterial;
	THREE.MeshPhysicalMaterial.prototype.copy=function(a){THREE.MeshStandardMaterial.prototype.copy.call(this,a);this.defines={PHYSICAL:""};this.reflectivity=a.reflectivity;return this};THREE.MultiMaterial=function(a){this.uuid=THREE.Math.generateUUID();this.type="MultiMaterial";this.materials=a instanceof Array?a:[];this.visible=!0};
	THREE.MultiMaterial.prototype={constructor:THREE.MultiMaterial,toJSON:function(a){for(var b={metadata:{version:4.2,type:"material",generator:"MaterialExporter"},uuid:this.uuid,type:this.type,materials:[]},c=this.materials,d=0,e=c.length;d<e;d++){var f=c[d].toJSON(a);delete f.metadata;b.materials.push(f)}b.visible=this.visible;return b},clone:function(){for(var a=new this.constructor,b=0;b<this.materials.length;b++)a.materials.push(this.materials[b].clone());a.visible=this.visible;return a}};
	THREE.PointsMaterial=function(a){THREE.Material.call(this);this.type="PointsMaterial";this.color=new THREE.Color(16777215);this.map=null;this.size=1;this.sizeAttenuation=!0;this.lights=!1;this.setValues(a)};THREE.PointsMaterial.prototype=Object.create(THREE.Material.prototype);THREE.PointsMaterial.prototype.constructor=THREE.PointsMaterial;
	THREE.PointsMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.map=a.map;this.size=a.size;this.sizeAttenuation=a.sizeAttenuation;return this};
	THREE.ShaderMaterial=function(a){THREE.Material.call(this);this.type="ShaderMaterial";this.defines={};this.uniforms={};this.vertexShader="void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}";this.fragmentShader="void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}";this.linewidth=1;this.wireframe=!1;this.wireframeLinewidth=1;this.morphNormals=this.morphTargets=this.skinning=this.clipping=this.lights=this.fog=!1;this.extensions={derivatives:!1,fragDepth:!1,
	drawBuffers:!1,shaderTextureLOD:!1};this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]};this.index0AttributeName=void 0;void 0!==a&&(void 0!==a.attributes&&console.error("THREE.ShaderMaterial: attributes should now be defined in THREE.BufferGeometry instead."),this.setValues(a))};THREE.ShaderMaterial.prototype=Object.create(THREE.Material.prototype);THREE.ShaderMaterial.prototype.constructor=THREE.ShaderMaterial;
	THREE.ShaderMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.fragmentShader=a.fragmentShader;this.vertexShader=a.vertexShader;this.uniforms=THREE.UniformsUtils.clone(a.uniforms);this.defines=a.defines;this.wireframe=a.wireframe;this.wireframeLinewidth=a.wireframeLinewidth;this.lights=a.lights;this.clipping=a.clipping;this.skinning=a.skinning;this.morphTargets=a.morphTargets;this.morphNormals=a.morphNormals;this.extensions=a.extensions;return this};
	THREE.ShaderMaterial.prototype.toJSON=function(a){a=THREE.Material.prototype.toJSON.call(this,a);a.uniforms=this.uniforms;a.vertexShader=this.vertexShader;a.fragmentShader=this.fragmentShader;return a};THREE.RawShaderMaterial=function(a){THREE.ShaderMaterial.call(this,a);this.type="RawShaderMaterial"};THREE.RawShaderMaterial.prototype=Object.create(THREE.ShaderMaterial.prototype);THREE.RawShaderMaterial.prototype.constructor=THREE.RawShaderMaterial;
	THREE.SpriteMaterial=function(a){THREE.Material.call(this);this.type="SpriteMaterial";this.color=new THREE.Color(16777215);this.map=null;this.rotation=0;this.lights=this.fog=!1;this.setValues(a)};THREE.SpriteMaterial.prototype=Object.create(THREE.Material.prototype);THREE.SpriteMaterial.prototype.constructor=THREE.SpriteMaterial;THREE.SpriteMaterial.prototype.copy=function(a){THREE.Material.prototype.copy.call(this,a);this.color.copy(a.color);this.map=a.map;this.rotation=a.rotation;return this};
	THREE.ShadowMaterial=function(){THREE.ShaderMaterial.call(this,{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.lights,{opacity:{value:1}}]),vertexShader:THREE.ShaderChunk.shadow_vert,fragmentShader:THREE.ShaderChunk.shadow_frag});this.transparent=this.lights=!0;Object.defineProperties(this,{opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(a){this.uniforms.opacity.value=a}}})};THREE.ShadowMaterial.prototype=Object.create(THREE.ShaderMaterial.prototype);
	THREE.ShadowMaterial.prototype.constructor=THREE.ShadowMaterial;
	THREE.Texture=function(a,b,c,d,e,f,g,h,k,l){Object.defineProperty(this,"id",{value:THREE.TextureIdCount++});this.uuid=THREE.Math.generateUUID();this.sourceFile=this.name="";this.image=void 0!==a?a:THREE.Texture.DEFAULT_IMAGE;this.mipmaps=[];this.mapping=void 0!==b?b:THREE.Texture.DEFAULT_MAPPING;this.wrapS=void 0!==c?c:THREE.ClampToEdgeWrapping;this.wrapT=void 0!==d?d:THREE.ClampToEdgeWrapping;this.magFilter=void 0!==e?e:THREE.LinearFilter;this.minFilter=void 0!==f?f:THREE.LinearMipMapLinearFilter;
	this.anisotropy=void 0!==k?k:1;this.format=void 0!==g?g:THREE.RGBAFormat;this.type=void 0!==h?h:THREE.UnsignedByteType;this.offset=new THREE.Vector2(0,0);this.repeat=new THREE.Vector2(1,1);this.generateMipmaps=!0;this.premultiplyAlpha=!1;this.flipY=!0;this.unpackAlignment=4;this.encoding=void 0!==l?l:THREE.LinearEncoding;this.version=0;this.onUpdate=null};THREE.Texture.DEFAULT_IMAGE=void 0;THREE.Texture.DEFAULT_MAPPING=THREE.UVMapping;
	THREE.Texture.prototype={constructor:THREE.Texture,set needsUpdate(a){!0===a&&this.version++},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.image=a.image;this.mipmaps=a.mipmaps.slice(0);this.mapping=a.mapping;this.wrapS=a.wrapS;this.wrapT=a.wrapT;this.magFilter=a.magFilter;this.minFilter=a.minFilter;this.anisotropy=a.anisotropy;this.format=a.format;this.type=a.type;this.offset.copy(a.offset);this.repeat.copy(a.repeat);this.generateMipmaps=a.generateMipmaps;this.premultiplyAlpha=
	a.premultiplyAlpha;this.flipY=a.flipY;this.unpackAlignment=a.unpackAlignment;this.encoding=a.encoding;return this},toJSON:function(a){if(void 0!==a.textures[this.uuid])return a.textures[this.uuid];var b={metadata:{version:4.4,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],wrap:[this.wrapS,this.wrapT],minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy};
	if(void 0!==this.image){var c=this.image;void 0===c.uuid&&(c.uuid=THREE.Math.generateUUID());if(void 0===a.images[c.uuid]){var d=a.images,e=c.uuid,f=c.uuid,g;void 0!==c.toDataURL?g=c:(g=document.createElement("canvas"),g.width=c.width,g.height=c.height,g.getContext("2d").drawImage(c,0,0,c.width,c.height));g=2048<g.width||2048<g.height?g.toDataURL("image/jpeg",.6):g.toDataURL("image/png");d[e]={uuid:f,url:g}}b.image=c.uuid}return a.textures[this.uuid]=b},dispose:function(){this.dispatchEvent({type:"dispose"})},
	transformUv:function(a){if(this.mapping===THREE.UVMapping){a.multiply(this.repeat);a.add(this.offset);if(0>a.x||1<a.x)switch(this.wrapS){case THREE.RepeatWrapping:a.x-=Math.floor(a.x);break;case THREE.ClampToEdgeWrapping:a.x=0>a.x?0:1;break;case THREE.MirroredRepeatWrapping:1===Math.abs(Math.floor(a.x)%2)?a.x=Math.ceil(a.x)-a.x:a.x-=Math.floor(a.x)}if(0>a.y||1<a.y)switch(this.wrapT){case THREE.RepeatWrapping:a.y-=Math.floor(a.y);break;case THREE.ClampToEdgeWrapping:a.y=0>a.y?0:1;break;case THREE.MirroredRepeatWrapping:1===
	Math.abs(Math.floor(a.y)%2)?a.y=Math.ceil(a.y)-a.y:a.y-=Math.floor(a.y)}this.flipY&&(a.y=1-a.y)}}};Object.assign(THREE.Texture.prototype,THREE.EventDispatcher.prototype);THREE.TextureIdCount=0;
	THREE.DepthTexture=function(a,b,c,d,e,f,g,h,k){THREE.Texture.call(this,null,d,e,f,g,h,THREE.DepthFormat,c,k);this.image={width:a,height:b};this.type=void 0!==c?c:THREE.UnsignedShortType;this.magFilter=void 0!==g?g:THREE.NearestFilter;this.minFilter=void 0!==h?h:THREE.NearestFilter;this.generateMipmaps=this.flipY=!1};THREE.DepthTexture.prototype=Object.create(THREE.Texture.prototype);THREE.DepthTexture.prototype.constructor=THREE.DepthTexture;
	THREE.CanvasTexture=function(a,b,c,d,e,f,g,h,k){THREE.Texture.call(this,a,b,c,d,e,f,g,h,k);this.needsUpdate=!0};THREE.CanvasTexture.prototype=Object.create(THREE.Texture.prototype);THREE.CanvasTexture.prototype.constructor=THREE.CanvasTexture;THREE.CubeTexture=function(a,b,c,d,e,f,g,h,k,l){a=void 0!==a?a:[];b=void 0!==b?b:THREE.CubeReflectionMapping;THREE.Texture.call(this,a,b,c,d,e,f,g,h,k,l);this.flipY=!1};THREE.CubeTexture.prototype=Object.create(THREE.Texture.prototype);
	THREE.CubeTexture.prototype.constructor=THREE.CubeTexture;Object.defineProperty(THREE.CubeTexture.prototype,"images",{get:function(){return this.image},set:function(a){this.image=a}});THREE.CompressedTexture=function(a,b,c,d,e,f,g,h,k,l,n,p){THREE.Texture.call(this,null,f,g,h,k,l,d,e,n,p);this.image={width:b,height:c};this.mipmaps=a;this.generateMipmaps=this.flipY=!1};THREE.CompressedTexture.prototype=Object.create(THREE.Texture.prototype);THREE.CompressedTexture.prototype.constructor=THREE.CompressedTexture;
	THREE.DataTexture=function(a,b,c,d,e,f,g,h,k,l,n,p){THREE.Texture.call(this,null,f,g,h,k,l,d,e,n,p);this.image={data:a,width:b,height:c};this.magFilter=void 0!==k?k:THREE.NearestFilter;this.minFilter=void 0!==l?l:THREE.NearestFilter;this.generateMipmaps=this.flipY=!1};THREE.DataTexture.prototype=Object.create(THREE.Texture.prototype);THREE.DataTexture.prototype.constructor=THREE.DataTexture;
	THREE.VideoTexture=function(a,b,c,d,e,f,g,h,k){function l(){requestAnimationFrame(l);a.readyState>=a.HAVE_CURRENT_DATA&&(n.needsUpdate=!0)}THREE.Texture.call(this,a,b,c,d,e,f,g,h,k);this.generateMipmaps=!1;var n=this;l()};THREE.VideoTexture.prototype=Object.create(THREE.Texture.prototype);THREE.VideoTexture.prototype.constructor=THREE.VideoTexture;THREE.Group=function(){THREE.Object3D.call(this);this.type="Group"};THREE.Group.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Group});
	THREE.Points=function(a,b){THREE.Object3D.call(this);this.type="Points";this.geometry=void 0!==a?a:new THREE.BufferGeometry;this.material=void 0!==b?b:new THREE.PointsMaterial({color:16777215*Math.random()})};
	THREE.Points.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Points,raycast:function(){var a=new THREE.Matrix4,b=new THREE.Ray,c=new THREE.Sphere;return function(d,e){function f(a,c){var f=b.distanceSqToPoint(a);if(f<n){var h=b.closestPointToPoint(a);h.applyMatrix4(k);var m=d.ray.origin.distanceTo(h);m<d.near||m>d.far||e.push({distance:m,distanceToRay:Math.sqrt(f),point:h.clone(),index:c,face:null,object:g})}}var g=this,h=this.geometry,k=this.matrixWorld,l=d.params.Points.threshold;
	null===h.boundingSphere&&h.computeBoundingSphere();c.copy(h.boundingSphere);c.applyMatrix4(k);if(!1!==d.ray.intersectsSphere(c)){a.getInverse(k);b.copy(d.ray).applyMatrix4(a);var l=l/((this.scale.x+this.scale.y+this.scale.z)/3),n=l*l,l=new THREE.Vector3;if(h instanceof THREE.BufferGeometry){var p=h.index,h=h.attributes.position.array;if(null!==p)for(var m=p.array,p=0,q=m.length;p<q;p++){var r=m[p];l.fromArray(h,3*r);f(l,r)}else for(p=0,m=h.length/3;p<m;p++)l.fromArray(h,3*p),f(l,p)}else for(l=h.vertices,
	p=0,m=l.length;p<m;p++)f(l[p],p)}}}(),clone:function(){return(new this.constructor(this.geometry,this.material)).copy(this)}});THREE.Line=function(a,b,c){if(1===c)return console.warn("THREE.Line: parameter THREE.LinePieces no longer supported. Created THREE.LineSegments instead."),new THREE.LineSegments(a,b);THREE.Object3D.call(this);this.type="Line";this.geometry=void 0!==a?a:new THREE.BufferGeometry;this.material=void 0!==b?b:new THREE.LineBasicMaterial({color:16777215*Math.random()})};
	THREE.Line.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Line,raycast:function(){var a=new THREE.Matrix4,b=new THREE.Ray,c=new THREE.Sphere;return function(d,e){var f=d.linePrecision,f=f*f,g=this.geometry,h=this.matrixWorld;null===g.boundingSphere&&g.computeBoundingSphere();c.copy(g.boundingSphere);c.applyMatrix4(h);if(!1!==d.ray.intersectsSphere(c)){a.getInverse(h);b.copy(d.ray).applyMatrix4(a);var k=new THREE.Vector3,l=new THREE.Vector3,h=new THREE.Vector3,n=
	new THREE.Vector3,p=this instanceof THREE.LineSegments?2:1;if(g instanceof THREE.BufferGeometry){var m=g.index,q=g.attributes.position.array;if(null!==m)for(var m=m.array,g=0,r=m.length-1;g<r;g+=p){var s=m[g+1];k.fromArray(q,3*m[g]);l.fromArray(q,3*s);s=b.distanceSqToSegment(k,l,n,h);s>f||(n.applyMatrix4(this.matrixWorld),s=d.ray.origin.distanceTo(n),s<d.near||s>d.far||e.push({distance:s,point:h.clone().applyMatrix4(this.matrixWorld),index:g,face:null,faceIndex:null,object:this}))}else for(g=0,r=
	q.length/3-1;g<r;g+=p)k.fromArray(q,3*g),l.fromArray(q,3*g+3),s=b.distanceSqToSegment(k,l,n,h),s>f||(n.applyMatrix4(this.matrixWorld),s=d.ray.origin.distanceTo(n),s<d.near||s>d.far||e.push({distance:s,point:h.clone().applyMatrix4(this.matrixWorld),index:g,face:null,faceIndex:null,object:this}))}else if(g instanceof THREE.Geometry)for(k=g.vertices,l=k.length,g=0;g<l-1;g+=p)s=b.distanceSqToSegment(k[g],k[g+1],n,h),s>f||(n.applyMatrix4(this.matrixWorld),s=d.ray.origin.distanceTo(n),s<d.near||s>d.far||
	e.push({distance:s,point:h.clone().applyMatrix4(this.matrixWorld),index:g,face:null,faceIndex:null,object:this}))}}}(),clone:function(){return(new this.constructor(this.geometry,this.material)).copy(this)}});THREE.LineSegments=function(a,b){THREE.Line.call(this,a,b);this.type="LineSegments"};THREE.LineSegments.prototype=Object.assign(Object.create(THREE.Line.prototype),{constructor:THREE.LineSegments});
	THREE.Mesh=function(a,b){THREE.Object3D.call(this);this.type="Mesh";this.geometry=void 0!==a?a:new THREE.BufferGeometry;this.material=void 0!==b?b:new THREE.MeshBasicMaterial({color:16777215*Math.random()});this.drawMode=THREE.TrianglesDrawMode;this.updateMorphTargets()};
	THREE.Mesh.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Mesh,setDrawMode:function(a){this.drawMode=a},updateMorphTargets:function(){if(void 0!==this.geometry.morphTargets&&0<this.geometry.morphTargets.length){this.morphTargetBase=-1;this.morphTargetInfluences=[];this.morphTargetDictionary={};for(var a=0,b=this.geometry.morphTargets.length;a<b;a++)this.morphTargetInfluences.push(0),this.morphTargetDictionary[this.geometry.morphTargets[a].name]=a}},getMorphTargetIndexByName:function(a){if(void 0!==
	this.morphTargetDictionary[a])return this.morphTargetDictionary[a];console.warn("THREE.Mesh.getMorphTargetIndexByName: morph target "+a+" does not exist. Returning 0.");return 0},raycast:function(){function a(a,b,c,d,e,g,f){THREE.Triangle.barycoordFromPoint(a,b,c,d,s);e.multiplyScalar(s.x);g.multiplyScalar(s.y);f.multiplyScalar(s.z);e.add(g).add(f);return e.clone()}function b(a,b,c,d,e,g,f){var h=a.material;if(null===(h.side===THREE.BackSide?c.intersectTriangle(g,e,d,!0,f):c.intersectTriangle(d,e,
	g,h.side!==THREE.DoubleSide,f)))return null;x.copy(f);x.applyMatrix4(a.matrixWorld);c=b.ray.origin.distanceTo(x);return c<b.near||c>b.far?null:{distance:c,point:x.clone(),object:a}}function c(c,d,e,f,l,p,n,s){g.fromArray(f,3*p);h.fromArray(f,3*n);k.fromArray(f,3*s);if(c=b(c,d,e,g,h,k,u))l&&(m.fromArray(l,2*p),q.fromArray(l,2*n),r.fromArray(l,2*s),c.uv=a(u,g,h,k,m,q,r)),c.face=new THREE.Face3(p,n,s,THREE.Triangle.normal(g,h,k)),c.faceIndex=p;return c}var d=new THREE.Matrix4,e=new THREE.Ray,f=new THREE.Sphere,
	g=new THREE.Vector3,h=new THREE.Vector3,k=new THREE.Vector3,l=new THREE.Vector3,n=new THREE.Vector3,p=new THREE.Vector3,m=new THREE.Vector2,q=new THREE.Vector2,r=new THREE.Vector2,s=new THREE.Vector3,u=new THREE.Vector3,x=new THREE.Vector3;return function(s,x){var w=this.geometry,D=this.material,A=this.matrixWorld;if(void 0!==D&&(null===w.boundingSphere&&w.computeBoundingSphere(),f.copy(w.boundingSphere),f.applyMatrix4(A),!1!==s.ray.intersectsSphere(f)&&(d.getInverse(A),e.copy(s.ray).applyMatrix4(d),
	null===w.boundingBox||!1!==e.intersectsBox(w.boundingBox)))){var y,B;if(w instanceof THREE.BufferGeometry){var G,z,D=w.index,A=w.attributes,w=A.position.array;void 0!==A.uv&&(y=A.uv.array);if(null!==D)for(var A=D.array,H=0,M=A.length;H<M;H+=3){if(D=A[H],G=A[H+1],z=A[H+2],B=c(this,s,e,w,y,D,G,z))B.faceIndex=Math.floor(H/3),x.push(B)}else for(H=0,M=w.length;H<M;H+=9)if(D=H/3,G=D+1,z=D+2,B=c(this,s,e,w,y,D,G,z))B.index=D,x.push(B)}else if(w instanceof THREE.Geometry){var O,N,A=D instanceof THREE.MultiMaterial,
	H=!0===A?D.materials:null,M=w.vertices;G=w.faces;z=w.faceVertexUvs[0];0<z.length&&(y=z);for(var E=0,K=G.length;E<K;E++){var I=G[E];B=!0===A?H[I.materialIndex]:D;if(void 0!==B){z=M[I.a];O=M[I.b];N=M[I.c];if(!0===B.morphTargets){B=w.morphTargets;var L=this.morphTargetInfluences;g.set(0,0,0);h.set(0,0,0);k.set(0,0,0);for(var P=0,Q=B.length;P<Q;P++){var R=L[P];if(0!==R){var F=B[P].vertices;g.addScaledVector(l.subVectors(F[I.a],z),R);h.addScaledVector(n.subVectors(F[I.b],O),R);k.addScaledVector(p.subVectors(F[I.c],
	N),R)}}g.add(z);h.add(O);k.add(N);z=g;O=h;N=k}if(B=b(this,s,e,z,O,N,u))y&&(L=y[E],m.copy(L[0]),q.copy(L[1]),r.copy(L[2]),B.uv=a(u,z,O,N,m,q,r)),B.face=I,B.faceIndex=E,x.push(B)}}}}}}(),clone:function(){return(new this.constructor(this.geometry,this.material)).copy(this)}});THREE.Bone=function(a){THREE.Object3D.call(this);this.type="Bone";this.skin=a};
	THREE.Bone.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Bone,copy:function(a){THREE.Object3D.prototype.copy.call(this,a);this.skin=a.skin;return this}});
	THREE.Skeleton=function(a,b,c){this.useVertexTexture=void 0!==c?c:!0;this.identityMatrix=new THREE.Matrix4;a=a||[];this.bones=a.slice(0);this.useVertexTexture?(a=Math.sqrt(4*this.bones.length),a=THREE.Math.nextPowerOfTwo(Math.ceil(a)),this.boneTextureHeight=this.boneTextureWidth=a=Math.max(a,4),this.boneMatrices=new Float32Array(this.boneTextureWidth*this.boneTextureHeight*4),this.boneTexture=new THREE.DataTexture(this.boneMatrices,this.boneTextureWidth,this.boneTextureHeight,THREE.RGBAFormat,THREE.FloatType)):
	this.boneMatrices=new Float32Array(16*this.bones.length);if(void 0===b)this.calculateInverses();else if(this.bones.length===b.length)this.boneInverses=b.slice(0);else for(console.warn("THREE.Skeleton bonInverses is the wrong length."),this.boneInverses=[],b=0,a=this.bones.length;b<a;b++)this.boneInverses.push(new THREE.Matrix4)};
	Object.assign(THREE.Skeleton.prototype,{calculateInverses:function(){this.boneInverses=[];for(var a=0,b=this.bones.length;a<b;a++){var c=new THREE.Matrix4;this.bones[a]&&c.getInverse(this.bones[a].matrixWorld);this.boneInverses.push(c)}},pose:function(){for(var a,b=0,c=this.bones.length;b<c;b++)(a=this.bones[b])&&a.matrixWorld.getInverse(this.boneInverses[b]);b=0;for(c=this.bones.length;b<c;b++)if(a=this.bones[b])a.parent?(a.matrix.getInverse(a.parent.matrixWorld),a.matrix.multiply(a.matrixWorld)):
	a.matrix.copy(a.matrixWorld),a.matrix.decompose(a.position,a.quaternion,a.scale)},update:function(){var a=new THREE.Matrix4;return function(){for(var b=0,c=this.bones.length;b<c;b++)a.multiplyMatrices(this.bones[b]?this.bones[b].matrixWorld:this.identityMatrix,this.boneInverses[b]),a.toArray(this.boneMatrices,16*b);this.useVertexTexture&&(this.boneTexture.needsUpdate=!0)}}(),clone:function(){return new THREE.Skeleton(this.bones,this.boneInverses,this.useVertexTexture)}});
	THREE.SkinnedMesh=function(a,b,c){THREE.Mesh.call(this,a,b);this.type="SkinnedMesh";this.bindMode="attached";this.bindMatrix=new THREE.Matrix4;this.bindMatrixInverse=new THREE.Matrix4;a=[];if(this.geometry&&void 0!==this.geometry.bones){for(var d,e=0,f=this.geometry.bones.length;e<f;++e)d=this.geometry.bones[e],b=new THREE.Bone(this),a.push(b),b.name=d.name,b.position.fromArray(d.pos),b.quaternion.fromArray(d.rotq),void 0!==d.scl&&b.scale.fromArray(d.scl);e=0;for(f=this.geometry.bones.length;e<f;++e)d=
	this.geometry.bones[e],-1!==d.parent&&null!==d.parent&&void 0!==a[d.parent]?a[d.parent].add(a[e]):this.add(a[e])}this.normalizeSkinWeights();this.updateMatrixWorld(!0);this.bind(new THREE.Skeleton(a,void 0,c),this.matrixWorld)};
	THREE.SkinnedMesh.prototype=Object.assign(Object.create(THREE.Mesh.prototype),{constructor:THREE.SkinnedMesh,bind:function(a,b){this.skeleton=a;void 0===b&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),b=this.matrixWorld);this.bindMatrix.copy(b);this.bindMatrixInverse.getInverse(b)},pose:function(){this.skeleton.pose()},normalizeSkinWeights:function(){if(this.geometry instanceof THREE.Geometry)for(var a=0;a<this.geometry.skinWeights.length;a++){var b=this.geometry.skinWeights[a],c=
	1/b.lengthManhattan();Infinity!==c?b.multiplyScalar(c):b.set(1,0,0,0)}else if(this.geometry instanceof THREE.BufferGeometry)for(var b=new THREE.Vector4,d=this.geometry.attributes.skinWeight,a=0;a<d.count;a++)b.x=d.getX(a),b.y=d.getY(a),b.z=d.getZ(a),b.w=d.getW(a),c=1/b.lengthManhattan(),Infinity!==c?b.multiplyScalar(c):b.set(1,0,0,0),d.setXYZW(a,b.x,b.y,b.z,b.w)},updateMatrixWorld:function(a){THREE.Mesh.prototype.updateMatrixWorld.call(this,!0);"attached"===this.bindMode?this.bindMatrixInverse.getInverse(this.matrixWorld):
	"detached"===this.bindMode?this.bindMatrixInverse.getInverse(this.bindMatrix):console.warn("THREE.SkinnedMesh unrecognized bindMode: "+this.bindMode)},clone:function(){return(new this.constructor(this.geometry,this.material,this.useVertexTexture)).copy(this)}});THREE.LOD=function(){THREE.Object3D.call(this);this.type="LOD";Object.defineProperties(this,{levels:{enumerable:!0,value:[]}})};
	THREE.LOD.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.LOD,copy:function(a){THREE.Object3D.prototype.copy.call(this,a,!1);a=a.levels;for(var b=0,c=a.length;b<c;b++){var d=a[b];this.addLevel(d.object.clone(),d.distance)}return this},addLevel:function(a,b){void 0===b&&(b=0);b=Math.abs(b);for(var c=this.levels,d=0;d<c.length&&!(b<c[d].distance);d++);c.splice(d,0,{distance:b,object:a});this.add(a)},getObjectForDistance:function(a){for(var b=this.levels,c=1,d=b.length;c<
	d&&!(a<b[c].distance);c++);return b[c-1].object},raycast:function(){var a=new THREE.Vector3;return function(b,c){a.setFromMatrixPosition(this.matrixWorld);var d=b.ray.origin.distanceTo(a);this.getObjectForDistance(d).raycast(b,c)}}(),update:function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(c){var d=this.levels;if(1<d.length){a.setFromMatrixPosition(c.matrixWorld);b.setFromMatrixPosition(this.matrixWorld);c=a.distanceTo(b);d[0].object.visible=!0;for(var e=1,f=d.length;e<f;e++)if(c>=
	d[e].distance)d[e-1].object.visible=!1,d[e].object.visible=!0;else break;for(;e<f;e++)d[e].object.visible=!1}}}(),toJSON:function(a){a=THREE.Object3D.prototype.toJSON.call(this,a);a.object.levels=[];for(var b=this.levels,c=0,d=b.length;c<d;c++){var e=b[c];a.object.levels.push({object:e.object.uuid,distance:e.distance})}return a}});THREE.Sprite=function(a){THREE.Object3D.call(this);this.type="Sprite";this.material=void 0!==a?a:new THREE.SpriteMaterial};
	THREE.Sprite.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.Sprite,raycast:function(){var a=new THREE.Vector3;return function(b,c){a.setFromMatrixPosition(this.matrixWorld);var d=b.ray.distanceSqToPoint(a);d>this.scale.x*this.scale.y/4||c.push({distance:Math.sqrt(d),point:this.position,face:null,object:this})}}(),clone:function(){return(new this.constructor(this.material)).copy(this)}});
	THREE.LensFlare=function(a,b,c,d,e){THREE.Object3D.call(this);this.lensFlares=[];this.positionScreen=new THREE.Vector3;this.customUpdateCallback=void 0;void 0!==a&&this.add(a,b,c,d,e)};
	THREE.LensFlare.prototype=Object.assign(Object.create(THREE.Object3D.prototype),{constructor:THREE.LensFlare,copy:function(a){THREE.Object3D.prototype.copy.call(this,a);this.positionScreen.copy(a.positionScreen);this.customUpdateCallback=a.customUpdateCallback;for(var b=0,c=a.lensFlares.length;b<c;b++)this.lensFlares.push(a.lensFlares[b]);return this},add:function(a,b,c,d,e,f){void 0===b&&(b=-1);void 0===c&&(c=0);void 0===f&&(f=1);void 0===e&&(e=new THREE.Color(16777215));void 0===d&&(d=THREE.NormalBlending);
	c=Math.min(c,Math.max(0,c));this.lensFlares.push({texture:a,size:b,distance:c,x:0,y:0,z:0,scale:1,rotation:0,opacity:f,color:e,blending:d})},updateLensFlares:function(){var a,b=this.lensFlares.length,c,d=2*-this.positionScreen.x,e=2*-this.positionScreen.y;for(a=0;a<b;a++)c=this.lensFlares[a],c.x=this.positionScreen.x+d*c.distance,c.y=this.positionScreen.y+e*c.distance,c.wantedRotation=c.x*Math.PI*.25,c.rotation+=.25*(c.wantedRotation-c.rotation)}});
	THREE.Scene=function(){THREE.Object3D.call(this);this.type="Scene";this.overrideMaterial=this.fog=null;this.autoUpdate=!0};THREE.Scene.prototype=Object.create(THREE.Object3D.prototype);THREE.Scene.prototype.constructor=THREE.Scene;
	THREE.Scene.prototype.copy=function(a,b){THREE.Object3D.prototype.copy.call(this,a,b);null!==a.fog&&(this.fog=a.fog.clone());null!==a.overrideMaterial&&(this.overrideMaterial=a.overrideMaterial.clone());this.autoUpdate=a.autoUpdate;this.matrixAutoUpdate=a.matrixAutoUpdate;return this};THREE.Fog=function(a,b,c){this.name="";this.color=new THREE.Color(a);this.near=void 0!==b?b:1;this.far=void 0!==c?c:1E3};THREE.Fog.prototype.clone=function(){return new THREE.Fog(this.color.getHex(),this.near,this.far)};
	THREE.FogExp2=function(a,b){this.name="";this.color=new THREE.Color(a);this.density=void 0!==b?b:2.5E-4};THREE.FogExp2.prototype.clone=function(){return new THREE.FogExp2(this.color.getHex(),this.density)};THREE.ShaderChunk={};THREE.ShaderChunk.alphamap_fragment="#ifdef USE_ALPHAMAP\n\tdiffuseColor.a *= texture2D( alphaMap, vUv ).g;\n#endif\n";THREE.ShaderChunk.alphamap_pars_fragment="#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n#endif\n";THREE.ShaderChunk.alphatest_fragment="#ifdef ALPHATEST\n\tif ( diffuseColor.a < ALPHATEST ) discard;\n#endif\n";
	THREE.ShaderChunk.aomap_fragment="#ifdef USE_AOMAP\n\tfloat ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;\n\treflectedLight.indirectDiffuse *= ambientOcclusion;\n\t#if defined( USE_ENVMAP ) && defined( PHYSICAL )\n\t\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\t\treflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );\n\t#endif\n#endif\n";THREE.ShaderChunk.aomap_pars_fragment="#ifdef USE_AOMAP\n\tuniform sampler2D aoMap;\n\tuniform float aoMapIntensity;\n#endif";
	THREE.ShaderChunk.begin_vertex="\nvec3 transformed = vec3( position );\n";THREE.ShaderChunk.beginnormal_vertex="\nvec3 objectNormal = vec3( normal );\n";THREE.ShaderChunk.bsdfs="bool testLightInRange( const in float lightDistance, const in float cutoffDistance ) {\n\treturn any( bvec2( cutoffDistance == 0.0, lightDistance < cutoffDistance ) );\n}\nfloat punctualLightIntensityToIrradianceFactor( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\t\tif( decayExponent > 0.0 ) {\n#if defined ( PHYSICALLY_CORRECT_LIGHTS )\n\t\t\tfloat distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n\t\t\tfloat maxDistanceCutoffFactor = pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n\t\t\treturn distanceFalloff * maxDistanceCutoffFactor;\n#else\n\t\t\treturn pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );\n#endif\n\t\t}\n\t\treturn 1.0;\n}\nvec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {\n\treturn RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {\n\tfloat fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );\n\treturn ( 1.0 - specularColor ) * fresnel + specularColor;\n}\nfloat G_GGX_Smith( const in float alpha, const in float dotNL, const in float dotNV ) {\n\tfloat a2 = pow2( alpha );\n\tfloat gl = dotNL + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n\tfloat gv = dotNV + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n\treturn 1.0 / ( gl * gv );\n}\nfloat G_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n\tfloat a2 = pow2( alpha );\n\tfloat gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n\tfloat gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n\treturn 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n\tfloat a2 = pow2( alpha );\n\tfloat denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n\treturn RECIPROCAL_PI * a2 / pow2( denom );\n}\nvec3 BRDF_Specular_GGX( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {\n\tfloat alpha = pow2( roughness );\n\tvec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );\n\tfloat dotNL = saturate( dot( geometry.normal, incidentLight.direction ) );\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\tfloat dotNH = saturate( dot( geometry.normal, halfDir ) );\n\tfloat dotLH = saturate( dot( incidentLight.direction, halfDir ) );\n\tvec3 F = F_Schlick( specularColor, dotLH );\n\tfloat G = G_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n\tfloat D = D_GGX( alpha, dotNH );\n\treturn F * ( G * D );\n}\nvec3 BRDF_Specular_GGX_Environment( const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\tconst vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );\n\tconst vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );\n\tvec4 r = roughness * c0 + c1;\n\tfloat a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;\n\tvec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;\n\treturn specularColor * AB.x + AB.y;\n}\nfloat G_BlinnPhong_Implicit( ) {\n\treturn 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n\treturn RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_Specular_BlinnPhong( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {\n\tvec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );\n\tfloat dotNH = saturate( dot( geometry.normal, halfDir ) );\n\tfloat dotLH = saturate( dot( incidentLight.direction, halfDir ) );\n\tvec3 F = F_Schlick( specularColor, dotLH );\n\tfloat G = G_BlinnPhong_Implicit( );\n\tfloat D = D_BlinnPhong( shininess, dotNH );\n\treturn F * ( G * D );\n}\nfloat GGXRoughnessToBlinnExponent( const in float ggxRoughness ) {\n\treturn ( 2.0 / pow2( ggxRoughness + 0.0001 ) - 2.0 );\n}\nfloat BlinnExponentToGGXRoughness( const in float blinnExponent ) {\n\treturn sqrt( 2.0 / ( blinnExponent + 2.0 ) );\n}\n";
	THREE.ShaderChunk.bumpmap_pars_fragment="#ifdef USE_BUMPMAP\n\tuniform sampler2D bumpMap;\n\tuniform float bumpScale;\n\tvec2 dHdxy_fwd() {\n\t\tvec2 dSTdx = dFdx( vUv );\n\t\tvec2 dSTdy = dFdy( vUv );\n\t\tfloat Hll = bumpScale * texture2D( bumpMap, vUv ).x;\n\t\tfloat dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;\n\t\tfloat dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;\n\t\treturn vec2( dBx, dBy );\n\t}\n\tvec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {\n\t\tvec3 vSigmaX = dFdx( surf_pos );\n\t\tvec3 vSigmaY = dFdy( surf_pos );\n\t\tvec3 vN = surf_norm;\n\t\tvec3 R1 = cross( vSigmaY, vN );\n\t\tvec3 R2 = cross( vN, vSigmaX );\n\t\tfloat fDet = dot( vSigmaX, R1 );\n\t\tvec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n\t\treturn normalize( abs( fDet ) * surf_norm - vGrad );\n\t}\n#endif\n";
	THREE.ShaderChunk.clipping_planes_fragment="#if NUM_CLIPPING_PLANES > 0\n\tfor ( int i = 0; i < NUM_CLIPPING_PLANES; ++ i ) {\n\t\tvec4 plane = clippingPlanes[ i ];\n\t\tif ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;\n\t}\n#endif\n";THREE.ShaderChunk.clipping_planes_pars_fragment="#if NUM_CLIPPING_PLANES > 0\n\t#if ! defined( PHYSICAL ) && ! defined( PHONG )\n\t\tvarying vec3 vViewPosition;\n\t#endif\n\tuniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif\n";
	THREE.ShaderChunk.clipping_planes_pars_vertex="#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )\n\tvarying vec3 vViewPosition;\n#endif\n";THREE.ShaderChunk.clipping_planes_vertex="#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )\n\tvViewPosition = - mvPosition.xyz;\n#endif\n";THREE.ShaderChunk.color_fragment="#ifdef USE_COLOR\n\tdiffuseColor.rgb *= vColor;\n#endif";THREE.ShaderChunk.color_pars_fragment="#ifdef USE_COLOR\n\tvarying vec3 vColor;\n#endif\n";
	THREE.ShaderChunk.color_pars_vertex="#ifdef USE_COLOR\n\tvarying vec3 vColor;\n#endif";THREE.ShaderChunk.color_vertex="#ifdef USE_COLOR\n\tvColor.xyz = color.xyz;\n#endif";THREE.ShaderChunk.common="#define PI 3.14159265359\n#define PI2 6.28318530718\n#define RECIPROCAL_PI 0.31830988618\n#define RECIPROCAL_PI2 0.15915494\n#define LOG2 1.442695\n#define EPSILON 1e-6\n#define saturate(a) clamp( a, 0.0, 1.0 )\n#define whiteCompliment(a) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }\nhighp float rand( const in vec2 uv ) {\n\tconst highp float a = 12.9898, b = 78.233, c = 43758.5453;\n\thighp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n\treturn fract(sin(sn) * c);\n}\nstruct IncidentLight {\n\tvec3 color;\n\tvec3 direction;\n\tbool visible;\n};\nstruct ReflectedLight {\n\tvec3 directDiffuse;\n\tvec3 directSpecular;\n\tvec3 indirectDiffuse;\n\tvec3 indirectSpecular;\n};\nstruct GeometricContext {\n\tvec3 position;\n\tvec3 normal;\n\tvec3 viewDir;\n};\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\nvec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );\n}\nvec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {\n\tfloat distance = dot( planeNormal, point - pointOnPlane );\n\treturn - distance * planeNormal + point;\n}\nfloat sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {\n\treturn sign( dot( point - pointOnPlane, planeNormal ) );\n}\nvec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {\n\treturn lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;\n}\n";
	THREE.ShaderChunk.cube_uv_reflection_fragment="#ifdef ENVMAP_TYPE_CUBE_UV\n#define cubeUV_textureSize (1024.0)\nint getFaceFromDirection(vec3 direction) {\n\tvec3 absDirection = abs(direction);\n\tint face = -1;\n\tif( absDirection.x > absDirection.z ) {\n\t\tif(absDirection.x > absDirection.y )\n\t\t\tface = direction.x > 0.0 ? 0 : 3;\n\t\telse\n\t\t\tface = direction.y > 0.0 ? 1 : 4;\n\t}\n\telse {\n\t\tif(absDirection.z > absDirection.y )\n\t\t\tface = direction.z > 0.0 ? 2 : 5;\n\t\telse\n\t\t\tface = direction.y > 0.0 ? 1 : 4;\n\t}\n\treturn face;\n}\n#define cubeUV_maxLods1  (log2(cubeUV_textureSize*0.25) - 1.0)\n#define cubeUV_rangeClamp (exp2((6.0 - 1.0) * 2.0))\nvec2 MipLevelInfo( vec3 vec, float roughnessLevel, float roughness ) {\n\tfloat scale = exp2(cubeUV_maxLods1 - roughnessLevel);\n\tfloat dxRoughness = dFdx(roughness);\n\tfloat dyRoughness = dFdy(roughness);\n\tvec3 dx = dFdx( vec * scale * dxRoughness );\n\tvec3 dy = dFdy( vec * scale * dyRoughness );\n\tfloat d = max( dot( dx, dx ), dot( dy, dy ) );\n\td = clamp(d, 1.0, cubeUV_rangeClamp);\n\tfloat mipLevel = 0.5 * log2(d);\n\treturn vec2(floor(mipLevel), fract(mipLevel));\n}\n#define cubeUV_maxLods2 (log2(cubeUV_textureSize*0.25) - 2.0)\n#define cubeUV_rcpTextureSize (1.0 / cubeUV_textureSize)\nvec2 getCubeUV(vec3 direction, float roughnessLevel, float mipLevel) {\n\tmipLevel = roughnessLevel > cubeUV_maxLods2 - 3.0 ? 0.0 : mipLevel;\n\tfloat a = 16.0 * cubeUV_rcpTextureSize;\n\tvec2 exp2_packed = exp2( vec2( roughnessLevel, mipLevel ) );\n\tvec2 rcp_exp2_packed = vec2( 1.0 ) / exp2_packed;\n\tfloat powScale = exp2_packed.x * exp2_packed.y;\n\tfloat scale = rcp_exp2_packed.x * rcp_exp2_packed.y * 0.25;\n\tfloat mipOffset = 0.75*(1.0 - rcp_exp2_packed.y) * rcp_exp2_packed.x;\n\tbool bRes = mipLevel == 0.0;\n\tscale =  bRes && (scale < a) ? a : scale;\n\tvec3 r;\n\tvec2 offset;\n\tint face = getFaceFromDirection(direction);\n\tfloat rcpPowScale = 1.0 / powScale;\n\tif( face == 0) {\n\t\tr = vec3(direction.x, -direction.z, direction.y);\n\t\toffset = vec2(0.0+mipOffset,0.75 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ?  a : offset.y;\n\t}\n\telse if( face == 1) {\n\t\tr = vec3(direction.y, direction.x, direction.z);\n\t\toffset = vec2(scale+mipOffset, 0.75 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ?  a : offset.y;\n\t}\n\telse if( face == 2) {\n\t\tr = vec3(direction.z, direction.x, direction.y);\n\t\toffset = vec2(2.0*scale+mipOffset, 0.75 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ?  a : offset.y;\n\t}\n\telse if( face == 3) {\n\t\tr = vec3(direction.x, direction.z, direction.y);\n\t\toffset = vec2(0.0+mipOffset,0.5 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ?  0.0 : offset.y;\n\t}\n\telse if( face == 4) {\n\t\tr = vec3(direction.y, direction.x, -direction.z);\n\t\toffset = vec2(scale+mipOffset, 0.5 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ?  0.0 : offset.y;\n\t}\n\telse {\n\t\tr = vec3(direction.z, -direction.x, direction.y);\n\t\toffset = vec2(2.0*scale+mipOffset, 0.5 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ?  0.0 : offset.y;\n\t}\n\tr = normalize(r);\n\tfloat texelOffset = 0.5 * cubeUV_rcpTextureSize;\n\tvec2 s = ( r.yz / abs( r.x ) + vec2( 1.0 ) ) * 0.5;\n\tvec2 base = offset + vec2( texelOffset );\n\treturn base + s * ( scale - 2.0 * texelOffset );\n}\n#define cubeUV_maxLods3 (log2(cubeUV_textureSize*0.25) - 3.0)\nvec4 textureCubeUV(vec3 reflectedDirection, float roughness ) {\n\tfloat roughnessVal = roughness* cubeUV_maxLods3;\n\tfloat r1 = floor(roughnessVal);\n\tfloat r2 = r1 + 1.0;\n\tfloat t = fract(roughnessVal);\n\tvec2 mipInfo = MipLevelInfo(reflectedDirection, r1, roughness);\n\tfloat s = mipInfo.y;\n\tfloat level0 = mipInfo.x;\n\tfloat level1 = level0 + 1.0;\n\tlevel1 = level1 > 5.0 ? 5.0 : level1;\n\tlevel0 += min( floor( s + 0.5 ), 5.0 );\n\tvec2 uv_10 = getCubeUV(reflectedDirection, r1, level0);\n\tvec4 color10 = envMapTexelToLinear(texture2D(envMap, uv_10));\n\tvec2 uv_20 = getCubeUV(reflectedDirection, r2, level0);\n\tvec4 color20 = envMapTexelToLinear(texture2D(envMap, uv_20));\n\tvec4 result = mix(color10, color20, t);\n\treturn vec4(result.rgb, 1.0);\n}\n#endif\n";
	THREE.ShaderChunk.defaultnormal_vertex="#ifdef FLIP_SIDED\n\tobjectNormal = -objectNormal;\n#endif\nvec3 transformedNormal = normalMatrix * objectNormal;\n";THREE.ShaderChunk.displacementmap_vertex="#ifdef USE_DISPLACEMENTMAP\n\ttransformed += normal * ( texture2D( displacementMap, uv ).x * displacementScale + displacementBias );\n#endif\n";THREE.ShaderChunk.displacementmap_pars_vertex="#ifdef USE_DISPLACEMENTMAP\n\tuniform sampler2D displacementMap;\n\tuniform float displacementScale;\n\tuniform float displacementBias;\n#endif\n";
	THREE.ShaderChunk.emissivemap_fragment="#ifdef USE_EMISSIVEMAP\n\tvec4 emissiveColor = texture2D( emissiveMap, vUv );\n\temissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;\n\ttotalEmissiveRadiance *= emissiveColor.rgb;\n#endif\n";THREE.ShaderChunk.emissivemap_pars_fragment="#ifdef USE_EMISSIVEMAP\n\tuniform sampler2D emissiveMap;\n#endif\n";THREE.ShaderChunk.encodings_pars_fragment="\nvec4 LinearToLinear( in vec4 value ) {\n  return value;\n}\nvec4 GammaToLinear( in vec4 value, in float gammaFactor ) {\n  return vec4( pow( value.xyz, vec3( gammaFactor ) ), value.w );\n}\nvec4 LinearToGamma( in vec4 value, in float gammaFactor ) {\n  return vec4( pow( value.xyz, vec3( 1.0 / gammaFactor ) ), value.w );\n}\nvec4 sRGBToLinear( in vec4 value ) {\n  return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.w );\n}\nvec4 LinearTosRGB( in vec4 value ) {\n  return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.w );\n}\nvec4 RGBEToLinear( in vec4 value ) {\n  return vec4( value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );\n}\nvec4 LinearToRGBE( in vec4 value ) {\n  float maxComponent = max( max( value.r, value.g ), value.b );\n  float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );\n  return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );\n}\nvec4 RGBMToLinear( in vec4 value, in float maxRange ) {\n  return vec4( value.xyz * value.w * maxRange, 1.0 );\n}\nvec4 LinearToRGBM( in vec4 value, in float maxRange ) {\n  float maxRGB = max( value.x, max( value.g, value.b ) );\n  float M      = clamp( maxRGB / maxRange, 0.0, 1.0 );\n  M            = ceil( M * 255.0 ) / 255.0;\n  return vec4( value.rgb / ( M * maxRange ), M );\n}\nvec4 RGBDToLinear( in vec4 value, in float maxRange ) {\n    return vec4( value.rgb * ( ( maxRange / 255.0 ) / value.a ), 1.0 );\n}\nvec4 LinearToRGBD( in vec4 value, in float maxRange ) {\n    float maxRGB = max( value.x, max( value.g, value.b ) );\n    float D      = max( maxRange / maxRGB, 1.0 );\n    D            = min( floor( D ) / 255.0, 1.0 );\n    return vec4( value.rgb * ( D * ( 255.0 / maxRange ) ), D );\n}\nconst mat3 cLogLuvM = mat3( 0.2209, 0.3390, 0.4184, 0.1138, 0.6780, 0.7319, 0.0102, 0.1130, 0.2969 );\nvec4 LinearToLogLuv( in vec4 value )  {\n  vec3 Xp_Y_XYZp = value.rgb * cLogLuvM;\n  Xp_Y_XYZp = max(Xp_Y_XYZp, vec3(1e-6, 1e-6, 1e-6));\n  vec4 vResult;\n  vResult.xy = Xp_Y_XYZp.xy / Xp_Y_XYZp.z;\n  float Le = 2.0 * log2(Xp_Y_XYZp.y) + 127.0;\n  vResult.w = fract(Le);\n  vResult.z = (Le - (floor(vResult.w*255.0))/255.0)/255.0;\n  return vResult;\n}\nconst mat3 cLogLuvInverseM = mat3( 6.0014, -2.7008, -1.7996, -1.3320, 3.1029, -5.7721, 0.3008, -1.0882, 5.6268 );\nvec4 LogLuvToLinear( in vec4 value ) {\n  float Le = value.z * 255.0 + value.w;\n  vec3 Xp_Y_XYZp;\n  Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);\n  Xp_Y_XYZp.z = Xp_Y_XYZp.y / value.y;\n  Xp_Y_XYZp.x = value.x * Xp_Y_XYZp.z;\n  vec3 vRGB = Xp_Y_XYZp.rgb * cLogLuvInverseM;\n  return vec4( max(vRGB, 0.0), 1.0 );\n}\n";
	THREE.ShaderChunk.encodings_fragment="  gl_FragColor = linearToOutputTexel( gl_FragColor );\n";THREE.ShaderChunk.envmap_fragment="#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\t\tvec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );\n\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvec3 reflectVec = reflect( cameraToVertex, worldNormal );\n\t\t#else\n\t\t\tvec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );\n\t\t#endif\n\t#else\n\t\tvec3 reflectVec = vReflect;\n\t#endif\n\t#ifdef DOUBLE_SIDED\n\t\tfloat flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t#else\n\t\tfloat flipNormal = 1.0;\n\t#endif\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tvec4 envColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\n\t#elif defined( ENVMAP_TYPE_EQUIREC )\n\t\tvec2 sampleUV;\n\t\tsampleUV.y = saturate( flipNormal * reflectVec.y * 0.5 + 0.5 );\n\t\tsampleUV.x = atan( flipNormal * reflectVec.z, flipNormal * reflectVec.x ) * RECIPROCAL_PI2 + 0.5;\n\t\tvec4 envColor = texture2D( envMap, sampleUV );\n\t#elif defined( ENVMAP_TYPE_SPHERE )\n\t\tvec3 reflectView = flipNormal * normalize((viewMatrix * vec4( reflectVec, 0.0 )).xyz + vec3(0.0,0.0,1.0));\n\t\tvec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );\n\t#endif\n\tenvColor = envMapTexelToLinear( envColor );\n\t#ifdef ENVMAP_BLENDING_MULTIPLY\n\t\toutgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_MIX )\n\t\toutgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_ADD )\n\t\toutgoingLight += envColor.xyz * specularStrength * reflectivity;\n\t#endif\n#endif\n";
	THREE.ShaderChunk.envmap_pars_fragment="#if defined( USE_ENVMAP ) || defined( PHYSICAL )\n\tuniform float reflectivity;\n\tuniform float envMapIntenstiy;\n#endif\n#ifdef USE_ENVMAP\n\t#if ! defined( PHYSICAL ) && ( defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) )\n\t\tvarying vec3 vWorldPosition;\n\t#endif\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tuniform samplerCube envMap;\n\t#else\n\t\tuniform sampler2D envMap;\n\t#endif\n\tuniform float flipEnvMap;\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( PHYSICAL )\n\t\tuniform float refractionRatio;\n\t#else\n\t\tvarying vec3 vReflect;\n\t#endif\n#endif\n";
	THREE.ShaderChunk.envmap_pars_vertex="#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\t\tvarying vec3 vWorldPosition;\n\t#else\n\t\tvarying vec3 vReflect;\n\t\tuniform float refractionRatio;\n\t#endif\n#endif\n";THREE.ShaderChunk.envmap_vertex="#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\t\tvWorldPosition = worldPosition.xyz;\n\t#else\n\t\tvec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n\t\tvec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvReflect = reflect( cameraToVertex, worldNormal );\n\t\t#else\n\t\t\tvReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n\t\t#endif\n\t#endif\n#endif\n";
	THREE.ShaderChunk.fog_fragment="#ifdef USE_FOG\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\t\tfloat depth = gl_FragDepthEXT / gl_FragCoord.w;\n\t#else\n\t\tfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n\t#endif\n\t#ifdef FOG_EXP2\n\t\tfloat fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 ) );\n\t#else\n\t\tfloat fogFactor = smoothstep( fogNear, fogFar, depth );\n\t#endif\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif\n";
	THREE.ShaderChunk.fog_pars_fragment="#ifdef USE_FOG\n\tuniform vec3 fogColor;\n\t#ifdef FOG_EXP2\n\t\tuniform float fogDensity;\n\t#else\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\t#endif\n#endif";THREE.ShaderChunk.lightmap_fragment="#ifdef USE_LIGHTMAP\n\treflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n#endif\n";THREE.ShaderChunk.lightmap_pars_fragment="#ifdef USE_LIGHTMAP\n\tuniform sampler2D lightMap;\n\tuniform float lightMapIntensity;\n#endif";
	THREE.ShaderChunk.lights_lambert_vertex="vec3 diffuse = vec3( 1.0 );\nGeometricContext geometry;\ngeometry.position = mvPosition.xyz;\ngeometry.normal = normalize( transformedNormal );\ngeometry.viewDir = normalize( -mvPosition.xyz );\nGeometricContext backGeometry;\nbackGeometry.position = geometry.position;\nbackGeometry.normal = -geometry.normal;\nbackGeometry.viewDir = geometry.viewDir;\nvLightFront = vec3( 0.0 );\n#ifdef DOUBLE_SIDED\n\tvLightBack = vec3( 0.0 );\n#endif\nIncidentLight directLight;\nfloat dotNL;\nvec3 directLightColor_Diffuse;\n#if NUM_POINT_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tgetPointDirectLightIrradiance( pointLights[ i ], geometry, directLight );\n\t\tdotNL = dot( geometry.normal, directLight.direction );\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\n\t\t#endif\n\t}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tgetSpotDirectLightIrradiance( spotLights[ i ], geometry, directLight );\n\t\tdotNL = dot( geometry.normal, directLight.direction );\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\n\t\t#endif\n\t}\n#endif\n#if NUM_DIR_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tgetDirectionalDirectLightIrradiance( directionalLights[ i ], geometry, directLight );\n\t\tdotNL = dot( geometry.normal, directLight.direction );\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\n\t\t#endif\n\t}\n#endif\n#if NUM_HEMI_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\tvLightFront += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += getHemisphereLightIrradiance( hemisphereLights[ i ], backGeometry );\n\t\t#endif\n\t}\n#endif\n";
	THREE.ShaderChunk.lights_pars="uniform vec3 ambientLightColor;\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n\tvec3 irradiance = ambientLightColor;\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tirradiance *= PI;\n\t#endif\n\treturn irradiance;\n}\n#if NUM_DIR_LIGHTS > 0\n\tstruct DirectionalLight {\n\t\tvec3 direction;\n\t\tvec3 color;\n\t\tint shadow;\n\t\tfloat shadowBias;\n\t\tfloat shadowRadius;\n\t\tvec2 shadowMapSize;\n\t};\n\tuniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n\tvoid getDirectionalDirectLightIrradiance( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight ) {\n\t\tdirectLight.color = directionalLight.color;\n\t\tdirectLight.direction = directionalLight.direction;\n\t\tdirectLight.visible = true;\n\t}\n#endif\n#if NUM_POINT_LIGHTS > 0\n\tstruct PointLight {\n\t\tvec3 position;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t\tint shadow;\n\t\tfloat shadowBias;\n\t\tfloat shadowRadius;\n\t\tvec2 shadowMapSize;\n\t};\n\tuniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n\tvoid getPointDirectLightIrradiance( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight ) {\n\t\tvec3 lVector = pointLight.position - geometry.position;\n\t\tdirectLight.direction = normalize( lVector );\n\t\tfloat lightDistance = length( lVector );\n\t\tif ( testLightInRange( lightDistance, pointLight.distance ) ) {\n\t\t\tdirectLight.color = pointLight.color;\n\t\t\tdirectLight.color *= punctualLightIntensityToIrradianceFactor( lightDistance, pointLight.distance, pointLight.decay );\n\t\t\tdirectLight.visible = true;\n\t\t} else {\n\t\t\tdirectLight.color = vec3( 0.0 );\n\t\t\tdirectLight.visible = false;\n\t\t}\n\t}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n\tstruct SpotLight {\n\t\tvec3 position;\n\t\tvec3 direction;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t\tfloat coneCos;\n\t\tfloat penumbraCos;\n\t\tint shadow;\n\t\tfloat shadowBias;\n\t\tfloat shadowRadius;\n\t\tvec2 shadowMapSize;\n\t};\n\tuniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n\tvoid getSpotDirectLightIrradiance( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight  ) {\n\t\tvec3 lVector = spotLight.position - geometry.position;\n\t\tdirectLight.direction = normalize( lVector );\n\t\tfloat lightDistance = length( lVector );\n\t\tfloat angleCos = dot( directLight.direction, spotLight.direction );\n\t\tif ( all( bvec2( angleCos > spotLight.coneCos, testLightInRange( lightDistance, spotLight.distance ) ) ) ) {\n\t\t\tfloat spotEffect = smoothstep( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n\t\t\tdirectLight.color = spotLight.color;\n\t\t\tdirectLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor( lightDistance, spotLight.distance, spotLight.decay );\n\t\t\tdirectLight.visible = true;\n\t\t} else {\n\t\t\tdirectLight.color = vec3( 0.0 );\n\t\t\tdirectLight.visible = false;\n\t\t}\n\t}\n#endif\n#if NUM_HEMI_LIGHTS > 0\n\tstruct HemisphereLight {\n\t\tvec3 direction;\n\t\tvec3 skyColor;\n\t\tvec3 groundColor;\n\t};\n\tuniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n\tvec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in GeometricContext geometry ) {\n\t\tfloat dotNL = dot( geometry.normal, hemiLight.direction );\n\t\tfloat hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n\t\tvec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n\t\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\t\tirradiance *= PI;\n\t\t#endif\n\t\treturn irradiance;\n\t}\n#endif\n#if defined( USE_ENVMAP ) && defined( PHYSICAL )\n\tvec3 getLightProbeIndirectIrradiance( const in GeometricContext geometry, const in int maxMIPLevel ) {\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tfloat flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t\t#else\n\t\t\tfloat flipNormal = 1.0;\n\t\t#endif\n\t\tvec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );\n\t\t#ifdef ENVMAP_TYPE_CUBE\n\t\t\tvec3 queryVec = flipNormal * vec3( flipEnvMap * worldNormal.x, worldNormal.yz );\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#elif defined( ENVMAP_TYPE_CUBE_UV )\n\t\t\tvec3 queryVec = flipNormal * vec3( flipEnvMap * worldNormal.x, worldNormal.yz );\n\t\t\tvec4 envMapColor = textureCubeUV( queryVec, 1.0 );\n\t\t#else\n\t\t\tvec4 envMapColor = vec4( 0.0 );\n\t\t#endif\n\t\treturn PI * envMapColor.rgb * envMapIntensity;\n\t}\n\tfloat getSpecularMIPLevel( const in float blinnShininessExponent, const in int maxMIPLevel ) {\n\t\tfloat maxMIPLevelScalar = float( maxMIPLevel );\n\t\tfloat desiredMIPLevel = maxMIPLevelScalar - 0.79248 - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );\n\t\treturn clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );\n\t}\n\tvec3 getLightProbeIndirectRadiance( const in GeometricContext geometry, const in float blinnShininessExponent, const in int maxMIPLevel ) {\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );\n\t\t#else\n\t\t\tvec3 reflectVec = refract( -geometry.viewDir, geometry.normal, refractionRatio );\n\t\t#endif\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tfloat flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t\t#else\n\t\t\tfloat flipNormal = 1.0;\n\t\t#endif\n\t\treflectVec = inverseTransformDirection( reflectVec, viewMatrix );\n\t\tfloat specularMIPLevel = getSpecularMIPLevel( blinnShininessExponent, maxMIPLevel );\n\t\t#ifdef ENVMAP_TYPE_CUBE\n\t\t\tvec3 queryReflectVec = flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz );\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#elif defined( ENVMAP_TYPE_CUBE_UV )\n\t\t\tvec3 queryReflectVec = flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz );\n\t\t\tvec4 envMapColor = textureCubeUV(queryReflectVec, BlinnExponentToGGXRoughness(blinnShininessExponent));\n\t\t#elif defined( ENVMAP_TYPE_EQUIREC )\n\t\t\tvec2 sampleUV;\n\t\t\tsampleUV.y = saturate( flipNormal * reflectVec.y * 0.5 + 0.5 );\n\t\t\tsampleUV.x = atan( flipNormal * reflectVec.z, flipNormal * reflectVec.x ) * RECIPROCAL_PI2 + 0.5;\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = texture2DLodEXT( envMap, sampleUV, specularMIPLevel );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = texture2D( envMap, sampleUV, specularMIPLevel );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#elif defined( ENVMAP_TYPE_SPHERE )\n\t\t\tvec3 reflectView = flipNormal * normalize((viewMatrix * vec4( reflectVec, 0.0 )).xyz + vec3(0.0,0.0,1.0));\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = texture2DLodEXT( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#endif\n\t\treturn envMapColor.rgb * envMapIntensity;\n\t}\n#endif\n";
	THREE.ShaderChunk.lights_phong_fragment="BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;\n";THREE.ShaderChunk.lights_phong_pars_fragment="varying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\nstruct BlinnPhongMaterial {\n\tvec3\tdiffuseColor;\n\tvec3\tspecularColor;\n\tfloat\tspecularShininess;\n\tfloat\tspecularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometry.normal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tirradiance *= PI;\n\t#endif\n\treflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n\treflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_BlinnPhong\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_BlinnPhong\n#define Material_LightProbeLOD( material )\t(0)\n";
	THREE.ShaderChunk.lights_physical_fragment="PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nmaterial.specularRoughness = clamp( roughnessFactor, 0.04, 1.0 );\n#ifdef STANDARD\n\tmaterial.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );\n#else\n\tmaterial.specularColor = mix( vec3( 0.16 * pow2( reflectivity ) ), diffuseColor.rgb, metalnessFactor );\n#endif\n";THREE.ShaderChunk.lights_physical_pars_fragment="struct PhysicalMaterial {\n\tvec3\tdiffuseColor;\n\tfloat\tspecularRoughness;\n\tvec3\tspecularColor;\n\t#ifndef STANDARD\n\t#endif\n};\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometry.normal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tirradiance *= PI;\n\t#endif\n\treflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n\treflectedLight.directSpecular += irradiance * BRDF_Specular_GGX( directLight, geometry, material.specularColor, material.specularRoughness );\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectSpecular += radiance * BRDF_Specular_GGX_Environment( geometry, material.specularColor, material.specularRoughness );\n}\n#define RE_Direct\t\t\t\tRE_Direct_Physical\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular\t\tRE_IndirectSpecular_Physical\n#define Material_BlinnShininessExponent( material )   GGXRoughnessToBlinnExponent( material.specularRoughness )\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n\treturn saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}\n";
	THREE.ShaderChunk.lights_template="\nGeometricContext geometry;\ngeometry.position = - vViewPosition;\ngeometry.normal = normal;\ngeometry.viewDir = normalize( vViewPosition );\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\tPointLight pointLight;\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tgetPointDirectLightIrradiance( pointLight, geometry, directLight );\n\t\t#ifdef USE_SHADOWMAP\n\t\tdirectLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\tSpotLight spotLight;\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tgetSpotDirectLightIrradiance( spotLight, geometry, directLight );\n\t\t#ifdef USE_SHADOWMAP\n\t\tdirectLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\tDirectionalLight directionalLight;\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tgetDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );\n\t\t#ifdef USE_SHADOWMAP\n\t\tdirectLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if defined( RE_IndirectDiffuse )\n\tvec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\t#ifdef USE_LIGHTMAP\n\t\tvec3 lightMapIrradiance = texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n\t\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\t\tlightMapIrradiance *= PI;\n\t\t#endif\n\t\tirradiance += lightMapIrradiance;\n\t#endif\n\t#if ( NUM_HEMI_LIGHTS > 0 )\n\t\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\t\tirradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\n\t\t}\n\t#endif\n\t#if defined( USE_ENVMAP ) && defined( PHYSICAL ) && defined( ENVMAP_TYPE_CUBE_UV )\n\t \tirradiance += getLightProbeIndirectIrradiance( geometry, 8 );\n\t#endif\n\tRE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n\tvec3 radiance = getLightProbeIndirectRadiance( geometry, Material_BlinnShininessExponent( material ), 8 );\n\tRE_IndirectSpecular( radiance, geometry, material, reflectedLight );\n#endif\n";
	THREE.ShaderChunk.logdepthbuf_fragment="#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\n\tgl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\n#endif";THREE.ShaderChunk.logdepthbuf_pars_fragment="#ifdef USE_LOGDEPTHBUF\n\tuniform float logDepthBufFC;\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\t\tvarying float vFragDepth;\n\t#endif\n#endif\n";THREE.ShaderChunk.logdepthbuf_pars_vertex="#ifdef USE_LOGDEPTHBUF\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\t\tvarying float vFragDepth;\n\t#endif\n\tuniform float logDepthBufFC;\n#endif";
	THREE.ShaderChunk.logdepthbuf_vertex="#ifdef USE_LOGDEPTHBUF\n\tgl_Position.z = log2(max( EPSILON, gl_Position.w + 1.0 )) * logDepthBufFC;\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\t\tvFragDepth = 1.0 + gl_Position.w;\n\t#else\n\t\tgl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;\n\t#endif\n#endif\n";THREE.ShaderChunk.map_fragment="#ifdef USE_MAP\n\tvec4 texelColor = texture2D( map, vUv );\n\ttexelColor = mapTexelToLinear( texelColor );\n\tdiffuseColor *= texelColor;\n#endif\n";
	THREE.ShaderChunk.map_pars_fragment="#ifdef USE_MAP\n\tuniform sampler2D map;\n#endif\n";THREE.ShaderChunk.map_particle_fragment="#ifdef USE_MAP\n\tvec4 mapTexel = texture2D( map, vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) * offsetRepeat.zw + offsetRepeat.xy );\n\tdiffuseColor *= mapTexelToLinear( mapTexel );\n#endif\n";THREE.ShaderChunk.map_particle_pars_fragment="#ifdef USE_MAP\n\tuniform vec4 offsetRepeat;\n\tuniform sampler2D map;\n#endif\n";THREE.ShaderChunk.metalnessmap_fragment="float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n\tvec4 texelMetalness = texture2D( metalnessMap, vUv );\n\tmetalnessFactor *= texelMetalness.r;\n#endif\n";
	THREE.ShaderChunk.metalnessmap_pars_fragment="#ifdef USE_METALNESSMAP\n\tuniform sampler2D metalnessMap;\n#endif";THREE.ShaderChunk.morphnormal_vertex="#ifdef USE_MORPHNORMALS\n\tobjectNormal += ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];\n\tobjectNormal += ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];\n\tobjectNormal += ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];\n\tobjectNormal += ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];\n#endif\n";
	THREE.ShaderChunk.morphtarget_pars_vertex="#ifdef USE_MORPHTARGETS\n\t#ifndef USE_MORPHNORMALS\n\tuniform float morphTargetInfluences[ 8 ];\n\t#else\n\tuniform float morphTargetInfluences[ 4 ];\n\t#endif\n#endif";THREE.ShaderChunk.morphtarget_vertex="#ifdef USE_MORPHTARGETS\n\ttransformed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];\n\ttransformed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];\n\ttransformed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];\n\ttransformed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];\n\t#ifndef USE_MORPHNORMALS\n\ttransformed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];\n\ttransformed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];\n\ttransformed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];\n\ttransformed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];\n\t#endif\n#endif\n";
	THREE.ShaderChunk.normal_fragment="#ifdef FLAT_SHADED\n\tvec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );\n\tvec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );\n\tvec3 normal = normalize( cross( fdx, fdy ) );\n#else\n\tvec3 normal = normalize( vNormal );\n\t#ifdef DOUBLE_SIDED\n\t\tnormal = normal * ( -1.0 + 2.0 * float( gl_FrontFacing ) );\n\t#endif\n#endif\n#ifdef USE_NORMALMAP\n\tnormal = perturbNormal2Arb( -vViewPosition, normal );\n#elif defined( USE_BUMPMAP )\n\tnormal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );\n#endif\n";
	THREE.ShaderChunk.normalmap_pars_fragment="#ifdef USE_NORMALMAP\n\tuniform sampler2D normalMap;\n\tuniform vec2 normalScale;\n\tvec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {\n\t\tvec3 q0 = dFdx( eye_pos.xyz );\n\t\tvec3 q1 = dFdy( eye_pos.xyz );\n\t\tvec2 st0 = dFdx( vUv.st );\n\t\tvec2 st1 = dFdy( vUv.st );\n\t\tvec3 S = normalize( q0 * st1.t - q1 * st0.t );\n\t\tvec3 T = normalize( -q0 * st1.s + q1 * st0.s );\n\t\tvec3 N = normalize( surf_norm );\n\t\tvec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;\n\t\tmapN.xy = normalScale * mapN.xy;\n\t\tmat3 tsn = mat3( S, T, N );\n\t\treturn normalize( tsn * mapN );\n\t}\n#endif\n";
	THREE.ShaderChunk.packing="vec3 packNormalToRGB( const in vec3 normal ) {\n  return normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n  return 1.0 - 2.0 * rgb.xyz;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;\nconst vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );\nconst vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );\nconst float ShiftRight8 = 1. / 256.;\nvec4 packDepthToRGBA( const in float v ) {\n\tvec4 r = vec4( fract( v * PackFactors ), v );\n\tr.yzw -= r.xyz * ShiftRight8;\treturn r * PackUpscale;\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n\treturn dot( v, UnpackFactors );\n}\nfloat viewZToOrthoDepth( const in float viewZ, const in float near, const in float far ) {\n  return ( viewZ + near ) / ( near - far );\n}\nfloat OrthoDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {\n  return linearClipZ * ( near - far ) - near;\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n  return (( near + viewZ ) * far ) / (( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {\n  return ( near * far ) / ( ( far - near ) * invClipZ - far );\n}\n";
	THREE.ShaderChunk.premultiplied_alpha_fragment="#ifdef PREMULTIPLIED_ALPHA\n\tgl_FragColor.rgb *= gl_FragColor.a;\n#endif\n";THREE.ShaderChunk.project_vertex="#ifdef USE_SKINNING\n\tvec4 mvPosition = modelViewMatrix * skinned;\n#else\n\tvec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\n#endif\ngl_Position = projectionMatrix * mvPosition;\n";THREE.ShaderChunk.roughnessmap_fragment="float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n\tvec4 texelRoughness = texture2D( roughnessMap, vUv );\n\troughnessFactor *= texelRoughness.r;\n#endif\n";
	THREE.ShaderChunk.roughnessmap_pars_fragment="#ifdef USE_ROUGHNESSMAP\n\tuniform sampler2D roughnessMap;\n#endif";THREE.ShaderChunk.shadowmap_pars_fragment="#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\t\tuniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\t\tuniform sampler2D spotShadowMap[ NUM_SPOT_LIGHTS ];\n\t\tvarying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\t\tuniform sampler2D pointShadowMap[ NUM_POINT_LIGHTS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];\n\t#endif\n\tfloat texture2DCompare( sampler2D depths, vec2 uv, float compare ) {\n\t\treturn step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );\n\t}\n\tfloat texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {\n\t\tconst vec2 offset = vec2( 0.0, 1.0 );\n\t\tvec2 texelSize = vec2( 1.0 ) / size;\n\t\tvec2 centroidUV = floor( uv * size + 0.5 ) / size;\n\t\tfloat lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );\n\t\tfloat lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );\n\t\tfloat rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );\n\t\tfloat rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );\n\t\tvec2 f = fract( uv * size + 0.5 );\n\t\tfloat a = mix( lb, lt, f.y );\n\t\tfloat b = mix( rb, rt, f.y );\n\t\tfloat c = mix( a, b, f.x );\n\t\treturn c;\n\t}\n\tfloat getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n\t\tshadowCoord.xyz /= shadowCoord.w;\n\t\tshadowCoord.z += shadowBias;\n\t\tbvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );\n\t\tbool inFrustum = all( inFrustumVec );\n\t\tbvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );\n\t\tbool frustumTest = all( frustumTestVec );\n\t\tif ( frustumTest ) {\n\t\t#if defined( SHADOWMAP_TYPE_PCF )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\n\t\t\treturn (\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#elif defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\n\t\t\treturn (\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#else\n\t\t\treturn texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );\n\t\t#endif\n\t\t}\n\t\treturn 1.0;\n\t}\n\tvec2 cubeToUV( vec3 v, float texelSizeY ) {\n\t\tvec3 absV = abs( v );\n\t\tfloat scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );\n\t\tabsV *= scaleToCube;\n\t\tv *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );\n\t\tvec2 planar = v.xy;\n\t\tfloat almostATexel = 1.5 * texelSizeY;\n\t\tfloat almostOne = 1.0 - almostATexel;\n\t\tif ( absV.z >= almostOne ) {\n\t\t\tif ( v.z > 0.0 )\n\t\t\t\tplanar.x = 4.0 - v.x;\n\t\t} else if ( absV.x >= almostOne ) {\n\t\t\tfloat signX = sign( v.x );\n\t\t\tplanar.x = v.z * signX + 2.0 * signX;\n\t\t} else if ( absV.y >= almostOne ) {\n\t\t\tfloat signY = sign( v.y );\n\t\t\tplanar.x = v.x + 2.0 * signY + 2.0;\n\t\t\tplanar.y = v.z * signY - 2.0;\n\t\t}\n\t\treturn vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );\n\t}\n\tfloat getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n\t\tvec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );\n\t\tvec3 lightToPosition = shadowCoord.xyz;\n\t\tvec3 bd3D = normalize( lightToPosition );\n\t\tfloat dp = ( length( lightToPosition ) - shadowBias ) / 1000.0;\n\t\t#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tvec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;\n\t\t\treturn (\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#else\n\t\t\treturn texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );\n\t\t#endif\n\t}\n#endif\n";
	THREE.ShaderChunk.shadowmap_pars_vertex="#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\t\tuniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\t\tuniform mat4 spotShadowMatrix[ NUM_SPOT_LIGHTS ];\n\t\tvarying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\t\tuniform mat4 pointShadowMatrix[ NUM_POINT_LIGHTS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];\n\t#endif\n#endif\n";
	THREE.ShaderChunk.shadowmap_vertex="#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tvDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * worldPosition;\n\t}\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tvSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * worldPosition;\n\t}\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tvPointShadowCoord[ i ] = pointShadowMatrix[ i ] * worldPosition;\n\t}\n\t#endif\n#endif\n";
	THREE.ShaderChunk.shadowmask_pars_fragment="float getShadowMask() {\n\tfloat shadow = 1.0;\n\t#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\tDirectionalLight directionalLight;\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tshadow *= bool( directionalLight.shadow ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t}\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\tSpotLight spotLight;\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tshadow *= bool( spotLight.shadow ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n\t}\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\tPointLight pointLight;\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tshadow *= bool( pointLight.shadow ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;\n\t}\n\t#endif\n\t#endif\n\treturn shadow;\n}\n";
	THREE.ShaderChunk.skinbase_vertex="#ifdef USE_SKINNING\n\tmat4 boneMatX = getBoneMatrix( skinIndex.x );\n\tmat4 boneMatY = getBoneMatrix( skinIndex.y );\n\tmat4 boneMatZ = getBoneMatrix( skinIndex.z );\n\tmat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif";THREE.ShaderChunk.skinning_pars_vertex="#ifdef USE_SKINNING\n\tuniform mat4 bindMatrix;\n\tuniform mat4 bindMatrixInverse;\n\t#ifdef BONE_TEXTURE\n\t\tuniform sampler2D boneTexture;\n\t\tuniform int boneTextureWidth;\n\t\tuniform int boneTextureHeight;\n\t\tmat4 getBoneMatrix( const in float i ) {\n\t\t\tfloat j = i * 4.0;\n\t\t\tfloat x = mod( j, float( boneTextureWidth ) );\n\t\t\tfloat y = floor( j / float( boneTextureWidth ) );\n\t\t\tfloat dx = 1.0 / float( boneTextureWidth );\n\t\t\tfloat dy = 1.0 / float( boneTextureHeight );\n\t\t\ty = dy * ( y + 0.5 );\n\t\t\tvec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );\n\t\t\tvec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );\n\t\t\tvec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );\n\t\t\tvec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );\n\t\t\tmat4 bone = mat4( v1, v2, v3, v4 );\n\t\t\treturn bone;\n\t\t}\n\t#else\n\t\tuniform mat4 boneMatrices[ MAX_BONES ];\n\t\tmat4 getBoneMatrix( const in float i ) {\n\t\t\tmat4 bone = boneMatrices[ int(i) ];\n\t\t\treturn bone;\n\t\t}\n\t#endif\n#endif\n";
	THREE.ShaderChunk.skinning_vertex="#ifdef USE_SKINNING\n\tvec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n\tvec4 skinned = vec4( 0.0 );\n\tskinned += boneMatX * skinVertex * skinWeight.x;\n\tskinned += boneMatY * skinVertex * skinWeight.y;\n\tskinned += boneMatZ * skinVertex * skinWeight.z;\n\tskinned += boneMatW * skinVertex * skinWeight.w;\n\tskinned  = bindMatrixInverse * skinned;\n#endif\n";THREE.ShaderChunk.skinnormal_vertex="#ifdef USE_SKINNING\n\tmat4 skinMatrix = mat4( 0.0 );\n\tskinMatrix += skinWeight.x * boneMatX;\n\tskinMatrix += skinWeight.y * boneMatY;\n\tskinMatrix += skinWeight.z * boneMatZ;\n\tskinMatrix += skinWeight.w * boneMatW;\n\tskinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;\n\tobjectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n#endif\n";
	THREE.ShaderChunk.specularmap_fragment="float specularStrength;\n#ifdef USE_SPECULARMAP\n\tvec4 texelSpecular = texture2D( specularMap, vUv );\n\tspecularStrength = texelSpecular.r;\n#else\n\tspecularStrength = 1.0;\n#endif";THREE.ShaderChunk.specularmap_pars_fragment="#ifdef USE_SPECULARMAP\n\tuniform sampler2D specularMap;\n#endif";THREE.ShaderChunk.tonemapping_fragment="#if defined( TONE_MAPPING )\n  gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif\n";
	THREE.ShaderChunk.tonemapping_pars_fragment="#define saturate(a) clamp( a, 0.0, 1.0 )\nuniform float toneMappingExposure;\nuniform float toneMappingWhitePoint;\nvec3 LinearToneMapping( vec3 color ) {\n  return toneMappingExposure * color;\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n  color *= toneMappingExposure;\n  return saturate( color / ( vec3( 1.0 ) + color ) );\n}\n#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )\nvec3 Uncharted2ToneMapping( vec3 color ) {\n  color *= toneMappingExposure;\n  return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );\n}\nvec3 OptimizedCineonToneMapping( vec3 color ) {\n  color *= toneMappingExposure;\n  color = max( vec3( 0.0 ), color - 0.004 );\n  return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\n";
	THREE.ShaderChunk.uv2_pars_fragment="#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n\tvarying vec2 vUv2;\n#endif";THREE.ShaderChunk.uv2_pars_vertex="#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n\tattribute vec2 uv2;\n\tvarying vec2 vUv2;\n#endif";THREE.ShaderChunk.uv2_vertex="#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n\tvUv2 = uv2;\n#endif";THREE.ShaderChunk.uv_pars_fragment="#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\tvarying vec2 vUv;\n#endif";
	THREE.ShaderChunk.uv_pars_vertex="#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\tvarying vec2 vUv;\n\tuniform vec4 offsetRepeat;\n#endif\n";THREE.ShaderChunk.uv_vertex="#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n#endif";
	THREE.ShaderChunk.worldpos_vertex="#if defined( USE_ENVMAP ) || defined( PHONG ) || defined( PHYSICAL ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )\n\t#ifdef USE_SKINNING\n\t\tvec4 worldPosition = modelMatrix * skinned;\n\t#else\n\t\tvec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );\n\t#endif\n#endif\n";
	THREE.UniformsUtils={merge:function(a){for(var b={},c=0;c<a.length;c++){var d=this.clone(a[c]),e;for(e in d)b[e]=d[e]}return b},clone:function(a){var b={},c;for(c in a){b[c]={};for(var d in a[c]){var e=a[c][d];e instanceof THREE.Color||e instanceof THREE.Vector2||e instanceof THREE.Vector3||e instanceof THREE.Vector4||e instanceof THREE.Matrix3||e instanceof THREE.Matrix4||e instanceof THREE.Texture?b[c][d]=e.clone():Array.isArray(e)?b[c][d]=e.slice():b[c][d]=e}}return b}};
	THREE.UniformsLib={common:{diffuse:{type:"c",value:new THREE.Color(15658734)},opacity:{type:"1f",value:1},map:{type:"t",value:null},offsetRepeat:{type:"v4",value:new THREE.Vector4(0,0,1,1)},specularMap:{type:"t",value:null},alphaMap:{type:"t",value:null},envMap:{type:"t",value:null},flipEnvMap:{type:"1f",value:-1},reflectivity:{type:"1f",value:1},refractionRatio:{type:"1f",value:.98}},aomap:{aoMap:{type:"t",value:null},aoMapIntensity:{type:"1f",value:1}},lightmap:{lightMap:{type:"t",value:null},lightMapIntensity:{type:"1f",
	value:1}},emissivemap:{emissiveMap:{type:"t",value:null}},bumpmap:{bumpMap:{type:"t",value:null},bumpScale:{type:"1f",value:1}},normalmap:{normalMap:{type:"t",value:null},normalScale:{type:"v2",value:new THREE.Vector2(1,1)}},displacementmap:{displacementMap:{type:"t",value:null},displacementScale:{type:"1f",value:1},displacementBias:{type:"1f",value:0}},roughnessmap:{roughnessMap:{type:"t",value:null}},metalnessmap:{metalnessMap:{type:"t",value:null}},fog:{fogDensity:{type:"1f",value:2.5E-4},fogNear:{type:"1f",
	value:1},fogFar:{type:"1f",value:2E3},fogColor:{type:"c",value:new THREE.Color(16777215)}},lights:{ambientLightColor:{type:"3fv",value:[]},directionalLights:{type:"sa",value:[],properties:{direction:{type:"v3"},color:{type:"c"},shadow:{type:"1i"},shadowBias:{type:"1f"},shadowRadius:{type:"1f"},shadowMapSize:{type:"v2"}}},directionalShadowMap:{type:"tv",value:[]},directionalShadowMatrix:{type:"m4v",value:[]},spotLights:{type:"sa",value:[],properties:{color:{type:"c"},position:{type:"v3"},direction:{type:"v3"},
	distance:{type:"1f"},coneCos:{type:"1f"},penumbraCos:{type:"1f"},decay:{type:"1f"},shadow:{type:"1i"},shadowBias:{type:"1f"},shadowRadius:{type:"1f"},shadowMapSize:{type:"v2"}}},spotShadowMap:{type:"tv",value:[]},spotShadowMatrix:{type:"m4v",value:[]},pointLights:{type:"sa",value:[],properties:{color:{type:"c"},position:{type:"v3"},decay:{type:"1f"},distance:{type:"1f"},shadow:{type:"1i"},shadowBias:{type:"1f"},shadowRadius:{type:"1f"},shadowMapSize:{type:"v2"}}},pointShadowMap:{type:"tv",value:[]},
	pointShadowMatrix:{type:"m4v",value:[]},hemisphereLights:{type:"sa",value:[],properties:{direction:{type:"v3"},skyColor:{type:"c"},groundColor:{type:"c"}}}},points:{diffuse:{type:"c",value:new THREE.Color(15658734)},opacity:{type:"1f",value:1},size:{type:"1f",value:1},scale:{type:"1f",value:1},map:{type:"t",value:null},offsetRepeat:{type:"v4",value:new THREE.Vector4(0,0,1,1)}}};THREE.ShaderChunk.cube_frag="uniform samplerCube tCube;\nuniform float tFlip;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tgl_FragColor = textureCube( tCube, vec3( tFlip * vWorldPosition.x, vWorldPosition.yz ) );\n\t#include <logdepthbuf_fragment>\n}\n";
	THREE.ShaderChunk.cube_vert="varying vec3 vWorldPosition;\n#include <common>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\tvWorldPosition = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n}\n";THREE.ShaderChunk.depth_frag="#if DEPTH_PACKING == 3200\n\tuniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#if DEPTH_PACKING == 3200\n\t\tdiffuseColor.a = opacity;\n\t#endif\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <logdepthbuf_fragment>\n\t#if DEPTH_PACKING == 3200\n\t\tgl_FragColor = vec4( vec3( gl_FragCoord.z ), opacity );\n\t#elif DEPTH_PACKING == 3201\n\t\tgl_FragColor = packDepthToRGBA( gl_FragCoord.z );\n\t#endif\n}\n";
	THREE.ShaderChunk.depth_vert="#include <common>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <skinbase_vertex>\n\t#include <begin_vertex>\n\t#include <displacementmap_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n}\n";
	THREE.ShaderChunk.distanceRGBA_frag="uniform vec3 lightPos;\nvarying vec4 vWorldPosition;\n#include <common>\n#include <packing>\n#include <clipping_planes_pars_fragment>\nvoid main () {\n\t#include <clipping_planes_fragment>\n\tgl_FragColor = packDepthToRGBA( length( vWorldPosition.xyz - lightPos.xyz ) / 1000.0 );\n}\n";THREE.ShaderChunk.distanceRGBA_vert="varying vec4 vWorldPosition;\n#include <common>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <skinbase_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n\t#include <clipping_planes_vertex>\n\tvWorldPosition = worldPosition;\n}\n";
	THREE.ShaderChunk.equirect_frag="uniform sampler2D tEquirect;\nuniform float tFlip;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec3 direction = normalize( vWorldPosition );\n\tvec2 sampleUV;\n\tsampleUV.y = saturate( tFlip * direction.y * -0.5 + 0.5 );\n\tsampleUV.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;\n\tgl_FragColor = texture2D( tEquirect, sampleUV );\n\t#include <logdepthbuf_fragment>\n}\n";
	THREE.ShaderChunk.equirect_vert="varying vec3 vWorldPosition;\n#include <common>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\tvWorldPosition = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n}\n";THREE.ShaderChunk.linedashed_frag="uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tif ( mod( vLineDistance, totalSize ) > dashSize ) {\n\t\tdiscard;\n\t}\n\tvec3 outgoingLight = vec3( 0.0 );\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <color_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}\n";
	THREE.ShaderChunk.linedashed_vert="uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <color_vertex>\n\tvLineDistance = scale * lineDistance;\n\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n\tgl_Position = projectionMatrix * mvPosition;\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n}\n";
	THREE.ShaderChunk.meshbasic_frag="uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\tReflectedLight reflectedLight;\n\treflectedLight.directDiffuse = vec3( 0.0 );\n\treflectedLight.directSpecular = vec3( 0.0 );\n\treflectedLight.indirectDiffuse = diffuseColor.rgb;\n\treflectedLight.indirectSpecular = vec3( 0.0 );\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\n\t#include <envmap_fragment>\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}\n";
	THREE.ShaderChunk.meshbasic_vert="#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <skinbase_vertex>\n\t#ifdef USE_ENVMAP\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <worldpos_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <envmap_vertex>\n}\n";
	THREE.ShaderChunk.meshlambert_frag="uniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\nvarying vec3 vLightFront;\n#ifdef DOUBLE_SIDED\n\tvarying vec3 vLightBack;\n#endif\n#include <common>\n#include <packing>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <bsdfs>\n#include <lights_pars>\n#include <fog_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <emissivemap_fragment>\n\treflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n\t#include <lightmap_fragment>\n\treflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n\t#ifdef DOUBLE_SIDED\n\t\treflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n\t#else\n\t\treflectedLight.directDiffuse = vLightFront;\n\t#endif\n\treflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n\t#include <envmap_fragment>\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}\n";
	THREE.ShaderChunk.meshlambert_vert="#define LAMBERT\nvarying vec3 vLightFront;\n#ifdef DOUBLE_SIDED\n\tvarying vec3 vLightBack;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <envmap_pars_vertex>\n#include <bsdfs>\n#include <lights_pars>\n#include <color_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <lights_lambert_vertex>\n\t#include <shadowmap_vertex>\n}\n";
	THREE.ShaderChunk.meshphong_frag="#define PHONG\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment>\n\t#include <emissivemap_fragment>\n\t#include <lights_phong_fragment>\n\t#include <lights_template>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\t#include <envmap_fragment>\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}\n";
	THREE.ShaderChunk.meshphong_vert="#define PHONG\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n#endif\n\t#include <begin_vertex>\n\t#include <displacementmap_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n}\n";
	THREE.ShaderChunk.meshphysical_frag="#define PHYSICAL\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\nuniform float envMapIntensity;\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <packing>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <cube_uv_reflection_fragment>\n#include <lights_pars>\n#include <lights_physical_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <roughnessmap_fragment>\n\t#include <metalnessmap_fragment>\n\t#include <normal_fragment>\n\t#include <emissivemap_fragment>\n\t#include <lights_physical_fragment>\n\t#include <lights_template>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}\n";
	THREE.ShaderChunk.meshphysical_vert="#define PHYSICAL\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n#endif\n\t#include <begin_vertex>\n\t#include <displacementmap_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n}\n";
	THREE.ShaderChunk.normal_frag="uniform float opacity;\nvarying vec3 vNormal;\n#include <common>\n#include <packing>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tgl_FragColor = vec4( packNormalToRGB( vNormal ), opacity );\n\t#include <logdepthbuf_fragment>\n}\n";THREE.ShaderChunk.normal_vert="varying vec3 vNormal;\n#include <common>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\tvNormal = normalize( normalMatrix * normal );\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n}\n";
	THREE.ShaderChunk.points_frag="uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <fog_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec3 outgoingLight = vec3( 0.0 );\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_particle_fragment>\n\t#include <color_fragment>\n\t#include <alphatest_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}\n";
	THREE.ShaderChunk.points_vert="uniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <color_vertex>\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\t#ifdef USE_SIZEATTENUATION\n\t\tgl_PointSize = size * ( scale / - mvPosition.z );\n\t#else\n\t\tgl_PointSize = size;\n\t#endif\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n}\n";
	THREE.ShaderChunk.shadow_frag="uniform float opacity;\n#include <common>\n#include <packing>\n#include <bsdfs>\n#include <lights_pars>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nvoid main() {\n\tgl_FragColor = vec4( 0.0, 0.0, 0.0, opacity * ( 1.0  - getShadowMask() ) );\n}\n";THREE.ShaderChunk.shadow_vert="#include <shadowmap_pars_vertex>\nvoid main() {\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n}\n";
	THREE.ShaderLib={basic:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.common,THREE.UniformsLib.aomap,THREE.UniformsLib.fog]),vertexShader:THREE.ShaderChunk.meshbasic_vert,fragmentShader:THREE.ShaderChunk.meshbasic_frag},lambert:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.common,THREE.UniformsLib.aomap,THREE.UniformsLib.lightmap,THREE.UniformsLib.emissivemap,THREE.UniformsLib.fog,THREE.UniformsLib.lights,{emissive:{type:"c",value:new THREE.Color(0)}}]),vertexShader:THREE.ShaderChunk.meshlambert_vert,
	fragmentShader:THREE.ShaderChunk.meshlambert_frag},phong:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.common,THREE.UniformsLib.aomap,THREE.UniformsLib.lightmap,THREE.UniformsLib.emissivemap,THREE.UniformsLib.bumpmap,THREE.UniformsLib.normalmap,THREE.UniformsLib.displacementmap,THREE.UniformsLib.fog,THREE.UniformsLib.lights,{emissive:{type:"c",value:new THREE.Color(0)},specular:{type:"c",value:new THREE.Color(1118481)},shininess:{type:"1f",value:30}}]),vertexShader:THREE.ShaderChunk.meshphong_vert,
	fragmentShader:THREE.ShaderChunk.meshphong_frag},standard:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.common,THREE.UniformsLib.aomap,THREE.UniformsLib.lightmap,THREE.UniformsLib.emissivemap,THREE.UniformsLib.bumpmap,THREE.UniformsLib.normalmap,THREE.UniformsLib.displacementmap,THREE.UniformsLib.roughnessmap,THREE.UniformsLib.metalnessmap,THREE.UniformsLib.fog,THREE.UniformsLib.lights,{emissive:{type:"c",value:new THREE.Color(0)},roughness:{type:"1f",value:.5},metalness:{type:"1f",value:0},
	envMapIntensity:{type:"1f",value:1}}]),vertexShader:THREE.ShaderChunk.meshphysical_vert,fragmentShader:THREE.ShaderChunk.meshphysical_frag},points:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.points,THREE.UniformsLib.fog]),vertexShader:THREE.ShaderChunk.points_vert,fragmentShader:THREE.ShaderChunk.points_frag},dashed:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.common,THREE.UniformsLib.fog,{scale:{type:"1f",value:1},dashSize:{type:"1f",value:1},totalSize:{type:"1f",value:2}}]),
	vertexShader:THREE.ShaderChunk.linedashed_vert,fragmentShader:THREE.ShaderChunk.linedashed_frag},depth:{uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.common,THREE.UniformsLib.displacementmap]),vertexShader:THREE.ShaderChunk.depth_vert,fragmentShader:THREE.ShaderChunk.depth_frag},normal:{uniforms:{opacity:{type:"1f",value:1}},vertexShader:THREE.ShaderChunk.normal_vert,fragmentShader:THREE.ShaderChunk.normal_frag},cube:{uniforms:{tCube:{type:"t",value:null},tFlip:{type:"1f",value:-1}},vertexShader:THREE.ShaderChunk.cube_vert,
	fragmentShader:THREE.ShaderChunk.cube_frag},equirect:{uniforms:{tEquirect:{type:"t",value:null},tFlip:{type:"1f",value:-1}},vertexShader:THREE.ShaderChunk.equirect_vert,fragmentShader:THREE.ShaderChunk.equirect_frag},distanceRGBA:{uniforms:{lightPos:{type:"v3",value:new THREE.Vector3}},vertexShader:THREE.ShaderChunk.distanceRGBA_vert,fragmentShader:THREE.ShaderChunk.distanceRGBA_frag}};
	THREE.ShaderLib.physical={uniforms:THREE.UniformsUtils.merge([THREE.ShaderLib.standard.uniforms,{}]),vertexShader:THREE.ShaderChunk.meshphysical_vert,fragmentShader:THREE.ShaderChunk.meshphysical_frag};
	THREE.WebGLRenderer=function(a){function b(a,b,c,d){!0===K&&(a*=d,b*=d,c*=d);J.clearColor(a,b,c,d)}function c(){J.init();J.scissor(ra.copy(ya).multiplyScalar($));J.viewport(ma.copy(na).multiplyScalar($));b(aa.r,aa.g,aa.b,ia)}function d(){ea=fa=null;oa="";Z=-1;J.reset()}function e(a){a.preventDefault();d();c();T.clear()}function f(a){a=a.target;a.removeEventListener("dispose",f);a:{var b=T.get(a);if(a.image&&b.__image__webglTextureCube)t.deleteTexture(b.__image__webglTextureCube);else{if(void 0===
	b.__webglInit)break a;t.deleteTexture(b.__webglTexture)}T.delete(a)}ja.textures--}function g(a){a=a.target;a.removeEventListener("dispose",g);var b=T.get(a),c=T.get(a.texture);if(a){void 0!==c.__webglTexture&&t.deleteTexture(c.__webglTexture);a.depthTexture&&a.depthTexture.dispose();if(a instanceof THREE.WebGLRenderTargetCube)for(c=0;6>c;c++)t.deleteFramebuffer(b.__webglFramebuffer[c]),b.__webglDepthbuffer&&t.deleteRenderbuffer(b.__webglDepthbuffer[c]);else t.deleteFramebuffer(b.__webglFramebuffer),
	b.__webglDepthbuffer&&t.deleteRenderbuffer(b.__webglDepthbuffer);T.delete(a.texture);T.delete(a)}ja.textures--}function h(a){a=a.target;a.removeEventListener("dispose",h);k(a);T.delete(a)}function k(a){var b=T.get(a).program;a.program=void 0;void 0!==b&&pa.releaseProgram(b)}function l(a,b){return Math.abs(b[0])-Math.abs(a[0])}function n(a,b){return a.object.renderOrder!==b.object.renderOrder?a.object.renderOrder-b.object.renderOrder:a.material.id!==b.material.id?a.material.id-b.material.id:a.z!==
	b.z?a.z-b.z:a.id-b.id}function p(a,b){return a.object.renderOrder!==b.object.renderOrder?a.object.renderOrder-b.object.renderOrder:a.z!==b.z?b.z-a.z:a.id-b.id}function m(a,b,c,d,e){var g;c.transparent?(d=R,g=++F):(d=P,g=++Q);g=d[g];void 0!==g?(g.id=a.id,g.object=a,g.geometry=b,g.material=c,g.z=X.z,g.group=e):(g={id:a.id,object:a,geometry:b,material:c,z:X.z,group:e},d.push(g))}function q(a){if(!Ba.intersectsSphere(a))return!1;var b=ba.numPlanes;if(0===b)return!0;var c=W.clippingPlanes,d=a.center;a=
	-a.radius;var e=0;do if(c[e].distanceToPoint(d)<a)return!1;while(++e!==b);return!0}function r(a,b){if(!1!==a.visible){if(a.layers.test(b.layers))if(a instanceof THREE.Light)L.push(a);else if(a instanceof THREE.Sprite){var c;(c=!1===a.frustumCulled)||(ka.center.set(0,0,0),ka.radius=.7071067811865476,ka.applyMatrix4(a.matrixWorld),c=!0===q(ka));c&&U.push(a)}else if(a instanceof THREE.LensFlare)Y.push(a);else if(a instanceof THREE.ImmediateRenderObject)!0===W.sortObjects&&(X.setFromMatrixPosition(a.matrixWorld),
	X.applyProjection(sa)),m(a,null,a.material,X.z,null);else if(a instanceof THREE.Mesh||a instanceof THREE.Line||a instanceof THREE.Points)if(a instanceof THREE.SkinnedMesh&&a.skeleton.update(),(c=!1===a.frustumCulled)||(c=a.geometry,null===c.boundingSphere&&c.computeBoundingSphere(),ka.copy(c.boundingSphere).applyMatrix4(a.matrixWorld),c=!0===q(ka)),c){var d=a.material;if(!0===d.visible)if(!0===W.sortObjects&&(X.setFromMatrixPosition(a.matrixWorld),X.applyProjection(sa)),c=qa.update(a),d instanceof
	THREE.MultiMaterial)for(var e=c.groups,g=d.materials,d=0,f=e.length;d<f;d++){var h=e[d],k=g[h.materialIndex];!0===k.visible&&m(a,c,k,X.z,h)}else m(a,c,d,X.z,null)}c=a.children;d=0;for(f=c.length;d<f;d++)r(c[d],b)}}function s(a,b,c,d){for(var e=0,g=a.length;e<g;e++){var f=a[e],h=f.object,k=f.geometry,m=void 0===d?f.material:d,f=f.group;h.modelViewMatrix.multiplyMatrices(b.matrixWorldInverse,h.matrixWorld);h.normalMatrix.getNormalMatrix(h.modelViewMatrix);if(h instanceof THREE.ImmediateRenderObject){u(m);
	var l=x(b,c,m,h);oa="";h.render(function(a){W.renderBufferImmediate(a,l,m)})}else W.renderBufferDirect(b,c,k,m,h,f)}}function u(a){a.side!==THREE.DoubleSide?J.enable(t.CULL_FACE):J.disable(t.CULL_FACE);J.setFlipSided(a.side===THREE.BackSide);!0===a.transparent?J.setBlending(a.blending,a.blendEquation,a.blendSrc,a.blendDst,a.blendEquationAlpha,a.blendSrcAlpha,a.blendDstAlpha,a.premultipliedAlpha):J.setBlending(THREE.NoBlending);J.setDepthFunc(a.depthFunc);J.setDepthTest(a.depthTest);J.setDepthWrite(a.depthWrite);
	J.setColorWrite(a.colorWrite);J.setPolygonOffset(a.polygonOffset,a.polygonOffsetFactor,a.polygonOffsetUnits)}function x(a,b,c,d){ta=0;var e=T.get(c);ua&&((za||a!==ea)&&ba.setState(c.clippingPlanes,c.clipShadows,a,e,a===ea&&c.id===Z),void 0!==e.numClippingPlanes&&e.numClippingPlanes!==ba.numPlanes&&(c.needsUpdate=!0));void 0===e.program&&(c.needsUpdate=!0);void 0!==e.lightsHash&&e.lightsHash!==S.hash&&(c.needsUpdate=!0);if(c.needsUpdate){a:{var g=T.get(c),f=pa.getParameters(c,S,b,ba.numPlanes,d),m=
	pa.getProgramCode(c,f),l=g.program,p=!0;if(void 0===l)c.addEventListener("dispose",h);else if(l.code!==m)k(c);else if(void 0!==f.shaderID)break a;else p=!1;p&&(f.shaderID?(l=THREE.ShaderLib[f.shaderID],g.__webglShader={name:c.type,uniforms:THREE.UniformsUtils.clone(l.uniforms),vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}):g.__webglShader={name:c.type,uniforms:c.uniforms,vertexShader:c.vertexShader,fragmentShader:c.fragmentShader},c.__webglShader=g.__webglShader,l=pa.acquireProgram(c,
	f,m),g.program=l,c.program=l);f=l.getAttributes();if(c.morphTargets)for(m=c.numSupportedMorphTargets=0;m<W.maxMorphTargets;m++)0<=f["morphTarget"+m]&&c.numSupportedMorphTargets++;if(c.morphNormals)for(m=c.numSupportedMorphNormals=0;m<W.maxMorphNormals;m++)0<=f["morphNormal"+m]&&c.numSupportedMorphNormals++;f=g.__webglShader.uniforms;(c instanceof THREE.ShaderMaterial||c instanceof THREE.RawShaderMaterial)&&!0!==c.clipping||(g.numClippingPlanes=ba.numPlanes,f.clippingPlanes=ba.uniform);c.lights&&(g.lightsHash=
	S.hash,f.ambientLightColor.value=S.ambient,f.directionalLights.value=S.directional,f.spotLights.value=S.spot,f.pointLights.value=S.point,f.hemisphereLights.value=S.hemi,f.directionalShadowMap.value=S.directionalShadowMap,f.directionalShadowMatrix.value=S.directionalShadowMatrix,f.spotShadowMap.value=S.spotShadowMap,f.spotShadowMatrix.value=S.spotShadowMatrix,f.pointShadowMap.value=S.pointShadowMap,f.pointShadowMatrix.value=S.pointShadowMatrix);m=g.program.getUniforms();m=THREE.WebGLUniforms.seqWithValue(m.seq,
	f);g.uniformsList=m;g.dynamicUniforms=THREE.WebGLUniforms.splitDynamic(m,f)}c.needsUpdate=!1}var n=!1,p=l=!1,g=e.program,m=g.getUniforms(),f=e.__webglShader.uniforms;g.id!==fa&&(t.useProgram(g.program),fa=g.id,p=l=n=!0);c.id!==Z&&(Z=c.id,l=!0);if(n||a!==ea){m.set(t,a,"projectionMatrix");ca.logarithmicDepthBuffer&&m.setValue(t,"logDepthBufFC",2/(Math.log(a.far+1)/Math.LN2));a!==ea&&(ea=a,p=l=!0);if(c instanceof THREE.ShaderMaterial||c instanceof THREE.MeshPhongMaterial||c instanceof THREE.MeshStandardMaterial||
	c.envMap)n=m.map.cameraPosition,void 0!==n&&n.setValue(t,X.setFromMatrixPosition(a.matrixWorld));(c instanceof THREE.MeshPhongMaterial||c instanceof THREE.MeshLambertMaterial||c instanceof THREE.MeshBasicMaterial||c instanceof THREE.MeshStandardMaterial||c instanceof THREE.ShaderMaterial||c.skinning)&&m.setValue(t,"viewMatrix",a.matrixWorldInverse);m.set(t,W,"toneMappingExposure");m.set(t,W,"toneMappingWhitePoint")}c.skinning&&(m.setOptional(t,d,"bindMatrix"),m.setOptional(t,d,"bindMatrixInverse"),
	n=d.skeleton)&&(ca.floatVertexTextures&&n.useVertexTexture?(m.set(t,n,"boneTexture"),m.set(t,n,"boneTextureWidth"),m.set(t,n,"boneTextureHeight")):m.setOptional(t,n,"boneMatrices"));if(l){c.lights&&(l=p,f.ambientLightColor.needsUpdate=l,f.directionalLights.needsUpdate=l,f.pointLights.needsUpdate=l,f.spotLights.needsUpdate=l,f.hemisphereLights.needsUpdate=l);b&&c.fog&&(f.fogColor.value=b.color,b instanceof THREE.Fog?(f.fogNear.value=b.near,f.fogFar.value=b.far):b instanceof THREE.FogExp2&&(f.fogDensity.value=
	b.density));if(c instanceof THREE.MeshBasicMaterial||c instanceof THREE.MeshLambertMaterial||c instanceof THREE.MeshPhongMaterial||c instanceof THREE.MeshStandardMaterial||c instanceof THREE.MeshDepthMaterial){f.opacity.value=c.opacity;f.diffuse.value=c.color;c.emissive&&f.emissive.value.copy(c.emissive).multiplyScalar(c.emissiveIntensity);f.map.value=c.map;f.specularMap.value=c.specularMap;f.alphaMap.value=c.alphaMap;c.aoMap&&(f.aoMap.value=c.aoMap,f.aoMapIntensity.value=c.aoMapIntensity);var q;
	c.map?q=c.map:c.specularMap?q=c.specularMap:c.displacementMap?q=c.displacementMap:c.normalMap?q=c.normalMap:c.bumpMap?q=c.bumpMap:c.roughnessMap?q=c.roughnessMap:c.metalnessMap?q=c.metalnessMap:c.alphaMap?q=c.alphaMap:c.emissiveMap&&(q=c.emissiveMap);void 0!==q&&(q instanceof THREE.WebGLRenderTarget&&(q=q.texture),b=q.offset,q=q.repeat,f.offsetRepeat.value.set(b.x,b.y,q.x,q.y));f.envMap.value=c.envMap;f.flipEnvMap.value=c.envMap instanceof THREE.CubeTexture?-1:1;f.reflectivity.value=c.reflectivity;
	f.refractionRatio.value=c.refractionRatio}c instanceof THREE.LineBasicMaterial?(f.diffuse.value=c.color,f.opacity.value=c.opacity):c instanceof THREE.LineDashedMaterial?(f.diffuse.value=c.color,f.opacity.value=c.opacity,f.dashSize.value=c.dashSize,f.totalSize.value=c.dashSize+c.gapSize,f.scale.value=c.scale):c instanceof THREE.PointsMaterial?(f.diffuse.value=c.color,f.opacity.value=c.opacity,f.size.value=c.size*$,f.scale.value=.5*z.clientHeight,f.map.value=c.map,null!==c.map&&(q=c.map.offset,c=c.map.repeat,
	f.offsetRepeat.value.set(q.x,q.y,c.x,c.y))):c instanceof THREE.MeshLambertMaterial?(c.lightMap&&(f.lightMap.value=c.lightMap,f.lightMapIntensity.value=c.lightMapIntensity),c.emissiveMap&&(f.emissiveMap.value=c.emissiveMap)):c instanceof THREE.MeshPhongMaterial?(f.specular.value=c.specular,f.shininess.value=Math.max(c.shininess,1E-4),c.lightMap&&(f.lightMap.value=c.lightMap,f.lightMapIntensity.value=c.lightMapIntensity),c.emissiveMap&&(f.emissiveMap.value=c.emissiveMap),c.bumpMap&&(f.bumpMap.value=
	c.bumpMap,f.bumpScale.value=c.bumpScale),c.normalMap&&(f.normalMap.value=c.normalMap,f.normalScale.value.copy(c.normalScale)),c.displacementMap&&(f.displacementMap.value=c.displacementMap,f.displacementScale.value=c.displacementScale,f.displacementBias.value=c.displacementBias)):c instanceof THREE.MeshPhysicalMaterial?v(f,c):c instanceof THREE.MeshStandardMaterial?v(f,c):c instanceof THREE.MeshDepthMaterial?c.displacementMap&&(f.displacementMap.value=c.displacementMap,f.displacementScale.value=c.displacementScale,
	f.displacementBias.value=c.displacementBias):c instanceof THREE.MeshNormalMaterial&&(f.opacity.value=c.opacity);THREE.WebGLUniforms.upload(t,e.uniformsList,f,W)}m.set(t,d,"modelViewMatrix");m.set(t,d,"normalMatrix");m.setValue(t,"modelMatrix",d.matrixWorld);e=e.dynamicUniforms;null!==e&&(THREE.WebGLUniforms.evalDynamic(e,f,d,a),THREE.WebGLUniforms.upload(t,e,f,W));return g}function v(a,b){a.roughness.value=b.roughness;a.metalness.value=b.metalness;b.roughnessMap&&(a.roughnessMap.value=b.roughnessMap);
	b.metalnessMap&&(a.metalnessMap.value=b.metalnessMap);b.lightMap&&(a.lightMap.value=b.lightMap,a.lightMapIntensity.value=b.lightMapIntensity);b.emissiveMap&&(a.emissiveMap.value=b.emissiveMap);b.bumpMap&&(a.bumpMap.value=b.bumpMap,a.bumpScale.value=b.bumpScale);b.normalMap&&(a.normalMap.value=b.normalMap,a.normalScale.value.copy(b.normalScale));b.displacementMap&&(a.displacementMap.value=b.displacementMap,a.displacementScale.value=b.displacementScale,a.displacementBias.value=b.displacementBias);b.envMap&&
	(a.envMapIntensity.value=b.envMapIntensity)}function C(a,b,c){c?(t.texParameteri(a,t.TEXTURE_WRAP_S,G(b.wrapS)),t.texParameteri(a,t.TEXTURE_WRAP_T,G(b.wrapT)),t.texParameteri(a,t.TEXTURE_MAG_FILTER,G(b.magFilter)),t.texParameteri(a,t.TEXTURE_MIN_FILTER,G(b.minFilter))):(t.texParameteri(a,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(a,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),b.wrapS===THREE.ClampToEdgeWrapping&&b.wrapT===THREE.ClampToEdgeWrapping||console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.",
	b),t.texParameteri(a,t.TEXTURE_MAG_FILTER,B(b.magFilter)),t.texParameteri(a,t.TEXTURE_MIN_FILTER,B(b.minFilter)),b.minFilter!==THREE.NearestFilter&&b.minFilter!==THREE.LinearFilter&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.",b));!(c=V.get("EXT_texture_filter_anisotropic"))||b.type===THREE.FloatType&&null===V.get("OES_texture_float_linear")||b.type===THREE.HalfFloatType&&null===V.get("OES_texture_half_float_linear")||
	!(1<b.anisotropy||T.get(b).__currentAnisotropy)||(t.texParameterf(a,c.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,W.getMaxAnisotropy())),T.get(b).__currentAnisotropy=b.anisotropy)}function w(a,b){if(a.width>b||a.height>b){var c=b/Math.max(a.width,a.height),d=document.createElement("canvas");d.width=Math.floor(a.width*c);d.height=Math.floor(a.height*c);d.getContext("2d").drawImage(a,0,0,a.width,a.height,0,0,d.width,d.height);console.warn("THREE.WebGLRenderer: image is too big ("+a.width+"x"+a.height+
	"). Resized to "+d.width+"x"+d.height,a);return d}return a}function D(a){return THREE.Math.isPowerOfTwo(a.width)&&THREE.Math.isPowerOfTwo(a.height)}function A(a,b,c,d){var e=G(b.texture.format),f=G(b.texture.type);J.texImage2D(d,0,e,b.width,b.height,0,e,f,null);t.bindFramebuffer(t.FRAMEBUFFER,a);t.framebufferTexture2D(t.FRAMEBUFFER,c,d,T.get(b.texture).__webglTexture,0);t.bindFramebuffer(t.FRAMEBUFFER,null)}function y(a,b){t.bindRenderbuffer(t.RENDERBUFFER,a);b.depthBuffer&&!b.stencilBuffer?(t.renderbufferStorage(t.RENDERBUFFER,
	t.DEPTH_COMPONENT16,b.width,b.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_ATTACHMENT,t.RENDERBUFFER,a)):b.depthBuffer&&b.stencilBuffer?(t.renderbufferStorage(t.RENDERBUFFER,t.DEPTH_STENCIL,b.width,b.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.RENDERBUFFER,a)):t.renderbufferStorage(t.RENDERBUFFER,t.RGBA4,b.width,b.height);t.bindRenderbuffer(t.RENDERBUFFER,null)}function B(a){return a===THREE.NearestFilter||a===THREE.NearestMipMapNearestFilter||a===THREE.NearestMipMapLinearFilter?
	t.NEAREST:t.LINEAR}function G(a){var b;if(a===THREE.RepeatWrapping)return t.REPEAT;if(a===THREE.ClampToEdgeWrapping)return t.CLAMP_TO_EDGE;if(a===THREE.MirroredRepeatWrapping)return t.MIRRORED_REPEAT;if(a===THREE.NearestFilter)return t.NEAREST;if(a===THREE.NearestMipMapNearestFilter)return t.NEAREST_MIPMAP_NEAREST;if(a===THREE.NearestMipMapLinearFilter)return t.NEAREST_MIPMAP_LINEAR;if(a===THREE.LinearFilter)return t.LINEAR;if(a===THREE.LinearMipMapNearestFilter)return t.LINEAR_MIPMAP_NEAREST;if(a===
	THREE.LinearMipMapLinearFilter)return t.LINEAR_MIPMAP_LINEAR;if(a===THREE.UnsignedByteType)return t.UNSIGNED_BYTE;if(a===THREE.UnsignedShort4444Type)return t.UNSIGNED_SHORT_4_4_4_4;if(a===THREE.UnsignedShort5551Type)return t.UNSIGNED_SHORT_5_5_5_1;if(a===THREE.UnsignedShort565Type)return t.UNSIGNED_SHORT_5_6_5;if(a===THREE.ByteType)return t.BYTE;if(a===THREE.ShortType)return t.SHORT;if(a===THREE.UnsignedShortType)return t.UNSIGNED_SHORT;if(a===THREE.IntType)return t.INT;if(a===THREE.UnsignedIntType)return t.UNSIGNED_INT;
	if(a===THREE.FloatType)return t.FLOAT;b=V.get("OES_texture_half_float");if(null!==b&&a===THREE.HalfFloatType)return b.HALF_FLOAT_OES;if(a===THREE.AlphaFormat)return t.ALPHA;if(a===THREE.RGBFormat)return t.RGB;if(a===THREE.RGBAFormat)return t.RGBA;if(a===THREE.LuminanceFormat)return t.LUMINANCE;if(a===THREE.LuminanceAlphaFormat)return t.LUMINANCE_ALPHA;if(a===THREE.DepthFormat)return t.DEPTH_COMPONENT;if(a===THREE.AddEquation)return t.FUNC_ADD;if(a===THREE.SubtractEquation)return t.FUNC_SUBTRACT;if(a===
	THREE.ReverseSubtractEquation)return t.FUNC_REVERSE_SUBTRACT;if(a===THREE.ZeroFactor)return t.ZERO;if(a===THREE.OneFactor)return t.ONE;if(a===THREE.SrcColorFactor)return t.SRC_COLOR;if(a===THREE.OneMinusSrcColorFactor)return t.ONE_MINUS_SRC_COLOR;if(a===THREE.SrcAlphaFactor)return t.SRC_ALPHA;if(a===THREE.OneMinusSrcAlphaFactor)return t.ONE_MINUS_SRC_ALPHA;if(a===THREE.DstAlphaFactor)return t.DST_ALPHA;if(a===THREE.OneMinusDstAlphaFactor)return t.ONE_MINUS_DST_ALPHA;if(a===THREE.DstColorFactor)return t.DST_COLOR;
	if(a===THREE.OneMinusDstColorFactor)return t.ONE_MINUS_DST_COLOR;if(a===THREE.SrcAlphaSaturateFactor)return t.SRC_ALPHA_SATURATE;b=V.get("WEBGL_compressed_texture_s3tc");if(null!==b){if(a===THREE.RGB_S3TC_DXT1_Format)return b.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===THREE.RGBA_S3TC_DXT1_Format)return b.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===THREE.RGBA_S3TC_DXT3_Format)return b.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===THREE.RGBA_S3TC_DXT5_Format)return b.COMPRESSED_RGBA_S3TC_DXT5_EXT}b=V.get("WEBGL_compressed_texture_pvrtc");
	if(null!==b){if(a===THREE.RGB_PVRTC_4BPPV1_Format)return b.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===THREE.RGB_PVRTC_2BPPV1_Format)return b.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===THREE.RGBA_PVRTC_4BPPV1_Format)return b.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===THREE.RGBA_PVRTC_2BPPV1_Format)return b.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}b=V.get("WEBGL_compressed_texture_etc1");if(null!==b&&a===THREE.RGB_ETC1_Format)return b.COMPRESSED_RGB_ETC1_WEBGL;b=V.get("EXT_blend_minmax");if(null!==b){if(a===THREE.MinEquation)return b.MIN_EXT;
	if(a===THREE.MaxEquation)return b.MAX_EXT}return 0}console.log("THREE.WebGLRenderer",THREE.REVISION);a=a||{};var z=void 0!==a.canvas?a.canvas:document.createElement("canvas"),H=void 0!==a.context?a.context:null,M=void 0!==a.alpha?a.alpha:!1,O=void 0!==a.depth?a.depth:!0,N=void 0!==a.stencil?a.stencil:!0,E=void 0!==a.antialias?a.antialias:!1,K=void 0!==a.premultipliedAlpha?a.premultipliedAlpha:!0,I=void 0!==a.preserveDrawingBuffer?a.preserveDrawingBuffer:!1,L=[],P=[],Q=-1,R=[],F=-1,da=new Float32Array(8),
	U=[],Y=[];this.domElement=z;this.context=null;this.sortObjects=this.autoClearStencil=this.autoClearDepth=this.autoClearColor=this.autoClear=!0;this.clippingPlanes=[];this.localClippingEnabled=!1;this.gammaFactor=2;this.physicallyCorrectLights=this.gammaOutput=this.gammaInput=!1;this.toneMapping=THREE.LinearToneMapping;this.toneMappingWhitePoint=this.toneMappingExposure=1;this.maxMorphTargets=8;this.maxMorphNormals=4;this.autoScaleCubemaps=!0;var W=this,fa=null,la=null,ga=null,Z=-1,oa="",ea=null,ra=
	new THREE.Vector4,Aa=null,ma=new THREE.Vector4,ta=0,aa=new THREE.Color(0),ia=0,va=z.width,wa=z.height,$=1,ya=new THREE.Vector4(0,0,va,wa),Ca=!1,na=new THREE.Vector4(0,0,va,wa),Ba=new THREE.Frustum,ba=new THREE.WebGLClipping,ua=!1,za=!1,ka=new THREE.Sphere,sa=new THREE.Matrix4,X=new THREE.Vector3,S={hash:"",ambient:[0,0,0],directional:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotShadowMap:[],spotShadowMatrix:[],point:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],shadows:[]},
	ja={geometries:0,textures:0},ha={calls:0,vertices:0,faces:0,points:0};this.info={render:ha,memory:ja,programs:null};var t;try{M={alpha:M,depth:O,stencil:N,antialias:E,premultipliedAlpha:K,preserveDrawingBuffer:I};t=H||z.getContext("webgl",M)||z.getContext("experimental-webgl",M);if(null===t){if(null!==z.getContext("webgl"))throw"Error creating WebGL context with your selected attributes.";throw"Error creating WebGL context.";}void 0===t.getShaderPrecisionFormat&&(t.getShaderPrecisionFormat=function(){return{rangeMin:1,
	rangeMax:1,precision:1}});z.addEventListener("webglcontextlost",e,!1)}catch(Fa){console.error("THREE.WebGLRenderer: "+Fa)}var Da="undefined"!==typeof WebGL2RenderingContext&&t instanceof WebGL2RenderingContext,V=new THREE.WebGLExtensions(t);V.get("WEBGL_depth_texture");V.get("OES_texture_float");V.get("OES_texture_float_linear");V.get("OES_texture_half_float");V.get("OES_texture_half_float_linear");V.get("OES_standard_derivatives");V.get("ANGLE_instanced_arrays");V.get("OES_element_index_uint")&&
	(THREE.BufferGeometry.MaxIndex=4294967296);var ca=new THREE.WebGLCapabilities(t,V,a),J=new THREE.WebGLState(t,V,G),T=new THREE.WebGLProperties,qa=new THREE.WebGLObjects(t,T,this.info),pa=new THREE.WebGLPrograms(this,ca),xa=new THREE.WebGLLights;this.info.programs=pa.programs;var Ga=new THREE.WebGLBufferRenderer(t,V,ha),Ha=new THREE.WebGLIndexedBufferRenderer(t,V,ha);c();this.context=t;this.capabilities=ca;this.extensions=V;this.properties=T;this.state=J;var Ea=new THREE.WebGLShadowMap(this,S,qa);
	this.shadowMap=Ea;var Ia=new THREE.SpritePlugin(this,U),Ja=new THREE.LensFlarePlugin(this,Y);this.getContext=function(){return t};this.getContextAttributes=function(){return t.getContextAttributes()};this.forceContextLoss=function(){V.get("WEBGL_lose_context").loseContext()};this.getMaxAnisotropy=function(){var a;return function(){if(void 0!==a)return a;var b=V.get("EXT_texture_filter_anisotropic");return a=null!==b?t.getParameter(b.MAX_TEXTURE_MAX_ANISOTROPY_EXT):0}}();this.getPrecision=function(){return ca.precision};
	this.getPixelRatio=function(){return $};this.setPixelRatio=function(a){void 0!==a&&($=a,this.setSize(na.z,na.w,!1))};this.getSize=function(){return{width:va,height:wa}};this.setSize=function(a,b,c){va=a;wa=b;z.width=a*$;z.height=b*$;!1!==c&&(z.style.width=a+"px",z.style.height=b+"px");this.setViewport(0,0,a,b)};this.setViewport=function(a,b,c,d){J.viewport(na.set(a,b,c,d))};this.setScissor=function(a,b,c,d){J.scissor(ya.set(a,b,c,d))};this.setScissorTest=function(a){J.setScissorTest(Ca=a)};this.getClearColor=
	function(){return aa};this.setClearColor=function(a,c){aa.set(a);ia=void 0!==c?c:1;b(aa.r,aa.g,aa.b,ia)};this.getClearAlpha=function(){return ia};this.setClearAlpha=function(a){ia=a;b(aa.r,aa.g,aa.b,ia)};this.clear=function(a,b,c){var d=0;if(void 0===a||a)d|=t.COLOR_BUFFER_BIT;if(void 0===b||b)d|=t.DEPTH_BUFFER_BIT;if(void 0===c||c)d|=t.STENCIL_BUFFER_BIT;t.clear(d)};this.clearColor=function(){this.clear(!0,!1,!1)};this.clearDepth=function(){this.clear(!1,!0,!1)};this.clearStencil=function(){this.clear(!1,
	!1,!0)};this.clearTarget=function(a,b,c,d){this.setRenderTarget(a);this.clear(b,c,d)};this.resetGLState=d;this.dispose=function(){z.removeEventListener("webglcontextlost",e,!1)};this.renderBufferImmediate=function(a,b,c){J.initAttributes();var d=T.get(a);a.hasPositions&&!d.position&&(d.position=t.createBuffer());a.hasNormals&&!d.normal&&(d.normal=t.createBuffer());a.hasUvs&&!d.uv&&(d.uv=t.createBuffer());a.hasColors&&!d.color&&(d.color=t.createBuffer());b=b.getAttributes();a.hasPositions&&(t.bindBuffer(t.ARRAY_BUFFER,
	d.position),t.bufferData(t.ARRAY_BUFFER,a.positionArray,t.DYNAMIC_DRAW),J.enableAttribute(b.position),t.vertexAttribPointer(b.position,3,t.FLOAT,!1,0,0));if(a.hasNormals){t.bindBuffer(t.ARRAY_BUFFER,d.normal);if("MeshPhongMaterial"!==c.type&&"MeshStandardMaterial"!==c.type&&"MeshPhysicalMaterial"!==c.type&&c.shading===THREE.FlatShading)for(var e=0,f=3*a.count;e<f;e+=9){var g=a.normalArray,h=(g[e+0]+g[e+3]+g[e+6])/3,k=(g[e+1]+g[e+4]+g[e+7])/3,m=(g[e+2]+g[e+5]+g[e+8])/3;g[e+0]=h;g[e+1]=k;g[e+2]=m;g[e+
	3]=h;g[e+4]=k;g[e+5]=m;g[e+6]=h;g[e+7]=k;g[e+8]=m}t.bufferData(t.ARRAY_BUFFER,a.normalArray,t.DYNAMIC_DRAW);J.enableAttribute(b.normal);t.vertexAttribPointer(b.normal,3,t.FLOAT,!1,0,0)}a.hasUvs&&c.map&&(t.bindBuffer(t.ARRAY_BUFFER,d.uv),t.bufferData(t.ARRAY_BUFFER,a.uvArray,t.DYNAMIC_DRAW),J.enableAttribute(b.uv),t.vertexAttribPointer(b.uv,2,t.FLOAT,!1,0,0));a.hasColors&&c.vertexColors!==THREE.NoColors&&(t.bindBuffer(t.ARRAY_BUFFER,d.color),t.bufferData(t.ARRAY_BUFFER,a.colorArray,t.DYNAMIC_DRAW),
	J.enableAttribute(b.color),t.vertexAttribPointer(b.color,3,t.FLOAT,!1,0,0));J.disableUnusedAttributes();t.drawArrays(t.TRIANGLES,0,a.count);a.count=0};this.renderBufferDirect=function(a,b,c,d,e,f){u(d);var g=x(a,b,d,e),h=!1;a=c.id+"_"+g.id+"_"+d.wireframe;a!==oa&&(oa=a,h=!0);b=e.morphTargetInfluences;if(void 0!==b){a=[];for(var k=0,h=b.length;k<h;k++){var m=b[k];a.push([m,k])}a.sort(l);8<a.length&&(a.length=8);for(var p=c.morphAttributes,k=0,h=a.length;k<h;k++)m=a[k],da[k]=m[0],0!==m[0]?(b=m[1],!0===
	d.morphTargets&&p.position&&c.addAttribute("morphTarget"+k,p.position[b]),!0===d.morphNormals&&p.normal&&c.addAttribute("morphNormal"+k,p.normal[b])):(!0===d.morphTargets&&c.removeAttribute("morphTarget"+k),!0===d.morphNormals&&c.removeAttribute("morphNormal"+k));g.getUniforms().setValue(t,"morphTargetInfluences",da);h=!0}b=c.index;k=c.attributes.position;!0===d.wireframe&&(b=qa.getWireframeAttribute(c));null!==b?(a=Ha,a.setIndex(b)):a=Ga;if(h){a:{var h=void 0,n;if(c instanceof THREE.InstancedBufferGeometry&&
	(n=V.get("ANGLE_instanced_arrays"),null===n)){console.error("THREE.WebGLRenderer.setupVertexAttributes: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");break a}void 0===h&&(h=0);J.initAttributes();var m=c.attributes,g=g.getAttributes(),p=d.defaultAttributeValues,q;for(q in g){var r=g[q];if(0<=r){var s=m[q];if(void 0!==s){var v=t.FLOAT,w=s.array,E=s.normalized;w instanceof Float32Array?v=t.FLOAT:w instanceof Float64Array?console.warn("Unsupported data buffer format: Float64Array"):
	w instanceof Uint16Array?v=t.UNSIGNED_SHORT:w instanceof Int16Array?v=t.SHORT:w instanceof Uint32Array?v=t.UNSIGNED_INT:w instanceof Int32Array?v=t.INT:w instanceof Int8Array?v=t.BYTE:w instanceof Uint8Array&&(v=t.UNSIGNED_BYTE);var w=s.itemSize,L=qa.getAttributeBuffer(s);if(s instanceof THREE.InterleavedBufferAttribute){var y=s.data,C=y.stride,s=s.offset;y instanceof THREE.InstancedInterleavedBuffer?(J.enableAttributeAndDivisor(r,y.meshPerAttribute,n),void 0===c.maxInstancedCount&&(c.maxInstancedCount=
	y.meshPerAttribute*y.count)):J.enableAttribute(r);t.bindBuffer(t.ARRAY_BUFFER,L);t.vertexAttribPointer(r,w,v,E,C*y.array.BYTES_PER_ELEMENT,(h*C+s)*y.array.BYTES_PER_ELEMENT)}else s instanceof THREE.InstancedBufferAttribute?(J.enableAttributeAndDivisor(r,s.meshPerAttribute,n),void 0===c.maxInstancedCount&&(c.maxInstancedCount=s.meshPerAttribute*s.count)):J.enableAttribute(r),t.bindBuffer(t.ARRAY_BUFFER,L),t.vertexAttribPointer(r,w,v,E,0,h*w*s.array.BYTES_PER_ELEMENT)}else if(void 0!==p&&(v=p[q],void 0!==
	v))switch(v.length){case 2:t.vertexAttrib2fv(r,v);break;case 3:t.vertexAttrib3fv(r,v);break;case 4:t.vertexAttrib4fv(r,v);break;default:t.vertexAttrib1fv(r,v)}}}J.disableUnusedAttributes()}null!==b&&t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,qa.getAttributeBuffer(b))}n=Infinity;null!==b?n=b.count:void 0!==k&&(n=k.count);q=c.drawRange.start;b=c.drawRange.count;k=null!==f?f.start:0;h=null!==f?f.count:Infinity;f=Math.max(0,q,k);n=Math.min(0+n,q+b,k+h)-1;n=Math.max(0,n-f+1);if(e instanceof THREE.Mesh)if(!0===
	d.wireframe)J.setLineWidth(d.wireframeLinewidth*(null===la?$:1)),a.setMode(t.LINES);else switch(e.drawMode){case THREE.TrianglesDrawMode:a.setMode(t.TRIANGLES);break;case THREE.TriangleStripDrawMode:a.setMode(t.TRIANGLE_STRIP);break;case THREE.TriangleFanDrawMode:a.setMode(t.TRIANGLE_FAN)}else e instanceof THREE.Line?(d=d.linewidth,void 0===d&&(d=1),J.setLineWidth(d*(null===la?$:1)),e instanceof THREE.LineSegments?a.setMode(t.LINES):a.setMode(t.LINE_STRIP)):e instanceof THREE.Points&&a.setMode(t.POINTS);
	c instanceof THREE.InstancedBufferGeometry?0<c.maxInstancedCount&&a.renderInstances(c,f,n):a.render(f,n)};this.render=function(a,b,c,d){if(!1===b instanceof THREE.Camera)console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");else{var e=a.fog;oa="";Z=-1;ea=null;!0===a.autoUpdate&&a.updateMatrixWorld();null===b.parent&&b.updateMatrixWorld();b.matrixWorldInverse.getInverse(b.matrixWorld);sa.multiplyMatrices(b.projectionMatrix,b.matrixWorldInverse);Ba.setFromMatrix(sa);
	L.length=0;F=Q=-1;U.length=0;Y.length=0;za=this.localClippingEnabled;ua=ba.init(this.clippingPlanes,za,b);r(a,b);P.length=Q+1;R.length=F+1;!0===W.sortObjects&&(P.sort(n),R.sort(p));ua&&ba.beginShadows();for(var f=L,g=0,h=0,k=f.length;h<k;h++){var m=f[h];m.castShadow&&(S.shadows[g++]=m)}S.shadows.length=g;Ea.render(a,b);for(var f=L,l=m=0,q=0,v,x,u,w,E=b.matrixWorldInverse,y=0,C=0,A=0,I=0,g=0,h=f.length;g<h;g++)if(k=f[g],v=k.color,x=k.intensity,u=k.distance,w=k.shadow&&k.shadow.map?k.shadow.map.texture:
	null,k instanceof THREE.AmbientLight)m+=v.r*x,l+=v.g*x,q+=v.b*x;else if(k instanceof THREE.DirectionalLight){var z=xa.get(k);z.color.copy(k.color).multiplyScalar(k.intensity);z.direction.setFromMatrixPosition(k.matrixWorld);X.setFromMatrixPosition(k.target.matrixWorld);z.direction.sub(X);z.direction.transformDirection(E);if(z.shadow=k.castShadow)z.shadowBias=k.shadow.bias,z.shadowRadius=k.shadow.radius,z.shadowMapSize=k.shadow.mapSize;S.directionalShadowMap[y]=w;S.directionalShadowMatrix[y]=k.shadow.matrix;
	S.directional[y++]=z}else if(k instanceof THREE.SpotLight){z=xa.get(k);z.position.setFromMatrixPosition(k.matrixWorld);z.position.applyMatrix4(E);z.color.copy(v).multiplyScalar(x);z.distance=u;z.direction.setFromMatrixPosition(k.matrixWorld);X.setFromMatrixPosition(k.target.matrixWorld);z.direction.sub(X);z.direction.transformDirection(E);z.coneCos=Math.cos(k.angle);z.penumbraCos=Math.cos(k.angle*(1-k.penumbra));z.decay=0===k.distance?0:k.decay;if(z.shadow=k.castShadow)z.shadowBias=k.shadow.bias,
	z.shadowRadius=k.shadow.radius,z.shadowMapSize=k.shadow.mapSize;S.spotShadowMap[A]=w;S.spotShadowMatrix[A]=k.shadow.matrix;S.spot[A++]=z}else if(k instanceof THREE.PointLight){z=xa.get(k);z.position.setFromMatrixPosition(k.matrixWorld);z.position.applyMatrix4(E);z.color.copy(k.color).multiplyScalar(k.intensity);z.distance=k.distance;z.decay=0===k.distance?0:k.decay;if(z.shadow=k.castShadow)z.shadowBias=k.shadow.bias,z.shadowRadius=k.shadow.radius,z.shadowMapSize=k.shadow.mapSize;S.pointShadowMap[C]=
	w;void 0===S.pointShadowMatrix[C]&&(S.pointShadowMatrix[C]=new THREE.Matrix4);X.setFromMatrixPosition(k.matrixWorld).negate();S.pointShadowMatrix[C].identity().setPosition(X);S.point[C++]=z}else k instanceof THREE.HemisphereLight&&(z=xa.get(k),z.direction.setFromMatrixPosition(k.matrixWorld),z.direction.transformDirection(E),z.direction.normalize(),z.skyColor.copy(k.color).multiplyScalar(x),z.groundColor.copy(k.groundColor).multiplyScalar(x),S.hemi[I++]=z);S.ambient[0]=m;S.ambient[1]=l;S.ambient[2]=
	q;S.directional.length=y;S.spot.length=A;S.point.length=C;S.hemi.length=I;S.hash=y+","+C+","+A+","+I+","+S.shadows.length;ua&&ba.endShadows();ha.calls=0;ha.vertices=0;ha.faces=0;ha.points=0;void 0===c&&(c=null);this.setRenderTarget(c);(this.autoClear||d)&&this.clear(this.autoClearColor,this.autoClearDepth,this.autoClearStencil);a.overrideMaterial?(d=a.overrideMaterial,s(P,b,e,d),s(R,b,e,d)):(J.setBlending(THREE.NoBlending),s(P,b,e),s(R,b,e));Ia.render(a,b);Ja.render(a,b,ma);c&&(a=c.texture,a.generateMipmaps&&
	D(c)&&a.minFilter!==THREE.NearestFilter&&a.minFilter!==THREE.LinearFilter&&(a=c instanceof THREE.WebGLRenderTargetCube?t.TEXTURE_CUBE_MAP:t.TEXTURE_2D,c=T.get(c.texture).__webglTexture,J.bindTexture(a,c),t.generateMipmap(a),J.bindTexture(a,null)));J.setDepthTest(!0);J.setDepthWrite(!0);J.setColorWrite(!0)}};this.setFaceCulling=function(a,b){J.setCullFace(a);J.setFlipSided(b===THREE.FrontFaceDirectionCW)};this.allocTextureUnit=function(){var a=ta;a>=ca.maxTextures&&console.warn("WebGLRenderer: trying to use "+
	a+" texture units while this GPU supports only "+ca.maxTextures);ta+=1;return a};this.setTexture2D=function(){var a=!1;return function(b,c){b instanceof THREE.WebGLRenderTarget&&(a||(console.warn("THREE.WebGLRenderer.setTexture2D: don't use render targets as textures. Use their .texture property instead."),a=!0),b=b.texture);var d=b,e=T.get(d);if(0<d.version&&e.__version!==d.version){var g=d.image;if(void 0===g)console.warn("THREE.WebGLRenderer: Texture marked for update but image is undefined",d);
	else if(!1===g.complete)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete",d);else{void 0===e.__webglInit&&(e.__webglInit=!0,d.addEventListener("dispose",f),e.__webglTexture=t.createTexture(),ja.textures++);J.activeTexture(t.TEXTURE0+c);J.bindTexture(t.TEXTURE_2D,e.__webglTexture);t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,d.flipY);t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,d.premultiplyAlpha);t.pixelStorei(t.UNPACK_ALIGNMENT,d.unpackAlignment);var h=w(d.image,ca.maxTextureSize);
	if((d.wrapS!==THREE.ClampToEdgeWrapping||d.wrapT!==THREE.ClampToEdgeWrapping||d.minFilter!==THREE.NearestFilter&&d.minFilter!==THREE.LinearFilter)&&!1===D(h))if(g=h,g instanceof HTMLImageElement||g instanceof HTMLCanvasElement){var k=document.createElement("canvas");k.width=THREE.Math.nearestPowerOfTwo(g.width);k.height=THREE.Math.nearestPowerOfTwo(g.height);k.getContext("2d").drawImage(g,0,0,k.width,k.height);console.warn("THREE.WebGLRenderer: image is not power of two ("+g.width+"x"+g.height+"). Resized to "+
	k.width+"x"+k.height,g);h=k}else h=g;var g=D(h),k=G(d.format),m=G(d.type);C(t.TEXTURE_2D,d,g);var l=d.mipmaps;if(d instanceof THREE.DepthTexture){l=t.DEPTH_COMPONENT;if(d.type===THREE.FloatType){if(!Da)throw Error("Float Depth Texture only supported in WebGL2.0");l=t.DEPTH_COMPONENT32F}else Da&&(l=t.DEPTH_COMPONENT16);J.texImage2D(t.TEXTURE_2D,0,l,h.width,h.height,0,k,m,null)}else if(d instanceof THREE.DataTexture)if(0<l.length&&g){for(var n=0,p=l.length;n<p;n++)h=l[n],J.texImage2D(t.TEXTURE_2D,n,
	k,h.width,h.height,0,k,m,h.data);d.generateMipmaps=!1}else J.texImage2D(t.TEXTURE_2D,0,k,h.width,h.height,0,k,m,h.data);else if(d instanceof THREE.CompressedTexture)for(n=0,p=l.length;n<p;n++)h=l[n],d.format!==THREE.RGBAFormat&&d.format!==THREE.RGBFormat?-1<J.getCompressedTextureFormats().indexOf(k)?J.compressedTexImage2D(t.TEXTURE_2D,n,k,h.width,h.height,0,h.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):J.texImage2D(t.TEXTURE_2D,
	n,k,h.width,h.height,0,k,m,h.data);else if(0<l.length&&g){n=0;for(p=l.length;n<p;n++)h=l[n],J.texImage2D(t.TEXTURE_2D,n,k,k,m,h);d.generateMipmaps=!1}else J.texImage2D(t.TEXTURE_2D,0,k,k,m,h);d.generateMipmaps&&g&&t.generateMipmap(t.TEXTURE_2D);e.__version=d.version;if(d.onUpdate)d.onUpdate(d)}}else J.activeTexture(t.TEXTURE0+c),J.bindTexture(t.TEXTURE_2D,e.__webglTexture)}}();this.setTexture=function(){var a=!1;return function(b,c){a||(console.warn("THREE.WebGLRenderer: .setTexture is deprecated, use setTexture2D instead."),
	a=!0);W.setTexture2D(b,c)}}();this.setTextureCube=function(){var a=!1;return function(b,c){b instanceof THREE.WebGLRenderTargetCube&&(a||(console.warn("THREE.WebGLRenderer.setTextureCube: don't use cube render targets as textures. Use their .texture property instead."),a=!0),b=b.texture);if(b instanceof THREE.CubeTexture||Array.isArray(b.image)&&6===b.image.length){var d=b,e=T.get(d);if(6===d.image.length)if(0<d.version&&e.__version!==d.version){e.__image__webglTextureCube||(d.addEventListener("dispose",
	f),e.__image__webglTextureCube=t.createTexture(),ja.textures++);J.activeTexture(t.TEXTURE0+c);J.bindTexture(t.TEXTURE_CUBE_MAP,e.__image__webglTextureCube);t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,d.flipY);for(var g=d instanceof THREE.CompressedTexture,h=d.image[0]instanceof THREE.DataTexture,k=[],m=0;6>m;m++)k[m]=!W.autoScaleCubemaps||g||h?h?d.image[m].image:d.image[m]:w(d.image[m],ca.maxCubemapSize);var l=D(k[0]),n=G(d.format),p=G(d.type);C(t.TEXTURE_CUBE_MAP,d,l);for(m=0;6>m;m++)if(g)for(var q,r=k[m].mipmaps,
	s=0,x=r.length;s<x;s++)q=r[s],d.format!==THREE.RGBAFormat&&d.format!==THREE.RGBFormat?-1<J.getCompressedTextureFormats().indexOf(n)?J.compressedTexImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+m,s,n,q.width,q.height,0,q.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):J.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+m,s,n,q.width,q.height,0,n,p,q.data);else h?J.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+m,0,n,k[m].width,k[m].height,0,n,p,k[m].data):
	J.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+m,0,n,n,p,k[m]);d.generateMipmaps&&l&&t.generateMipmap(t.TEXTURE_CUBE_MAP);e.__version=d.version;if(d.onUpdate)d.onUpdate(d)}else J.activeTexture(t.TEXTURE0+c),J.bindTexture(t.TEXTURE_CUBE_MAP,e.__image__webglTextureCube)}else d=b,J.activeTexture(t.TEXTURE0+c),J.bindTexture(t.TEXTURE_CUBE_MAP,T.get(d).__webglTexture)}}();this.getCurrentRenderTarget=function(){return la};this.setRenderTarget=function(a){if((la=a)&&void 0===T.get(a).__webglFramebuffer){var b=
	T.get(a),c=T.get(a.texture);a.addEventListener("dispose",g);c.__webglTexture=t.createTexture();ja.textures++;var d=a instanceof THREE.WebGLRenderTargetCube,e=THREE.Math.isPowerOfTwo(a.width)&&THREE.Math.isPowerOfTwo(a.height);if(d){b.__webglFramebuffer=[];for(var f=0;6>f;f++)b.__webglFramebuffer[f]=t.createFramebuffer()}else b.__webglFramebuffer=t.createFramebuffer();if(d){J.bindTexture(t.TEXTURE_CUBE_MAP,c.__webglTexture);C(t.TEXTURE_CUBE_MAP,a.texture,e);for(f=0;6>f;f++)A(b.__webglFramebuffer[f],
	a,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+f);a.texture.generateMipmaps&&e&&t.generateMipmap(t.TEXTURE_CUBE_MAP);J.bindTexture(t.TEXTURE_CUBE_MAP,null)}else J.bindTexture(t.TEXTURE_2D,c.__webglTexture),C(t.TEXTURE_2D,a.texture,e),A(b.__webglFramebuffer,a,t.COLOR_ATTACHMENT0,t.TEXTURE_2D),a.texture.generateMipmaps&&e&&t.generateMipmap(t.TEXTURE_2D),J.bindTexture(t.TEXTURE_2D,null);if(a.depthBuffer){b=T.get(a);c=a instanceof THREE.WebGLRenderTargetCube;if(a.depthTexture){if(c)throw Error("target.depthTexture not supported in Cube render targets");
	if(a instanceof THREE.WebGLRenderTargetCube)throw Error("Depth Texture with cube render targets is not supported!");t.bindFramebuffer(t.FRAMEBUFFER,b.__webglFramebuffer);if(!(a.depthTexture instanceof THREE.DepthTexture))throw Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");T.get(a.depthTexture).__webglTexture&&a.depthTexture.image.width===a.width&&a.depthTexture.image.height===a.height||(a.depthTexture.image.width=a.width,a.depthTexture.image.height=a.height,a.depthTexture.needsUpdate=
	!0);W.setTexture2D(a.depthTexture,0);b=T.get(a.depthTexture).__webglTexture;t.framebufferTexture2D(t.FRAMEBUFFER,t.DEPTH_ATTACHMENT,t.TEXTURE_2D,b,0)}else if(c)for(b.__webglDepthbuffer=[],c=0;6>c;c++)t.bindFramebuffer(t.FRAMEBUFFER,b.__webglFramebuffer[c]),b.__webglDepthbuffer[c]=t.createRenderbuffer(),y(b.__webglDepthbuffer[c],a);else t.bindFramebuffer(t.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer=t.createRenderbuffer(),y(b.__webglDepthbuffer,a);t.bindFramebuffer(t.FRAMEBUFFER,null)}}b=
	a instanceof THREE.WebGLRenderTargetCube;a?(c=T.get(a),c=b?c.__webglFramebuffer[a.activeCubeFace]:c.__webglFramebuffer,ra.copy(a.scissor),Aa=a.scissorTest,ma.copy(a.viewport)):(c=null,ra.copy(ya).multiplyScalar($),Aa=Ca,ma.copy(na).multiplyScalar($));ga!==c&&(t.bindFramebuffer(t.FRAMEBUFFER,c),ga=c);J.scissor(ra);J.setScissorTest(Aa);J.viewport(ma);b&&(b=T.get(a.texture),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+a.activeCubeFace,b.__webglTexture,a.activeMipMapLevel))};
	this.readRenderTargetPixels=function(a,b,c,d,e,f){if(!1===a instanceof THREE.WebGLRenderTarget)console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");else{var g=T.get(a).__webglFramebuffer;if(g){var h=!1;g!==ga&&(t.bindFramebuffer(t.FRAMEBUFFER,g),h=!0);try{var k=a.texture;k.format!==THREE.RGBAFormat&&G(k.format)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_FORMAT)?console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format."):
	k.type===THREE.UnsignedByteType||G(k.type)===t.getParameter(t.IMPLEMENTATION_COLOR_READ_TYPE)||k.type===THREE.FloatType&&V.get("WEBGL_color_buffer_float")||k.type===THREE.HalfFloatType&&V.get("EXT_color_buffer_half_float")?t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE?0<=b&&b<=a.width-d&&0<=c&&c<=a.height-e&&t.readPixels(b,c,d,e,G(k.format),G(k.type),f):console.error("THREE.WebGLRenderer.readRenderTargetPixels: readPixels from renderTarget failed. Framebuffer not complete."):console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.")}finally{h&&
	t.bindFramebuffer(t.FRAMEBUFFER,ga)}}}}};
	THREE.WebGLRenderTarget=function(a,b,c){this.uuid=THREE.Math.generateUUID();this.width=a;this.height=b;this.scissor=new THREE.Vector4(0,0,a,b);this.scissorTest=!1;this.viewport=new THREE.Vector4(0,0,a,b);c=c||{};void 0===c.minFilter&&(c.minFilter=THREE.LinearFilter);this.texture=new THREE.Texture(void 0,void 0,c.wrapS,c.wrapT,c.magFilter,c.minFilter,c.format,c.type,c.anisotropy,c.encoding);this.depthBuffer=void 0!==c.depthBuffer?c.depthBuffer:!0;this.stencilBuffer=void 0!==c.stencilBuffer?c.stencilBuffer:
	!0;this.depthTexture=null};
	Object.assign(THREE.WebGLRenderTarget.prototype,THREE.EventDispatcher.prototype,{setSize:function(a,b){if(this.width!==a||this.height!==b)this.width=a,this.height=b,this.dispose();this.viewport.set(0,0,a,b);this.scissor.set(0,0,a,b)},clone:function(){return(new this.constructor).copy(this)},copy:function(a){this.width=a.width;this.height=a.height;this.viewport.copy(a.viewport);this.texture=a.texture.clone();this.depthBuffer=a.depthBuffer;this.stencilBuffer=a.stencilBuffer;this.depthTexture=a.depthTexture;
	return this},dispose:function(){this.dispatchEvent({type:"dispose"})}});THREE.WebGLRenderTargetCube=function(a,b,c){THREE.WebGLRenderTarget.call(this,a,b,c);this.activeMipMapLevel=this.activeCubeFace=0};THREE.WebGLRenderTargetCube.prototype=Object.create(THREE.WebGLRenderTarget.prototype);THREE.WebGLRenderTargetCube.prototype.constructor=THREE.WebGLRenderTargetCube;
	THREE.WebGLBufferRenderer=function(a,b,c){var d;this.setMode=function(a){d=a};this.render=function(b,f){a.drawArrays(d,b,f);c.calls++;c.vertices+=f;d===a.TRIANGLES&&(c.faces+=f/3)};this.renderInstances=function(e){var f=b.get("ANGLE_instanced_arrays");if(null===f)console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");else{var g=e.attributes.position,h=0,h=g instanceof THREE.InterleavedBufferAttribute?g.data.count:
	g.count;f.drawArraysInstancedANGLE(d,0,h,e.maxInstancedCount);c.calls++;c.vertices+=h*e.maxInstancedCount;d===a.TRIANGLES&&(c.faces+=e.maxInstancedCount*h/3)}}};
	THREE.WebGLClipping=function(){function a(){l.value!==d&&(l.value=d,l.needsUpdate=0<e);c.numPlanes=e}function b(a,b,d,e){var f=null!==a?a.length:0,g=null;if(0!==f){g=l.value;if(!0!==e||null===g){e=d+4*f;b=b.matrixWorldInverse;k.getNormalMatrix(b);if(null===g||g.length<e)g=new Float32Array(e);for(e=0;e!==f;++e,d+=4)h.copy(a[e]).applyMatrix4(b,k),h.normal.toArray(g,d),g[d+3]=h.constant}l.value=g;l.needsUpdate=!0}c.numPlanes=f;return g}var c=this,d=null,e=0,f=!1,g=!1,h=new THREE.Plane,k=new THREE.Matrix3,
	l={value:null,needsUpdate:!1};this.uniform=l;this.numPlanes=0;this.init=function(a,c,g){var h=0!==a.length||c||0!==e||f;f=c;d=b(a,g,0);e=a.length;return h};this.beginShadows=function(){g=!0;b(null)};this.endShadows=function(){g=!1;a()};this.setState=function(c,h,k,q,r){if(!f||null===c||0===c.length||g&&!h)g?b(null):a();else{h=g?0:e;var s=4*h,u=q.clippingState||null;l.value=u;u=b(c,k,s,r);for(c=0;c!==s;++c)u[c]=d[c];q.clippingState=u;this.numPlanes+=h}}};
	THREE.WebGLIndexedBufferRenderer=function(a,b,c){var d,e,f;this.setMode=function(a){d=a};this.setIndex=function(c){c.array instanceof Uint32Array&&b.get("OES_element_index_uint")?(e=a.UNSIGNED_INT,f=4):(e=a.UNSIGNED_SHORT,f=2)};this.render=function(b,h){a.drawElements(d,h,e,b*f);c.calls++;c.vertices+=h;d===a.TRIANGLES&&(c.faces+=h/3)};this.renderInstances=function(g,h,k){var l=b.get("ANGLE_instanced_arrays");null===l?console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays."):
	(l.drawElementsInstancedANGLE(d,k,e,h*f,g.maxInstancedCount),c.calls++,c.vertices+=k*g.maxInstancedCount,d===a.TRIANGLES&&(c.faces+=g.maxInstancedCount*k/3))}};
	THREE.WebGLExtensions=function(a){var b={};this.get=function(c){if(void 0!==b[c])return b[c];var d;switch(c){case "WEBGL_depth_texture":a.getExtension("WEBGL_depth_texture")||a.getExtension("MOZ_WEBGL_depth_texture")||a.getExtension("WEBKIT_WEBGL_depth_texture");case "EXT_texture_filter_anisotropic":d=a.getExtension("EXT_texture_filter_anisotropic")||a.getExtension("MOZ_EXT_texture_filter_anisotropic")||a.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case "WEBGL_compressed_texture_s3tc":d=
	a.getExtension("WEBGL_compressed_texture_s3tc")||a.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case "WEBGL_compressed_texture_pvrtc":d=a.getExtension("WEBGL_compressed_texture_pvrtc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;case "WEBGL_compressed_texture_etc1":d=a.getExtension("WEBGL_compressed_texture_etc1");break;default:d=a.getExtension(c)}null===d&&console.warn("THREE.WebGLRenderer: "+c+" extension not supported.");
	return b[c]=d}};
	THREE.WebGLCapabilities=function(a,b,c){function d(b){if("highp"===b){if(0<a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.HIGH_FLOAT).precision&&0<a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.HIGH_FLOAT).precision)return"highp";b="mediump"}return"mediump"===b&&0<a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.MEDIUM_FLOAT).precision&&0<a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.MEDIUM_FLOAT).precision?"mediump":"lowp"}this.getMaxPrecision=d;this.precision=void 0!==c.precision?c.precision:"highp";
	this.logarithmicDepthBuffer=void 0!==c.logarithmicDepthBuffer?c.logarithmicDepthBuffer:!1;this.maxTextures=a.getParameter(a.MAX_TEXTURE_IMAGE_UNITS);this.maxVertexTextures=a.getParameter(a.MAX_VERTEX_TEXTURE_IMAGE_UNITS);this.maxTextureSize=a.getParameter(a.MAX_TEXTURE_SIZE);this.maxCubemapSize=a.getParameter(a.MAX_CUBE_MAP_TEXTURE_SIZE);this.maxAttributes=a.getParameter(a.MAX_VERTEX_ATTRIBS);this.maxVertexUniforms=a.getParameter(a.MAX_VERTEX_UNIFORM_VECTORS);this.maxVaryings=a.getParameter(a.MAX_VARYING_VECTORS);
	this.maxFragmentUniforms=a.getParameter(a.MAX_FRAGMENT_UNIFORM_VECTORS);this.vertexTextures=0<this.maxVertexTextures;this.floatFragmentTextures=!!b.get("OES_texture_float");this.floatVertexTextures=this.vertexTextures&&this.floatFragmentTextures;c=d(this.precision);c!==this.precision&&(console.warn("THREE.WebGLRenderer:",this.precision,"not supported, using",c,"instead."),this.precision=c);this.logarithmicDepthBuffer&&(this.logarithmicDepthBuffer=!!b.get("EXT_frag_depth"))};
	THREE.WebGLGeometries=function(a,b,c){function d(a){var h=a.target;a=f[h.id];null!==a.index&&e(a.index);var k=a.attributes,l;for(l in k)e(k[l]);h.removeEventListener("dispose",d);delete f[h.id];l=b.get(h);l.wireframe&&e(l.wireframe);b.delete(h);h=b.get(a);h.wireframe&&e(h.wireframe);b.delete(a);c.memory.geometries--}function e(c){var d;d=c instanceof THREE.InterleavedBufferAttribute?b.get(c.data).__webglBuffer:b.get(c).__webglBuffer;void 0!==d&&(a.deleteBuffer(d),c instanceof THREE.InterleavedBufferAttribute?
	b.delete(c.data):b.delete(c))}var f={};this.get=function(a){var b=a.geometry;if(void 0!==f[b.id])return f[b.id];b.addEventListener("dispose",d);var e;b instanceof THREE.BufferGeometry?e=b:b instanceof THREE.Geometry&&(void 0===b._bufferGeometry&&(b._bufferGeometry=(new THREE.BufferGeometry).setFromObject(a)),e=b._bufferGeometry);f[b.id]=e;c.memory.geometries++;return e}};
	THREE.WebGLLights=function(){var a={};this.get=function(b){if(void 0!==a[b.id])return a[b.id];var c;switch(b.type){case "DirectionalLight":c={direction:new THREE.Vector3,color:new THREE.Color,shadow:!1,shadowBias:0,shadowRadius:1,shadowMapSize:new THREE.Vector2};break;case "SpotLight":c={position:new THREE.Vector3,direction:new THREE.Vector3,color:new THREE.Color,distance:0,coneCos:0,penumbraCos:0,decay:0,shadow:!1,shadowBias:0,shadowRadius:1,shadowMapSize:new THREE.Vector2};break;case "PointLight":c=
	{position:new THREE.Vector3,color:new THREE.Color,distance:0,decay:0,shadow:!1,shadowBias:0,shadowRadius:1,shadowMapSize:new THREE.Vector2};break;case "HemisphereLight":c={direction:new THREE.Vector3,skyColor:new THREE.Color,groundColor:new THREE.Color}}return a[b.id]=c}};
	THREE.WebGLObjects=function(a,b,c){function d(c,d){var e=c instanceof THREE.InterleavedBufferAttribute?c.data:c,f=b.get(e);void 0===f.__webglBuffer?(f.__webglBuffer=a.createBuffer(),a.bindBuffer(d,f.__webglBuffer),a.bufferData(d,e.array,e.dynamic?a.DYNAMIC_DRAW:a.STATIC_DRAW),f.version=e.version):f.version!==e.version&&(a.bindBuffer(d,f.__webglBuffer),!1===e.dynamic||-1===e.updateRange.count?a.bufferSubData(d,0,e.array):0===e.updateRange.count?console.error("THREE.WebGLObjects.updateBuffer: dynamic THREE.BufferAttribute marked as needsUpdate but updateRange.count is 0, ensure you are using set methods or updating manually."):
	(a.bufferSubData(d,e.updateRange.offset*e.array.BYTES_PER_ELEMENT,e.array.subarray(e.updateRange.offset,e.updateRange.offset+e.updateRange.count)),e.updateRange.count=0),f.version=e.version)}function e(a,b,c){if(b>c){var d=b;b=c;c=d}d=a[b];return void 0===d?(a[b]=[c],!0):-1===d.indexOf(c)?(d.push(c),!0):!1}var f=new THREE.WebGLGeometries(a,b,c);this.getAttributeBuffer=function(a){return a instanceof THREE.InterleavedBufferAttribute?b.get(a.data).__webglBuffer:b.get(a).__webglBuffer};this.getWireframeAttribute=
	function(c){var f=b.get(c);if(void 0!==f.wireframe)return f.wireframe;var k=[],l=c.index,n=c.attributes;c=n.position;if(null!==l)for(var n={},l=l.array,p=0,m=l.length;p<m;p+=3){var q=l[p+0],r=l[p+1],s=l[p+2];e(n,q,r)&&k.push(q,r);e(n,r,s)&&k.push(r,s);e(n,s,q)&&k.push(s,q)}else for(l=n.position.array,p=0,m=l.length/3-1;p<m;p+=3)q=p+0,r=p+1,s=p+2,k.push(q,r,r,s,s,q);k=new THREE.BufferAttribute(new (65535<c.count?Uint32Array:Uint16Array)(k),1);d(k,a.ELEMENT_ARRAY_BUFFER);return f.wireframe=k};this.update=
	function(b){var c=f.get(b);b.geometry instanceof THREE.Geometry&&c.updateFromObject(b);b=c.index;var e=c.attributes;null!==b&&d(b,a.ELEMENT_ARRAY_BUFFER);for(var l in e)d(e[l],a.ARRAY_BUFFER);b=c.morphAttributes;for(l in b)for(var e=b[l],n=0,p=e.length;n<p;n++)d(e[n],a.ARRAY_BUFFER);return c}};
	THREE.WebGLProgram=function(){function a(a){switch(a){case THREE.LinearEncoding:return["Linear","( value )"];case THREE.sRGBEncoding:return["sRGB","( value )"];case THREE.RGBEEncoding:return["RGBE","( value )"];case THREE.RGBM7Encoding:return["RGBM","( value, 7.0 )"];case THREE.RGBM16Encoding:return["RGBM","( value, 16.0 )"];case THREE.RGBDEncoding:return["RGBD","( value, 256.0 )"];case THREE.GammaEncoding:return["Gamma","( value, float( GAMMA_FACTOR ) )"];default:throw Error("unsupported encoding: "+
	a);}}function b(b,c){var d=a(c);return"vec4 "+b+"( vec4 value ) { return "+d[0]+"ToLinear"+d[1]+"; }"}function c(b,c){var d=a(c);return"vec4 "+b+"( vec4 value ) { return LinearTo"+d[0]+d[1]+"; }"}function d(a,b){var c;switch(b){case THREE.LinearToneMapping:c="Linear";break;case THREE.ReinhardToneMapping:c="Reinhard";break;case THREE.Uncharted2ToneMapping:c="Uncharted2";break;case THREE.CineonToneMapping:c="OptimizedCineon";break;default:throw Error("unsupported toneMapping: "+b);}return"vec3 "+a+
	"( vec3 color ) { return "+c+"ToneMapping( color ); }"}function e(a,b,c){a=a||{};return[a.derivatives||b.envMapCubeUV||b.bumpMap||b.normalMap||b.flatShading?"#extension GL_OES_standard_derivatives : enable":"",(a.fragDepth||b.logarithmicDepthBuffer)&&c.get("EXT_frag_depth")?"#extension GL_EXT_frag_depth : enable":"",a.drawBuffers&&c.get("WEBGL_draw_buffers")?"#extension GL_EXT_draw_buffers : require":"",(a.shaderTextureLOD||b.envMap)&&c.get("EXT_shader_texture_lod")?"#extension GL_EXT_shader_texture_lod : enable":
	""].filter(g).join("\n")}function f(a){var b=[],c;for(c in a){var d=a[c];!1!==d&&b.push("#define "+c+" "+d)}return b.join("\n")}function g(a){return""!==a}function h(a,b){return a.replace(/NUM_DIR_LIGHTS/g,b.numDirLights).replace(/NUM_SPOT_LIGHTS/g,b.numSpotLights).replace(/NUM_POINT_LIGHTS/g,b.numPointLights).replace(/NUM_HEMI_LIGHTS/g,b.numHemiLights)}function k(a){return a.replace(/#include +<([\w\d.]+)>/g,function(a,b){var c=THREE.ShaderChunk[b];if(void 0===c)throw Error("Can not resolve #include <"+
	b+">");return k(c)})}function l(a){return a.replace(/for \( int i \= (\d+)\; i < (\d+)\; i \+\+ \) \{([\s\S]+?)(?=\})\}/g,function(a,b,c,d){a="";for(b=parseInt(b);b<parseInt(c);b++)a+=d.replace(/\[ i \]/g,"[ "+b+" ]");return a})}var n=0;return function(a,m,q,r){var s=a.context,u=q.extensions,x=q.defines,v=q.__webglShader.vertexShader,C=q.__webglShader.fragmentShader,w="SHADOWMAP_TYPE_BASIC";r.shadowMapType===THREE.PCFShadowMap?w="SHADOWMAP_TYPE_PCF":r.shadowMapType===THREE.PCFSoftShadowMap&&(w="SHADOWMAP_TYPE_PCF_SOFT");
	var D="ENVMAP_TYPE_CUBE",A="ENVMAP_MODE_REFLECTION",y="ENVMAP_BLENDING_MULTIPLY";if(r.envMap){switch(q.envMap.mapping){case THREE.CubeReflectionMapping:case THREE.CubeRefractionMapping:D="ENVMAP_TYPE_CUBE";break;case THREE.CubeUVReflectionMapping:case THREE.CubeUVRefractionMapping:D="ENVMAP_TYPE_CUBE_UV";break;case THREE.EquirectangularReflectionMapping:case THREE.EquirectangularRefractionMapping:D="ENVMAP_TYPE_EQUIREC";break;case THREE.SphericalReflectionMapping:D="ENVMAP_TYPE_SPHERE"}switch(q.envMap.mapping){case THREE.CubeRefractionMapping:case THREE.EquirectangularRefractionMapping:A=
	"ENVMAP_MODE_REFRACTION"}switch(q.combine){case THREE.MultiplyOperation:y="ENVMAP_BLENDING_MULTIPLY";break;case THREE.MixOperation:y="ENVMAP_BLENDING_MIX";break;case THREE.AddOperation:y="ENVMAP_BLENDING_ADD"}}var B=0<a.gammaFactor?a.gammaFactor:1,u=e(u,r,a.extensions),G=f(x),z=s.createProgram();q instanceof THREE.RawShaderMaterial?w=x="":(x=["precision "+r.precision+" float;","precision "+r.precision+" int;","#define SHADER_NAME "+q.__webglShader.name,G,r.supportsVertexTextures?"#define VERTEX_TEXTURES":
	"","#define GAMMA_FACTOR "+B,"#define MAX_BONES "+r.maxBones,r.map?"#define USE_MAP":"",r.envMap?"#define USE_ENVMAP":"",r.envMap?"#define "+A:"",r.lightMap?"#define USE_LIGHTMAP":"",r.aoMap?"#define USE_AOMAP":"",r.emissiveMap?"#define USE_EMISSIVEMAP":"",r.bumpMap?"#define USE_BUMPMAP":"",r.normalMap?"#define USE_NORMALMAP":"",r.displacementMap&&r.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",r.specularMap?"#define USE_SPECULARMAP":"",r.roughnessMap?"#define USE_ROUGHNESSMAP":"",r.metalnessMap?
	"#define USE_METALNESSMAP":"",r.alphaMap?"#define USE_ALPHAMAP":"",r.vertexColors?"#define USE_COLOR":"",r.flatShading?"#define FLAT_SHADED":"",r.skinning?"#define USE_SKINNING":"",r.useVertexTexture?"#define BONE_TEXTURE":"",r.morphTargets?"#define USE_MORPHTARGETS":"",r.morphNormals&&!1===r.flatShading?"#define USE_MORPHNORMALS":"",r.doubleSided?"#define DOUBLE_SIDED":"",r.flipSided?"#define FLIP_SIDED":"","#define NUM_CLIPPING_PLANES "+r.numClippingPlanes,r.shadowMapEnabled?"#define USE_SHADOWMAP":
	"",r.shadowMapEnabled?"#define "+w:"",r.sizeAttenuation?"#define USE_SIZEATTENUATION":"",r.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",r.logarithmicDepthBuffer&&a.extensions.get("EXT_frag_depth")?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_COLOR",
	"\tattribute vec3 color;","#endif","#ifdef USE_MORPHTARGETS","\tattribute vec3 morphTarget0;","\tattribute vec3 morphTarget1;","\tattribute vec3 morphTarget2;","\tattribute vec3 morphTarget3;","\t#ifdef USE_MORPHNORMALS","\t\tattribute vec3 morphNormal0;","\t\tattribute vec3 morphNormal1;","\t\tattribute vec3 morphNormal2;","\t\tattribute vec3 morphNormal3;","\t#else","\t\tattribute vec3 morphTarget4;","\t\tattribute vec3 morphTarget5;","\t\tattribute vec3 morphTarget6;","\t\tattribute vec3 morphTarget7;",
	"\t#endif","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif","\n"].filter(g).join("\n"),w=[u,"precision "+r.precision+" float;","precision "+r.precision+" int;","#define SHADER_NAME "+q.__webglShader.name,G,r.alphaTest?"#define ALPHATEST "+r.alphaTest:"","#define GAMMA_FACTOR "+B,r.useFog&&r.fog?"#define USE_FOG":"",r.useFog&&r.fogExp?"#define FOG_EXP2":"",r.map?"#define USE_MAP":"",r.envMap?"#define USE_ENVMAP":"",r.envMap?"#define "+D:"",r.envMap?
	"#define "+A:"",r.envMap?"#define "+y:"",r.lightMap?"#define USE_LIGHTMAP":"",r.aoMap?"#define USE_AOMAP":"",r.emissiveMap?"#define USE_EMISSIVEMAP":"",r.bumpMap?"#define USE_BUMPMAP":"",r.normalMap?"#define USE_NORMALMAP":"",r.specularMap?"#define USE_SPECULARMAP":"",r.roughnessMap?"#define USE_ROUGHNESSMAP":"",r.metalnessMap?"#define USE_METALNESSMAP":"",r.alphaMap?"#define USE_ALPHAMAP":"",r.vertexColors?"#define USE_COLOR":"",r.flatShading?"#define FLAT_SHADED":"",r.doubleSided?"#define DOUBLE_SIDED":
	"",r.flipSided?"#define FLIP_SIDED":"","#define NUM_CLIPPING_PLANES "+r.numClippingPlanes,r.shadowMapEnabled?"#define USE_SHADOWMAP":"",r.shadowMapEnabled?"#define "+w:"",r.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",r.physicallyCorrectLights?"#define PHYSICALLY_CORRECT_LIGHTS":"",r.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",r.logarithmicDepthBuffer&&a.extensions.get("EXT_frag_depth")?"#define USE_LOGDEPTHBUF_EXT":"",r.envMap&&a.extensions.get("EXT_shader_texture_lod")?"#define TEXTURE_LOD_EXT":
	"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;",r.toneMapping!==THREE.NoToneMapping?"#define TONE_MAPPING":"",r.toneMapping!==THREE.NoToneMapping?THREE.ShaderChunk.tonemapping_pars_fragment:"",r.toneMapping!==THREE.NoToneMapping?d("toneMapping",r.toneMapping):"",r.outputEncoding||r.mapEncoding||r.envMapEncoding||r.emissiveMapEncoding?THREE.ShaderChunk.encodings_pars_fragment:"",r.mapEncoding?b("mapTexelToLinear",r.mapEncoding):"",r.envMapEncoding?b("envMapTexelToLinear",r.envMapEncoding):
	"",r.emissiveMapEncoding?b("emissiveMapTexelToLinear",r.emissiveMapEncoding):"",r.outputEncoding?c("linearToOutputTexel",r.outputEncoding):"",r.depthPacking?"#define DEPTH_PACKING "+q.depthPacking:"","\n"].filter(g).join("\n"));v=k(v,r);v=h(v,r);C=k(C,r);C=h(C,r);!1===q instanceof THREE.ShaderMaterial&&(v=l(v),C=l(C));C=w+C;v=THREE.WebGLShader(s,s.VERTEX_SHADER,x+v);C=THREE.WebGLShader(s,s.FRAGMENT_SHADER,C);s.attachShader(z,v);s.attachShader(z,C);void 0!==q.index0AttributeName?s.bindAttribLocation(z,
	0,q.index0AttributeName):!0===r.morphTargets&&s.bindAttribLocation(z,0,"position");s.linkProgram(z);r=s.getProgramInfoLog(z);D=s.getShaderInfoLog(v);A=s.getShaderInfoLog(C);B=y=!0;if(!1===s.getProgramParameter(z,s.LINK_STATUS))y=!1,console.error("THREE.WebGLProgram: shader error: ",s.getError(),"gl.VALIDATE_STATUS",s.getProgramParameter(z,s.VALIDATE_STATUS),"gl.getProgramInfoLog",r,D,A);else if(""!==r)console.warn("THREE.WebGLProgram: gl.getProgramInfoLog()",r);else if(""===D||""===A)B=!1;B&&(this.diagnostics=
	{runnable:y,material:q,programLog:r,vertexShader:{log:D,prefix:x},fragmentShader:{log:A,prefix:w}});s.deleteShader(v);s.deleteShader(C);var H;this.getUniforms=function(){void 0===H&&(H=new THREE.WebGLUniforms(s,z,a));return H};var M;this.getAttributes=function(){if(void 0===M){for(var a={},b=s.getProgramParameter(z,s.ACTIVE_ATTRIBUTES),c=0;c<b;c++){var d=s.getActiveAttrib(z,c).name;a[d]=s.getAttribLocation(z,d)}M=a}return M};this.destroy=function(){s.deleteProgram(z);this.program=void 0};Object.defineProperties(this,
	{uniforms:{get:function(){console.warn("THREE.WebGLProgram: .uniforms is now .getUniforms().");return this.getUniforms()}},attributes:{get:function(){console.warn("THREE.WebGLProgram: .attributes is now .getAttributes().");return this.getAttributes()}}});this.id=n++;this.code=m;this.usedTimes=1;this.program=z;this.vertexShader=v;this.fragmentShader=C;return this}}();
	THREE.WebGLPrograms=function(a,b){function c(a,b){var c;a?a instanceof THREE.Texture?c=a.encoding:a instanceof THREE.WebGLRenderTarget&&(console.warn("THREE.WebGLPrograms.getTextureEncodingFromMap: don't use render targets as textures. Use their .texture property instead."),c=a.texture.encoding):c=THREE.LinearEncoding;c===THREE.LinearEncoding&&b&&(c=THREE.GammaEncoding);return c}var d=[],e={MeshDepthMaterial:"depth",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",
	MeshPhongMaterial:"phong",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points"},f="precision supportsVertexTextures map mapEncoding envMap envMapMode envMapEncoding lightMap aoMap emissiveMap emissiveMapEncoding bumpMap normalMap displacementMap specularMap roughnessMap metalnessMap alphaMap combine vertexColors fog useFog fogExp flatShading sizeAttenuation logarithmicDepthBuffer skinning maxBones useVertexTexture morphTargets morphNormals maxMorphTargets maxMorphNormals premultipliedAlpha numDirLights numPointLights numSpotLights numHemiLights shadowMapEnabled shadowMapType toneMapping physicallyCorrectLights alphaTest doubleSided flipSided numClippingPlanes depthPacking".split(" ");
	this.getParameters=function(d,f,k,l,n){var p=e[d.type],m;b.floatVertexTextures&&n&&n.skeleton&&n.skeleton.useVertexTexture?m=1024:(m=Math.floor((b.maxVertexUniforms-20)/4),void 0!==n&&n instanceof THREE.SkinnedMesh&&(m=Math.min(n.skeleton.bones.length,m),m<n.skeleton.bones.length&&console.warn("WebGLRenderer: too many bones - "+n.skeleton.bones.length+", this GPU supports just "+m+" (try OpenGL instead of ANGLE)")));var q=a.getPrecision();null!==d.precision&&(q=b.getMaxPrecision(d.precision),q!==
	d.precision&&console.warn("THREE.WebGLProgram.getParameters:",d.precision,"not supported, using",q,"instead."));var r=a.getCurrentRenderTarget();return{shaderID:p,precision:q,supportsVertexTextures:b.vertexTextures,outputEncoding:c(r?r.texture:null,a.gammaOutput),map:!!d.map,mapEncoding:c(d.map,a.gammaInput),envMap:!!d.envMap,envMapMode:d.envMap&&d.envMap.mapping,envMapEncoding:c(d.envMap,a.gammaInput),envMapCubeUV:!!d.envMap&&(d.envMap.mapping===THREE.CubeUVReflectionMapping||d.envMap.mapping===
	THREE.CubeUVRefractionMapping),lightMap:!!d.lightMap,aoMap:!!d.aoMap,emissiveMap:!!d.emissiveMap,emissiveMapEncoding:c(d.emissiveMap,a.gammaInput),bumpMap:!!d.bumpMap,normalMap:!!d.normalMap,displacementMap:!!d.displacementMap,roughnessMap:!!d.roughnessMap,metalnessMap:!!d.metalnessMap,specularMap:!!d.specularMap,alphaMap:!!d.alphaMap,combine:d.combine,vertexColors:d.vertexColors,fog:k,useFog:d.fog,fogExp:k instanceof THREE.FogExp2,flatShading:d.shading===THREE.FlatShading,sizeAttenuation:d.sizeAttenuation,
	logarithmicDepthBuffer:b.logarithmicDepthBuffer,skinning:d.skinning,maxBones:m,useVertexTexture:b.floatVertexTextures&&n&&n.skeleton&&n.skeleton.useVertexTexture,morphTargets:d.morphTargets,morphNormals:d.morphNormals,maxMorphTargets:a.maxMorphTargets,maxMorphNormals:a.maxMorphNormals,numDirLights:f.directional.length,numPointLights:f.point.length,numSpotLights:f.spot.length,numHemiLights:f.hemi.length,numClippingPlanes:l,shadowMapEnabled:a.shadowMap.enabled&&n.receiveShadow&&0<f.shadows.length,shadowMapType:a.shadowMap.type,
	toneMapping:a.toneMapping,physicallyCorrectLights:a.physicallyCorrectLights,premultipliedAlpha:d.premultipliedAlpha,alphaTest:d.alphaTest,doubleSided:d.side===THREE.DoubleSide,flipSided:d.side===THREE.BackSide,depthPacking:void 0!==d.depthPacking?d.depthPacking:!1}};this.getProgramCode=function(a,b){var c=[];b.shaderID?c.push(b.shaderID):(c.push(a.fragmentShader),c.push(a.vertexShader));if(void 0!==a.defines)for(var d in a.defines)c.push(d),c.push(a.defines[d]);for(d=0;d<f.length;d++)c.push(b[f[d]]);
	return c.join()};this.acquireProgram=function(b,c,e){for(var f,n=0,p=d.length;n<p;n++){var m=d[n];if(m.code===e){f=m;++f.usedTimes;break}}void 0===f&&(f=new THREE.WebGLProgram(a,e,b,c),d.push(f));return f};this.releaseProgram=function(a){if(0===--a.usedTimes){var b=d.indexOf(a);d[b]=d[d.length-1];d.pop();a.destroy()}};this.programs=d};
	THREE.WebGLProperties=function(){var a={};this.get=function(b){b=b.uuid;var c=a[b];void 0===c&&(c={},a[b]=c);return c};this.delete=function(b){delete a[b.uuid]};this.clear=function(){a={}}};
	THREE.WebGLShader=function(){function a(a){a=a.split("\n");for(var c=0;c<a.length;c++)a[c]=c+1+": "+a[c];return a.join("\n")}return function(b,c,d){var e=b.createShader(c);b.shaderSource(e,d);b.compileShader(e);!1===b.getShaderParameter(e,b.COMPILE_STATUS)&&console.error("THREE.WebGLShader: Shader couldn't compile.");""!==b.getShaderInfoLog(e)&&console.warn("THREE.WebGLShader: gl.getShaderInfoLog()",c===b.VERTEX_SHADER?"vertex":"fragment",b.getShaderInfoLog(e),a(d));return e}}();
	THREE.WebGLShadowMap=function(a,b,c){function d(b,c,d,e){var f=b.geometry,g=null,g=r,h=b.customDepthMaterial;d&&(g=s,h=b.customDistanceMaterial);h?g=h:(b=b instanceof THREE.SkinnedMesh&&c.skinning,h=0,void 0!==f.morphTargets&&0<f.morphTargets.length&&c.morphTargets&&(h|=1),b&&(h|=2),g=g[h]);a.localClippingEnabled&&!0===c.clipShadows&&0!==c.clippingPlanes.length&&(h=g.uuid,f=c.uuid,b=u[h],void 0===b&&(b={},u[h]=b),h=b[f],void 0===h&&(h=g.clone(),b[f]=h),g=h);g.visible=c.visible;g.wireframe=c.wireframe;
	f=c.side;z.renderSingleSided&&f==THREE.DoubleSide&&(f=THREE.FrontSide);z.renderReverseSided&&(f===THREE.FrontSide?f=THREE.BackSide:f===THREE.BackSide&&(f=THREE.FrontSide));g.side=f;g.clipShadows=c.clipShadows;g.clippingPlanes=c.clippingPlanes;g.wireframeLinewidth=c.wireframeLinewidth;g.linewidth=c.linewidth;d&&void 0!==g.uniforms.lightPos&&g.uniforms.lightPos.value.copy(e);return g}function e(a,b,c){if(!1!==a.visible){a.layers.test(b.layers)&&(a instanceof THREE.Mesh||a instanceof THREE.Line||a instanceof
	THREE.Points)&&a.castShadow&&(!1===a.frustumCulled||!0===h.intersectsObject(a))&&!0===a.material.visible&&(a.modelViewMatrix.multiplyMatrices(c.matrixWorldInverse,a.matrixWorld),q.push(a));a=a.children;for(var d=0,f=a.length;d<f;d++)e(a[d],b,c)}}var f=a.context,g=a.state,h=new THREE.Frustum,k=new THREE.Matrix4,l=b.shadows,n=new THREE.Vector2,p=new THREE.Vector3,m=new THREE.Vector3,q=[],r=Array(4),s=Array(4),u={},x=[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,
	0,-1),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0)],v=[new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)],C=[new THREE.Vector4,new THREE.Vector4,new THREE.Vector4,new THREE.Vector4,new THREE.Vector4,new THREE.Vector4];b=new THREE.MeshDepthMaterial;b.depthPacking=THREE.RGBADepthPacking;b.clipping=!0;for(var w=THREE.ShaderLib.distanceRGBA,D=THREE.UniformsUtils.clone(w.uniforms),A=0;4!==A;++A){var y=
	0!==(A&1),B=0!==(A&2),G=b.clone();G.morphTargets=y;G.skinning=B;r[A]=G;y=new THREE.ShaderMaterial({defines:{USE_SHADOWMAP:""},uniforms:D,vertexShader:w.vertexShader,fragmentShader:w.fragmentShader,morphTargets:y,skinning:B,clipping:!0});s[A]=y}var z=this;this.enabled=!1;this.autoUpdate=!0;this.needsUpdate=!1;this.type=THREE.PCFShadowMap;this.renderSingleSided=this.renderReverseSided=!0;this.render=function(b,r){if(!1!==z.enabled&&(!1!==z.autoUpdate||!1!==z.needsUpdate)&&0!==l.length){g.clearColor(1,
	1,1,1);g.disable(f.BLEND);g.setDepthTest(!0);g.setScissorTest(!1);for(var s,u,w=0,y=l.length;w<y;w++){var A=l[w],L=A.shadow;if(void 0===L)console.warn("THREE.WebGLShadowMap:",A,"has no shadow.");else{var P=L.camera;n.copy(L.mapSize);if(A instanceof THREE.PointLight){s=6;u=!0;var B=n.x,D=n.y;C[0].set(2*B,D,B,D);C[1].set(0,D,B,D);C[2].set(3*B,D,B,D);C[3].set(B,D,B,D);C[4].set(3*B,0,B,D);C[5].set(B,0,B,D);n.x*=4;n.y*=2}else s=1,u=!1;null===L.map&&(L.map=new THREE.WebGLRenderTarget(n.x,n.y,{minFilter:THREE.NearestFilter,
	magFilter:THREE.NearestFilter,format:THREE.RGBAFormat}),P.updateProjectionMatrix());L instanceof THREE.SpotLightShadow&&L.update(A);B=L.map;L=L.matrix;m.setFromMatrixPosition(A.matrixWorld);P.position.copy(m);a.setRenderTarget(B);a.clear();for(B=0;B<s;B++){u?(p.copy(P.position),p.add(x[B]),P.up.copy(v[B]),P.lookAt(p),g.viewport(C[B])):(p.setFromMatrixPosition(A.target.matrixWorld),P.lookAt(p));P.updateMatrixWorld();P.matrixWorldInverse.getInverse(P.matrixWorld);L.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,
	0,0,0,1);L.multiply(P.projectionMatrix);L.multiply(P.matrixWorldInverse);k.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse);h.setFromMatrix(k);q.length=0;e(b,r,P);for(var D=0,F=q.length;D<F;D++){var G=q[D],U=c.update(G),Y=G.material;if(Y instanceof THREE.MultiMaterial)for(var W=U.groups,Y=Y.materials,fa=0,la=W.length;fa<la;fa++){var ga=W[fa],Z=Y[ga.materialIndex];!0===Z.visible&&(Z=d(G,Z,u,m),a.renderBufferDirect(P,null,U,Z,G,ga))}else Z=d(G,Y,u,m),a.renderBufferDirect(P,null,U,Z,G,null)}}}}s=
	a.getClearColor();u=a.getClearAlpha();a.setClearColor(s,u);z.needsUpdate=!1}}};
	THREE.WebGLState=function(a,b,c){function d(b,c,d){var e=new Uint8Array(3),f=a.createTexture();a.bindTexture(b,f);a.texParameteri(b,a.TEXTURE_MIN_FILTER,a.NEAREST);a.texParameteri(b,a.TEXTURE_MAG_FILTER,a.NEAREST);for(b=0;b<d;b++)a.texImage2D(c+b,0,a.RGB,1,1,0,a.RGB,a.UNSIGNED_BYTE,e);return f}var e=this;this.buffers={color:new THREE.WebGLColorBuffer(a,this),depth:new THREE.WebGLDepthBuffer(a,this),stencil:new THREE.WebGLStencilBuffer(a,this)};var f=a.getParameter(a.MAX_VERTEX_ATTRIBS),g=new Uint8Array(f),
	h=new Uint8Array(f),k=new Uint8Array(f),l={},n=null,p=null,m=null,q=null,r=null,s=null,u=null,x=null,v=!1,C=null,w=null,D=null,A=null,y=null,B=null,G=a.getParameter(a.MAX_TEXTURE_IMAGE_UNITS),z=null,H={},M=new THREE.Vector4,O=new THREE.Vector4,N={};N[a.TEXTURE_2D]=d(a.TEXTURE_2D,a.TEXTURE_2D,1);N[a.TEXTURE_CUBE_MAP]=d(a.TEXTURE_CUBE_MAP,a.TEXTURE_CUBE_MAP_POSITIVE_X,6);this.init=function(){this.clearColor(0,0,0,1);this.clearDepth(1);this.clearStencil(0);this.enable(a.DEPTH_TEST);this.setDepthFunc(THREE.LessEqualDepth);
	this.setFlipSided(!1);this.setCullFace(THREE.CullFaceBack);this.enable(a.CULL_FACE);this.enable(a.BLEND);this.setBlending(THREE.NormalBlending)};this.initAttributes=function(){for(var a=0,b=g.length;a<b;a++)g[a]=0};this.enableAttribute=function(c){g[c]=1;0===h[c]&&(a.enableVertexAttribArray(c),h[c]=1);0!==k[c]&&(b.get("ANGLE_instanced_arrays").vertexAttribDivisorANGLE(c,0),k[c]=0)};this.enableAttributeAndDivisor=function(b,c,d){g[b]=1;0===h[b]&&(a.enableVertexAttribArray(b),h[b]=1);k[b]!==c&&(d.vertexAttribDivisorANGLE(b,
	c),k[b]=c)};this.disableUnusedAttributes=function(){for(var b=0,c=h.length;b!==c;++b)h[b]!==g[b]&&(a.disableVertexAttribArray(b),h[b]=0)};this.enable=function(b){!0!==l[b]&&(a.enable(b),l[b]=!0)};this.disable=function(b){!1!==l[b]&&(a.disable(b),l[b]=!1)};this.getCompressedTextureFormats=function(){if(null===n&&(n=[],b.get("WEBGL_compressed_texture_pvrtc")||b.get("WEBGL_compressed_texture_s3tc")||b.get("WEBGL_compressed_texture_etc1")))for(var c=a.getParameter(a.COMPRESSED_TEXTURE_FORMATS),d=0;d<
	c.length;d++)n.push(c[d]);return n};this.setBlending=function(b,d,e,f,g,h,k,l){if(b!==THREE.NoBlending){this.enable(a.BLEND);if(b!==p||l!==v)b===THREE.AdditiveBlending?l?(a.blendEquationSeparate(a.FUNC_ADD,a.FUNC_ADD),a.blendFuncSeparate(a.ONE,a.ONE,a.ONE,a.ONE)):(a.blendEquation(a.FUNC_ADD),a.blendFunc(a.SRC_ALPHA,a.ONE)):b===THREE.SubtractiveBlending?l?(a.blendEquationSeparate(a.FUNC_ADD,a.FUNC_ADD),a.blendFuncSeparate(a.ZERO,a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ONE_MINUS_SRC_ALPHA)):(a.blendEquation(a.FUNC_ADD),
	a.blendFunc(a.ZERO,a.ONE_MINUS_SRC_COLOR)):b===THREE.MultiplyBlending?l?(a.blendEquationSeparate(a.FUNC_ADD,a.FUNC_ADD),a.blendFuncSeparate(a.ZERO,a.SRC_COLOR,a.ZERO,a.SRC_ALPHA)):(a.blendEquation(a.FUNC_ADD),a.blendFunc(a.ZERO,a.SRC_COLOR)):l?(a.blendEquationSeparate(a.FUNC_ADD,a.FUNC_ADD),a.blendFuncSeparate(a.ONE,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA)):(a.blendEquationSeparate(a.FUNC_ADD,a.FUNC_ADD),a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA)),
	p=b,v=l;if(b===THREE.CustomBlending){g=g||d;h=h||e;k=k||f;if(d!==m||g!==s)a.blendEquationSeparate(c(d),c(g)),m=d,s=g;if(e!==q||f!==r||h!==u||k!==x)a.blendFuncSeparate(c(e),c(f),c(h),c(k)),q=e,r=f,u=h,x=k}else x=u=s=r=q=m=null}else this.disable(a.BLEND),p=b};this.setColorWrite=function(a){this.buffers.color.setMask(a)};this.setDepthTest=function(a){this.buffers.depth.setTest(a)};this.setDepthWrite=function(a){this.buffers.depth.setMask(a)};this.setDepthFunc=function(a){this.buffers.depth.setFunc(a)};
	this.setStencilTest=function(a){this.buffers.stencil.setTest(a)};this.setStencilWrite=function(a){this.buffers.stencil.setMask(a)};this.setStencilFunc=function(a,b,c){this.buffers.stencil.setFunc(a,b,c)};this.setStencilOp=function(a,b,c){this.buffers.stencil.setOp(a,b,c)};this.setFlipSided=function(b){C!==b&&(b?a.frontFace(a.CW):a.frontFace(a.CCW),C=b)};this.setCullFace=function(b){b!==THREE.CullFaceNone?(this.enable(a.CULL_FACE),b!==w&&(b===THREE.CullFaceBack?a.cullFace(a.BACK):b===THREE.CullFaceFront?
	a.cullFace(a.FRONT):a.cullFace(a.FRONT_AND_BACK))):this.disable(a.CULL_FACE);w=b};this.setLineWidth=function(b){b!==D&&(a.lineWidth(b),D=b)};this.setPolygonOffset=function(b,c,d){if(b){if(this.enable(a.POLYGON_OFFSET_FILL),A!==c||y!==d)a.polygonOffset(c,d),A=c,y=d}else this.disable(a.POLYGON_OFFSET_FILL)};this.getScissorTest=function(){return B};this.setScissorTest=function(b){(B=b)?this.enable(a.SCISSOR_TEST):this.disable(a.SCISSOR_TEST)};this.activeTexture=function(b){void 0===b&&(b=a.TEXTURE0+
	G-1);z!==b&&(a.activeTexture(b),z=b)};this.bindTexture=function(b,c){null===z&&e.activeTexture();var d=H[z];void 0===d&&(d={type:void 0,texture:void 0},H[z]=d);if(d.type!==b||d.texture!==c)a.bindTexture(b,c||N[b]),d.type=b,d.texture=c};this.compressedTexImage2D=function(){try{a.compressedTexImage2D.apply(a,arguments)}catch(b){console.error(b)}};this.texImage2D=function(){try{a.texImage2D.apply(a,arguments)}catch(b){console.error(b)}};this.clearColor=function(a,b,c,d){this.buffers.color.setClear(a,
	b,c,d)};this.clearDepth=function(a){this.buffers.depth.setClear(a)};this.clearStencil=function(a){this.buffers.stencil.setClear(a)};this.scissor=function(b){!1===M.equals(b)&&(a.scissor(b.x,b.y,b.z,b.w),M.copy(b))};this.viewport=function(b){!1===O.equals(b)&&(a.viewport(b.x,b.y,b.z,b.w),O.copy(b))};this.reset=function(){for(var b=0;b<h.length;b++)1===h[b]&&(a.disableVertexAttribArray(b),h[b]=0);l={};z=n=null;H={};w=C=p=null;this.buffers.color.reset();this.buffers.depth.reset();this.buffers.stencil.reset()}};
	THREE.WebGLColorBuffer=function(a,b){var c=!1,d=new THREE.Vector4,e=null,f=new THREE.Vector4;this.setMask=function(b){e===b||c||(a.colorMask(b,b,b,b),e=b)};this.setLocked=function(a){c=a};this.setClear=function(b,c,e,l){d.set(b,c,e,l);!1===f.equals(d)&&(a.clearColor(b,c,e,l),f.copy(d))};this.reset=function(){c=!1;e=null;f=new THREE.Vector4}};
	THREE.WebGLDepthBuffer=function(a,b){var c=!1,d=null,e=null,f=null;this.setTest=function(c){c?b.enable(a.DEPTH_TEST):b.disable(a.DEPTH_TEST)};this.setMask=function(b){d===b||c||(a.depthMask(b),d=b)};this.setFunc=function(b){if(e!==b){if(b)switch(b){case THREE.NeverDepth:a.depthFunc(a.NEVER);break;case THREE.AlwaysDepth:a.depthFunc(a.ALWAYS);break;case THREE.LessDepth:a.depthFunc(a.LESS);break;case THREE.LessEqualDepth:a.depthFunc(a.LEQUAL);break;case THREE.EqualDepth:a.depthFunc(a.EQUAL);break;case THREE.GreaterEqualDepth:a.depthFunc(a.GEQUAL);
	break;case THREE.GreaterDepth:a.depthFunc(a.GREATER);break;case THREE.NotEqualDepth:a.depthFunc(a.NOTEQUAL);break;default:a.depthFunc(a.LEQUAL)}else a.depthFunc(a.LEQUAL);e=b}};this.setLocked=function(a){c=a};this.setClear=function(b){f!==b&&(a.clearDepth(b),f=b)};this.reset=function(){c=!1;f=e=d=null}};
	THREE.WebGLStencilBuffer=function(a,b){var c=!1,d=null,e=null,f=null,g=null,h=null,k=null,l=null,n=null;this.setTest=function(c){c?b.enable(a.STENCIL_TEST):b.disable(a.STENCIL_TEST)};this.setMask=function(b){d===b||c||(a.stencilMask(b),d=b)};this.setFunc=function(b,c,d){if(e!==b||f!==c||g!==d)a.stencilFunc(b,c,d),e=b,f=c,g=d};this.setOp=function(b,c,d){if(h!==b||k!==c||l!==d)a.stencilOp(b,c,d),h=b,k=c,l=d};this.setLocked=function(a){c=a};this.setClear=function(b){n!==b&&(a.clearStencil(b),n=b)};this.reset=
	function(){c=!1;n=l=k=h=g=f=e=d=null}};
	THREE.WebGLUniforms=function(){var a=[],b=[],c=function(b,c,d){var e=b[0];if(0>=e||0<e)return b;var f=c*d,g=a[f];void 0===g&&(g=new Float32Array(f),a[f]=g);if(0!==c)for(e.toArray(g,0),e=1,f=0;e!==c;++e)f+=d,b[e].toArray(g,f);return g},d=function(a,c){var d=b[c];void 0===d&&(d=new Int32Array(c),b[c]=d);for(var e=0;e!==c;++e)d[e]=a.allocTextureUnit();return d},e=function(a,b){a.uniform1f(this.addr,b)},f=function(a,b){a.uniform1i(this.addr,b)},g=function(a,b){void 0===b.x?a.uniform2fv(this.addr,b):a.uniform2f(this.addr,
	b.x,b.y)},h=function(a,b){void 0!==b.x?a.uniform3f(this.addr,b.x,b.y,b.z):void 0!==b.r?a.uniform3f(this.addr,b.r,b.g,b.b):a.uniform3fv(this.addr,b)},k=function(a,b){void 0===b.x?a.uniform4fv(this.addr,b):a.uniform4f(this.addr,b.x,b.y,b.z,b.w)},l=function(a,b){a.uniformMatrix2fv(this.addr,!1,b.elements||b)},n=function(a,b){a.uniformMatrix3fv(this.addr,!1,b.elements||b)},p=function(a,b){a.uniformMatrix4fv(this.addr,!1,b.elements||b)},m=function(a,b,c){var d=c.allocTextureUnit();a.uniform1i(this.addr,
	d);b&&c.setTexture2D(b,d)},q=function(a,b,c){var d=c.allocTextureUnit();a.uniform1i(this.addr,d);b&&c.setTextureCube(b,d)},r=function(a,b){a.uniform2iv(this.addr,b)},s=function(a,b){a.uniform3iv(this.addr,b)},u=function(a,b){a.uniform4iv(this.addr,b)},x=function(a){switch(a){case 5126:return e;case 35664:return g;case 35665:return h;case 35666:return k;case 35674:return l;case 35675:return n;case 35676:return p;case 35678:return m;case 35680:return q;case 5124:case 35670:return f;case 35667:case 35671:return r;
	case 35668:case 35672:return s;case 35669:case 35673:return u}},v=function(a,b){a.uniform1fv(this.addr,b)},C=function(a,b){a.uniform1iv(this.addr,b)},w=function(a,b){a.uniform2fv(this.addr,c(b,this.size,2))},D=function(a,b){a.uniform3fv(this.addr,c(b,this.size,3))},A=function(a,b){a.uniform4fv(this.addr,c(b,this.size,4))},y=function(a,b){a.uniformMatrix2fv(this.addr,!1,c(b,this.size,4))},B=function(a,b){a.uniformMatrix3fv(this.addr,!1,c(b,this.size,9))},G=function(a,b){a.uniformMatrix4fv(this.addr,
	!1,c(b,this.size,16))},z=function(a,b,c){var e=b.length,f=d(c,e);a.uniform1iv(this.addr,f);for(a=0;a!==e;++a){var g=b[a];g&&c.setTexture2D(g,f[a])}},H=function(a,b,c){var e=b.length,f=d(c,e);a.uniform1iv(this.addr,f);for(a=0;a!==e;++a){var g=b[a];g&&c.setTextureCube(g,f[a])}},M=function(a){switch(a){case 5126:return v;case 35664:return w;case 35665:return D;case 35666:return A;case 35674:return y;case 35675:return B;case 35676:return G;case 35678:return z;case 35680:return H;case 5124:case 35670:return C;
	case 35667:case 35671:return r;case 35668:case 35672:return s;case 35669:case 35673:return u}},O=function(a,b,c){this.id=a;this.addr=c;this.setValue=x(b.type)},N=function(a,b,c){this.id=a;this.addr=c;this.size=b.size;this.setValue=M(b.type)},E=function(a){this.id=a;this.seq=[];this.map={}};E.prototype.setValue=function(a,b){for(var c=this.seq,d=0,e=c.length;d!==e;++d){var f=c[d];f.setValue(a,b[f.id])}};var K=/([\w\d_]+)(\])?(\[|\.)?/g,I=function(a,b,c){this.seq=[];this.map={};this.renderer=c;c=a.getProgramParameter(b,
	a.ACTIVE_UNIFORMS);for(var d=0;d!==c;++d){var e=a.getActiveUniform(b,d),f=a.getUniformLocation(b,e.name),g=this,h=e.name,k=h.length;for(K.lastIndex=0;;){var m=K.exec(h),l=K.lastIndex,n=m[1],q=m[3];"]"===m[2]&&(n|=0);if(void 0===q||"["===q&&l+2===k){h=g;e=void 0===q?new O(n,e,f):new N(n,e,f);h.seq.push(e);h.map[e.id]=e;break}else q=g.map[n],void 0===q&&(q=new E(n),n=g,g=q,n.seq.push(g),n.map[g.id]=g),g=q}}};I.prototype.setValue=function(a,b,c){b=this.map[b];void 0!==b&&b.setValue(a,c,this.renderer)};
	I.prototype.set=function(a,b,c){var d=this.map[c];void 0!==d&&d.setValue(a,b[c],this.renderer)};I.prototype.setOptional=function(a,b,c){b=b[c];void 0!==b&&this.setValue(a,c,b)};I.upload=function(a,b,c,d){for(var e=0,f=b.length;e!==f;++e){var g=b[e],h=c[g.id];!1!==h.needsUpdate&&g.setValue(a,h.value,d)}};I.seqWithValue=function(a,b){for(var c=[],d=0,e=a.length;d!==e;++d){var f=a[d];f.id in b&&c.push(f)}return c};I.splitDynamic=function(a,b){for(var c=null,d=a.length,e=0,f=0;f!==d;++f){var g=a[f],h=
	b[g.id];h&&!0===h.dynamic?(null===c&&(c=[]),c.push(g)):(e<f&&(a[e]=g),++e)}e<d&&(a.length=e);return c};I.evalDynamic=function(a,b,c,d){for(var e=0,f=a.length;e!==f;++e){var g=b[a[e].id],h=g.onUpdateCallback;void 0!==h&&h.call(g,c,d)}};return I}();
	THREE.LensFlarePlugin=function(a,b){var c,d,e,f,g,h,k,l,n,p,m=a.context,q=a.state,r,s,u,x,v,C;this.render=function(w,D,A){if(0!==b.length){w=new THREE.Vector3;var y=A.w/A.z,B=.5*A.z,G=.5*A.w,z=16/A.w,H=new THREE.Vector2(z*y,z),M=new THREE.Vector3(1,1,0),O=new THREE.Vector2(1,1),N=new THREE.Box2;N.min.set(0,0);N.max.set(A.z-16,A.w-16);if(void 0===x){var z=new Float32Array([-1,-1,0,0,1,-1,1,0,1,1,1,1,-1,1,0,1]),E=new Uint16Array([0,1,2,0,2,3]);r=m.createBuffer();s=m.createBuffer();m.bindBuffer(m.ARRAY_BUFFER,
	r);m.bufferData(m.ARRAY_BUFFER,z,m.STATIC_DRAW);m.bindBuffer(m.ELEMENT_ARRAY_BUFFER,s);m.bufferData(m.ELEMENT_ARRAY_BUFFER,E,m.STATIC_DRAW);v=m.createTexture();C=m.createTexture();q.bindTexture(m.TEXTURE_2D,v);m.texImage2D(m.TEXTURE_2D,0,m.RGB,16,16,0,m.RGB,m.UNSIGNED_BYTE,null);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_WRAP_S,m.CLAMP_TO_EDGE);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_WRAP_T,m.CLAMP_TO_EDGE);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_MAG_FILTER,m.NEAREST);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_MIN_FILTER,
	m.NEAREST);q.bindTexture(m.TEXTURE_2D,C);m.texImage2D(m.TEXTURE_2D,0,m.RGBA,16,16,0,m.RGBA,m.UNSIGNED_BYTE,null);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_WRAP_S,m.CLAMP_TO_EDGE);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_WRAP_T,m.CLAMP_TO_EDGE);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_MAG_FILTER,m.NEAREST);m.texParameteri(m.TEXTURE_2D,m.TEXTURE_MIN_FILTER,m.NEAREST);var z=u={vertexShader:"uniform lowp int renderType;\nuniform vec3 screenPosition;\nuniform vec2 scale;\nuniform float rotation;\nuniform sampler2D occlusionMap;\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUV;\nvarying float vVisibility;\nvoid main() {\nvUV = uv;\nvec2 pos = position;\nif ( renderType == 2 ) {\nvec4 visibility = texture2D( occlusionMap, vec2( 0.1, 0.1 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.1 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.1 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.5 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.9 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.9 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.1, 0.9 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.1, 0.5 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.5 ) );\nvVisibility =        visibility.r / 9.0;\nvVisibility *= 1.0 - visibility.g / 9.0;\nvVisibility *=       visibility.b / 9.0;\nvVisibility *= 1.0 - visibility.a / 9.0;\npos.x = cos( rotation ) * position.x - sin( rotation ) * position.y;\npos.y = sin( rotation ) * position.x + cos( rotation ) * position.y;\n}\ngl_Position = vec4( ( pos * scale + screenPosition.xy ).xy, screenPosition.z, 1.0 );\n}",
	fragmentShader:"uniform lowp int renderType;\nuniform sampler2D map;\nuniform float opacity;\nuniform vec3 color;\nvarying vec2 vUV;\nvarying float vVisibility;\nvoid main() {\nif ( renderType == 0 ) {\ngl_FragColor = vec4( 1.0, 0.0, 1.0, 0.0 );\n} else if ( renderType == 1 ) {\ngl_FragColor = texture2D( map, vUV );\n} else {\nvec4 texture = texture2D( map, vUV );\ntexture.a *= opacity * vVisibility;\ngl_FragColor = texture;\ngl_FragColor.rgb *= color;\n}\n}"},E=m.createProgram(),K=m.createShader(m.FRAGMENT_SHADER),
	I=m.createShader(m.VERTEX_SHADER),L="precision "+a.getPrecision()+" float;\n";m.shaderSource(K,L+z.fragmentShader);m.shaderSource(I,L+z.vertexShader);m.compileShader(K);m.compileShader(I);m.attachShader(E,K);m.attachShader(E,I);m.linkProgram(E);x=E;n=m.getAttribLocation(x,"position");p=m.getAttribLocation(x,"uv");c=m.getUniformLocation(x,"renderType");d=m.getUniformLocation(x,"map");e=m.getUniformLocation(x,"occlusionMap");f=m.getUniformLocation(x,"opacity");g=m.getUniformLocation(x,"color");h=m.getUniformLocation(x,
	"scale");k=m.getUniformLocation(x,"rotation");l=m.getUniformLocation(x,"screenPosition")}m.useProgram(x);q.initAttributes();q.enableAttribute(n);q.enableAttribute(p);q.disableUnusedAttributes();m.uniform1i(e,0);m.uniform1i(d,1);m.bindBuffer(m.ARRAY_BUFFER,r);m.vertexAttribPointer(n,2,m.FLOAT,!1,16,0);m.vertexAttribPointer(p,2,m.FLOAT,!1,16,8);m.bindBuffer(m.ELEMENT_ARRAY_BUFFER,s);q.disable(m.CULL_FACE);q.setDepthWrite(!1);E=0;for(K=b.length;E<K;E++)if(z=16/A.w,H.set(z*y,z),I=b[E],w.set(I.matrixWorld.elements[12],
	I.matrixWorld.elements[13],I.matrixWorld.elements[14]),w.applyMatrix4(D.matrixWorldInverse),w.applyProjection(D.projectionMatrix),M.copy(w),O.x=A.x+M.x*B+B-8,O.y=A.y+M.y*G+G-8,!0===N.containsPoint(O)){q.activeTexture(m.TEXTURE0);q.bindTexture(m.TEXTURE_2D,null);q.activeTexture(m.TEXTURE1);q.bindTexture(m.TEXTURE_2D,v);m.copyTexImage2D(m.TEXTURE_2D,0,m.RGB,O.x,O.y,16,16,0);m.uniform1i(c,0);m.uniform2f(h,H.x,H.y);m.uniform3f(l,M.x,M.y,M.z);q.disable(m.BLEND);q.enable(m.DEPTH_TEST);m.drawElements(m.TRIANGLES,
	6,m.UNSIGNED_SHORT,0);q.activeTexture(m.TEXTURE0);q.bindTexture(m.TEXTURE_2D,C);m.copyTexImage2D(m.TEXTURE_2D,0,m.RGBA,O.x,O.y,16,16,0);m.uniform1i(c,1);q.disable(m.DEPTH_TEST);q.activeTexture(m.TEXTURE1);q.bindTexture(m.TEXTURE_2D,v);m.drawElements(m.TRIANGLES,6,m.UNSIGNED_SHORT,0);I.positionScreen.copy(M);I.customUpdateCallback?I.customUpdateCallback(I):I.updateLensFlares();m.uniform1i(c,2);q.enable(m.BLEND);for(var L=0,P=I.lensFlares.length;L<P;L++){var Q=I.lensFlares[L];.001<Q.opacity&&.001<Q.scale&&
	(M.x=Q.x,M.y=Q.y,M.z=Q.z,z=Q.size*Q.scale/A.w,H.x=z*y,H.y=z,m.uniform3f(l,M.x,M.y,M.z),m.uniform2f(h,H.x,H.y),m.uniform1f(k,Q.rotation),m.uniform1f(f,Q.opacity),m.uniform3f(g,Q.color.r,Q.color.g,Q.color.b),q.setBlending(Q.blending,Q.blendEquation,Q.blendSrc,Q.blendDst),a.setTexture2D(Q.texture,1),m.drawElements(m.TRIANGLES,6,m.UNSIGNED_SHORT,0))}}q.enable(m.CULL_FACE);q.enable(m.DEPTH_TEST);q.setDepthWrite(!0);a.resetGLState()}}};
	THREE.SpritePlugin=function(a,b){var c,d,e,f,g,h,k,l,n,p,m,q,r,s,u,x,v;function C(a,b){return a.renderOrder!==b.renderOrder?a.renderOrder-b.renderOrder:a.z!==b.z?b.z-a.z:b.id-a.id}var w=a.context,D=a.state,A,y,B,G,z=new THREE.Vector3,H=new THREE.Quaternion,M=new THREE.Vector3;this.render=function(O,N){if(0!==b.length){if(void 0===B){var E=new Float32Array([-.5,-.5,0,0,.5,-.5,1,0,.5,.5,1,1,-.5,.5,0,1]),K=new Uint16Array([0,1,2,0,2,3]);A=w.createBuffer();y=w.createBuffer();w.bindBuffer(w.ARRAY_BUFFER,
	A);w.bufferData(w.ARRAY_BUFFER,E,w.STATIC_DRAW);w.bindBuffer(w.ELEMENT_ARRAY_BUFFER,y);w.bufferData(w.ELEMENT_ARRAY_BUFFER,K,w.STATIC_DRAW);var E=w.createProgram(),K=w.createShader(w.VERTEX_SHADER),I=w.createShader(w.FRAGMENT_SHADER);w.shaderSource(K,["precision "+a.getPrecision()+" float;","uniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform float rotation;\nuniform vec2 scale;\nuniform vec2 uvOffset;\nuniform vec2 uvScale;\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUV;\nvoid main() {\nvUV = uvOffset + uv * uvScale;\nvec2 alignedPosition = position * scale;\nvec2 rotatedPosition;\nrotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\nrotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\nvec4 finalPosition;\nfinalPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );\nfinalPosition.xy += rotatedPosition;\nfinalPosition = projectionMatrix * finalPosition;\ngl_Position = finalPosition;\n}"].join("\n"));
	w.shaderSource(I,["precision "+a.getPrecision()+" float;","uniform vec3 color;\nuniform sampler2D map;\nuniform float opacity;\nuniform int fogType;\nuniform vec3 fogColor;\nuniform float fogDensity;\nuniform float fogNear;\nuniform float fogFar;\nuniform float alphaTest;\nvarying vec2 vUV;\nvoid main() {\nvec4 texture = texture2D( map, vUV );\nif ( texture.a < alphaTest ) discard;\ngl_FragColor = vec4( color * texture.xyz, texture.a * opacity );\nif ( fogType > 0 ) {\nfloat depth = gl_FragCoord.z / gl_FragCoord.w;\nfloat fogFactor = 0.0;\nif ( fogType == 1 ) {\nfogFactor = smoothstep( fogNear, fogFar, depth );\n} else {\nconst float LOG2 = 1.442695;\nfogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );\nfogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n}\ngl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n}\n}"].join("\n"));
	w.compileShader(K);w.compileShader(I);w.attachShader(E,K);w.attachShader(E,I);w.linkProgram(E);B=E;x=w.getAttribLocation(B,"position");v=w.getAttribLocation(B,"uv");c=w.getUniformLocation(B,"uvOffset");d=w.getUniformLocation(B,"uvScale");e=w.getUniformLocation(B,"rotation");f=w.getUniformLocation(B,"scale");g=w.getUniformLocation(B,"color");h=w.getUniformLocation(B,"map");k=w.getUniformLocation(B,"opacity");l=w.getUniformLocation(B,"modelViewMatrix");n=w.getUniformLocation(B,"projectionMatrix");p=
	w.getUniformLocation(B,"fogType");m=w.getUniformLocation(B,"fogDensity");q=w.getUniformLocation(B,"fogNear");r=w.getUniformLocation(B,"fogFar");s=w.getUniformLocation(B,"fogColor");u=w.getUniformLocation(B,"alphaTest");E=document.createElement("canvas");E.width=8;E.height=8;K=E.getContext("2d");K.fillStyle="white";K.fillRect(0,0,8,8);G=new THREE.Texture(E);G.needsUpdate=!0}w.useProgram(B);D.initAttributes();D.enableAttribute(x);D.enableAttribute(v);D.disableUnusedAttributes();D.disable(w.CULL_FACE);
	D.enable(w.BLEND);w.bindBuffer(w.ARRAY_BUFFER,A);w.vertexAttribPointer(x,2,w.FLOAT,!1,16,0);w.vertexAttribPointer(v,2,w.FLOAT,!1,16,8);w.bindBuffer(w.ELEMENT_ARRAY_BUFFER,y);w.uniformMatrix4fv(n,!1,N.projectionMatrix.elements);D.activeTexture(w.TEXTURE0);w.uniform1i(h,0);K=E=0;(I=O.fog)?(w.uniform3f(s,I.color.r,I.color.g,I.color.b),I instanceof THREE.Fog?(w.uniform1f(q,I.near),w.uniform1f(r,I.far),w.uniform1i(p,1),K=E=1):I instanceof THREE.FogExp2&&(w.uniform1f(m,I.density),w.uniform1i(p,2),K=E=2)):
	(w.uniform1i(p,0),K=E=0);for(var I=0,L=b.length;I<L;I++){var P=b[I];P.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,P.matrixWorld);P.z=-P.modelViewMatrix.elements[14]}b.sort(C);for(var Q=[],I=0,L=b.length;I<L;I++){var P=b[I],R=P.material;w.uniform1f(u,R.alphaTest);w.uniformMatrix4fv(l,!1,P.modelViewMatrix.elements);P.matrixWorld.decompose(z,H,M);Q[0]=M.x;Q[1]=M.y;P=0;O.fog&&R.fog&&(P=K);E!==P&&(w.uniform1i(p,P),E=P);null!==R.map?(w.uniform2f(c,R.map.offset.x,R.map.offset.y),w.uniform2f(d,
	R.map.repeat.x,R.map.repeat.y)):(w.uniform2f(c,0,0),w.uniform2f(d,1,1));w.uniform1f(k,R.opacity);w.uniform3f(g,R.color.r,R.color.g,R.color.b);w.uniform1f(e,R.rotation);w.uniform2fv(f,Q);D.setBlending(R.blending,R.blendEquation,R.blendSrc,R.blendDst);D.setDepthTest(R.depthTest);D.setDepthWrite(R.depthWrite);R.map?a.setTexture2D(R.map,0):a.setTexture2D(G,0);w.drawElements(w.TRIANGLES,6,w.UNSIGNED_SHORT,0)}D.enable(w.CULL_FACE);a.resetGLState()}}};
	Object.assign(THREE,{Face4:function(a,b,c,d,e,f,g){console.warn("THREE.Face4 has been removed. A THREE.Face3 will be created instead.");return new THREE.Face3(a,b,c,e,f,g)},LineStrip:0,LinePieces:1,MeshFaceMaterial:THREE.MultiMaterial,PointCloud:function(a,b){console.warn("THREE.PointCloud has been renamed to THREE.Points.");return new THREE.Points(a,b)},Particle:THREE.Sprite,ParticleSystem:function(a,b){console.warn("THREE.ParticleSystem has been renamed to THREE.Points.");return new THREE.Points(a,
	b)},PointCloudMaterial:function(a){console.warn("THREE.PointCloudMaterial has been renamed to THREE.PointsMaterial.");return new THREE.PointsMaterial(a)},ParticleBasicMaterial:function(a){console.warn("THREE.ParticleBasicMaterial has been renamed to THREE.PointsMaterial.");return new THREE.PointsMaterial(a)},ParticleSystemMaterial:function(a){console.warn("THREE.ParticleSystemMaterial has been renamed to THREE.PointsMaterial.");return new THREE.PointsMaterial(a)},Vertex:function(a,b,c){console.warn("THREE.Vertex has been removed. Use THREE.Vector3 instead.");
	return new THREE.Vector3(a,b,c)}});Object.assign(THREE.Box2.prototype,{empty:function(){console.warn("THREE.Box2: .empty() has been renamed to .isEmpty().");return this.isEmpty()},isIntersectionBox:function(a){console.warn("THREE.Box2: .isIntersectionBox() has been renamed to .intersectsBox().");return this.intersectsBox(a)}});
	Object.assign(THREE.Box3.prototype,{empty:function(){console.warn("THREE.Box3: .empty() has been renamed to .isEmpty().");return this.isEmpty()},isIntersectionBox:function(a){console.warn("THREE.Box3: .isIntersectionBox() has been renamed to .intersectsBox().");return this.intersectsBox(a)},isIntersectionSphere:function(a){console.warn("THREE.Box3: .isIntersectionSphere() has been renamed to .intersectsSphere().");return this.intersectsSphere(a)}});
	Object.assign(THREE.Matrix3.prototype,{multiplyVector3:function(a){console.warn("THREE.Matrix3: .multiplyVector3() has been removed. Use vector.applyMatrix3( matrix ) instead.");return a.applyMatrix3(this)},multiplyVector3Array:function(a){console.warn("THREE.Matrix3: .multiplyVector3Array() has been renamed. Use matrix.applyToVector3Array( array ) instead.");return this.applyToVector3Array(a)}});
	Object.assign(THREE.Matrix4.prototype,{extractPosition:function(a){console.warn("THREE.Matrix4: .extractPosition() has been renamed to .copyPosition().");return this.copyPosition(a)},setRotationFromQuaternion:function(a){console.warn("THREE.Matrix4: .setRotationFromQuaternion() has been renamed to .makeRotationFromQuaternion().");return this.makeRotationFromQuaternion(a)},multiplyVector3:function(a){console.warn("THREE.Matrix4: .multiplyVector3() has been removed. Use vector.applyMatrix4( matrix ) or vector.applyProjection( matrix ) instead.");
	return a.applyProjection(this)},multiplyVector4:function(a){console.warn("THREE.Matrix4: .multiplyVector4() has been removed. Use vector.applyMatrix4( matrix ) instead.");return a.applyMatrix4(this)},multiplyVector3Array:function(a){console.warn("THREE.Matrix4: .multiplyVector3Array() has been renamed. Use matrix.applyToVector3Array( array ) instead.");return this.applyToVector3Array(a)},rotateAxis:function(a){console.warn("THREE.Matrix4: .rotateAxis() has been removed. Use Vector3.transformDirection( matrix ) instead.");
	a.transformDirection(this)},crossVector:function(a){console.warn("THREE.Matrix4: .crossVector() has been removed. Use vector.applyMatrix4( matrix ) instead.");return a.applyMatrix4(this)},translate:function(a){console.error("THREE.Matrix4: .translate() has been removed.")},rotateX:function(a){console.error("THREE.Matrix4: .rotateX() has been removed.")},rotateY:function(a){console.error("THREE.Matrix4: .rotateY() has been removed.")},rotateZ:function(a){console.error("THREE.Matrix4: .rotateZ() has been removed.")},
	rotateByAxis:function(a,b){console.error("THREE.Matrix4: .rotateByAxis() has been removed.")}});Object.assign(THREE.Plane.prototype,{isIntersectionLine:function(a){console.warn("THREE.Plane: .isIntersectionLine() has been renamed to .intersectsLine().");return this.intersectsLine(a)}});Object.assign(THREE.Quaternion.prototype,{multiplyVector3:function(a){console.warn("THREE.Quaternion: .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead.");return a.applyQuaternion(this)}});
	Object.assign(THREE.Ray.prototype,{isIntersectionBox:function(a){console.warn("THREE.Ray: .isIntersectionBox() has been renamed to .intersectsBox().");return this.intersectsBox(a)},isIntersectionPlane:function(a){console.warn("THREE.Ray: .isIntersectionPlane() has been renamed to .intersectsPlane().");return this.intersectsPlane(a)},isIntersectionSphere:function(a){console.warn("THREE.Ray: .isIntersectionSphere() has been renamed to .intersectsSphere().");return this.intersectsSphere(a)}});
	Object.assign(THREE.Vector3.prototype,{setEulerFromRotationMatrix:function(){console.error("THREE.Vector3: .setEulerFromRotationMatrix() has been removed. Use Euler.setFromRotationMatrix() instead.")},setEulerFromQuaternion:function(){console.error("THREE.Vector3: .setEulerFromQuaternion() has been removed. Use Euler.setFromQuaternion() instead.")},getPositionFromMatrix:function(a){console.warn("THREE.Vector3: .getPositionFromMatrix() has been renamed to .setFromMatrixPosition().");return this.setFromMatrixPosition(a)},
	getScaleFromMatrix:function(a){console.warn("THREE.Vector3: .getScaleFromMatrix() has been renamed to .setFromMatrixScale().");return this.setFromMatrixScale(a)},getColumnFromMatrix:function(a,b){console.warn("THREE.Vector3: .getColumnFromMatrix() has been renamed to .setFromMatrixColumn().");return this.setFromMatrixColumn(b,a)}});
	Object.assign(THREE.Object3D.prototype,{getChildByName:function(a){console.warn("THREE.Object3D: .getChildByName() has been renamed to .getObjectByName().");return this.getObjectByName(a)},renderDepth:function(a){console.warn("THREE.Object3D: .renderDepth has been removed. Use .renderOrder, instead.")},translate:function(a,b){console.warn("THREE.Object3D: .translate() has been removed. Use .translateOnAxis( axis, distance ) instead.");return this.translateOnAxis(b,a)}});
	Object.defineProperties(THREE.Object3D.prototype,{eulerOrder:{get:function(){console.warn("THREE.Object3D: .eulerOrder is now .rotation.order.");return this.rotation.order},set:function(a){console.warn("THREE.Object3D: .eulerOrder is now .rotation.order.");this.rotation.order=a}},useQuaternion:{get:function(){console.warn("THREE.Object3D: .useQuaternion has been removed. The library now uses quaternions by default.")},set:function(a){console.warn("THREE.Object3D: .useQuaternion has been removed. The library now uses quaternions by default.")}}});
	Object.defineProperties(THREE.LOD.prototype,{objects:{get:function(){console.warn("THREE.LOD: .objects has been renamed to .levels.");return this.levels}}});THREE.PerspectiveCamera.prototype.setLens=function(a,b){console.warn("THREE.PerspectiveCamera.setLens is deprecated. Use .setFocalLength and .filmGauge for a photographic setup.");void 0!==b&&(this.filmGauge=b);this.setFocalLength(a)};
	Object.defineProperties(THREE.Light.prototype,{onlyShadow:{set:function(a){console.warn("THREE.Light: .onlyShadow has been removed.")}},shadowCameraFov:{set:function(a){console.warn("THREE.Light: .shadowCameraFov is now .shadow.camera.fov.");this.shadow.camera.fov=a}},shadowCameraLeft:{set:function(a){console.warn("THREE.Light: .shadowCameraLeft is now .shadow.camera.left.");this.shadow.camera.left=a}},shadowCameraRight:{set:function(a){console.warn("THREE.Light: .shadowCameraRight is now .shadow.camera.right.");
	this.shadow.camera.right=a}},shadowCameraTop:{set:function(a){console.warn("THREE.Light: .shadowCameraTop is now .shadow.camera.top.");this.shadow.camera.top=a}},shadowCameraBottom:{set:function(a){console.warn("THREE.Light: .shadowCameraBottom is now .shadow.camera.bottom.");this.shadow.camera.bottom=a}},shadowCameraNear:{set:function(a){console.warn("THREE.Light: .shadowCameraNear is now .shadow.camera.near.");this.shadow.camera.near=a}},shadowCameraFar:{set:function(a){console.warn("THREE.Light: .shadowCameraFar is now .shadow.camera.far.");
	this.shadow.camera.far=a}},shadowCameraVisible:{set:function(a){console.warn("THREE.Light: .shadowCameraVisible has been removed. Use new THREE.CameraHelper( light.shadow.camera ) instead.")}},shadowBias:{set:function(a){console.warn("THREE.Light: .shadowBias is now .shadow.bias.");this.shadow.bias=a}},shadowDarkness:{set:function(a){console.warn("THREE.Light: .shadowDarkness has been removed.")}},shadowMapWidth:{set:function(a){console.warn("THREE.Light: .shadowMapWidth is now .shadow.mapSize.width.");
	this.shadow.mapSize.width=a}},shadowMapHeight:{set:function(a){console.warn("THREE.Light: .shadowMapHeight is now .shadow.mapSize.height.");this.shadow.mapSize.height=a}}});Object.defineProperties(THREE.BufferAttribute.prototype,{length:{get:function(){console.warn("THREE.BufferAttribute: .length has been deprecated. Please use .count.");return this.array.length}}});
	Object.assign(THREE.BufferGeometry.prototype,{addIndex:function(a){console.warn("THREE.BufferGeometry: .addIndex() has been renamed to .setIndex().");this.setIndex(a)},addDrawCall:function(a,b,c){void 0!==c&&console.warn("THREE.BufferGeometry: .addDrawCall() no longer supports indexOffset.");console.warn("THREE.BufferGeometry: .addDrawCall() is now .addGroup().");this.addGroup(a,b)},clearDrawCalls:function(){console.warn("THREE.BufferGeometry: .clearDrawCalls() is now .clearGroups().");this.clearGroups()},
	computeTangents:function(){console.warn("THREE.BufferGeometry: .computeTangents() has been removed.")},computeOffsets:function(){console.warn("THREE.BufferGeometry: .computeOffsets() has been removed.")}});Object.defineProperties(THREE.BufferGeometry.prototype,{drawcalls:{get:function(){console.error("THREE.BufferGeometry: .drawcalls has been renamed to .groups.");return this.groups}},offsets:{get:function(){console.warn("THREE.BufferGeometry: .offsets has been renamed to .groups.");return this.groups}}});
	Object.defineProperties(THREE.Material.prototype,{wrapAround:{get:function(){console.warn("THREE."+this.type+": .wrapAround has been removed.")},set:function(a){console.warn("THREE."+this.type+": .wrapAround has been removed.")}},wrapRGB:{get:function(){console.warn("THREE."+this.type+": .wrapRGB has been removed.");return new THREE.Color}}});
	Object.defineProperties(THREE.MeshPhongMaterial.prototype,{metal:{get:function(){console.warn("THREE.MeshPhongMaterial: .metal has been removed. Use THREE.MeshStandardMaterial instead.");return!1},set:function(a){console.warn("THREE.MeshPhongMaterial: .metal has been removed. Use THREE.MeshStandardMaterial instead")}}});
	Object.defineProperties(THREE.ShaderMaterial.prototype,{derivatives:{get:function(){console.warn("THREE.ShaderMaterial: .derivatives has been moved to .extensions.derivatives.");return this.extensions.derivatives},set:function(a){console.warn("THREE. ShaderMaterial: .derivatives has been moved to .extensions.derivatives.");this.extensions.derivatives=a}}});
	THREE.EventDispatcher.prototype=Object.assign(Object.create({constructor:THREE.EventDispatcher,apply:function(a){console.warn("THREE.EventDispatcher: .apply is deprecated, just inherit or Object.assign the prototype to mix-in.");Object.assign(a,this)}}),THREE.EventDispatcher.prototype);
	Object.assign(THREE.WebGLRenderer.prototype,{supportsFloatTextures:function(){console.warn("THREE.WebGLRenderer: .supportsFloatTextures() is now .extensions.get( 'OES_texture_float' ).");return this.extensions.get("OES_texture_float")},supportsHalfFloatTextures:function(){console.warn("THREE.WebGLRenderer: .supportsHalfFloatTextures() is now .extensions.get( 'OES_texture_half_float' ).");return this.extensions.get("OES_texture_half_float")},supportsStandardDerivatives:function(){console.warn("THREE.WebGLRenderer: .supportsStandardDerivatives() is now .extensions.get( 'OES_standard_derivatives' ).");
	return this.extensions.get("OES_standard_derivatives")},supportsCompressedTextureS3TC:function(){console.warn("THREE.WebGLRenderer: .supportsCompressedTextureS3TC() is now .extensions.get( 'WEBGL_compressed_texture_s3tc' ).");return this.extensions.get("WEBGL_compressed_texture_s3tc")},supportsCompressedTexturePVRTC:function(){console.warn("THREE.WebGLRenderer: .supportsCompressedTexturePVRTC() is now .extensions.get( 'WEBGL_compressed_texture_pvrtc' ).");return this.extensions.get("WEBGL_compressed_texture_pvrtc")},
	supportsBlendMinMax:function(){console.warn("THREE.WebGLRenderer: .supportsBlendMinMax() is now .extensions.get( 'EXT_blend_minmax' ).");return this.extensions.get("EXT_blend_minmax")},supportsVertexTextures:function(){return this.capabilities.vertexTextures},supportsInstancedArrays:function(){console.warn("THREE.WebGLRenderer: .supportsInstancedArrays() is now .extensions.get( 'ANGLE_instanced_arrays' ).");return this.extensions.get("ANGLE_instanced_arrays")},enableScissorTest:function(a){console.warn("THREE.WebGLRenderer: .enableScissorTest() is now .setScissorTest().");
	this.setScissorTest(a)},initMaterial:function(){console.warn("THREE.WebGLRenderer: .initMaterial() has been removed.")},addPrePlugin:function(){console.warn("THREE.WebGLRenderer: .addPrePlugin() has been removed.")},addPostPlugin:function(){console.warn("THREE.WebGLRenderer: .addPostPlugin() has been removed.")},updateShadowMap:function(){console.warn("THREE.WebGLRenderer: .updateShadowMap() has been removed.")}});
	Object.defineProperties(THREE.WebGLRenderer.prototype,{shadowMapEnabled:{get:function(){return this.shadowMap.enabled},set:function(a){console.warn("THREE.WebGLRenderer: .shadowMapEnabled is now .shadowMap.enabled.");this.shadowMap.enabled=a}},shadowMapType:{get:function(){return this.shadowMap.type},set:function(a){console.warn("THREE.WebGLRenderer: .shadowMapType is now .shadowMap.type.");this.shadowMap.type=a}},shadowMapCullFace:{get:function(){return this.shadowMap.cullFace},set:function(a){console.warn("THREE.WebGLRenderer: .shadowMapCullFace is now .shadowMap.cullFace.");
	this.shadowMap.cullFace=a}}});Object.defineProperties(THREE.WebGLShadowMap.prototype,{cullFace:{get:function(){return this.renderReverseSided?THREE.CullFaceFront:THREE.CullFaceBack},set:function(a){a=a!==THREE.CullFaceBack;console.warn("WebGLRenderer: .shadowMap.cullFace is deprecated. Set .shadowMap.renderReverseSided to "+a+".");this.renderReverseSided=a}}});
	Object.defineProperties(THREE.WebGLRenderTarget.prototype,{wrapS:{get:function(){console.warn("THREE.WebGLRenderTarget: .wrapS is now .texture.wrapS.");return this.texture.wrapS},set:function(a){console.warn("THREE.WebGLRenderTarget: .wrapS is now .texture.wrapS.");this.texture.wrapS=a}},wrapT:{get:function(){console.warn("THREE.WebGLRenderTarget: .wrapT is now .texture.wrapT.");return this.texture.wrapT},set:function(a){console.warn("THREE.WebGLRenderTarget: .wrapT is now .texture.wrapT.");this.texture.wrapT=
	a}},magFilter:{get:function(){console.warn("THREE.WebGLRenderTarget: .magFilter is now .texture.magFilter.");return this.texture.magFilter},set:function(a){console.warn("THREE.WebGLRenderTarget: .magFilter is now .texture.magFilter.");this.texture.magFilter=a}},minFilter:{get:function(){console.warn("THREE.WebGLRenderTarget: .minFilter is now .texture.minFilter.");return this.texture.minFilter},set:function(a){console.warn("THREE.WebGLRenderTarget: .minFilter is now .texture.minFilter.");this.texture.minFilter=
	a}},anisotropy:{get:function(){console.warn("THREE.WebGLRenderTarget: .anisotropy is now .texture.anisotropy.");return this.texture.anisotropy},set:function(a){console.warn("THREE.WebGLRenderTarget: .anisotropy is now .texture.anisotropy.");this.texture.anisotropy=a}},offset:{get:function(){console.warn("THREE.WebGLRenderTarget: .offset is now .texture.offset.");return this.texture.offset},set:function(a){console.warn("THREE.WebGLRenderTarget: .offset is now .texture.offset.");this.texture.offset=
	a}},repeat:{get:function(){console.warn("THREE.WebGLRenderTarget: .repeat is now .texture.repeat.");return this.texture.repeat},set:function(a){console.warn("THREE.WebGLRenderTarget: .repeat is now .texture.repeat.");this.texture.repeat=a}},format:{get:function(){console.warn("THREE.WebGLRenderTarget: .format is now .texture.format.");return this.texture.format},set:function(a){console.warn("THREE.WebGLRenderTarget: .format is now .texture.format.");this.texture.format=a}},type:{get:function(){console.warn("THREE.WebGLRenderTarget: .type is now .texture.type.");
	return this.texture.type},set:function(a){console.warn("THREE.WebGLRenderTarget: .type is now .texture.type.");this.texture.type=a}},generateMipmaps:{get:function(){console.warn("THREE.WebGLRenderTarget: .generateMipmaps is now .texture.generateMipmaps.");return this.texture.generateMipmaps},set:function(a){console.warn("THREE.WebGLRenderTarget: .generateMipmaps is now .texture.generateMipmaps.");this.texture.generateMipmaps=a}}});
	Object.assign(THREE.Audio.prototype,{load:function(a){console.warn("THREE.Audio: .load has been deprecated. Please use THREE.AudioLoader.");var b=this;(new THREE.AudioLoader).load(a,function(a){b.setBuffer(a)});return this}});Object.assign(THREE.AudioAnalyser.prototype,{getData:function(a){console.warn("THREE.AudioAnalyser: .getData() is now .getFrequencyData().");return this.getFrequencyData()}});
	THREE.GeometryUtils={merge:function(a,b,c){console.warn("THREE.GeometryUtils: .merge() has been moved to Geometry. Use geometry.merge( geometry2, matrix, materialIndexOffset ) instead.");var d;b instanceof THREE.Mesh&&(b.matrixAutoUpdate&&b.updateMatrix(),d=b.matrix,b=b.geometry);a.merge(b,d,c)},center:function(a){console.warn("THREE.GeometryUtils: .center() has been moved to Geometry. Use geometry.center() instead.");return a.center()}};
	THREE.ImageUtils={crossOrigin:void 0,loadTexture:function(a,b,c,d){console.warn("THREE.ImageUtils.loadTexture has been deprecated. Use THREE.TextureLoader() instead.");var e=new THREE.TextureLoader;e.setCrossOrigin(this.crossOrigin);a=e.load(a,c,void 0,d);b&&(a.mapping=b);return a},loadTextureCube:function(a,b,c,d){console.warn("THREE.ImageUtils.loadTextureCube has been deprecated. Use THREE.CubeTextureLoader() instead.");var e=new THREE.CubeTextureLoader;e.setCrossOrigin(this.crossOrigin);a=e.load(a,
	c,void 0,d);b&&(a.mapping=b);return a},loadCompressedTexture:function(){console.error("THREE.ImageUtils.loadCompressedTexture has been removed. Use THREE.DDSLoader instead.")},loadCompressedTextureCube:function(){console.error("THREE.ImageUtils.loadCompressedTextureCube has been removed. Use THREE.DDSLoader instead.")}};
	THREE.Projector=function(){console.error("THREE.Projector has been moved to /examples/js/renderers/Projector.js.");this.projectVector=function(a,b){console.warn("THREE.Projector: .projectVector() is now vector.project().");a.project(b)};this.unprojectVector=function(a,b){console.warn("THREE.Projector: .unprojectVector() is now vector.unproject().");a.unproject(b)};this.pickingRay=function(a,b){console.error("THREE.Projector: .pickingRay() is now raycaster.setFromCamera().")}};
	THREE.CanvasRenderer=function(){console.error("THREE.CanvasRenderer has been moved to /examples/js/renderers/CanvasRenderer.js");this.domElement=document.createElement("canvas");this.clear=function(){};this.render=function(){};this.setClearColor=function(){};this.setSize=function(){}};
	THREE.CurveUtils={tangentQuadraticBezier:function(a,b,c,d){return 2*(1-a)*(c-b)+2*a*(d-c)},tangentCubicBezier:function(a,b,c,d,e){return-3*b*(1-a)*(1-a)+3*c*(1-a)*(1-a)-6*a*c*(1-a)+6*a*d*(1-a)-3*a*a*d+3*a*a*e},tangentSpline:function(a,b,c,d,e){return 6*a*a-6*a+(3*a*a-4*a+1)+(-6*a*a+6*a)+(3*a*a-2*a)},interpolate:function(a,b,c,d,e){a=.5*(c-a);d=.5*(d-b);var f=e*e;return(2*b-2*c+a+d)*e*f+(-3*b+3*c-2*a-d)*f+a*e+b}};
	THREE.SceneUtils={createMultiMaterialObject:function(a,b){for(var c=new THREE.Group,d=0,e=b.length;d<e;d++)c.add(new THREE.Mesh(a,b[d]));return c},detach:function(a,b,c){a.applyMatrix(b.matrixWorld);b.remove(a);c.add(a)},attach:function(a,b,c){var d=new THREE.Matrix4;d.getInverse(c.matrixWorld);a.applyMatrix(d);b.remove(a);c.add(a)}};
	THREE.ShapeUtils={area:function(a){for(var b=a.length,c=0,d=b-1,e=0;e<b;d=e++)c+=a[d].x*a[e].y-a[e].x*a[d].y;return.5*c},triangulate:function(){return function(a,b){var c=a.length;if(3>c)return null;var d=[],e=[],f=[],g,h,k;if(0<THREE.ShapeUtils.area(a))for(h=0;h<c;h++)e[h]=h;else for(h=0;h<c;h++)e[h]=c-1-h;var l=2*c;for(h=c-1;2<c;){if(0>=l--){console.warn("THREE.ShapeUtils: Unable to triangulate polygon! in triangulate()");break}g=h;c<=g&&(g=0);h=g+1;c<=h&&(h=0);k=h+1;c<=k&&(k=0);var n;a:{var p=
	n=void 0,m=void 0,q=void 0,r=void 0,s=void 0,u=void 0,x=void 0,v=void 0,p=a[e[g]].x,m=a[e[g]].y,q=a[e[h]].x,r=a[e[h]].y,s=a[e[k]].x,u=a[e[k]].y;if(Number.EPSILON>(q-p)*(u-m)-(r-m)*(s-p))n=!1;else{var C=void 0,w=void 0,D=void 0,A=void 0,y=void 0,B=void 0,G=void 0,z=void 0,H=void 0,M=void 0,H=z=G=v=x=void 0,C=s-q,w=u-r,D=p-s,A=m-u,y=q-p,B=r-m;for(n=0;n<c;n++)if(x=a[e[n]].x,v=a[e[n]].y,!(x===p&&v===m||x===q&&v===r||x===s&&v===u)&&(G=x-p,z=v-m,H=x-q,M=v-r,x-=s,v-=u,H=C*M-w*H,G=y*z-B*G,z=D*v-A*x,H>=-Number.EPSILON&&
	z>=-Number.EPSILON&&G>=-Number.EPSILON)){n=!1;break a}n=!0}}if(n){d.push([a[e[g]],a[e[h]],a[e[k]]]);f.push([e[g],e[h],e[k]]);g=h;for(k=h+1;k<c;g++,k++)e[g]=e[k];c--;l=2*c}}return b?f:d}}(),triangulateShape:function(a,b){function c(a,b,c){return a.x!==b.x?a.x<b.x?a.x<=c.x&&c.x<=b.x:b.x<=c.x&&c.x<=a.x:a.y<b.y?a.y<=c.y&&c.y<=b.y:b.y<=c.y&&c.y<=a.y}function d(a,b,d,e,f){var g=b.x-a.x,h=b.y-a.y,k=e.x-d.x,l=e.y-d.y,n=a.x-d.x,p=a.y-d.y,y=h*k-g*l,B=h*n-g*p;if(Math.abs(y)>Number.EPSILON){if(0<y){if(0>B||B>
	y)return[];k=l*n-k*p;if(0>k||k>y)return[]}else{if(0<B||B<y)return[];k=l*n-k*p;if(0<k||k<y)return[]}if(0===k)return!f||0!==B&&B!==y?[a]:[];if(k===y)return!f||0!==B&&B!==y?[b]:[];if(0===B)return[d];if(B===y)return[e];f=k/y;return[{x:a.x+f*g,y:a.y+f*h}]}if(0!==B||l*n!==k*p)return[];h=0===g&&0===h;k=0===k&&0===l;if(h&&k)return a.x!==d.x||a.y!==d.y?[]:[a];if(h)return c(d,e,a)?[a]:[];if(k)return c(a,b,d)?[d]:[];0!==g?(a.x<b.x?(g=a,k=a.x,h=b,a=b.x):(g=b,k=b.x,h=a,a=a.x),d.x<e.x?(b=d,y=d.x,l=e,d=e.x):(b=
	e,y=e.x,l=d,d=d.x)):(a.y<b.y?(g=a,k=a.y,h=b,a=b.y):(g=b,k=b.y,h=a,a=a.y),d.y<e.y?(b=d,y=d.y,l=e,d=e.y):(b=e,y=e.y,l=d,d=d.y));return k<=y?a<y?[]:a===y?f?[]:[b]:a<=d?[b,h]:[b,l]:k>d?[]:k===d?f?[]:[g]:a<=d?[g,h]:[g,l]}function e(a,b,c,d){var e=b.x-a.x,f=b.y-a.y;b=c.x-a.x;c=c.y-a.y;var g=d.x-a.x;d=d.y-a.y;a=e*c-f*b;e=e*d-f*g;return Math.abs(a)>Number.EPSILON?(b=g*c-d*b,0<a?0<=e&&0<=b:0<=e||0<=b):0<e}var f,g,h,k,l,n={};h=a.concat();f=0;for(g=b.length;f<g;f++)Array.prototype.push.apply(h,b[f]);f=0;for(g=
	h.length;f<g;f++)l=h[f].x+":"+h[f].y,void 0!==n[l]&&console.warn("THREE.Shape: Duplicate point",l),n[l]=f;f=function(a,b){function c(a,b){var d=h.length-1,f=a-1;0>f&&(f=d);var g=a+1;g>d&&(g=0);d=e(h[a],h[f],h[g],k[b]);if(!d)return!1;d=k.length-1;f=b-1;0>f&&(f=d);g=b+1;g>d&&(g=0);return(d=e(k[b],k[f],k[g],h[a]))?!0:!1}function f(a,b){var c,e;for(c=0;c<h.length;c++)if(e=c+1,e%=h.length,e=d(a,b,h[c],h[e],!0),0<e.length)return!0;return!1}function g(a,c){var e,f,h,k;for(e=0;e<l.length;e++)for(f=b[l[e]],
	h=0;h<f.length;h++)if(k=h+1,k%=f.length,k=d(a,c,f[h],f[k],!0),0<k.length)return!0;return!1}var h=a.concat(),k,l=[],n,p,A,y,B,G=[],z,H,M,O=0;for(n=b.length;O<n;O++)l.push(O);z=0;for(var N=2*l.length;0<l.length;){N--;if(0>N){console.log("Infinite Loop! Holes left:"+l.length+", Probably Hole outside Shape!");break}for(p=z;p<h.length;p++){A=h[p];n=-1;for(O=0;O<l.length;O++)if(y=l[O],B=A.x+":"+A.y+":"+y,void 0===G[B]){k=b[y];for(H=0;H<k.length;H++)if(y=k[H],c(p,H)&&!f(A,y)&&!g(A,y)){n=H;l.splice(O,1);
	z=h.slice(0,p+1);y=h.slice(p);H=k.slice(n);M=k.slice(0,n+1);h=z.concat(H).concat(M).concat(y);z=p;break}if(0<=n)break;G[B]=!0}if(0<=n)break}}return h}(a,b);var p=THREE.ShapeUtils.triangulate(f,!1);f=0;for(g=p.length;f<g;f++)for(k=p[f],h=0;3>h;h++)l=k[h].x+":"+k[h].y,l=n[l],void 0!==l&&(k[h]=l);return p.concat()},isClockWise:function(a){return 0>THREE.ShapeUtils.area(a)},b2:function(){return function(a,b,c,d){var e=1-a;return e*e*b+2*(1-a)*a*c+a*a*d}}(),b3:function(){return function(a,b,c,d,e){var f=
	1-a,g=1-a;return f*f*f*b+3*g*g*a*c+3*(1-a)*a*a*d+a*a*a*e}}()};THREE.Curve=function(){};
	THREE.Curve.prototype={constructor:THREE.Curve,getPoint:function(a){console.warn("THREE.Curve: Warning, getPoint() not implemented!");return null},getPointAt:function(a){a=this.getUtoTmapping(a);return this.getPoint(a)},getPoints:function(a){a||(a=5);var b,c=[];for(b=0;b<=a;b++)c.push(this.getPoint(b/a));return c},getSpacedPoints:function(a){a||(a=5);var b,c=[];for(b=0;b<=a;b++)c.push(this.getPointAt(b/a));return c},getLength:function(){var a=this.getLengths();return a[a.length-1]},getLengths:function(a){a||
	(a=this.__arcLengthDivisions?this.__arcLengthDivisions:200);if(this.cacheArcLengths&&this.cacheArcLengths.length===a+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;var b=[],c,d=this.getPoint(0),e,f=0;b.push(0);for(e=1;e<=a;e++)c=this.getPoint(e/a),f+=c.distanceTo(d),b.push(f),d=c;return this.cacheArcLengths=b},updateArcLengths:function(){this.needsUpdate=!0;this.getLengths()},getUtoTmapping:function(a,b){var c=this.getLengths(),d=0,e=c.length,f;f=b?b:a*c[e-1];for(var g=0,h=e-
	1,k;g<=h;)if(d=Math.floor(g+(h-g)/2),k=c[d]-f,0>k)g=d+1;else if(0<k)h=d-1;else{h=d;break}d=h;if(c[d]===f)return d/(e-1);g=c[d];return c=(d+(f-g)/(c[d+1]-g))/(e-1)},getTangent:function(a){var b=a-1E-4;a+=1E-4;0>b&&(b=0);1<a&&(a=1);b=this.getPoint(b);return this.getPoint(a).clone().sub(b).normalize()},getTangentAt:function(a){a=this.getUtoTmapping(a);return this.getTangent(a)}};
	THREE.Curve.create=function(a,b){a.prototype=Object.create(THREE.Curve.prototype);a.prototype.constructor=a;a.prototype.getPoint=b;return a};THREE.CurvePath=function(){this.curves=[];this.autoClose=!1};
	THREE.CurvePath.prototype=Object.assign(Object.create(THREE.Curve.prototype),{constructor:THREE.CurvePath,add:function(a){this.curves.push(a)},closePath:function(){var a=this.curves[0].getPoint(0),b=this.curves[this.curves.length-1].getPoint(1);a.equals(b)||this.curves.push(new THREE.LineCurve(b,a))},getPoint:function(a){for(var b=a*this.getLength(),c=this.getCurveLengths(),d=0;d<c.length;){if(c[d]>=b)return a=this.curves[d],b=1-(c[d]-b)/a.getLength(),a.getPointAt(b);d++}return null},getLength:function(){var a=
	this.getCurveLengths();return a[a.length-1]},getCurveLengths:function(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;for(var a=[],b=0,c=0,d=this.curves.length;c<d;c++)b+=this.curves[c].getLength(),a.push(b);return this.cacheLengths=a},createPointsGeometry:function(a){a=this.getPoints(a);return this.createGeometry(a)},createSpacedPointsGeometry:function(a){a=this.getSpacedPoints(a);return this.createGeometry(a)},createGeometry:function(a){for(var b=new THREE.Geometry,
	c=0,d=a.length;c<d;c++){var e=a[c];b.vertices.push(new THREE.Vector3(e.x,e.y,e.z||0))}return b}});THREE.Font=function(a){this.data=a};
	Object.assign(THREE.Font.prototype,{generateShapes:function(a,b,c){void 0===b&&(b=100);void 0===c&&(c=4);var d=this.data;a=String(a).split("");var e=b/d.resolution,f=0;b=[];for(var g=0;g<a.length;g++){var h;h=e;var k=f,l=d.glyphs[a[g]]||d.glyphs["?"];if(l){var n=new THREE.Path,p=[],m=THREE.ShapeUtils.b2,q=THREE.ShapeUtils.b3,r=void 0,s=void 0,u=s=r=void 0,x=void 0,v=void 0,C=void 0,w=void 0,D=void 0,x=void 0;if(l.o)for(var A=l._cachedOutline||(l._cachedOutline=l.o.split(" ")),y=0,B=A.length;y<B;)switch(A[y++]){case "m":r=
	A[y++]*h+k;s=A[y++]*h;n.moveTo(r,s);break;case "l":r=A[y++]*h+k;s=A[y++]*h;n.lineTo(r,s);break;case "q":r=A[y++]*h+k;s=A[y++]*h;v=A[y++]*h+k;C=A[y++]*h;n.quadraticCurveTo(v,C,r,s);if(x=p[p.length-1])for(var u=x.x,x=x.y,G=1;G<=c;G++){var z=G/c;m(z,u,v,r);m(z,x,C,s)}break;case "b":if(r=A[y++]*h+k,s=A[y++]*h,v=A[y++]*h+k,C=A[y++]*h,w=A[y++]*h+k,D=A[y++]*h,n.bezierCurveTo(v,C,w,D,r,s),x=p[p.length-1])for(u=x.x,x=x.y,G=1;G<=c;G++)z=G/c,q(z,u,v,w,r),q(z,x,C,D,s)}h={offset:l.ha*h,path:n}}else h=void 0;f+=
	h.offset;b.push(h.path)}c=[];d=0;for(a=b.length;d<a;d++)Array.prototype.push.apply(c,b[d].toShapes());return c}});THREE.Path=function(a){THREE.CurvePath.call(this);this.actions=[];a&&this.fromPoints(a)};
	THREE.Path.prototype=Object.assign(Object.create(THREE.CurvePath.prototype),{constructor:THREE.Path,fromPoints:function(a){this.moveTo(a[0].x,a[0].y);for(var b=1,c=a.length;b<c;b++)this.lineTo(a[b].x,a[b].y)},moveTo:function(a,b){this.actions.push({action:"moveTo",args:[a,b]})},lineTo:function(a,b){var c=this.actions[this.actions.length-1].args,c=new THREE.LineCurve(new THREE.Vector2(c[c.length-2],c[c.length-1]),new THREE.Vector2(a,b));this.curves.push(c);this.actions.push({action:"lineTo",args:[a,
	b]})},quadraticCurveTo:function(a,b,c,d){var e=this.actions[this.actions.length-1].args,e=new THREE.QuadraticBezierCurve(new THREE.Vector2(e[e.length-2],e[e.length-1]),new THREE.Vector2(a,b),new THREE.Vector2(c,d));this.curves.push(e);this.actions.push({action:"quadraticCurveTo",args:[a,b,c,d]})},bezierCurveTo:function(a,b,c,d,e,f){var g=this.actions[this.actions.length-1].args,g=new THREE.CubicBezierCurve(new THREE.Vector2(g[g.length-2],g[g.length-1]),new THREE.Vector2(a,b),new THREE.Vector2(c,d),
	new THREE.Vector2(e,f));this.curves.push(g);this.actions.push({action:"bezierCurveTo",args:[a,b,c,d,e,f]})},splineThru:function(a){var b=Array.prototype.slice.call(arguments),c=this.actions[this.actions.length-1].args,c=[new THREE.Vector2(c[c.length-2],c[c.length-1])];Array.prototype.push.apply(c,a);c=new THREE.SplineCurve(c);this.curves.push(c);this.actions.push({action:"splineThru",args:b})},arc:function(a,b,c,d,e,f){var g=this.actions[this.actions.length-1].args;this.absarc(a+g[g.length-2],b+g[g.length-
	1],c,d,e,f)},absarc:function(a,b,c,d,e,f){this.absellipse(a,b,c,c,d,e,f)},ellipse:function(a,b,c,d,e,f,g,h){var k=this.actions[this.actions.length-1].args;this.absellipse(a+k[k.length-2],b+k[k.length-1],c,d,e,f,g,h)},absellipse:function(a,b,c,d,e,f,g,h){var k=[a,b,c,d,e,f,g,h||0];a=new THREE.EllipseCurve(a,b,c,d,e,f,g,h);this.curves.push(a);a=a.getPoint(1);k.push(a.x);k.push(a.y);this.actions.push({action:"ellipse",args:k})},getSpacedPoints:function(a){a||(a=40);for(var b=[],c=0;c<a;c++)b.push(this.getPoint(c/
	a));this.autoClose&&b.push(b[0]);return b},getPoints:function(a){a=a||12;for(var b=THREE.ShapeUtils.b2,c=THREE.ShapeUtils.b3,d=[],e,f,g,h,k,l,n,p,m,q,r=0,s=this.actions.length;r<s;r++){m=this.actions[r];var u=m.args;switch(m.action){case "moveTo":d.push(new THREE.Vector2(u[0],u[1]));break;case "lineTo":d.push(new THREE.Vector2(u[0],u[1]));break;case "quadraticCurveTo":e=u[2];f=u[3];k=u[0];l=u[1];0<d.length?(m=d[d.length-1],n=m.x,p=m.y):(m=this.actions[r-1].args,n=m[m.length-2],p=m[m.length-1]);for(u=
	1;u<=a;u++)q=u/a,m=b(q,n,k,e),q=b(q,p,l,f),d.push(new THREE.Vector2(m,q));break;case "bezierCurveTo":e=u[4];f=u[5];k=u[0];l=u[1];g=u[2];h=u[3];0<d.length?(m=d[d.length-1],n=m.x,p=m.y):(m=this.actions[r-1].args,n=m[m.length-2],p=m[m.length-1]);for(u=1;u<=a;u++)q=u/a,m=c(q,n,k,g,e),q=c(q,p,l,h,f),d.push(new THREE.Vector2(m,q));break;case "splineThru":m=this.actions[r-1].args;q=[new THREE.Vector2(m[m.length-2],m[m.length-1])];m=a*u[0].length;q=q.concat(u[0]);q=new THREE.SplineCurve(q);for(u=1;u<=m;u++)d.push(q.getPointAt(u/
	m));break;case "arc":e=u[0];f=u[1];l=u[2];g=u[3];m=u[4];k=!!u[5];n=m-g;p=2*a;for(u=1;u<=p;u++)q=u/p,k||(q=1-q),q=g+q*n,m=e+l*Math.cos(q),q=f+l*Math.sin(q),d.push(new THREE.Vector2(m,q));break;case "ellipse":e=u[0];f=u[1];l=u[2];h=u[3];g=u[4];m=u[5];k=!!u[6];var x=u[7];n=m-g;p=2*a;var v,C;0!==x&&(v=Math.cos(x),C=Math.sin(x));for(u=1;u<=p;u++){q=u/p;k||(q=1-q);q=g+q*n;m=e+l*Math.cos(q);q=f+h*Math.sin(q);if(0!==x){var w=m;m=(w-e)*v-(q-f)*C+e;q=(w-e)*C+(q-f)*v+f}d.push(new THREE.Vector2(m,q))}}}a=d[d.length-
	1];Math.abs(a.x-d[0].x)<Number.EPSILON&&Math.abs(a.y-d[0].y)<Number.EPSILON&&d.splice(d.length-1,1);this.autoClose&&d.push(d[0]);return d},toShapes:function(a,b){function c(a){for(var b=[],c=0,d=a.length;c<d;c++){var e=a[c],f=new THREE.Shape;f.actions=e.actions;f.curves=e.curves;b.push(f)}return b}function d(a,b){for(var c=b.length,d=!1,e=c-1,f=0;f<c;e=f++){var g=b[e],h=b[f],k=h.x-g.x,l=h.y-g.y;if(Math.abs(l)>Number.EPSILON){if(0>l&&(g=b[f],k=-k,h=b[e],l=-l),!(a.y<g.y||a.y>h.y))if(a.y===g.y){if(a.x===
	g.x)return!0}else{e=l*(a.x-g.x)-k*(a.y-g.y);if(0===e)return!0;0>e||(d=!d)}}else if(a.y===g.y&&(h.x<=a.x&&a.x<=g.x||g.x<=a.x&&a.x<=h.x))return!0}return d}var e=THREE.ShapeUtils.isClockWise,f=function(a){for(var b=[],c=new THREE.Path,d=0,e=a.length;d<e;d++){var f=a[d],g=f.args,f=f.action;"moveTo"===f&&0!==c.actions.length&&(b.push(c),c=new THREE.Path);c[f].apply(c,g)}0!==c.actions.length&&b.push(c);return b}(this.actions);if(0===f.length)return[];if(!0===b)return c(f);var g,h,k,l=[];if(1===f.length)return h=
	f[0],k=new THREE.Shape,k.actions=h.actions,k.curves=h.curves,l.push(k),l;var n=!e(f[0].getPoints()),n=a?!n:n;k=[];var p=[],m=[],q=0,r;p[q]=void 0;m[q]=[];for(var s=0,u=f.length;s<u;s++)h=f[s],r=h.getPoints(),g=e(r),(g=a?!g:g)?(!n&&p[q]&&q++,p[q]={s:new THREE.Shape,p:r},p[q].s.actions=h.actions,p[q].s.curves=h.curves,n&&q++,m[q]=[]):m[q].push({h:h,p:r[0]});if(!p[0])return c(f);if(1<p.length){s=!1;h=[];e=0;for(f=p.length;e<f;e++)k[e]=[];e=0;for(f=p.length;e<f;e++)for(g=m[e],n=0;n<g.length;n++){q=g[n];
	r=!0;for(u=0;u<p.length;u++)d(q.p,p[u].p)&&(e!==u&&h.push({froms:e,tos:u,hole:n}),r?(r=!1,k[u].push(q)):s=!0);r&&k[e].push(q)}0<h.length&&(s||(m=k))}s=0;for(e=p.length;s<e;s++)for(k=p[s].s,l.push(k),h=m[s],f=0,g=h.length;f<g;f++)k.holes.push(h[f].h);return l}});THREE.Shape=function(){THREE.Path.apply(this,arguments);this.holes=[]};
	THREE.Shape.prototype=Object.assign(Object.create(THREE.Path.prototype),{constructor:THREE.Shape,extrude:function(a){return new THREE.ExtrudeGeometry(this,a)},makeGeometry:function(a){return new THREE.ShapeGeometry(this,a)},getPointsHoles:function(a){for(var b=[],c=0,d=this.holes.length;c<d;c++)b[c]=this.holes[c].getPoints(a);return b},extractAllPoints:function(a){return{shape:this.getPoints(a),holes:this.getPointsHoles(a)}},extractPoints:function(a){return this.extractAllPoints(a)}});
	THREE.LineCurve=function(a,b){this.v1=a;this.v2=b};THREE.LineCurve.prototype=Object.create(THREE.Curve.prototype);THREE.LineCurve.prototype.constructor=THREE.LineCurve;THREE.LineCurve.prototype.getPoint=function(a){var b=this.v2.clone().sub(this.v1);b.multiplyScalar(a).add(this.v1);return b};THREE.LineCurve.prototype.getPointAt=function(a){return this.getPoint(a)};THREE.LineCurve.prototype.getTangent=function(a){return this.v2.clone().sub(this.v1).normalize()};
	THREE.QuadraticBezierCurve=function(a,b,c){this.v0=a;this.v1=b;this.v2=c};THREE.QuadraticBezierCurve.prototype=Object.create(THREE.Curve.prototype);THREE.QuadraticBezierCurve.prototype.constructor=THREE.QuadraticBezierCurve;THREE.QuadraticBezierCurve.prototype.getPoint=function(a){var b=THREE.ShapeUtils.b2;return new THREE.Vector2(b(a,this.v0.x,this.v1.x,this.v2.x),b(a,this.v0.y,this.v1.y,this.v2.y))};
	THREE.QuadraticBezierCurve.prototype.getTangent=function(a){var b=THREE.CurveUtils.tangentQuadraticBezier;return(new THREE.Vector2(b(a,this.v0.x,this.v1.x,this.v2.x),b(a,this.v0.y,this.v1.y,this.v2.y))).normalize()};THREE.CubicBezierCurve=function(a,b,c,d){this.v0=a;this.v1=b;this.v2=c;this.v3=d};THREE.CubicBezierCurve.prototype=Object.create(THREE.Curve.prototype);THREE.CubicBezierCurve.prototype.constructor=THREE.CubicBezierCurve;
	THREE.CubicBezierCurve.prototype.getPoint=function(a){var b=THREE.ShapeUtils.b3;return new THREE.Vector2(b(a,this.v0.x,this.v1.x,this.v2.x,this.v3.x),b(a,this.v0.y,this.v1.y,this.v2.y,this.v3.y))};THREE.CubicBezierCurve.prototype.getTangent=function(a){var b=THREE.CurveUtils.tangentCubicBezier;return(new THREE.Vector2(b(a,this.v0.x,this.v1.x,this.v2.x,this.v3.x),b(a,this.v0.y,this.v1.y,this.v2.y,this.v3.y))).normalize()};THREE.SplineCurve=function(a){this.points=void 0==a?[]:a};
	THREE.SplineCurve.prototype=Object.create(THREE.Curve.prototype);THREE.SplineCurve.prototype.constructor=THREE.SplineCurve;THREE.SplineCurve.prototype.getPoint=function(a){var b=this.points;a*=b.length-1;var c=Math.floor(a);a-=c;var d=b[0===c?c:c-1],e=b[c],f=b[c>b.length-2?b.length-1:c+1],b=b[c>b.length-3?b.length-1:c+2],c=THREE.CurveUtils.interpolate;return new THREE.Vector2(c(d.x,e.x,f.x,b.x,a),c(d.y,e.y,f.y,b.y,a))};
	THREE.EllipseCurve=function(a,b,c,d,e,f,g,h){this.aX=a;this.aY=b;this.xRadius=c;this.yRadius=d;this.aStartAngle=e;this.aEndAngle=f;this.aClockwise=g;this.aRotation=h||0};THREE.EllipseCurve.prototype=Object.create(THREE.Curve.prototype);THREE.EllipseCurve.prototype.constructor=THREE.EllipseCurve;
	THREE.EllipseCurve.prototype.getPoint=function(a){var b=this.aEndAngle-this.aStartAngle;0>b&&(b+=2*Math.PI);b>2*Math.PI&&(b-=2*Math.PI);b=!0===this.aClockwise?this.aEndAngle+(1-a)*(2*Math.PI-b):this.aStartAngle+a*b;a=this.aX+this.xRadius*Math.cos(b);var c=this.aY+this.yRadius*Math.sin(b);if(0!==this.aRotation){var b=Math.cos(this.aRotation),d=Math.sin(this.aRotation),e=a;a=(e-this.aX)*b-(c-this.aY)*d+this.aX;c=(e-this.aX)*d+(c-this.aY)*b+this.aY}return new THREE.Vector2(a,c)};
	THREE.ArcCurve=function(a,b,c,d,e,f){THREE.EllipseCurve.call(this,a,b,c,c,d,e,f)};THREE.ArcCurve.prototype=Object.create(THREE.EllipseCurve.prototype);THREE.ArcCurve.prototype.constructor=THREE.ArcCurve;THREE.LineCurve3=THREE.Curve.create(function(a,b){this.v1=a;this.v2=b},function(a){var b=new THREE.Vector3;b.subVectors(this.v2,this.v1);b.multiplyScalar(a);b.add(this.v1);return b});
	THREE.QuadraticBezierCurve3=THREE.Curve.create(function(a,b,c){this.v0=a;this.v1=b;this.v2=c},function(a){var b=THREE.ShapeUtils.b2;return new THREE.Vector3(b(a,this.v0.x,this.v1.x,this.v2.x),b(a,this.v0.y,this.v1.y,this.v2.y),b(a,this.v0.z,this.v1.z,this.v2.z))});
	THREE.CubicBezierCurve3=THREE.Curve.create(function(a,b,c,d){this.v0=a;this.v1=b;this.v2=c;this.v3=d},function(a){var b=THREE.ShapeUtils.b3;return new THREE.Vector3(b(a,this.v0.x,this.v1.x,this.v2.x,this.v3.x),b(a,this.v0.y,this.v1.y,this.v2.y,this.v3.y),b(a,this.v0.z,this.v1.z,this.v2.z,this.v3.z))});
	THREE.SplineCurve3=THREE.Curve.create(function(a){console.warn("THREE.SplineCurve3 will be deprecated. Please use THREE.CatmullRomCurve3");this.points=void 0==a?[]:a},function(a){var b=this.points;a*=b.length-1;var c=Math.floor(a);a-=c;var d=b[0==c?c:c-1],e=b[c],f=b[c>b.length-2?b.length-1:c+1],b=b[c>b.length-3?b.length-1:c+2],c=THREE.CurveUtils.interpolate;return new THREE.Vector3(c(d.x,e.x,f.x,b.x,a),c(d.y,e.y,f.y,b.y,a),c(d.z,e.z,f.z,b.z,a))});
	THREE.CatmullRomCurve3=function(){function a(){}var b=new THREE.Vector3,c=new a,d=new a,e=new a;a.prototype.init=function(a,b,c,d){this.c0=a;this.c1=c;this.c2=-3*a+3*b-2*c-d;this.c3=2*a-2*b+c+d};a.prototype.initNonuniformCatmullRom=function(a,b,c,d,e,n,p){a=((b-a)/e-(c-a)/(e+n)+(c-b)/n)*n;d=((c-b)/n-(d-b)/(n+p)+(d-c)/p)*n;this.init(b,c,a,d)};a.prototype.initCatmullRom=function(a,b,c,d,e){this.init(b,c,e*(c-a),e*(d-b))};a.prototype.calc=function(a){var b=a*a;return this.c0+this.c1*a+this.c2*b+this.c3*
	b*a};return THREE.Curve.create(function(a){this.points=a||[];this.closed=!1},function(a){var g=this.points,h,k;k=g.length;2>k&&console.log("duh, you need at least 2 points");a*=k-(this.closed?0:1);h=Math.floor(a);a-=h;this.closed?h+=0<h?0:(Math.floor(Math.abs(h)/g.length)+1)*g.length:0===a&&h===k-1&&(h=k-2,a=1);var l,n,p;this.closed||0<h?l=g[(h-1)%k]:(b.subVectors(g[0],g[1]).add(g[0]),l=b);n=g[h%k];p=g[(h+1)%k];this.closed||h+2<k?g=g[(h+2)%k]:(b.subVectors(g[k-1],g[k-2]).add(g[k-1]),g=b);if(void 0===
	this.type||"centripetal"===this.type||"chordal"===this.type){var m="chordal"===this.type?.5:.25;k=Math.pow(l.distanceToSquared(n),m);h=Math.pow(n.distanceToSquared(p),m);m=Math.pow(p.distanceToSquared(g),m);1E-4>h&&(h=1);1E-4>k&&(k=h);1E-4>m&&(m=h);c.initNonuniformCatmullRom(l.x,n.x,p.x,g.x,k,h,m);d.initNonuniformCatmullRom(l.y,n.y,p.y,g.y,k,h,m);e.initNonuniformCatmullRom(l.z,n.z,p.z,g.z,k,h,m)}else"catmullrom"===this.type&&(k=void 0!==this.tension?this.tension:.5,c.initCatmullRom(l.x,n.x,p.x,g.x,
	k),d.initCatmullRom(l.y,n.y,p.y,g.y,k),e.initCatmullRom(l.z,n.z,p.z,g.z,k));return new THREE.Vector3(c.calc(a),d.calc(a),e.calc(a))})}();THREE.ClosedSplineCurve3=function(a){console.warn("THREE.ClosedSplineCurve3 has been deprecated. Please use THREE.CatmullRomCurve3.");THREE.CatmullRomCurve3.call(this,a);this.type="catmullrom";this.closed=!0};THREE.ClosedSplineCurve3.prototype=Object.create(THREE.CatmullRomCurve3.prototype);
	THREE.BoxGeometry=function(a,b,c,d,e,f){THREE.Geometry.call(this);this.type="BoxGeometry";this.parameters={width:a,height:b,depth:c,widthSegments:d,heightSegments:e,depthSegments:f};this.fromBufferGeometry(new THREE.BoxBufferGeometry(a,b,c,d,e,f));this.mergeVertices()};THREE.BoxGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.BoxGeometry.prototype.constructor=THREE.BoxGeometry;THREE.CubeGeometry=THREE.BoxGeometry;
	THREE.BoxBufferGeometry=function(a,b,c,d,e,f){function g(a,b,c,d,e,f,g,k,l,M,O){var N=f/l,E=g/M,K=f/2,I=g/2,L=k/2;g=l+1;for(var P=M+1,Q=f=0,R=new THREE.Vector3,F=0;F<P;F++)for(var da=F*E-I,U=0;U<g;U++)R[a]=(U*N-K)*d,R[b]=da*e,R[c]=L,p[r]=R.x,p[r+1]=R.y,p[r+2]=R.z,R[a]=0,R[b]=0,R[c]=0<k?1:-1,m[r]=R.x,m[r+1]=R.y,m[r+2]=R.z,q[s]=U/l,q[s+1]=1-F/M,r+=3,s+=2,f+=1;for(F=0;F<M;F++)for(U=0;U<l;U++)a=x+U+g*(F+1),b=x+(U+1)+g*(F+1),c=x+(U+1)+g*F,n[u]=x+U+g*F,n[u+1]=a,n[u+2]=c,n[u+3]=a,n[u+4]=b,n[u+5]=c,u+=6,
	Q+=6;h.addGroup(v,Q,O);v+=Q;x+=f}THREE.BufferGeometry.call(this);this.type="BoxBufferGeometry";this.parameters={width:a,height:b,depth:c,widthSegments:d,heightSegments:e,depthSegments:f};var h=this;d=Math.floor(d)||1;e=Math.floor(e)||1;f=Math.floor(f)||1;var k=function(a,b,c){a=0+(a+1)*(b+1)*2+(a+1)*(c+1)*2;return a+=(c+1)*(b+1)*2}(d,e,f),l=function(a,b,c){a=0+a*b*2+a*c*2;a+=c*b*2;return 6*a}(d,e,f),n=new (65535<l?Uint32Array:Uint16Array)(l),p=new Float32Array(3*k),m=new Float32Array(3*k),q=new Float32Array(2*
	k),r=0,s=0,u=0,x=0,v=0;g("z","y","x",-1,-1,c,b,a,f,e,0);g("z","y","x",1,-1,c,b,-a,f,e,1);g("x","z","y",1,1,a,c,b,d,f,2);g("x","z","y",1,-1,a,c,-b,d,f,3);g("x","y","z",1,-1,a,b,c,d,e,4);g("x","y","z",-1,-1,a,b,-c,d,e,5);this.setIndex(new THREE.BufferAttribute(n,1));this.addAttribute("position",new THREE.BufferAttribute(p,3));this.addAttribute("normal",new THREE.BufferAttribute(m,3));this.addAttribute("uv",new THREE.BufferAttribute(q,2))};THREE.BoxBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);
	THREE.BoxBufferGeometry.prototype.constructor=THREE.BoxBufferGeometry;THREE.CircleGeometry=function(a,b,c,d){THREE.Geometry.call(this);this.type="CircleGeometry";this.parameters={radius:a,segments:b,thetaStart:c,thetaLength:d};this.fromBufferGeometry(new THREE.CircleBufferGeometry(a,b,c,d))};THREE.CircleGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.CircleGeometry.prototype.constructor=THREE.CircleGeometry;
	THREE.CircleBufferGeometry=function(a,b,c,d){THREE.BufferGeometry.call(this);this.type="CircleBufferGeometry";this.parameters={radius:a,segments:b,thetaStart:c,thetaLength:d};a=a||50;b=void 0!==b?Math.max(3,b):8;c=void 0!==c?c:0;d=void 0!==d?d:2*Math.PI;var e=b+2,f=new Float32Array(3*e),g=new Float32Array(3*e),e=new Float32Array(2*e);g[2]=1;e[0]=.5;e[1]=.5;for(var h=0,k=3,l=2;h<=b;h++,k+=3,l+=2){var n=c+h/b*d;f[k]=a*Math.cos(n);f[k+1]=a*Math.sin(n);g[k+2]=1;e[l]=(f[k]/a+1)/2;e[l+1]=(f[k+1]/a+1)/2}c=
	[];for(k=1;k<=b;k++)c.push(k,k+1,0);this.setIndex(new THREE.BufferAttribute(new Uint16Array(c),1));this.addAttribute("position",new THREE.BufferAttribute(f,3));this.addAttribute("normal",new THREE.BufferAttribute(g,3));this.addAttribute("uv",new THREE.BufferAttribute(e,2));this.boundingSphere=new THREE.Sphere(new THREE.Vector3,a)};THREE.CircleBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.CircleBufferGeometry.prototype.constructor=THREE.CircleBufferGeometry;
	THREE.CylinderBufferGeometry=function(a,b,c,d,e,f,g,h){function k(c){var e,f,k,m=new THREE.Vector2,n=new THREE.Vector3,p=0,C=!0===c?a:b,N=!0===c?1:-1;f=x;for(e=1;e<=d;e++)r.setXYZ(x,0,w*N,0),s.setXYZ(x,0,N,0),m.x=.5,m.y=.5,u.setXY(x,m.x,m.y),x++;k=x;for(e=0;e<=d;e++){var E=e/d*h+g,K=Math.cos(E),E=Math.sin(E);n.x=C*E;n.y=w*N;n.z=C*K;r.setXYZ(x,n.x,n.y,n.z);s.setXYZ(x,0,N,0);m.x=.5*K+.5;m.y=.5*E*N+.5;u.setXY(x,m.x,m.y);x++}for(e=0;e<d;e++)m=f+e,n=k+e,!0===c?(q.setX(v,n),v++,q.setX(v,n+1)):(q.setX(v,
	n+1),v++,q.setX(v,n)),v++,q.setX(v,m),v++,p+=3;l.addGroup(D,p,!0===c?1:2);D+=p}THREE.BufferGeometry.call(this);this.type="CylinderBufferGeometry";this.parameters={radiusTop:a,radiusBottom:b,height:c,radialSegments:d,heightSegments:e,openEnded:f,thetaStart:g,thetaLength:h};var l=this;a=void 0!==a?a:20;b=void 0!==b?b:20;c=void 0!==c?c:100;d=Math.floor(d)||8;e=Math.floor(e)||1;f=void 0!==f?f:!1;g=void 0!==g?g:0;h=void 0!==h?h:2*Math.PI;var n=0;!1===f&&(0<a&&n++,0<b&&n++);var p=function(){var a=(d+1)*
	(e+1);!1===f&&(a+=(d+1)*n+d*n);return a}(),m=function(){var a=d*e*6;!1===f&&(a+=d*n*3);return a}(),q=new THREE.BufferAttribute(new (65535<m?Uint32Array:Uint16Array)(m),1),r=new THREE.BufferAttribute(new Float32Array(3*p),3),s=new THREE.BufferAttribute(new Float32Array(3*p),3),u=new THREE.BufferAttribute(new Float32Array(2*p),2),x=0,v=0,C=[],w=c/2,D=0;(function(){var f,k,m=new THREE.Vector3,n=new THREE.Vector3,p=0,H=(b-a)/c;for(k=0;k<=e;k++){var M=[],O=k/e,N=O*(b-a)+a;for(f=0;f<=d;f++){var E=f/d;n.x=
	N*Math.sin(E*h+g);n.y=-O*c+w;n.z=N*Math.cos(E*h+g);r.setXYZ(x,n.x,n.y,n.z);m.copy(n);if(0===a&&0===k||0===b&&k===e)m.x=Math.sin(E*h+g),m.z=Math.cos(E*h+g);m.setY(Math.sqrt(m.x*m.x+m.z*m.z)*H).normalize();s.setXYZ(x,m.x,m.y,m.z);u.setXY(x,E,1-O);M.push(x);x++}C.push(M)}for(f=0;f<d;f++)for(k=0;k<e;k++)m=C[k+1][f],n=C[k+1][f+1],H=C[k][f+1],q.setX(v,C[k][f]),v++,q.setX(v,m),v++,q.setX(v,H),v++,q.setX(v,m),v++,q.setX(v,n),v++,q.setX(v,H),v++,p+=6;l.addGroup(D,p,0);D+=p})();!1===f&&(0<a&&k(!0),0<b&&k(!1));
	this.setIndex(q);this.addAttribute("position",r);this.addAttribute("normal",s);this.addAttribute("uv",u)};THREE.CylinderBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.CylinderBufferGeometry.prototype.constructor=THREE.CylinderBufferGeometry;
	THREE.CylinderGeometry=function(a,b,c,d,e,f,g,h){THREE.Geometry.call(this);this.type="CylinderGeometry";this.parameters={radiusTop:a,radiusBottom:b,height:c,radialSegments:d,heightSegments:e,openEnded:f,thetaStart:g,thetaLength:h};this.fromBufferGeometry(new THREE.CylinderBufferGeometry(a,b,c,d,e,f,g,h));this.mergeVertices()};THREE.CylinderGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.CylinderGeometry.prototype.constructor=THREE.CylinderGeometry;
	THREE.ConeBufferGeometry=function(a,b,c,d,e,f,g){THREE.CylinderBufferGeometry.call(this,0,a,b,c,d,e,f,g);this.type="ConeBufferGeometry";this.parameters={radius:a,height:b,radialSegments:c,heightSegments:d,thetaStart:f,thetaLength:g}};THREE.ConeBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.ConeBufferGeometry.prototype.constructor=THREE.ConeBufferGeometry;
	THREE.ConeGeometry=function(a,b,c,d,e,f,g){THREE.CylinderGeometry.call(this,0,a,b,c,d,e,f,g);this.type="ConeGeometry";this.parameters={radius:a,height:b,radialSegments:c,heightSegments:d,openEnded:e,thetaStart:f,thetaLength:g}};THREE.ConeGeometry.prototype=Object.create(THREE.CylinderGeometry.prototype);THREE.ConeGeometry.prototype.constructor=THREE.ConeGeometry;
	THREE.EdgesGeometry=function(a,b){function c(a,b){return a-b}THREE.BufferGeometry.call(this);var d=Math.cos(THREE.Math.DEG2RAD*(void 0!==b?b:1)),e=[0,0],f={},g=["a","b","c"],h;a instanceof THREE.BufferGeometry?(h=new THREE.Geometry,h.fromBufferGeometry(a)):h=a.clone();h.mergeVertices();h.computeFaceNormals();var k=h.vertices;h=h.faces;for(var l=0,n=h.length;l<n;l++)for(var p=h[l],m=0;3>m;m++){e[0]=p[g[m]];e[1]=p[g[(m+1)%3]];e.sort(c);var q=e.toString();void 0===f[q]?f[q]={vert1:e[0],vert2:e[1],face1:l,
	face2:void 0}:f[q].face2=l}e=[];for(q in f)if(g=f[q],void 0===g.face2||h[g.face1].normal.dot(h[g.face2].normal)<=d)l=k[g.vert1],e.push(l.x),e.push(l.y),e.push(l.z),l=k[g.vert2],e.push(l.x),e.push(l.y),e.push(l.z);this.addAttribute("position",new THREE.BufferAttribute(new Float32Array(e),3))};THREE.EdgesGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.EdgesGeometry.prototype.constructor=THREE.EdgesGeometry;
	THREE.ExtrudeGeometry=function(a,b){"undefined"!==typeof a&&(THREE.Geometry.call(this),this.type="ExtrudeGeometry",a=Array.isArray(a)?a:[a],this.addShapeList(a,b),this.computeFaceNormals())};THREE.ExtrudeGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.ExtrudeGeometry.prototype.constructor=THREE.ExtrudeGeometry;THREE.ExtrudeGeometry.prototype.addShapeList=function(a,b){for(var c=a.length,d=0;d<c;d++)this.addShape(a[d],b)};
	THREE.ExtrudeGeometry.prototype.addShape=function(a,b){function c(a,b,c){b||console.error("THREE.ExtrudeGeometry: vec does not exist");return b.clone().multiplyScalar(c).add(a)}function d(a,b,c){var d=1,d=a.x-b.x,e=a.y-b.y,f=c.x-a.x,g=c.y-a.y,h=d*d+e*e;if(Math.abs(d*g-e*f)>Number.EPSILON){var k=Math.sqrt(h),l=Math.sqrt(f*f+g*g),h=b.x-e/k;b=b.y+d/k;f=((c.x-g/l-h)*g-(c.y+f/l-b)*f)/(d*g-e*f);c=h+d*f-a.x;a=b+e*f-a.y;d=c*c+a*a;if(2>=d)return new THREE.Vector2(c,a);d=Math.sqrt(d/2)}else a=!1,d>Number.EPSILON?
	f>Number.EPSILON&&(a=!0):d<-Number.EPSILON?f<-Number.EPSILON&&(a=!0):Math.sign(e)===Math.sign(g)&&(a=!0),a?(c=-e,a=d,d=Math.sqrt(h)):(c=d,a=e,d=Math.sqrt(h/2));return new THREE.Vector2(c/d,a/d)}function e(a,b){var c,d;for(F=a.length;0<=--F;){c=F;d=F-1;0>d&&(d=a.length-1);for(var e=0,f=q+2*n,e=0;e<f;e++){var g=P*e,h=P*(e+1),k=b+c+g,g=b+d+g,l=b+d+h,h=b+c+h,k=k+z,g=g+z,l=l+z,h=h+z;G.faces.push(new THREE.Face3(k,g,h,null,null,1));G.faces.push(new THREE.Face3(g,l,h,null,null,1));k=x.generateSideWallUV(G,
	k,g,l,h);G.faceVertexUvs[0].push([k[0],k[1],k[3]]);G.faceVertexUvs[0].push([k[1],k[2],k[3]])}}}function f(a,b,c){G.vertices.push(new THREE.Vector3(a,b,c))}function g(a,b,c){a+=z;b+=z;c+=z;G.faces.push(new THREE.Face3(a,b,c,null,null,0));a=x.generateTopUV(G,a,b,c);G.faceVertexUvs[0].push(a)}var h=void 0!==b.amount?b.amount:100,k=void 0!==b.bevelThickness?b.bevelThickness:6,l=void 0!==b.bevelSize?b.bevelSize:k-2,n=void 0!==b.bevelSegments?b.bevelSegments:3,p=void 0!==b.bevelEnabled?b.bevelEnabled:!0,
	m=void 0!==b.curveSegments?b.curveSegments:12,q=void 0!==b.steps?b.steps:1,r=b.extrudePath,s,u=!1,x=void 0!==b.UVGenerator?b.UVGenerator:THREE.ExtrudeGeometry.WorldUVGenerator,v,C,w,D;r&&(s=r.getSpacedPoints(q),u=!0,p=!1,v=void 0!==b.frames?b.frames:new THREE.TubeGeometry.FrenetFrames(r,q,!1),C=new THREE.Vector3,w=new THREE.Vector3,D=new THREE.Vector3);p||(l=k=n=0);var A,y,B,G=this,z=this.vertices.length,r=a.extractPoints(m),m=r.shape,H=r.holes;if(r=!THREE.ShapeUtils.isClockWise(m)){m=m.reverse();
	y=0;for(B=H.length;y<B;y++)A=H[y],THREE.ShapeUtils.isClockWise(A)&&(H[y]=A.reverse());r=!1}var M=THREE.ShapeUtils.triangulateShape(m,H),O=m;y=0;for(B=H.length;y<B;y++)A=H[y],m=m.concat(A);var N,E,K,I,L,P=m.length,Q,R=M.length,r=[],F=0;K=O.length;N=K-1;for(E=F+1;F<K;F++,N++,E++)N===K&&(N=0),E===K&&(E=0),r[F]=d(O[F],O[N],O[E]);var da=[],U,Y=r.concat();y=0;for(B=H.length;y<B;y++){A=H[y];U=[];F=0;K=A.length;N=K-1;for(E=F+1;F<K;F++,N++,E++)N===K&&(N=0),E===K&&(E=0),U[F]=d(A[F],A[N],A[E]);da.push(U);Y=
	Y.concat(U)}for(N=0;N<n;N++){K=N/n;I=k*(1-K);E=l*Math.sin(K*Math.PI/2);F=0;for(K=O.length;F<K;F++)L=c(O[F],r[F],E),f(L.x,L.y,-I);y=0;for(B=H.length;y<B;y++)for(A=H[y],U=da[y],F=0,K=A.length;F<K;F++)L=c(A[F],U[F],E),f(L.x,L.y,-I)}E=l;for(F=0;F<P;F++)L=p?c(m[F],Y[F],E):m[F],u?(w.copy(v.normals[0]).multiplyScalar(L.x),C.copy(v.binormals[0]).multiplyScalar(L.y),D.copy(s[0]).add(w).add(C),f(D.x,D.y,D.z)):f(L.x,L.y,0);for(K=1;K<=q;K++)for(F=0;F<P;F++)L=p?c(m[F],Y[F],E):m[F],u?(w.copy(v.normals[K]).multiplyScalar(L.x),
	C.copy(v.binormals[K]).multiplyScalar(L.y),D.copy(s[K]).add(w).add(C),f(D.x,D.y,D.z)):f(L.x,L.y,h/q*K);for(N=n-1;0<=N;N--){K=N/n;I=k*(1-K);E=l*Math.sin(K*Math.PI/2);F=0;for(K=O.length;F<K;F++)L=c(O[F],r[F],E),f(L.x,L.y,h+I);y=0;for(B=H.length;y<B;y++)for(A=H[y],U=da[y],F=0,K=A.length;F<K;F++)L=c(A[F],U[F],E),u?f(L.x,L.y+s[q-1].y,s[q-1].x+I):f(L.x,L.y,h+I)}(function(){if(p){var a;a=0*P;for(F=0;F<R;F++)Q=M[F],g(Q[2]+a,Q[1]+a,Q[0]+a);a=q+2*n;a*=P;for(F=0;F<R;F++)Q=M[F],g(Q[0]+a,Q[1]+a,Q[2]+a)}else{for(F=
	0;F<R;F++)Q=M[F],g(Q[2],Q[1],Q[0]);for(F=0;F<R;F++)Q=M[F],g(Q[0]+P*q,Q[1]+P*q,Q[2]+P*q)}})();(function(){var a=0;e(O,a);a+=O.length;y=0;for(B=H.length;y<B;y++)A=H[y],e(A,a),a+=A.length})()};
	THREE.ExtrudeGeometry.WorldUVGenerator={generateTopUV:function(a,b,c,d){a=a.vertices;b=a[b];c=a[c];d=a[d];return[new THREE.Vector2(b.x,b.y),new THREE.Vector2(c.x,c.y),new THREE.Vector2(d.x,d.y)]},generateSideWallUV:function(a,b,c,d,e){a=a.vertices;b=a[b];c=a[c];d=a[d];e=a[e];return.01>Math.abs(b.y-c.y)?[new THREE.Vector2(b.x,1-b.z),new THREE.Vector2(c.x,1-c.z),new THREE.Vector2(d.x,1-d.z),new THREE.Vector2(e.x,1-e.z)]:[new THREE.Vector2(b.y,1-b.z),new THREE.Vector2(c.y,1-c.z),new THREE.Vector2(d.y,
	1-d.z),new THREE.Vector2(e.y,1-e.z)]}};THREE.ShapeGeometry=function(a,b){THREE.Geometry.call(this);this.type="ShapeGeometry";!1===Array.isArray(a)&&(a=[a]);this.addShapeList(a,b);this.computeFaceNormals()};THREE.ShapeGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.ShapeGeometry.prototype.constructor=THREE.ShapeGeometry;THREE.ShapeGeometry.prototype.addShapeList=function(a,b){for(var c=0,d=a.length;c<d;c++)this.addShape(a[c],b);return this};
	THREE.ShapeGeometry.prototype.addShape=function(a,b){void 0===b&&(b={});var c=b.material,d=void 0===b.UVGenerator?THREE.ExtrudeGeometry.WorldUVGenerator:b.UVGenerator,e,f,g,h=this.vertices.length;e=a.extractPoints(void 0!==b.curveSegments?b.curveSegments:12);var k=e.shape,l=e.holes;if(!THREE.ShapeUtils.isClockWise(k))for(k=k.reverse(),e=0,f=l.length;e<f;e++)g=l[e],THREE.ShapeUtils.isClockWise(g)&&(l[e]=g.reverse());var n=THREE.ShapeUtils.triangulateShape(k,l);e=0;for(f=l.length;e<f;e++)g=l[e],k=k.concat(g);
	l=k.length;f=n.length;for(e=0;e<l;e++)g=k[e],this.vertices.push(new THREE.Vector3(g.x,g.y,0));for(e=0;e<f;e++)l=n[e],k=l[0]+h,g=l[1]+h,l=l[2]+h,this.faces.push(new THREE.Face3(k,g,l,null,null,c)),this.faceVertexUvs[0].push(d.generateTopUV(this,k,g,l))};
	THREE.LatheBufferGeometry=function(a,b,c,d){THREE.BufferGeometry.call(this);this.type="LatheBufferGeometry";this.parameters={points:a,segments:b,phiStart:c,phiLength:d};b=Math.floor(b)||12;c=c||0;d=d||2*Math.PI;d=THREE.Math.clamp(d,0,2*Math.PI);for(var e=(b+1)*a.length,f=b*a.length*6,g=new THREE.BufferAttribute(new (65535<f?Uint32Array:Uint16Array)(f),1),h=new THREE.BufferAttribute(new Float32Array(3*e),3),k=new THREE.BufferAttribute(new Float32Array(2*e),2),l=0,n=0,p=1/b,m=new THREE.Vector3,q=new THREE.Vector2,
	e=0;e<=b;e++)for(var f=c+e*p*d,r=Math.sin(f),s=Math.cos(f),f=0;f<=a.length-1;f++)m.x=a[f].x*r,m.y=a[f].y,m.z=a[f].x*s,h.setXYZ(l,m.x,m.y,m.z),q.x=e/b,q.y=f/(a.length-1),k.setXY(l,q.x,q.y),l++;for(e=0;e<b;e++)for(f=0;f<a.length-1;f++)c=f+e*a.length,l=c+a.length,p=c+a.length+1,m=c+1,g.setX(n,c),n++,g.setX(n,l),n++,g.setX(n,m),n++,g.setX(n,l),n++,g.setX(n,p),n++,g.setX(n,m),n++;this.setIndex(g);this.addAttribute("position",h);this.addAttribute("uv",k);this.computeVertexNormals();if(d===2*Math.PI)for(d=
	this.attributes.normal.array,g=new THREE.Vector3,h=new THREE.Vector3,k=new THREE.Vector3,c=b*a.length*3,f=e=0;e<a.length;e++,f+=3)g.x=d[f+0],g.y=d[f+1],g.z=d[f+2],h.x=d[c+f+0],h.y=d[c+f+1],h.z=d[c+f+2],k.addVectors(g,h).normalize(),d[f+0]=d[c+f+0]=k.x,d[f+1]=d[c+f+1]=k.y,d[f+2]=d[c+f+2]=k.z};THREE.LatheBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.LatheBufferGeometry.prototype.constructor=THREE.LatheBufferGeometry;
	THREE.LatheGeometry=function(a,b,c,d){THREE.Geometry.call(this);this.type="LatheGeometry";this.parameters={points:a,segments:b,phiStart:c,phiLength:d};this.fromBufferGeometry(new THREE.LatheBufferGeometry(a,b,c,d));this.mergeVertices()};THREE.LatheGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.LatheGeometry.prototype.constructor=THREE.LatheGeometry;
	THREE.PlaneGeometry=function(a,b,c,d){THREE.Geometry.call(this);this.type="PlaneGeometry";this.parameters={width:a,height:b,widthSegments:c,heightSegments:d};this.fromBufferGeometry(new THREE.PlaneBufferGeometry(a,b,c,d))};THREE.PlaneGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.PlaneGeometry.prototype.constructor=THREE.PlaneGeometry;
	THREE.PlaneBufferGeometry=function(a,b,c,d){THREE.BufferGeometry.call(this);this.type="PlaneBufferGeometry";this.parameters={width:a,height:b,widthSegments:c,heightSegments:d};var e=a/2,f=b/2;c=Math.floor(c)||1;d=Math.floor(d)||1;var g=c+1,h=d+1,k=a/c,l=b/d;b=new Float32Array(g*h*3);a=new Float32Array(g*h*3);for(var n=new Float32Array(g*h*2),p=0,m=0,q=0;q<h;q++)for(var r=q*l-f,s=0;s<g;s++)b[p]=s*k-e,b[p+1]=-r,a[p+2]=1,n[m]=s/c,n[m+1]=1-q/d,p+=3,m+=2;p=0;e=new (65535<b.length/3?Uint32Array:Uint16Array)(c*
	d*6);for(q=0;q<d;q++)for(s=0;s<c;s++)f=s+g*(q+1),h=s+1+g*(q+1),k=s+1+g*q,e[p]=s+g*q,e[p+1]=f,e[p+2]=k,e[p+3]=f,e[p+4]=h,e[p+5]=k,p+=6;this.setIndex(new THREE.BufferAttribute(e,1));this.addAttribute("position",new THREE.BufferAttribute(b,3));this.addAttribute("normal",new THREE.BufferAttribute(a,3));this.addAttribute("uv",new THREE.BufferAttribute(n,2))};THREE.PlaneBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.PlaneBufferGeometry.prototype.constructor=THREE.PlaneBufferGeometry;
	THREE.RingBufferGeometry=function(a,b,c,d,e,f){THREE.BufferGeometry.call(this);this.type="RingBufferGeometry";this.parameters={innerRadius:a,outerRadius:b,thetaSegments:c,phiSegments:d,thetaStart:e,thetaLength:f};a=a||20;b=b||50;e=void 0!==e?e:0;f=void 0!==f?f:2*Math.PI;c=void 0!==c?Math.max(3,c):8;d=void 0!==d?Math.max(1,d):1;var g=(c+1)*(d+1),h=c*d*6,h=new THREE.BufferAttribute(new (65535<h?Uint32Array:Uint16Array)(h),1),k=new THREE.BufferAttribute(new Float32Array(3*g),3),l=new THREE.BufferAttribute(new Float32Array(3*
	g),3),g=new THREE.BufferAttribute(new Float32Array(2*g),2),n=0,p=0,m,q=a,r=(b-a)/d,s=new THREE.Vector3,u=new THREE.Vector2,x;for(a=0;a<=d;a++){for(x=0;x<=c;x++)m=e+x/c*f,s.x=q*Math.cos(m),s.y=q*Math.sin(m),k.setXYZ(n,s.x,s.y,s.z),l.setXYZ(n,0,0,1),u.x=(s.x/b+1)/2,u.y=(s.y/b+1)/2,g.setXY(n,u.x,u.y),n++;q+=r}for(a=0;a<d;a++)for(b=a*(c+1),x=0;x<c;x++)e=m=x+b,f=m+c+1,n=m+c+2,m+=1,h.setX(p,e),p++,h.setX(p,f),p++,h.setX(p,n),p++,h.setX(p,e),p++,h.setX(p,n),p++,h.setX(p,m),p++;this.setIndex(h);this.addAttribute("position",
	k);this.addAttribute("normal",l);this.addAttribute("uv",g)};THREE.RingBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.RingBufferGeometry.prototype.constructor=THREE.RingBufferGeometry;THREE.RingGeometry=function(a,b,c,d,e,f){THREE.Geometry.call(this);this.type="RingGeometry";this.parameters={innerRadius:a,outerRadius:b,thetaSegments:c,phiSegments:d,thetaStart:e,thetaLength:f};this.fromBufferGeometry(new THREE.RingBufferGeometry(a,b,c,d,e,f))};
	THREE.RingGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.RingGeometry.prototype.constructor=THREE.RingGeometry;THREE.SphereGeometry=function(a,b,c,d,e,f,g){THREE.Geometry.call(this);this.type="SphereGeometry";this.parameters={radius:a,widthSegments:b,heightSegments:c,phiStart:d,phiLength:e,thetaStart:f,thetaLength:g};this.fromBufferGeometry(new THREE.SphereBufferGeometry(a,b,c,d,e,f,g))};THREE.SphereGeometry.prototype=Object.create(THREE.Geometry.prototype);
	THREE.SphereGeometry.prototype.constructor=THREE.SphereGeometry;
	THREE.SphereBufferGeometry=function(a,b,c,d,e,f,g){THREE.BufferGeometry.call(this);this.type="SphereBufferGeometry";this.parameters={radius:a,widthSegments:b,heightSegments:c,phiStart:d,phiLength:e,thetaStart:f,thetaLength:g};a=a||50;b=Math.max(3,Math.floor(b)||8);c=Math.max(2,Math.floor(c)||6);d=void 0!==d?d:0;e=void 0!==e?e:2*Math.PI;f=void 0!==f?f:0;g=void 0!==g?g:Math.PI;for(var h=f+g,k=(b+1)*(c+1),l=new THREE.BufferAttribute(new Float32Array(3*k),3),n=new THREE.BufferAttribute(new Float32Array(3*
	k),3),k=new THREE.BufferAttribute(new Float32Array(2*k),2),p=0,m=[],q=new THREE.Vector3,r=0;r<=c;r++){for(var s=[],u=r/c,x=0;x<=b;x++){var v=x/b,C=-a*Math.cos(d+v*e)*Math.sin(f+u*g),w=a*Math.cos(f+u*g),D=a*Math.sin(d+v*e)*Math.sin(f+u*g);q.set(C,w,D).normalize();l.setXYZ(p,C,w,D);n.setXYZ(p,q.x,q.y,q.z);k.setXY(p,v,1-u);s.push(p);p++}m.push(s)}d=[];for(r=0;r<c;r++)for(x=0;x<b;x++)e=m[r][x+1],g=m[r][x],p=m[r+1][x],q=m[r+1][x+1],(0!==r||0<f)&&d.push(e,g,q),(r!==c-1||h<Math.PI)&&d.push(g,p,q);this.setIndex(new (65535<
	l.count?THREE.Uint32Attribute:THREE.Uint16Attribute)(d,1));this.addAttribute("position",l);this.addAttribute("normal",n);this.addAttribute("uv",k);this.boundingSphere=new THREE.Sphere(new THREE.Vector3,a)};THREE.SphereBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.SphereBufferGeometry.prototype.constructor=THREE.SphereBufferGeometry;
	THREE.TextGeometry=function(a,b){b=b||{};var c=b.font;if(!1===c instanceof THREE.Font)return console.error("THREE.TextGeometry: font parameter is not an instance of THREE.Font."),new THREE.Geometry;c=c.generateShapes(a,b.size,b.curveSegments);b.amount=void 0!==b.height?b.height:50;void 0===b.bevelThickness&&(b.bevelThickness=10);void 0===b.bevelSize&&(b.bevelSize=8);void 0===b.bevelEnabled&&(b.bevelEnabled=!1);THREE.ExtrudeGeometry.call(this,c,b);this.type="TextGeometry"};
	THREE.TextGeometry.prototype=Object.create(THREE.ExtrudeGeometry.prototype);THREE.TextGeometry.prototype.constructor=THREE.TextGeometry;
	THREE.TorusBufferGeometry=function(a,b,c,d,e){THREE.BufferGeometry.call(this);this.type="TorusBufferGeometry";this.parameters={radius:a,tube:b,radialSegments:c,tubularSegments:d,arc:e};a=a||100;b=b||40;c=Math.floor(c)||8;d=Math.floor(d)||6;e=e||2*Math.PI;var f=(c+1)*(d+1),g=c*d*6,g=new (65535<g?Uint32Array:Uint16Array)(g),h=new Float32Array(3*f),k=new Float32Array(3*f),f=new Float32Array(2*f),l=0,n=0,p=0,m=new THREE.Vector3,q=new THREE.Vector3,r=new THREE.Vector3,s,u;for(s=0;s<=c;s++)for(u=0;u<=d;u++){var x=
	u/d*e,v=s/c*Math.PI*2;q.x=(a+b*Math.cos(v))*Math.cos(x);q.y=(a+b*Math.cos(v))*Math.sin(x);q.z=b*Math.sin(v);h[l]=q.x;h[l+1]=q.y;h[l+2]=q.z;m.x=a*Math.cos(x);m.y=a*Math.sin(x);r.subVectors(q,m).normalize();k[l]=r.x;k[l+1]=r.y;k[l+2]=r.z;f[n]=u/d;f[n+1]=s/c;l+=3;n+=2}for(s=1;s<=c;s++)for(u=1;u<=d;u++)a=(d+1)*(s-1)+u-1,b=(d+1)*(s-1)+u,e=(d+1)*s+u,g[p]=(d+1)*s+u-1,g[p+1]=a,g[p+2]=e,g[p+3]=a,g[p+4]=b,g[p+5]=e,p+=6;this.setIndex(new THREE.BufferAttribute(g,1));this.addAttribute("position",new THREE.BufferAttribute(h,
	3));this.addAttribute("normal",new THREE.BufferAttribute(k,3));this.addAttribute("uv",new THREE.BufferAttribute(f,2))};THREE.TorusBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.TorusBufferGeometry.prototype.constructor=THREE.TorusBufferGeometry;
	THREE.TorusGeometry=function(a,b,c,d,e){THREE.Geometry.call(this);this.type="TorusGeometry";this.parameters={radius:a,tube:b,radialSegments:c,tubularSegments:d,arc:e};this.fromBufferGeometry(new THREE.TorusBufferGeometry(a,b,c,d,e))};THREE.TorusGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.TorusGeometry.prototype.constructor=THREE.TorusGeometry;
	THREE.TorusKnotBufferGeometry=function(a,b,c,d,e,f){function g(a,b,c,d,e){var f=Math.cos(a),g=Math.sin(a);a*=c/b;b=Math.cos(a);e.x=d*(2+b)*.5*f;e.y=d*(2+b)*g*.5;e.z=d*Math.sin(a)*.5}THREE.BufferGeometry.call(this);this.type="TorusKnotBufferGeometry";this.parameters={radius:a,tube:b,tubularSegments:c,radialSegments:d,p:e,q:f};a=a||100;b=b||40;c=Math.floor(c)||64;d=Math.floor(d)||8;e=e||2;f=f||3;var h=(d+1)*(c+1),k=d*c*6,k=new THREE.BufferAttribute(new (65535<k?Uint32Array:Uint16Array)(k),1),l=new THREE.BufferAttribute(new Float32Array(3*
	h),3),n=new THREE.BufferAttribute(new Float32Array(3*h),3),h=new THREE.BufferAttribute(new Float32Array(2*h),2),p,m,q=0,r=0,s=new THREE.Vector3,u=new THREE.Vector3,x=new THREE.Vector2,v=new THREE.Vector3,C=new THREE.Vector3,w=new THREE.Vector3,D=new THREE.Vector3,A=new THREE.Vector3;for(p=0;p<=c;++p)for(m=p/c*e*Math.PI*2,g(m,e,f,a,v),g(m+.01,e,f,a,C),D.subVectors(C,v),A.addVectors(C,v),w.crossVectors(D,A),A.crossVectors(w,D),w.normalize(),A.normalize(),m=0;m<=d;++m){var y=m/d*Math.PI*2,B=-b*Math.cos(y),
	y=b*Math.sin(y);s.x=v.x+(B*A.x+y*w.x);s.y=v.y+(B*A.y+y*w.y);s.z=v.z+(B*A.z+y*w.z);l.setXYZ(q,s.x,s.y,s.z);u.subVectors(s,v).normalize();n.setXYZ(q,u.x,u.y,u.z);x.x=p/c;x.y=m/d;h.setXY(q,x.x,x.y);q++}for(m=1;m<=c;m++)for(p=1;p<=d;p++)a=(d+1)*m+(p-1),b=(d+1)*m+p,e=(d+1)*(m-1)+p,k.setX(r,(d+1)*(m-1)+(p-1)),r++,k.setX(r,a),r++,k.setX(r,e),r++,k.setX(r,a),r++,k.setX(r,b),r++,k.setX(r,e),r++;this.setIndex(k);this.addAttribute("position",l);this.addAttribute("normal",n);this.addAttribute("uv",h)};
	THREE.TorusKnotBufferGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);THREE.TorusKnotBufferGeometry.prototype.constructor=THREE.TorusKnotBufferGeometry;
	THREE.TorusKnotGeometry=function(a,b,c,d,e,f,g){THREE.Geometry.call(this);this.type="TorusKnotGeometry";this.parameters={radius:a,tube:b,tubularSegments:c,radialSegments:d,p:e,q:f};void 0!==g&&console.warn("THREE.TorusKnotGeometry: heightScale has been deprecated. Use .scale( x, y, z ) instead.");this.fromBufferGeometry(new THREE.TorusKnotBufferGeometry(a,b,c,d,e,f));this.mergeVertices()};THREE.TorusKnotGeometry.prototype=Object.create(THREE.Geometry.prototype);
	THREE.TorusKnotGeometry.prototype.constructor=THREE.TorusKnotGeometry;
	THREE.TubeGeometry=function(a,b,c,d,e,f){THREE.Geometry.call(this);this.type="TubeGeometry";this.parameters={path:a,segments:b,radius:c,radialSegments:d,closed:e,taper:f};b=b||64;c=c||1;d=d||8;e=e||!1;f=f||THREE.TubeGeometry.NoTaper;var g=[],h,k,l=b+1,n,p,m,q,r,s=new THREE.Vector3,u,x,v;u=new THREE.TubeGeometry.FrenetFrames(a,b,e);x=u.normals;v=u.binormals;this.tangents=u.tangents;this.normals=x;this.binormals=v;for(u=0;u<l;u++)for(g[u]=[],n=u/(l-1),r=a.getPointAt(n),h=x[u],k=v[u],m=c*f(n),n=0;n<
	d;n++)p=n/d*2*Math.PI,q=-m*Math.cos(p),p=m*Math.sin(p),s.copy(r),s.x+=q*h.x+p*k.x,s.y+=q*h.y+p*k.y,s.z+=q*h.z+p*k.z,g[u][n]=this.vertices.push(new THREE.Vector3(s.x,s.y,s.z))-1;for(u=0;u<b;u++)for(n=0;n<d;n++)f=e?(u+1)%b:u+1,l=(n+1)%d,a=g[u][n],c=g[f][n],f=g[f][l],l=g[u][l],s=new THREE.Vector2(u/b,n/d),x=new THREE.Vector2((u+1)/b,n/d),v=new THREE.Vector2((u+1)/b,(n+1)/d),h=new THREE.Vector2(u/b,(n+1)/d),this.faces.push(new THREE.Face3(a,c,l)),this.faceVertexUvs[0].push([s,x,h]),this.faces.push(new THREE.Face3(c,
	f,l)),this.faceVertexUvs[0].push([x.clone(),v,h.clone()]);this.computeFaceNormals();this.computeVertexNormals()};THREE.TubeGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.TubeGeometry.prototype.constructor=THREE.TubeGeometry;THREE.TubeGeometry.NoTaper=function(a){return 1};THREE.TubeGeometry.SinusoidalTaper=function(a){return Math.sin(Math.PI*a)};
	THREE.TubeGeometry.FrenetFrames=function(a,b,c){var d=new THREE.Vector3,e=[],f=[],g=[],h=new THREE.Vector3,k=new THREE.Matrix4;b+=1;var l,n,p;this.tangents=e;this.normals=f;this.binormals=g;for(l=0;l<b;l++)n=l/(b-1),e[l]=a.getTangentAt(n),e[l].normalize();f[0]=new THREE.Vector3;g[0]=new THREE.Vector3;a=Number.MAX_VALUE;l=Math.abs(e[0].x);n=Math.abs(e[0].y);p=Math.abs(e[0].z);l<=a&&(a=l,d.set(1,0,0));n<=a&&(a=n,d.set(0,1,0));p<=a&&d.set(0,0,1);h.crossVectors(e[0],d).normalize();f[0].crossVectors(e[0],
	h);g[0].crossVectors(e[0],f[0]);for(l=1;l<b;l++)f[l]=f[l-1].clone(),g[l]=g[l-1].clone(),h.crossVectors(e[l-1],e[l]),h.length()>Number.EPSILON&&(h.normalize(),d=Math.acos(THREE.Math.clamp(e[l-1].dot(e[l]),-1,1)),f[l].applyMatrix4(k.makeRotationAxis(h,d))),g[l].crossVectors(e[l],f[l]);if(c)for(d=Math.acos(THREE.Math.clamp(f[0].dot(f[b-1]),-1,1)),d/=b-1,0<e[0].dot(h.crossVectors(f[0],f[b-1]))&&(d=-d),l=1;l<b;l++)f[l].applyMatrix4(k.makeRotationAxis(e[l],d*l)),g[l].crossVectors(e[l],f[l])};
	THREE.PolyhedronGeometry=function(a,b,c,d){function e(a){var b=a.normalize().clone();b.index=k.vertices.push(b)-1;var c=Math.atan2(a.z,-a.x)/2/Math.PI+.5;a=Math.atan2(-a.y,Math.sqrt(a.x*a.x+a.z*a.z))/Math.PI+.5;b.uv=new THREE.Vector2(c,1-a);return b}function f(a,b,c,d){d=new THREE.Face3(a.index,b.index,c.index,[a.clone(),b.clone(),c.clone()],void 0,d);k.faces.push(d);u.copy(a).add(b).add(c).divideScalar(3);d=Math.atan2(u.z,-u.x);k.faceVertexUvs[0].push([h(a.uv,a,d),h(b.uv,b,d),h(c.uv,c,d)])}function g(a,
	b){for(var c=Math.pow(2,b),d=e(k.vertices[a.a]),g=e(k.vertices[a.b]),h=e(k.vertices[a.c]),l=[],m=a.materialIndex,n=0;n<=c;n++){l[n]=[];for(var p=e(d.clone().lerp(h,n/c)),q=e(g.clone().lerp(h,n/c)),r=c-n,s=0;s<=r;s++)l[n][s]=0===s&&n===c?p:e(p.clone().lerp(q,s/r))}for(n=0;n<c;n++)for(s=0;s<2*(c-n)-1;s++)d=Math.floor(s/2),0===s%2?f(l[n][d+1],l[n+1][d],l[n][d],m):f(l[n][d+1],l[n+1][d+1],l[n+1][d],m)}function h(a,b,c){0>c&&1===a.x&&(a=new THREE.Vector2(a.x-1,a.y));0===b.x&&0===b.z&&(a=new THREE.Vector2(c/
	2/Math.PI+.5,a.y));return a.clone()}THREE.Geometry.call(this);this.type="PolyhedronGeometry";this.parameters={vertices:a,indices:b,radius:c,detail:d};c=c||1;d=d||0;for(var k=this,l=0,n=a.length;l<n;l+=3)e(new THREE.Vector3(a[l],a[l+1],a[l+2]));a=this.vertices;for(var p=[],m=l=0,n=b.length;l<n;l+=3,m++){var q=a[b[l]],r=a[b[l+1]],s=a[b[l+2]];p[m]=new THREE.Face3(q.index,r.index,s.index,[q.clone(),r.clone(),s.clone()],void 0,m)}for(var u=new THREE.Vector3,l=0,n=p.length;l<n;l++)g(p[l],d);l=0;for(n=this.faceVertexUvs[0].length;l<
	n;l++)b=this.faceVertexUvs[0][l],d=b[0].x,a=b[1].x,p=b[2].x,m=Math.max(d,a,p),q=Math.min(d,a,p),.9<m&&.1>q&&(.2>d&&(b[0].x+=1),.2>a&&(b[1].x+=1),.2>p&&(b[2].x+=1));l=0;for(n=this.vertices.length;l<n;l++)this.vertices[l].multiplyScalar(c);this.mergeVertices();this.computeFaceNormals();this.boundingSphere=new THREE.Sphere(new THREE.Vector3,c)};THREE.PolyhedronGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.PolyhedronGeometry.prototype.constructor=THREE.PolyhedronGeometry;
	THREE.DodecahedronGeometry=function(a,b){var c=(1+Math.sqrt(5))/2,d=1/c;THREE.PolyhedronGeometry.call(this,[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-d,-c,0,-d,c,0,d,-c,0,d,c,-d,-c,0,-d,c,0,d,-c,0,d,c,0,-c,0,-d,c,0,-d,-c,0,d,c,0,d],[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,
	12,14,1,14,5,1,5,9],a,b);this.type="DodecahedronGeometry";this.parameters={radius:a,detail:b}};THREE.DodecahedronGeometry.prototype=Object.create(THREE.PolyhedronGeometry.prototype);THREE.DodecahedronGeometry.prototype.constructor=THREE.DodecahedronGeometry;
	THREE.IcosahedronGeometry=function(a,b){var c=(1+Math.sqrt(5))/2;THREE.PolyhedronGeometry.call(this,[-1,c,0,1,c,0,-1,-c,0,1,-c,0,0,-1,c,0,1,c,0,-1,-c,0,1,-c,c,0,-1,c,0,1,-c,0,-1,-c,0,1],[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],a,b);this.type="IcosahedronGeometry";this.parameters={radius:a,detail:b}};THREE.IcosahedronGeometry.prototype=Object.create(THREE.PolyhedronGeometry.prototype);
	THREE.IcosahedronGeometry.prototype.constructor=THREE.IcosahedronGeometry;THREE.OctahedronGeometry=function(a,b){THREE.PolyhedronGeometry.call(this,[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],a,b);this.type="OctahedronGeometry";this.parameters={radius:a,detail:b}};THREE.OctahedronGeometry.prototype=Object.create(THREE.PolyhedronGeometry.prototype);THREE.OctahedronGeometry.prototype.constructor=THREE.OctahedronGeometry;
	THREE.TetrahedronGeometry=function(a,b){THREE.PolyhedronGeometry.call(this,[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],a,b);this.type="TetrahedronGeometry";this.parameters={radius:a,detail:b}};THREE.TetrahedronGeometry.prototype=Object.create(THREE.PolyhedronGeometry.prototype);THREE.TetrahedronGeometry.prototype.constructor=THREE.TetrahedronGeometry;
	THREE.ParametricGeometry=function(a,b,c){THREE.Geometry.call(this);this.type="ParametricGeometry";this.parameters={func:a,slices:b,stacks:c};var d=this.vertices,e=this.faces,f=this.faceVertexUvs[0],g,h,k,l,n=b+1;for(g=0;g<=c;g++)for(l=g/c,h=0;h<=b;h++)k=h/b,k=a(k,l),d.push(k);var p,m,q,r;for(g=0;g<c;g++)for(h=0;h<b;h++)a=g*n+h,d=g*n+h+1,l=(g+1)*n+h+1,k=(g+1)*n+h,p=new THREE.Vector2(h/b,g/c),m=new THREE.Vector2((h+1)/b,g/c),q=new THREE.Vector2((h+1)/b,(g+1)/c),r=new THREE.Vector2(h/b,(g+1)/c),e.push(new THREE.Face3(a,
	d,k)),f.push([p,m,r]),e.push(new THREE.Face3(d,l,k)),f.push([m.clone(),q,r.clone()]);this.computeFaceNormals();this.computeVertexNormals()};THREE.ParametricGeometry.prototype=Object.create(THREE.Geometry.prototype);THREE.ParametricGeometry.prototype.constructor=THREE.ParametricGeometry;
	THREE.WireframeGeometry=function(a){function b(a,b){return a-b}THREE.BufferGeometry.call(this);var c=[0,0],d={},e=["a","b","c"];if(a instanceof THREE.Geometry){var f=a.vertices,g=a.faces,h=0,k=new Uint32Array(6*g.length);a=0;for(var l=g.length;a<l;a++)for(var n=g[a],p=0;3>p;p++){c[0]=n[e[p]];c[1]=n[e[(p+1)%3]];c.sort(b);var m=c.toString();void 0===d[m]&&(k[2*h]=c[0],k[2*h+1]=c[1],d[m]=!0,h++)}c=new Float32Array(6*h);a=0;for(l=h;a<l;a++)for(p=0;2>p;p++)d=f[k[2*a+p]],h=6*a+3*p,c[h+0]=d.x,c[h+1]=d.y,
	c[h+2]=d.z;this.addAttribute("position",new THREE.BufferAttribute(c,3))}else if(a instanceof THREE.BufferGeometry){if(null!==a.index){l=a.index.array;f=a.attributes.position;e=a.groups;h=0;0===e.length&&a.addGroup(0,l.length);k=new Uint32Array(2*l.length);g=0;for(n=e.length;g<n;++g){a=e[g];p=a.start;m=a.count;a=p;for(var q=p+m;a<q;a+=3)for(p=0;3>p;p++)c[0]=l[a+p],c[1]=l[a+(p+1)%3],c.sort(b),m=c.toString(),void 0===d[m]&&(k[2*h]=c[0],k[2*h+1]=c[1],d[m]=!0,h++)}c=new Float32Array(6*h);a=0;for(l=h;a<
	l;a++)for(p=0;2>p;p++)h=6*a+3*p,d=k[2*a+p],c[h+0]=f.getX(d),c[h+1]=f.getY(d),c[h+2]=f.getZ(d)}else for(f=a.attributes.position.array,h=f.length/3,k=h/3,c=new Float32Array(6*h),a=0,l=k;a<l;a++)for(p=0;3>p;p++)h=18*a+6*p,k=9*a+3*p,c[h+0]=f[k],c[h+1]=f[k+1],c[h+2]=f[k+2],d=9*a+(p+1)%3*3,c[h+3]=f[d],c[h+4]=f[d+1],c[h+5]=f[d+2];this.addAttribute("position",new THREE.BufferAttribute(c,3))}};THREE.WireframeGeometry.prototype=Object.create(THREE.BufferGeometry.prototype);
	THREE.WireframeGeometry.prototype.constructor=THREE.WireframeGeometry;THREE.AxisHelper=function(a){a=a||1;var b=new Float32Array([0,0,0,a,0,0,0,0,0,0,a,0,0,0,0,0,0,a]),c=new Float32Array([1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1]);a=new THREE.BufferGeometry;a.addAttribute("position",new THREE.BufferAttribute(b,3));a.addAttribute("color",new THREE.BufferAttribute(c,3));b=new THREE.LineBasicMaterial({vertexColors:THREE.VertexColors});THREE.LineSegments.call(this,a,b)};THREE.AxisHelper.prototype=Object.create(THREE.LineSegments.prototype);
	THREE.AxisHelper.prototype.constructor=THREE.AxisHelper;
	THREE.ArrowHelper=function(){var a=new THREE.BufferGeometry;a.addAttribute("position",new THREE.Float32Attribute([0,0,0,0,1,0],3));var b=new THREE.CylinderBufferGeometry(0,.5,1,5,1);b.translate(0,-.5,0);return function(c,d,e,f,g,h){THREE.Object3D.call(this);void 0===f&&(f=16776960);void 0===e&&(e=1);void 0===g&&(g=.2*e);void 0===h&&(h=.2*g);this.position.copy(d);this.line=new THREE.Line(a,new THREE.LineBasicMaterial({color:f}));this.line.matrixAutoUpdate=!1;this.add(this.line);this.cone=new THREE.Mesh(b,
	new THREE.MeshBasicMaterial({color:f}));this.cone.matrixAutoUpdate=!1;this.add(this.cone);this.setDirection(c);this.setLength(e,g,h)}}();THREE.ArrowHelper.prototype=Object.create(THREE.Object3D.prototype);THREE.ArrowHelper.prototype.constructor=THREE.ArrowHelper;
	THREE.ArrowHelper.prototype.setDirection=function(){var a=new THREE.Vector3,b;return function(c){.99999<c.y?this.quaternion.set(0,0,0,1):-.99999>c.y?this.quaternion.set(1,0,0,0):(a.set(c.z,0,-c.x).normalize(),b=Math.acos(c.y),this.quaternion.setFromAxisAngle(a,b))}}();THREE.ArrowHelper.prototype.setLength=function(a,b,c){void 0===b&&(b=.2*a);void 0===c&&(c=.2*b);this.line.scale.set(1,Math.max(0,a-b),1);this.line.updateMatrix();this.cone.scale.set(c,b,c);this.cone.position.y=a;this.cone.updateMatrix()};
	THREE.ArrowHelper.prototype.setColor=function(a){this.line.material.color.copy(a);this.cone.material.color.copy(a)};THREE.BoxHelper=function(a){var b=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),c=new Float32Array(24),d=new THREE.BufferGeometry;d.setIndex(new THREE.BufferAttribute(b,1));d.addAttribute("position",new THREE.BufferAttribute(c,3));THREE.LineSegments.call(this,d,new THREE.LineBasicMaterial({color:16776960}));void 0!==a&&this.update(a)};THREE.BoxHelper.prototype=Object.create(THREE.LineSegments.prototype);
	THREE.BoxHelper.prototype.constructor=THREE.BoxHelper;
	THREE.BoxHelper.prototype.update=function(){var a=new THREE.Box3;return function(b){b instanceof THREE.Box3?a.copy(b):a.setFromObject(b);if(!a.isEmpty()){b=a.min;var c=a.max,d=this.geometry.attributes.position,e=d.array;e[0]=c.x;e[1]=c.y;e[2]=c.z;e[3]=b.x;e[4]=c.y;e[5]=c.z;e[6]=b.x;e[7]=b.y;e[8]=c.z;e[9]=c.x;e[10]=b.y;e[11]=c.z;e[12]=c.x;e[13]=c.y;e[14]=b.z;e[15]=b.x;e[16]=c.y;e[17]=b.z;e[18]=b.x;e[19]=b.y;e[20]=b.z;e[21]=c.x;e[22]=b.y;e[23]=b.z;d.needsUpdate=!0;this.geometry.computeBoundingSphere()}}}();
	THREE.BoundingBoxHelper=function(a,b){var c=void 0!==b?b:8947848;this.object=a;this.box=new THREE.Box3;THREE.Mesh.call(this,new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:c,wireframe:!0}))};THREE.BoundingBoxHelper.prototype=Object.create(THREE.Mesh.prototype);THREE.BoundingBoxHelper.prototype.constructor=THREE.BoundingBoxHelper;THREE.BoundingBoxHelper.prototype.update=function(){this.box.setFromObject(this.object);this.box.size(this.scale);this.box.center(this.position)};
	THREE.CameraHelper=function(a){function b(a,b,d){c(a,d);c(b,d)}function c(a,b){d.vertices.push(new THREE.Vector3);d.colors.push(new THREE.Color(b));void 0===f[a]&&(f[a]=[]);f[a].push(d.vertices.length-1)}var d=new THREE.Geometry,e=new THREE.LineBasicMaterial({color:16777215,vertexColors:THREE.FaceColors}),f={};b("n1","n2",16755200);b("n2","n4",16755200);b("n4","n3",16755200);b("n3","n1",16755200);b("f1","f2",16755200);b("f2","f4",16755200);b("f4","f3",16755200);b("f3","f1",16755200);b("n1","f1",16755200);
	b("n2","f2",16755200);b("n3","f3",16755200);b("n4","f4",16755200);b("p","n1",16711680);b("p","n2",16711680);b("p","n3",16711680);b("p","n4",16711680);b("u1","u2",43775);b("u2","u3",43775);b("u3","u1",43775);b("c","t",16777215);b("p","c",3355443);b("cn1","cn2",3355443);b("cn3","cn4",3355443);b("cf1","cf2",3355443);b("cf3","cf4",3355443);THREE.LineSegments.call(this,d,e);this.camera=a;this.camera.updateProjectionMatrix();this.matrix=a.matrixWorld;this.matrixAutoUpdate=!1;this.pointMap=f;this.update()};
	THREE.CameraHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.CameraHelper.prototype.constructor=THREE.CameraHelper;
	THREE.CameraHelper.prototype.update=function(){function a(a,g,h,k){d.set(g,h,k).unproject(e);a=c[a];if(void 0!==a)for(g=0,h=a.length;g<h;g++)b.vertices[a[g]].copy(d)}var b,c,d=new THREE.Vector3,e=new THREE.Camera;return function(){b=this.geometry;c=this.pointMap;e.projectionMatrix.copy(this.camera.projectionMatrix);a("c",0,0,-1);a("t",0,0,1);a("n1",-1,-1,-1);a("n2",1,-1,-1);a("n3",-1,1,-1);a("n4",1,1,-1);a("f1",-1,-1,1);a("f2",1,-1,1);a("f3",-1,1,1);a("f4",1,1,1);a("u1",.7,1.1,-1);a("u2",-.7,1.1,
	-1);a("u3",0,2,-1);a("cf1",-1,0,1);a("cf2",1,0,1);a("cf3",0,-1,1);a("cf4",0,1,1);a("cn1",-1,0,-1);a("cn2",1,0,-1);a("cn3",0,-1,-1);a("cn4",0,1,-1);b.verticesNeedUpdate=!0}}();
	THREE.DirectionalLightHelper=function(a,b){THREE.Object3D.call(this);this.light=a;this.light.updateMatrixWorld();this.matrix=a.matrixWorld;this.matrixAutoUpdate=!1;void 0===b&&(b=1);var c=new THREE.BufferGeometry;c.addAttribute("position",new THREE.Float32Attribute([-b,b,0,b,b,0,b,-b,0,-b,-b,0,-b,b,0],3));var d=new THREE.LineBasicMaterial({fog:!1});this.add(new THREE.Line(c,d));c=new THREE.BufferGeometry;c.addAttribute("position",new THREE.Float32Attribute([0,0,0,0,0,1],3));this.add(new THREE.Line(c,
	d));this.update()};THREE.DirectionalLightHelper.prototype=Object.create(THREE.Object3D.prototype);THREE.DirectionalLightHelper.prototype.constructor=THREE.DirectionalLightHelper;THREE.DirectionalLightHelper.prototype.dispose=function(){var a=this.children[0],b=this.children[1];a.geometry.dispose();a.material.dispose();b.geometry.dispose();b.material.dispose()};
	THREE.DirectionalLightHelper.prototype.update=function(){var a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Vector3;return function(){a.setFromMatrixPosition(this.light.matrixWorld);b.setFromMatrixPosition(this.light.target.matrixWorld);c.subVectors(b,a);var d=this.children[0],e=this.children[1];d.lookAt(c);d.material.color.copy(this.light.color).multiplyScalar(this.light.intensity);e.lookAt(c);e.scale.z=c.length()}}();
	THREE.EdgesHelper=function(a,b,c){b=void 0!==b?b:16777215;THREE.LineSegments.call(this,new THREE.EdgesGeometry(a.geometry,c),new THREE.LineBasicMaterial({color:b}));this.matrix=a.matrixWorld;this.matrixAutoUpdate=!1};THREE.EdgesHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.EdgesHelper.prototype.constructor=THREE.EdgesHelper;
	THREE.FaceNormalsHelper=function(a,b,c,d){this.object=a;this.size=void 0!==b?b:1;a=void 0!==c?c:16776960;d=void 0!==d?d:1;b=0;c=this.object.geometry;c instanceof THREE.Geometry?b=c.faces.length:console.warn("THREE.FaceNormalsHelper: only THREE.Geometry is supported. Use THREE.VertexNormalsHelper, instead.");c=new THREE.BufferGeometry;b=new THREE.Float32Attribute(6*b,3);c.addAttribute("position",b);THREE.LineSegments.call(this,c,new THREE.LineBasicMaterial({color:a,linewidth:d}));this.matrixAutoUpdate=
	!1;this.update()};THREE.FaceNormalsHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.FaceNormalsHelper.prototype.constructor=THREE.FaceNormalsHelper;
	THREE.FaceNormalsHelper.prototype.update=function(){var a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Matrix3;return function(){this.object.updateMatrixWorld(!0);c.getNormalMatrix(this.object.matrixWorld);for(var d=this.object.matrixWorld,e=this.geometry.attributes.position,f=this.object.geometry,g=f.vertices,f=f.faces,h=0,k=0,l=f.length;k<l;k++){var n=f[k],p=n.normal;a.copy(g[n.a]).add(g[n.b]).add(g[n.c]).divideScalar(3).applyMatrix4(d);b.copy(p).applyMatrix3(c).normalize().multiplyScalar(this.size).add(a);
	e.setXYZ(h,a.x,a.y,a.z);h+=1;e.setXYZ(h,b.x,b.y,b.z);h+=1}e.needsUpdate=!0;return this}}();
	THREE.GridHelper=function(a,b,c,d){c=new THREE.Color(void 0!==c?c:4473924);d=new THREE.Color(void 0!==d?d:8947848);for(var e=[],f=[],g=-a,h=0;g<=a;g+=b){e.push(-a,0,g,a,0,g);e.push(g,0,-a,g,0,a);var k=0===g?c:d;k.toArray(f,h);h+=3;k.toArray(f,h);h+=3;k.toArray(f,h);h+=3;k.toArray(f,h);h+=3}a=new THREE.BufferGeometry;a.addAttribute("position",new THREE.Float32Attribute(e,3));a.addAttribute("color",new THREE.Float32Attribute(f,3));e=new THREE.LineBasicMaterial({vertexColors:THREE.VertexColors});THREE.LineSegments.call(this,
	a,e)};THREE.GridHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.GridHelper.prototype.constructor=THREE.GridHelper;THREE.GridHelper.prototype.setColors=function(){console.error("THREE.GridHelper: setColors() has been deprecated, pass them in the constructor instead.")};
	THREE.HemisphereLightHelper=function(a,b){THREE.Object3D.call(this);this.light=a;this.light.updateMatrixWorld();this.matrix=a.matrixWorld;this.matrixAutoUpdate=!1;this.colors=[new THREE.Color,new THREE.Color];var c=new THREE.SphereGeometry(b,4,2);c.rotateX(-Math.PI/2);for(var d=0;8>d;d++)c.faces[d].color=this.colors[4>d?0:1];d=new THREE.MeshBasicMaterial({vertexColors:THREE.FaceColors,wireframe:!0});this.lightSphere=new THREE.Mesh(c,d);this.add(this.lightSphere);this.update()};
	THREE.HemisphereLightHelper.prototype=Object.create(THREE.Object3D.prototype);THREE.HemisphereLightHelper.prototype.constructor=THREE.HemisphereLightHelper;THREE.HemisphereLightHelper.prototype.dispose=function(){this.lightSphere.geometry.dispose();this.lightSphere.material.dispose()};
	THREE.HemisphereLightHelper.prototype.update=function(){var a=new THREE.Vector3;return function(){this.colors[0].copy(this.light.color).multiplyScalar(this.light.intensity);this.colors[1].copy(this.light.groundColor).multiplyScalar(this.light.intensity);this.lightSphere.lookAt(a.setFromMatrixPosition(this.light.matrixWorld).negate());this.lightSphere.geometry.colorsNeedUpdate=!0}}();
	THREE.PointLightHelper=function(a,b){this.light=a;this.light.updateMatrixWorld();var c=new THREE.SphereBufferGeometry(b,4,2),d=new THREE.MeshBasicMaterial({wireframe:!0,fog:!1});d.color.copy(this.light.color).multiplyScalar(this.light.intensity);THREE.Mesh.call(this,c,d);this.matrix=this.light.matrixWorld;this.matrixAutoUpdate=!1};THREE.PointLightHelper.prototype=Object.create(THREE.Mesh.prototype);THREE.PointLightHelper.prototype.constructor=THREE.PointLightHelper;
	THREE.PointLightHelper.prototype.dispose=function(){this.geometry.dispose();this.material.dispose()};THREE.PointLightHelper.prototype.update=function(){this.material.color.copy(this.light.color).multiplyScalar(this.light.intensity)};
	THREE.SkeletonHelper=function(a){this.bones=this.getBoneList(a);for(var b=new THREE.Geometry,c=0;c<this.bones.length;c++)this.bones[c].parent instanceof THREE.Bone&&(b.vertices.push(new THREE.Vector3),b.vertices.push(new THREE.Vector3),b.colors.push(new THREE.Color(0,0,1)),b.colors.push(new THREE.Color(0,1,0)));b.dynamic=!0;c=new THREE.LineBasicMaterial({vertexColors:THREE.VertexColors,depthTest:!1,depthWrite:!1,transparent:!0});THREE.LineSegments.call(this,b,c);this.root=a;this.matrix=a.matrixWorld;
	this.matrixAutoUpdate=!1;this.update()};THREE.SkeletonHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.SkeletonHelper.prototype.constructor=THREE.SkeletonHelper;THREE.SkeletonHelper.prototype.getBoneList=function(a){var b=[];a instanceof THREE.Bone&&b.push(a);for(var c=0;c<a.children.length;c++)b.push.apply(b,this.getBoneList(a.children[c]));return b};
	THREE.SkeletonHelper.prototype.update=function(){for(var a=this.geometry,b=(new THREE.Matrix4).getInverse(this.root.matrixWorld),c=new THREE.Matrix4,d=0,e=0;e<this.bones.length;e++){var f=this.bones[e];f.parent instanceof THREE.Bone&&(c.multiplyMatrices(b,f.matrixWorld),a.vertices[d].setFromMatrixPosition(c),c.multiplyMatrices(b,f.parent.matrixWorld),a.vertices[d+1].setFromMatrixPosition(c),d+=2)}a.verticesNeedUpdate=!0;a.computeBoundingSphere()};
	THREE.SpotLightHelper=function(a){THREE.Object3D.call(this);this.light=a;this.light.updateMatrixWorld();this.matrix=a.matrixWorld;this.matrixAutoUpdate=!1;a=new THREE.BufferGeometry;for(var b=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1],c=0,d=1;32>c;c++,d++){var e=c/32*Math.PI*2,f=d/32*Math.PI*2;b.push(Math.cos(e),Math.sin(e),1,Math.cos(f),Math.sin(f),1)}a.addAttribute("position",new THREE.Float32Attribute(b,3));b=new THREE.LineBasicMaterial({fog:!1});this.cone=new THREE.LineSegments(a,
	b);this.add(this.cone);this.update()};THREE.SpotLightHelper.prototype=Object.create(THREE.Object3D.prototype);THREE.SpotLightHelper.prototype.constructor=THREE.SpotLightHelper;THREE.SpotLightHelper.prototype.dispose=function(){this.cone.geometry.dispose();this.cone.material.dispose()};
	THREE.SpotLightHelper.prototype.update=function(){var a=new THREE.Vector3,b=new THREE.Vector3;return function(){var c=this.light.distance?this.light.distance:1E3,d=c*Math.tan(this.light.angle);this.cone.scale.set(d,d,c);a.setFromMatrixPosition(this.light.matrixWorld);b.setFromMatrixPosition(this.light.target.matrixWorld);this.cone.lookAt(b.sub(a));this.cone.material.color.copy(this.light.color).multiplyScalar(this.light.intensity)}}();
	THREE.VertexNormalsHelper=function(a,b,c,d){this.object=a;this.size=void 0!==b?b:1;a=void 0!==c?c:16711680;d=void 0!==d?d:1;b=0;c=this.object.geometry;c instanceof THREE.Geometry?b=3*c.faces.length:c instanceof THREE.BufferGeometry&&(b=c.attributes.normal.count);c=new THREE.BufferGeometry;b=new THREE.Float32Attribute(6*b,3);c.addAttribute("position",b);THREE.LineSegments.call(this,c,new THREE.LineBasicMaterial({color:a,linewidth:d}));this.matrixAutoUpdate=!1;this.update()};
	THREE.VertexNormalsHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.VertexNormalsHelper.prototype.constructor=THREE.VertexNormalsHelper;
	THREE.VertexNormalsHelper.prototype.update=function(){var a=new THREE.Vector3,b=new THREE.Vector3,c=new THREE.Matrix3;return function(){var d=["a","b","c"];this.object.updateMatrixWorld(!0);c.getNormalMatrix(this.object.matrixWorld);var e=this.object.matrixWorld,f=this.geometry.attributes.position,g=this.object.geometry;if(g instanceof THREE.Geometry)for(var h=g.vertices,k=g.faces,l=g=0,n=k.length;l<n;l++)for(var p=k[l],m=0,q=p.vertexNormals.length;m<q;m++){var r=p.vertexNormals[m];a.copy(h[p[d[m]]]).applyMatrix4(e);
	b.copy(r).applyMatrix3(c).normalize().multiplyScalar(this.size).add(a);f.setXYZ(g,a.x,a.y,a.z);g+=1;f.setXYZ(g,b.x,b.y,b.z);g+=1}else if(g instanceof THREE.BufferGeometry)for(d=g.attributes.position,h=g.attributes.normal,m=g=0,q=d.count;m<q;m++)a.set(d.getX(m),d.getY(m),d.getZ(m)).applyMatrix4(e),b.set(h.getX(m),h.getY(m),h.getZ(m)),b.applyMatrix3(c).normalize().multiplyScalar(this.size).add(a),f.setXYZ(g,a.x,a.y,a.z),g+=1,f.setXYZ(g,b.x,b.y,b.z),g+=1;f.needsUpdate=!0;return this}}();
	THREE.WireframeHelper=function(a,b){var c=void 0!==b?b:16777215;THREE.LineSegments.call(this,new THREE.WireframeGeometry(a.geometry),new THREE.LineBasicMaterial({color:c}));this.matrix=a.matrixWorld;this.matrixAutoUpdate=!1};THREE.WireframeHelper.prototype=Object.create(THREE.LineSegments.prototype);THREE.WireframeHelper.prototype.constructor=THREE.WireframeHelper;THREE.ImmediateRenderObject=function(a){THREE.Object3D.call(this);this.material=a;this.render=function(a){}};
	THREE.ImmediateRenderObject.prototype=Object.create(THREE.Object3D.prototype);THREE.ImmediateRenderObject.prototype.constructor=THREE.ImmediateRenderObject;THREE.MorphBlendMesh=function(a,b){THREE.Mesh.call(this,a,b);this.animationsMap={};this.animationsList=[];var c=this.geometry.morphTargets.length;this.createAnimation("__default",0,c-1,c/1);this.setAnimationWeight("__default",1)};THREE.MorphBlendMesh.prototype=Object.create(THREE.Mesh.prototype);THREE.MorphBlendMesh.prototype.constructor=THREE.MorphBlendMesh;
	THREE.MorphBlendMesh.prototype.createAnimation=function(a,b,c,d){b={start:b,end:c,length:c-b+1,fps:d,duration:(c-b)/d,lastFrame:0,currentFrame:0,active:!1,time:0,direction:1,weight:1,directionBackwards:!1,mirroredLoop:!1};this.animationsMap[a]=b;this.animationsList.push(b)};
	THREE.MorphBlendMesh.prototype.autoCreateAnimations=function(a){for(var b=/([a-z]+)_?(\d+)/i,c,d={},e=this.geometry,f=0,g=e.morphTargets.length;f<g;f++){var h=e.morphTargets[f].name.match(b);if(h&&1<h.length){var k=h[1];d[k]||(d[k]={start:Infinity,end:-Infinity});h=d[k];f<h.start&&(h.start=f);f>h.end&&(h.end=f);c||(c=k)}}for(k in d)h=d[k],this.createAnimation(k,h.start,h.end,a);this.firstAnimation=c};
	THREE.MorphBlendMesh.prototype.setAnimationDirectionForward=function(a){if(a=this.animationsMap[a])a.direction=1,a.directionBackwards=!1};THREE.MorphBlendMesh.prototype.setAnimationDirectionBackward=function(a){if(a=this.animationsMap[a])a.direction=-1,a.directionBackwards=!0};THREE.MorphBlendMesh.prototype.setAnimationFPS=function(a,b){var c=this.animationsMap[a];c&&(c.fps=b,c.duration=(c.end-c.start)/c.fps)};
	THREE.MorphBlendMesh.prototype.setAnimationDuration=function(a,b){var c=this.animationsMap[a];c&&(c.duration=b,c.fps=(c.end-c.start)/c.duration)};THREE.MorphBlendMesh.prototype.setAnimationWeight=function(a,b){var c=this.animationsMap[a];c&&(c.weight=b)};THREE.MorphBlendMesh.prototype.setAnimationTime=function(a,b){var c=this.animationsMap[a];c&&(c.time=b)};THREE.MorphBlendMesh.prototype.getAnimationTime=function(a){var b=0;if(a=this.animationsMap[a])b=a.time;return b};
	THREE.MorphBlendMesh.prototype.getAnimationDuration=function(a){var b=-1;if(a=this.animationsMap[a])b=a.duration;return b};THREE.MorphBlendMesh.prototype.playAnimation=function(a){var b=this.animationsMap[a];b?(b.time=0,b.active=!0):console.warn("THREE.MorphBlendMesh: animation["+a+"] undefined in .playAnimation()")};THREE.MorphBlendMesh.prototype.stopAnimation=function(a){if(a=this.animationsMap[a])a.active=!1};
	THREE.MorphBlendMesh.prototype.update=function(a){for(var b=0,c=this.animationsList.length;b<c;b++){var d=this.animationsList[b];if(d.active){var e=d.duration/d.length;d.time+=d.direction*a;if(d.mirroredLoop){if(d.time>d.duration||0>d.time)d.direction*=-1,d.time>d.duration&&(d.time=d.duration,d.directionBackwards=!0),0>d.time&&(d.time=0,d.directionBackwards=!1)}else d.time%=d.duration,0>d.time&&(d.time+=d.duration);var f=d.start+THREE.Math.clamp(Math.floor(d.time/e),0,d.length-1),g=d.weight;f!==d.currentFrame&&
	(this.morphTargetInfluences[d.lastFrame]=0,this.morphTargetInfluences[d.currentFrame]=1*g,this.morphTargetInfluences[f]=0,d.lastFrame=d.currentFrame,d.currentFrame=f);e=d.time%e/e;d.directionBackwards&&(e=1-e);d.currentFrame!==d.lastFrame?(this.morphTargetInfluences[d.currentFrame]=e*g,this.morphTargetInfluences[d.lastFrame]=(1-e)*g):this.morphTargetInfluences[d.currentFrame]=g}}};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @author qiao / https://github.com/qiao
	 * @author mrdoob / http://mrdoob.com
	 * @author alteredq / http://alteredqualia.com/
	 * @author WestLangley / http://github.com/WestLangley
	 * @author erich666 / http://erichaines.com
	 */
	/*global THREE, console */

	// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
	// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
	// supported.
	//
	//    Orbit - left mouse / touch: one finger move
	//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
	//    Pan - right mouse, or arrow keys / touch: three finter swipe

	var THREE = __webpack_require__(5)

	function OrbitControls (object, domElement) {
	  this.object = object
	  this.domElement = (domElement !== undefined) ? domElement : document

	  // API

	  // Set to false to disable this control
	  this.enabled = true

	  // "target" sets the location of focus, where the control orbits around
	  // and where it pans with respect to.
	  this.target = new THREE.Vector3()

	  // center is old, deprecated; use "target" instead
	  this.center = this.target

	  // This option actually enables dollying in and out; left as "zoom" for
	  // backwards compatibility
	  this.noZoom = false
	  this.zoomSpeed = 1.0

	  // Limits to how far you can dolly in and out ( PerspectiveCamera only )
	  this.minDistance = 0
	  this.maxDistance = Infinity

	  // Limits to how far you can zoom in and out ( OrthographicCamera only )
	  this.minZoom = 0
	  this.maxZoom = Infinity

	  // Set to true to disable this control
	  this.noRotate = false
	  this.rotateSpeed = 1.0

	  // Set to true to disable this control
	  this.noPan = false
	  this.keyPanSpeed = 7.0 // pixels moved per arrow key push

	  // Set to true to automatically rotate around the target
	  this.autoRotate = false
	  this.autoRotateSpeed = 2.0 // 30 seconds per round when fps is 60

	  // How far you can orbit vertically, upper and lower limits.
	  // Range is 0 to Math.PI radians.
	  this.minPolarAngle = 0 // radians
	  this.maxPolarAngle = Math.PI // radians

	  // How far you can orbit horizontally, upper and lower limits.
	  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	  this.minAzimuthAngle = - Infinity // radians
	  this.maxAzimuthAngle = Infinity // radians

	  // Set to true to disable use of the keys
	  this.noKeys = false

	  // The four arrow keys
	  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 }

	  // Mouse buttons
	  this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT }

	  // //////////
	  // internals

	  var scope = this

	  var EPS = 0.000001

	  var rotateStart = new THREE.Vector2()
	  var rotateEnd = new THREE.Vector2()
	  var rotateDelta = new THREE.Vector2()

	  var panStart = new THREE.Vector2()
	  var panEnd = new THREE.Vector2()
	  var panDelta = new THREE.Vector2()
	  var panOffset = new THREE.Vector3()

	  var offset = new THREE.Vector3()

	  var dollyStart = new THREE.Vector2()
	  var dollyEnd = new THREE.Vector2()
	  var dollyDelta = new THREE.Vector2()

	  var theta
	  var phi
	  var phiDelta = 0
	  var thetaDelta = 0
	  var scale = 1
	  var pan = new THREE.Vector3()

	  var lastPosition = new THREE.Vector3()
	  var lastQuaternion = new THREE.Quaternion()

	  var STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 }

	  var state = STATE.NONE

	  // for reset

	  this.target0 = this.target.clone()
	  this.position0 = this.object.position.clone()
	  this.zoom0 = this.object.zoom

	  // so camera.up is the orbit axis

	  var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0))
	  var quatInverse = quat.clone().inverse()

	  // events

	  var changeEvent = { type: 'change' }
	  var startEvent = { type: 'start' }
	  var endEvent = { type: 'end' }

	  this.rotateLeft = function (angle) {
	    if (angle === undefined) {
	      angle = getAutoRotationAngle()
	    }

	    thetaDelta -= angle
	  }

	  this.rotateUp = function (angle) {
	    if (angle === undefined) {
	      angle = getAutoRotationAngle()
	    }

	    phiDelta -= angle
	  }

	  // pass in distance in world space to move left
	  this.panLeft = function (distance) {
	    var te = this.object.matrix.elements

	    // get X column of matrix
	    panOffset.set(te[ 0 ], te[ 1 ], te[ 2 ])
	    panOffset.multiplyScalar(- distance)

	    pan.add(panOffset)
	  }

	  // pass in distance in world space to move up
	  this.panUp = function (distance) {
	    var te = this.object.matrix.elements

	    // get Y column of matrix
	    panOffset.set(te[ 4 ], te[ 5 ], te[ 6 ])
	    panOffset.multiplyScalar(distance)

	    pan.add(panOffset)
	  }

	  // pass in x,y of change desired in pixel space,
	  // right and down are positive
	  this.pan = function (deltaX, deltaY) {
	    var element = scope.domElement === document ? scope.domElement.body : scope.domElement

	    if (scope.object instanceof THREE.PerspectiveCamera) {

	      // perspective
	      var position = scope.object.position
	      var offset = position.clone().sub(scope.target)
	      var targetDistance = offset.length()

	      // half of the fov is center to top of screen
	      targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0)

	      // we actually don't use screenWidth, since perspective camera is fixed to screen height
	      scope.panLeft(2 * deltaX * targetDistance / element.clientHeight)
	      scope.panUp(2 * deltaY * targetDistance / element.clientHeight)
	    } else if (scope.object instanceof THREE.OrthographicCamera) {

	      // orthographic
	      scope.panLeft(deltaX * (scope.object.right - scope.object.left) / element.clientWidth)
	      scope.panUp(deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight)
	    } else {

	      // camera neither orthographic or perspective
	      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.')
	    }
	  }

	  this.dollyIn = function (dollyScale) {
	    if (dollyScale === undefined) {
	      dollyScale = getZoomScale()
	    }

	    if (scope.object instanceof THREE.PerspectiveCamera) {
	      scale /= dollyScale
	    } else if (scope.object instanceof THREE.OrthographicCamera) {
	      scope.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale))
	      scope.object.updateProjectionMatrix()
	      scope.dispatchEvent(changeEvent)
	    } else {
	      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
	    }
	  }

	  this.dollyOut = function (dollyScale) {
	    if (dollyScale === undefined) {
	      dollyScale = getZoomScale()
	    }

	    if (scope.object instanceof THREE.PerspectiveCamera) {
	      scale *= dollyScale
	    } else if (scope.object instanceof THREE.OrthographicCamera) {
	      scope.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale))
	      scope.object.updateProjectionMatrix()
	      scope.dispatchEvent(changeEvent)
	    } else {
	      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
	    }
	  }

	  this.update = function () {
	    var position = this.object.position

	    offset.copy(position).sub(this.target)

	    // rotate offset to "y-axis-is-up" space
	    offset.applyQuaternion(quat)

	    // angle from z-axis around y-axis

	    theta = Math.atan2(offset.x, offset.z)

	    // angle from y-axis

	    phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y)

	    if (this.autoRotate && state === STATE.NONE) {
	      this.rotateLeft(getAutoRotationAngle())
	    }

	    theta += thetaDelta
	    phi += phiDelta

	    // restrict theta to be between desired limits
	    theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta))

	    // restrict phi to be between desired limits
	    phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi))

	    // restrict phi to be betwee EPS and PI-EPS
	    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi))

	    var radius = offset.length() * scale

	    // restrict radius to be between desired limits
	    radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius))

	    // move target to panned location
	    this.target.add(pan)

	    offset.x = radius * Math.sin(phi) * Math.sin(theta)
	    offset.y = radius * Math.cos(phi)
	    offset.z = radius * Math.sin(phi) * Math.cos(theta)

	    // rotate offset back to "camera-up-vector-is-up" space
	    offset.applyQuaternion(quatInverse)

	    position.copy(this.target).add(offset)

	    this.object.lookAt(this.target)

	    thetaDelta = 0
	    phiDelta = 0
	    scale = 1
	    pan.set(0, 0, 0)

	    // update condition is:
	    // min(camera displacement, camera rotation in radians)^2 > EPS
	    // using small-angle approximation cos(x/2) = 1 - x^2 / 8

	    if (lastPosition.distanceToSquared(this.object.position) > EPS
	      || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS) {
	      this.dispatchEvent(changeEvent)

	      lastPosition.copy(this.object.position)
	      lastQuaternion.copy(this.object.quaternion)
	    }
	  }

	  this.reset = function () {
	    state = STATE.NONE

	    this.target.copy(this.target0)
	    this.object.position.copy(this.position0)
	    this.object.zoom = this.zoom0

	    this.object.updateProjectionMatrix()
	    this.dispatchEvent(changeEvent)

	    this.update()
	  }

	  this.getPolarAngle = function () {
	    return phi
	  }

	  this.getAzimuthalAngle = function () {
	    return theta
	  }

	  function getAutoRotationAngle () {
	    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed
	  }

	  function getZoomScale () {
	    return Math.pow(0.95, scope.zoomSpeed)
	  }

	  function onMouseDown (event) {
	    if (scope.enabled === false) return
	    event.preventDefault()

	    if (event.button === scope.mouseButtons.ORBIT) {
	      if (scope.noRotate === true) return

	      state = STATE.ROTATE

	      rotateStart.set(event.clientX, event.clientY)
	    } else if (event.button === scope.mouseButtons.ZOOM) {
	      if (scope.noZoom === true) return

	      state = STATE.DOLLY

	      dollyStart.set(event.clientX, event.clientY)
	    } else if (event.button === scope.mouseButtons.PAN) {
	      if (scope.noPan === true) return

	      state = STATE.PAN

	      panStart.set(event.clientX, event.clientY)
	    }

	    if (state !== STATE.NONE) {
	      document.addEventListener('mousemove', onMouseMove, false)
	      document.addEventListener('mouseup', onMouseUp, false)
	      scope.dispatchEvent(startEvent)
	    }
	  }

	  function onMouseMove (event) {
	    if (scope.enabled === false) return

	    event.preventDefault()

	    var element = scope.domElement === document ? scope.domElement.body : scope.domElement

	    if (state === STATE.ROTATE) {
	      if (scope.noRotate === true) return

	      rotateEnd.set(event.clientX, event.clientY)
	      rotateDelta.subVectors(rotateEnd, rotateStart)

	      // rotating across whole screen goes 360 degrees around
	      scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed)

	      // rotating up and down along whole screen attempts to go 360, but limited to 180
	      scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed)

	      rotateStart.copy(rotateEnd)
	    } else if (state === STATE.DOLLY) {
	      if (scope.noZoom === true) return

	      dollyEnd.set(event.clientX, event.clientY)
	      dollyDelta.subVectors(dollyEnd, dollyStart)

	      if (dollyDelta.y > 0) {
	        scope.dollyIn()
	      } else if (dollyDelta.y < 0) {
	        scope.dollyOut()
	      }

	      dollyStart.copy(dollyEnd)
	    } else if (state === STATE.PAN) {
	      if (scope.noPan === true) return

	      panEnd.set(event.clientX, event.clientY)
	      panDelta.subVectors(panEnd, panStart)

	      scope.pan(panDelta.x, panDelta.y)

	      panStart.copy(panEnd)
	    }

	    if (state !== STATE.NONE) scope.update()
	  }

	  function onMouseUp ( /* event */ ) {
	    if (scope.enabled === false) return

	    document.removeEventListener('mousemove', onMouseMove, false)
	    document.removeEventListener('mouseup', onMouseUp, false)
	    scope.dispatchEvent(endEvent)
	    state = STATE.NONE
	  }

	  function onMouseWheel (event) {
	    if (scope.enabled === false || scope.noZoom === true || state !== STATE.NONE) return

	    event.preventDefault()
	    event.stopPropagation()

	    var delta = 0

	    if (event.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9

	      delta = event.wheelDelta
	    } else if (event.detail !== undefined) { // Firefox

	      delta = - event.detail
	    }

	    if (delta > 0) {
	      scope.dollyOut()
	    } else if (delta < 0) {
	      scope.dollyIn()
	    }

	    scope.update()
	    scope.dispatchEvent(startEvent)
	    scope.dispatchEvent(endEvent)
	  }

	  function onKeyDown (event) {
	    if (scope.enabled === false || scope.noKeys === true || scope.noRotate === true) return
	    var angle = Math.PI / 4
	    switch (event.keyCode) {
	      case scope.keys.UP:
	        scope.rotateUp(angle)
	        scope.update()
	        break

	      case scope.keys.BOTTOM:
	        scope.rotateUp(- angle)
	        scope.update()
	        break

	      case scope.keys.LEFT:
	        scope.rotateLeft(angle)
	        scope.update()
	        break

	      case scope.keys.RIGHT:
	        scope.rotateLeft(- angle)
	        scope.update()
	        break

	    }
	  }

	  function touchstart (event) {
	    if (scope.enabled === false) return

	    switch (event.touches.length) {
	      case 1: // one-fingered touch: rotate

	        if (scope.noRotate === true) return

	        state = STATE.TOUCH_ROTATE

	        rotateStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY)
	        break

	      case 2: // two-fingered touch: dolly

	        if (scope.noZoom === true) return

	        state = STATE.TOUCH_DOLLY

	        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX
	        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY
	        var distance = Math.sqrt(dx * dx + dy * dy)
	        dollyStart.set(0, distance)
	        break

	      case 3: // three-fingered touch: pan

	        if (scope.noPan === true) return

	        state = STATE.TOUCH_PAN

	        panStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY)
	        break

	      default:

	        state = STATE.NONE

	    }

	    if (state !== STATE.NONE) scope.dispatchEvent(startEvent)
	  }

	  function touchmove (event) {
	    if (scope.enabled === false) return

	    event.preventDefault()
	    event.stopPropagation()

	    var element = scope.domElement === document ? scope.domElement.body : scope.domElement

	    switch (event.touches.length) {
	      case 1: // one-fingered touch: rotate

	        if (scope.noRotate === true) return
	        if (state !== STATE.TOUCH_ROTATE) return

	        rotateEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY)
	        rotateDelta.subVectors(rotateEnd, rotateStart)

	        // rotating across whole screen goes 360 degrees around
	        scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed)
	        // rotating up and down along whole screen attempts to go 360, but limited to 180
	        scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed)

	        rotateStart.copy(rotateEnd)

	        scope.update()
	        break

	      case 2: // two-fingered touch: dolly

	        if (scope.noZoom === true) return
	        if (state !== STATE.TOUCH_DOLLY) return

	        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX
	        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY
	        var distance = Math.sqrt(dx * dx + dy * dy)

	        dollyEnd.set(0, distance)
	        dollyDelta.subVectors(dollyEnd, dollyStart)

	        if (dollyDelta.y > 0) {
	          scope.dollyOut()
	        } else if (dollyDelta.y < 0) {
	          scope.dollyIn()
	        }

	        dollyStart.copy(dollyEnd)

	        scope.update()
	        break

	      case 3: // three-fingered touch: pan

	        if (scope.noPan === true) return
	        if (state !== STATE.TOUCH_PAN) return

	        panEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY)
	        panDelta.subVectors(panEnd, panStart)

	        scope.pan(panDelta.x, panDelta.y)

	        panStart.copy(panEnd)

	        scope.update()
	        break

	      default:

	        state = STATE.NONE

	    }
	  }

	  function touchend ( /* event */ ) {
	    if (scope.enabled === false) return

	    scope.dispatchEvent(endEvent)
	    state = STATE.NONE
	  }

	  this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false)
	  this.domElement.addEventListener('mousedown', onMouseDown, false)
	  this.domElement.addEventListener('mousewheel', onMouseWheel, false)
	  this.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false) // firefox

	  this.domElement.addEventListener('touchstart', touchstart, false)
	  this.domElement.addEventListener('touchend', touchend, false)
	  this.domElement.addEventListener('touchmove', touchmove, false)

	  this.domElement.addEventListener('keydown', onKeyDown, false)

	  // force an update at start
	  this.update()
	}

	OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype)
	OrbitControls.prototype.constructor = OrbitControls

	module.exports = {
	  OrbitControls: OrbitControls
	}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @author alteredq / http://alteredqualia.com/
	 */
	var THREE = __webpack_require__(5);

	module.exports = {

		createMultiMaterialObject: function ( geometry, materials ) {

			var group = new THREE.Object3D();

			for ( var i = 0, l = materials.length; i < l; i ++ ) {

				group.add( new THREE.Mesh( geometry, materials[ i ] ) );

			}

			return group;

		},

		detach: function ( child, parent, scene ) {

			child.applyMatrix( parent.matrixWorld );
			parent.remove( child );
			scene.add( child );

		},

		attach: function ( child, scene, parent ) {

			var matrixWorldInverse = new THREE.Matrix4();
			matrixWorldInverse.getInverse( parent.matrixWorld );
			child.applyMatrix( matrixWorldInverse );
			scene.remove( child );
			parent.add( child );

		}

	};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	var Axis = __webpack_require__(9).Axis;
	var Face = __webpack_require__(9).Face;
	var THREE = __webpack_require__(5);

	function swap4V(mat, v1, v2, v3, v4, cw) {
	    swap4(mat, v1[0],v1[1],v1[2], v2[0],v2[1],v2[2], v3[0],v3[1],v3[2], v4[0],v4[1],v4[2], cw);
	}

	function swap4(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, cw) {
	    if (cw) swap4CW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4);
	    else swap4CCW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4);
	}

	function swap4CCW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4) {
	    swap4CW(mat, x4,y4,z4, x3,y3,z3, x2,y2,z2, x1,y1,z1);
	}

	function swap4CW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4) {
	    tmp = mat[x4][y4][z4];
	    mat[x4][y4][z4] = mat[x3][y3][z3];
	    mat[x3][y3][z3] = mat[x2][y2][z2];
	    mat[x2][y2][z2] = mat[x1][y1][z1];
	    mat[x1][y1][z1] = tmp;
	}

	// http://threejs.org/docs/#Reference/Renderers/CanvasRenderer
	function webglAvailable() {
		try {
			var canvas = document.createElement( 'canvas' );
			return !!( window.WebGLRenderingContext && (
				canvas.getContext( 'webgl' ) ||
				canvas.getContext( 'experimental-webgl' ) )
			);
		} catch ( e ) {
			return false;
		}
	}




	function rotateLayer(mat, axis, layer, cw) {
	    if (Math.abs(axis) == Axis.X) rotateLayerX(mat, layer, cw);
	    else if (Math.abs(axis) == Axis.Y) rotateLayerY(mat, layer, cw);
	    else if (Math.abs(axis) == Axis.Z) rotateLayerZ(mat, layer, cw);
	};

	function rotateLayerX(mat, layer, cw) {
	    var s = mat.length;
	    var rings = s / 2;
	    for (var i = 0; i < rings; i++) {
	        var ringSize = s - i * 2;
	        // offset = i
	        for (var j = 0; j < ringSize-1; j++) {
	            swap4(mat, layer,i,i+j,  layer,i+j,s-1-i,   layer,s-1-i, s-1-i-j,   layer,s-1-i-j,i,  cw);
	        }
	    }
	};

	function rotateLayerY(mat, layer, cw) {
	    var s = mat.length;
	    var rings = s / 2;
	    for (var i = 0; i < rings; i++) {
	        var ringSize = s - i * 2;
	        // offset = i
	        for (var j = 0; j < ringSize-1; j++) {
	            swap4(mat, i+j,layer,i,   s-i-1,layer,i+j,   s-i-1-j,layer,s-i-1,   i,layer,s-i-1-j,  cw);
	        }
	    }
	};

	function rotateLayerZ(mat, layer, cw) {
	    var s = mat.length;
	    var rings = s / 2;
	    for (var i = 0; i < rings; i++) {
	        var ringSize = s - i * 2;
	        // offset = i
	        for (var j = 0; j < ringSize-1; j++) {
	            swap4(mat, i,i+j,layer,  i+j,s-1-i,layer,  s-1-i,s-1-i-j,layer,  s-1-i-j,i,layer,  cw);
	        }
	    }
	};

	function empty(elem) {
	    while (elem.lastChild) elem.removeChild(elem.lastChild);
	}

	function deepArrayEquals(a, b) {
	    // if any array is a falsy value, return
	    if (!a || !b)
	    return false;

	    // compare lengths - can save a lot of time
	    if (a.length != b.length)
	    return false;

	    for (var i = 0, l = a.length; i < l; i++) {
	        // Check if we have nested arrays
	        if (a[i] instanceof Array && b[i] instanceof Array) {
	            // recurse into the nested arrays
	            if (!deepArrayEquals(a[i], b[i]))
	            return false;
	        }
	        else if (a[i] != b[i]) {
	            // Warning - two different object instances will never be equal: {x:20} != {x:20}
	            return false;
	        }
	    }
	    return true;
	}


	function faceToChar(face) {
	    return faceToString(face)[0];
	}
	function faceToString(face) {
	    switch (face) {
	        case Face.FRONT: return 'FRONT'; case Face.BACK:  return 'BACK';
	        case Face.UP:    return 'UP';    case Face.DOWN:  return 'DOWN';
	        case Face.LEFT:  return 'LEFT';  case Face.RIGHT: return 'RIGHT';
	    }
	    return "X"
	}

	function faceToAxis(face) {
	    var x, y, z;
	    x = y = z = 0;
	    switch (face) {
	        case Face.LEFT:  x = -1; break; case Face.RIGHT: x = 1; break;
	        case Face.FRONT: y = -1; break; case Face.BACK:  y = 1; break;
	        case Face.DOWN:  z = -1; break; case Face.UP:    z = 1; break;
	    }
	    return new THREE.Vector3(x, y, z);
	}

	function axisToFace(axis) {
	    if (axis.x == -1) return Face.LEFT;
	    if (axis.x == 1) return Face.RIGHT;
	    if (axis.y == -1) return Face.FRONT;
	    if (axis.y == 1) return Face.BACK;
	    if (axis.z == -1) return Face.DOWN;
	    if (axis.z == 1) return Face.UP;
	}


	function getFaceIndex(face) {
	    switch (face) {
	        case Face.RIGHT: return 0; case Face.LEFT:  return 1;
	        case Face.BACK:  return 2; case Face.FRONT: return 3;
	        case Face.UP:    return 4; case Face.DOWN:  return 5;
	    }
	}


	function charToAxis(letter) {
	    switch (letter.toUpperCase()) {
	        case 'X': return Axis.CUBE_X;
	        case 'Y': return Axis.CUBE_Y;
	        case 'Z': return Axis.CUBE_Z;
	    }
	}
	function charToFace(letter) {
	    switch (letter.toUpperCase()) {
	        case 'U': return Face.UP;   case 'D': return Face.DOWN;
	        case 'L': return Face.LEFT; case 'R': return Face.RIGHT;
	        case 'B': return Face.BACK; case 'F': return Face.FRONT;
	    }
	    return Face.NONE;
	}

	function faceToColorString(face) {
	    switch (face) {
	        case Face.RIGHT: return "GREEN";  case Face.LEFT:  return "BLUE";
	        case Face.BACK:  return "ORANGE"; case Face.FRONT: return "RED";
	        case Face.UP:    return "YELLOW"; case Face.DOWN:  return "WHITE";
	    }
	}

	function opposite(face) {
	    switch(face.toUpperCase()) {
	        case "U": return "D";
	        case "D": return "U";
	        case "L": return "R";
	        case "R": return "L";
	        case "F": return "B";
	        case "B": return "F";
	    }
	}

	// http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
	// https://gist.github.com/niyazpk/f8ac616f181f6042d1e0
	function appendQueryParameter(uri, key, value) {
	    // remove the hash part before operating on the uri
	    var i = uri.indexOf('#');
	    var hash = i === -1 ? ''  : uri.substr(i);
	    uri = i === -1 ? uri : uri.substr(0, i);

	    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	    if (uri.match(re)) {
	        uri = uri.replace(re, '$1' + key + "=" + value + '$2');
	    } else {
	        uri = uri + separator + key + "=" + value;
	    }
	    return uri + hash;  // finally append the hash as well
	}

	// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	function getQueryParameter(name, url) {
	    if (!url) url = window.location.href;
	    url = url.toLowerCase(); // This is just to avoid case sensitiveness
	    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();// This is just to avoid case sensitiveness for query parameter name
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	    results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	// http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
	function copyToClipboard(text) {
	    var textArea = document.createElement("textarea");
	    textArea.style.position = 'fixed';
	    textArea.style.top = 0;
	    textArea.style.left = 0;
	    textArea.style.width = '2em';
	    textArea.style.height = '2em';
	    textArea.style.padding = 0;
	    textArea.style.border = 'none';
	    textArea.style.outline = 'none';
	    textArea.style.boxShadow = 'none';
	    textArea.style.background = 'transparent';
	    textArea.value = text;
	    document.body.appendChild(textArea);
	    textArea.select();
	    document.execCommand('copy');
	    document.body.removeChild(textArea);
	}

	module.exports = {
	    rotateLayer: rotateLayer,
	    deepArrayEquals: deepArrayEquals,
	    empty: empty,
	    faceToChar: faceToChar,
	    faceToString: faceToString,
	    getFaceIndex: getFaceIndex,
	    charToFace: charToFace,
	    charToAxis: charToAxis,
	    faceToColorString: faceToColorString,
	    axisToFace: axisToFace,
	    faceToAxis: faceToAxis,
	    appendQueryParameter: appendQueryParameter,
	    getQueryParameter: getQueryParameter,
	    copyToClipboard: copyToClipboard,
	    opposite: opposite,
	    webglAvailable: webglAvailable,
	};


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	var Face = {
	  RIGHT: 1, LEFT: -1,
	  BACK: 2, FRONT: -2,
	  UP: 3, DOWN: -3,
	  NONE: 0,
	}

	var faces = [Face.RIGHT, Face.BACK, Face.UP, Face.LEFT, Face.FRONT, Face.DOWN]

	var Axis = {
	  X: Face.RIGHT,
	  Y: Face.BACK,
	  Z: Face.UP,
	  CUBE_X: Face.RIGHT,
	  CUBE_Y: Face.UP,
	  CUBE_Z: Face.FRONT
	}

	function axisToIndex (axis) {
	  if (axis == Axis.X) return 0
	  if (axis == Axis.Y) return 1
	  if (axis == Axis.Z) return 2
	}

	module.exports = {
	  Axis: Axis,
	  Face: Face,
	  faces: faces,
	  axisToIndex: axisToIndex
	}


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @author mrdoob / http://mrdoob.com/
	 * @author supereggbert / http://www.paulbrunt.co.uk/
	 * @author julianwa / https://github.com/julianwa
	 */
	var THREE = __webpack_require__(5);
	THREE.RenderableObject = function () {

		this.id = 0;

		this.object = null;
		this.z = 0;

	};

	//

	THREE.RenderableFace = function () {

		this.id = 0;

		this.v1 = new THREE.RenderableVertex();
		this.v2 = new THREE.RenderableVertex();
		this.v3 = new THREE.RenderableVertex();

		this.normalModel = new THREE.Vector3();

		this.vertexNormalsModel = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
		this.vertexNormalsLength = 0;

		this.color = new THREE.Color();
		this.material = null;
		this.uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];

		this.z = 0;

	};

	//

	THREE.RenderableVertex = function () {

		this.position = new THREE.Vector3();
		this.positionWorld = new THREE.Vector3();
		this.positionScreen = new THREE.Vector4();

		this.visible = true;

	};

	THREE.RenderableVertex.prototype.copy = function ( vertex ) {

		this.positionWorld.copy( vertex.positionWorld );
		this.positionScreen.copy( vertex.positionScreen );

	};

	//

	THREE.RenderableLine = function () {

		this.id = 0;

		this.v1 = new THREE.RenderableVertex();
		this.v2 = new THREE.RenderableVertex();

		this.vertexColors = [ new THREE.Color(), new THREE.Color() ];
		this.material = null;

		this.z = 0;

	};

	//

	THREE.RenderableSprite = function () {

		this.id = 0;

		this.object = null;

		this.x = 0;
		this.y = 0;
		this.z = 0;

		this.rotation = 0;
		this.scale = new THREE.Vector2();

		this.material = null;

	};

	//

	THREE.Projector = function () {

		var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
		_vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
		_face, _faceCount, _facePool = [], _facePoolLength = 0,
		_line, _lineCount, _linePool = [], _linePoolLength = 0,
		_sprite, _spriteCount, _spritePool = [], _spritePoolLength = 0,

		_renderData = { objects: [], lights: [], elements: [] },

		_vector3 = new THREE.Vector3(),
		_vector4 = new THREE.Vector4(),

		_clipBox = new THREE.Box3( new THREE.Vector3( - 1, - 1, - 1 ), new THREE.Vector3( 1, 1, 1 ) ),
		_boundingBox = new THREE.Box3(),
		_points3 = new Array( 3 ),
		_points4 = new Array( 4 ),

		_viewMatrix = new THREE.Matrix4(),
		_viewProjectionMatrix = new THREE.Matrix4(),

		_modelMatrix,
		_modelViewProjectionMatrix = new THREE.Matrix4(),

		_normalMatrix = new THREE.Matrix3(),

		_frustum = new THREE.Frustum(),

		_clippedVertex1PositionScreen = new THREE.Vector4(),
		_clippedVertex2PositionScreen = new THREE.Vector4();

		//

		this.projectVector = function ( vector, camera ) {

			console.warn( 'THREE.Projector: .projectVector() is now vector.project().' );
			vector.project( camera );

		};

		this.unprojectVector = function ( vector, camera ) {

			console.warn( 'THREE.Projector: .unprojectVector() is now vector.unproject().' );
			vector.unproject( camera );

		};

		this.pickingRay = function ( vector, camera ) {

			console.error( 'THREE.Projector: .pickingRay() is now raycaster.setFromCamera().' );

		};

		//

		var RenderList = function () {

			var normals = [];
			var uvs = [];

			var object = null;
			var material = null;

			var normalMatrix = new THREE.Matrix3();

			var setObject = function ( value ) {

				object = value;
				material = object.material;

				normalMatrix.getNormalMatrix( object.matrixWorld );

				normals.length = 0;
				uvs.length = 0;

			};

			var projectVertex = function ( vertex ) {

				var position = vertex.position;
				var positionWorld = vertex.positionWorld;
				var positionScreen = vertex.positionScreen;

				positionWorld.copy( position ).applyMatrix4( _modelMatrix );
				positionScreen.copy( positionWorld ).applyMatrix4( _viewProjectionMatrix );

				var invW = 1 / positionScreen.w;

				positionScreen.x *= invW;
				positionScreen.y *= invW;
				positionScreen.z *= invW;

				vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
						 positionScreen.y >= - 1 && positionScreen.y <= 1 &&
						 positionScreen.z >= - 1 && positionScreen.z <= 1;

			};

			var pushVertex = function ( x, y, z ) {

				_vertex = getNextVertexInPool();
				_vertex.position.set( x, y, z );

				projectVertex( _vertex );

			};

			var pushNormal = function ( x, y, z ) {

				normals.push( x, y, z );

			};

			var pushUv = function ( x, y ) {

				uvs.push( x, y );

			};

			var checkTriangleVisibility = function ( v1, v2, v3 ) {

				if ( v1.visible === true || v2.visible === true || v3.visible === true ) return true;

				_points3[ 0 ] = v1.positionScreen;
				_points3[ 1 ] = v2.positionScreen;
				_points3[ 2 ] = v3.positionScreen;

				return _clipBox.isIntersectionBox( _boundingBox.setFromPoints( _points3 ) );

			};

			var checkBackfaceCulling = function ( v1, v2, v3 ) {

				return ( ( v3.positionScreen.x - v1.positionScreen.x ) *
					    ( v2.positionScreen.y - v1.positionScreen.y ) -
					    ( v3.positionScreen.y - v1.positionScreen.y ) *
					    ( v2.positionScreen.x - v1.positionScreen.x ) ) < 0;

			};

			var pushLine = function ( a, b ) {

				var v1 = _vertexPool[ a ];
				var v2 = _vertexPool[ b ];

				_line = getNextLineInPool();

				_line.id = object.id;
				_line.v1.copy( v1 );
				_line.v2.copy( v2 );
				_line.z = ( v1.positionScreen.z + v2.positionScreen.z ) / 2;

				_line.material = object.material;

				_renderData.elements.push( _line );

			};

			var pushTriangle = function ( a, b, c ) {

				var v1 = _vertexPool[ a ];
				var v2 = _vertexPool[ b ];
				var v3 = _vertexPool[ c ];

				if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

				if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

					_face = getNextFaceInPool();

					_face.id = object.id;
					_face.v1.copy( v1 );
					_face.v2.copy( v2 );
					_face.v3.copy( v3 );
					_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

					for ( var i = 0; i < 3; i ++ ) {

						var offset = arguments[ i ] * 3;
						var normal = _face.vertexNormalsModel[ i ];

						normal.set( normals[ offset ], normals[ offset + 1 ], normals[ offset + 2 ] );
						normal.applyMatrix3( normalMatrix ).normalize();

						var offset2 = arguments[ i ] * 2;

						var uv = _face.uvs[ i ];
						uv.set( uvs[ offset2 ], uvs[ offset2 + 1 ] );

					}

					_face.vertexNormalsLength = 3;

					_face.material = object.material;

					_renderData.elements.push( _face );

				}

			};

			return {
				setObject: setObject,
				projectVertex: projectVertex,
				checkTriangleVisibility: checkTriangleVisibility,
				checkBackfaceCulling: checkBackfaceCulling,
				pushVertex: pushVertex,
				pushNormal: pushNormal,
				pushUv: pushUv,
				pushLine: pushLine,
				pushTriangle: pushTriangle
			}

		};

		var renderList = new RenderList();

		this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

			_faceCount = 0;
			_lineCount = 0;
			_spriteCount = 0;

			_renderData.elements.length = 0;

			if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
			if ( camera.parent === undefined ) camera.updateMatrixWorld();

			_viewMatrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
			_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

			_frustum.setFromMatrix( _viewProjectionMatrix );

			//

			_objectCount = 0;

			_renderData.objects.length = 0;
			_renderData.lights.length = 0;

			scene.traverseVisible( function ( object ) {

				if ( object instanceof THREE.Light ) {

					_renderData.lights.push( object );

				} else if ( object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite ) {

					if ( object.material.visible === false ) return;

					if ( object.frustumCulled === false || _frustum.intersectsObject( object ) === true ) {

						_object = getNextObjectInPool();
						_object.id = object.id;
						_object.object = object;

						_vector3.setFromMatrixPosition( object.matrixWorld );
						_vector3.applyProjection( _viewProjectionMatrix );
						_object.z = _vector3.z;

						_renderData.objects.push( _object );

					}

				}

			} );

			if ( sortObjects === true ) {

				_renderData.objects.sort( painterSort );

			}

			//

			for ( var o = 0, ol = _renderData.objects.length; o < ol; o ++ ) {

				var object = _renderData.objects[ o ].object;
				var geometry = object.geometry;

				renderList.setObject( object );

				_modelMatrix = object.matrixWorld;

				_vertexCount = 0;

				if ( object instanceof THREE.Mesh ) {

					if ( geometry instanceof THREE.BufferGeometry ) {

						var attributes = geometry.attributes;
						var offsets = geometry.offsets;

						if ( attributes.position === undefined ) continue;

						var positions = attributes.position.array;

						for ( var i = 0, l = positions.length; i < l; i += 3 ) {

							renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

						}

						if ( attributes.normal !== undefined ) {

							var normals = attributes.normal.array;

							for ( var i = 0, l = normals.length; i < l; i += 3 ) {

								renderList.pushNormal( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );

							}

						}

						if ( attributes.uv !== undefined ) {

							var uvs = attributes.uv.array;

							for ( var i = 0, l = uvs.length; i < l; i += 2 ) {

								renderList.pushUv( uvs[ i ], uvs[ i + 1 ] );

							}

						}

						if ( attributes.index !== undefined ) {

							var indices = attributes.index.array;

							if ( offsets.length > 0 ) {

								for ( var o = 0; o < offsets.length; o ++ ) {

									var offset = offsets[ o ];
									var index = offset.index;

									for ( var i = offset.start, l = offset.start + offset.count; i < l; i += 3 ) {

										renderList.pushTriangle( indices[ i ] + index, indices[ i + 1 ] + index, indices[ i + 2 ] + index );

									}

								}

							} else {

								for ( var i = 0, l = indices.length; i < l; i += 3 ) {

									renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

								}

							}

						} else {

							for ( var i = 0, l = positions.length / 3; i < l; i += 3 ) {

								renderList.pushTriangle( i, i + 1, i + 2 );

							}

						}

					} else if ( geometry instanceof THREE.Geometry ) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;
						var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

						_normalMatrix.getNormalMatrix( _modelMatrix );

						var material = object.material;
						
						var isFaceMaterial = material instanceof THREE.MeshFaceMaterial;
						var objectMaterials = isFaceMaterial === true ? object.material : null;

						for ( var v = 0, vl = vertices.length; v < vl; v ++ ) {

							var vertex = vertices[ v ];

							_vector3.copy( vertex );

							if ( material.morphTargets === true ) {

								var morphTargets = geometry.morphTargets;
								var morphInfluences = object.morphTargetInfluences;

								for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

									var influence = morphInfluences[ t ];

									if ( influence === 0 ) continue;

									var target = morphTargets[ t ];
									var targetVertex = target.vertices[ v ];

									_vector3.x += ( targetVertex.x - vertex.x ) * influence;
									_vector3.y += ( targetVertex.y - vertex.y ) * influence;
									_vector3.z += ( targetVertex.z - vertex.z ) * influence;

								}

							}

							renderList.pushVertex( _vector3.x, _vector3.y, _vector3.z );

						}

						for ( var f = 0, fl = faces.length; f < fl; f ++ ) {

							var face = faces[ f ];

							var material = isFaceMaterial === true
								 ? objectMaterials.materials[ face.materialIndex ]
								 : object.material;

							if ( material === undefined ) continue;

							var side = material.side;

							var v1 = _vertexPool[ face.a ];
							var v2 = _vertexPool[ face.b ];
							var v3 = _vertexPool[ face.c ];

							if ( renderList.checkTriangleVisibility( v1, v2, v3 ) === false ) continue;

							var visible = renderList.checkBackfaceCulling( v1, v2, v3 );

							if ( side !== THREE.DoubleSide ) {
								if ( side === THREE.FrontSide && visible === false ) continue;
								if ( side === THREE.BackSide && visible === true ) continue;
							}

							_face = getNextFaceInPool();

							_face.id = object.id;
							_face.v1.copy( v1 );
							_face.v2.copy( v2 );
							_face.v3.copy( v3 );

							_face.normalModel.copy( face.normal );

							if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

								_face.normalModel.negate();

							}

							_face.normalModel.applyMatrix3( _normalMatrix ).normalize();

							var faceVertexNormals = face.vertexNormals;

							for ( var n = 0, nl = Math.min( faceVertexNormals.length, 3 ); n < nl; n ++ ) {

								var normalModel = _face.vertexNormalsModel[ n ];
								normalModel.copy( faceVertexNormals[ n ] );

								if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

									normalModel.negate();

								}

								normalModel.applyMatrix3( _normalMatrix ).normalize();

							}

							_face.vertexNormalsLength = faceVertexNormals.length;

							var vertexUvs = faceVertexUvs[ f ];

							if ( vertexUvs !== undefined ) {

								for ( var u = 0; u < 3; u ++ ) {

									_face.uvs[ u ].copy( vertexUvs[ u ] );

								}

							}

							_face.color = face.color;
							_face.material = material;

							_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

							_renderData.elements.push( _face );

						}

					}

				} else if ( object instanceof THREE.Line ) {

					if ( geometry instanceof THREE.BufferGeometry ) {

						var attributes = geometry.attributes;

						if ( attributes.position !== undefined ) {

							var positions = attributes.position.array;

							for ( var i = 0, l = positions.length; i < l; i += 3 ) {

								renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

							}

							if ( attributes.index !== undefined ) {

								var indices = attributes.index.array;

								for ( var i = 0, l = indices.length; i < l; i += 2 ) {

									renderList.pushLine( indices[ i ], indices[ i + 1 ] );

								}

							} else {

								var step = object.mode === THREE.LinePieces ? 2 : 1;

								for ( var i = 0, l = ( positions.length / 3 ) - 1; i < l; i += step ) {

									renderList.pushLine( i, i + 1 );

								}

							}

						}

					} else if ( geometry instanceof THREE.Geometry ) {

						_modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );

						var vertices = object.geometry.vertices;

						if ( vertices.length === 0 ) continue;

						v1 = getNextVertexInPool();
						v1.positionScreen.copy( vertices[ 0 ] ).applyMatrix4( _modelViewProjectionMatrix );

						// Handle LineStrip and LinePieces
						var step = object.mode === THREE.LinePieces ? 2 : 1;

						for ( var v = 1, vl = vertices.length; v < vl; v ++ ) {

							v1 = getNextVertexInPool();
							v1.positionScreen.copy( vertices[ v ] ).applyMatrix4( _modelViewProjectionMatrix );

							if ( ( v + 1 ) % step > 0 ) continue;

							v2 = _vertexPool[ _vertexCount - 2 ];

							_clippedVertex1PositionScreen.copy( v1.positionScreen );
							_clippedVertex2PositionScreen.copy( v2.positionScreen );

							if ( clipLine( _clippedVertex1PositionScreen, _clippedVertex2PositionScreen ) === true ) {

								// Perform the perspective divide
								_clippedVertex1PositionScreen.multiplyScalar( 1 / _clippedVertex1PositionScreen.w );
								_clippedVertex2PositionScreen.multiplyScalar( 1 / _clippedVertex2PositionScreen.w );

								_line = getNextLineInPool();

								_line.id = object.id;
								_line.v1.positionScreen.copy( _clippedVertex1PositionScreen );
								_line.v2.positionScreen.copy( _clippedVertex2PositionScreen );

								_line.z = Math.max( _clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z );

								_line.material = object.material;

								if ( object.material.vertexColors === THREE.VertexColors ) {

									_line.vertexColors[ 0 ].copy( object.geometry.colors[ v ] );
									_line.vertexColors[ 1 ].copy( object.geometry.colors[ v - 1 ] );

								}

								_renderData.elements.push( _line );

							}

						}

					}

				} else if ( object instanceof THREE.Sprite ) {

					_vector4.set( _modelMatrix.elements[ 12 ], _modelMatrix.elements[ 13 ], _modelMatrix.elements[ 14 ], 1 );
					_vector4.applyMatrix4( _viewProjectionMatrix );

					var invW = 1 / _vector4.w;

					_vector4.z *= invW;

					if ( _vector4.z >= - 1 && _vector4.z <= 1 ) {

						_sprite = getNextSpriteInPool();
						_sprite.id = object.id;
						_sprite.x = _vector4.x * invW;
						_sprite.y = _vector4.y * invW;
						_sprite.z = _vector4.z;
						_sprite.object = object;

						_sprite.rotation = object.rotation;

						_sprite.scale.x = object.scale.x * Math.abs( _sprite.x - ( _vector4.x + camera.projectionMatrix.elements[ 0 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 12 ] ) );
						_sprite.scale.y = object.scale.y * Math.abs( _sprite.y - ( _vector4.y + camera.projectionMatrix.elements[ 5 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 13 ] ) );

						_sprite.material = object.material;

						_renderData.elements.push( _sprite );

					}

				}

			}

			if ( sortElements === true ) {

				_renderData.elements.sort( painterSort );

			}

			return _renderData;

		};

		// Pools

		function getNextObjectInPool() {

			if ( _objectCount === _objectPoolLength ) {

				var object = new THREE.RenderableObject();
				_objectPool.push( object );
				_objectPoolLength ++;
				_objectCount ++;
				return object;

			}

			return _objectPool[ _objectCount ++ ];

		}

		function getNextVertexInPool() {

			if ( _vertexCount === _vertexPoolLength ) {

				var vertex = new THREE.RenderableVertex();
				_vertexPool.push( vertex );
				_vertexPoolLength ++;
				_vertexCount ++;
				return vertex;

			}

			return _vertexPool[ _vertexCount ++ ];

		}

		function getNextFaceInPool() {

			if ( _faceCount === _facePoolLength ) {

				var face = new THREE.RenderableFace();
				_facePool.push( face );
				_facePoolLength ++;
				_faceCount ++;
				return face;

			}

			return _facePool[ _faceCount ++ ];


		}

		function getNextLineInPool() {

			if ( _lineCount === _linePoolLength ) {

				var line = new THREE.RenderableLine();
				_linePool.push( line );
				_linePoolLength ++;
				_lineCount ++
				return line;

			}

			return _linePool[ _lineCount ++ ];

		}

		function getNextSpriteInPool() {

			if ( _spriteCount === _spritePoolLength ) {

				var sprite = new THREE.RenderableSprite();
				_spritePool.push( sprite );
				_spritePoolLength ++;
				_spriteCount ++
				return sprite;

			}

			return _spritePool[ _spriteCount ++ ];

		}

		//

		function painterSort( a, b ) {

			if ( a.z !== b.z ) {

				return b.z - a.z;

			} else if ( a.id !== b.id ) {

				return a.id - b.id;

			} else {

				return 0;

			}

		}

		function clipLine( s1, s2 ) {

			var alpha1 = 0, alpha2 = 1,

			// Calculate the boundary coordinate of each vertex for the near and far clip planes,
			// Z = -1 and Z = +1, respectively.
			bc1near =  s1.z + s1.w,
			bc2near =  s2.z + s2.w,
			bc1far =  - s1.z + s1.w,
			bc2far =  - s2.z + s2.w;

			if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

				// Both vertices lie entirely within all clip planes.
				return true;

			} else if ( ( bc1near < 0 && bc2near < 0 ) || ( bc1far < 0 && bc2far < 0 ) ) {

				// Both vertices lie entirely outside one of the clip planes.
				return false;

			} else {

				// The line segment spans at least one clip plane.

				if ( bc1near < 0 ) {

					// v1 lies outside the near plane, v2 inside
					alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

				} else if ( bc2near < 0 ) {

					// v2 lies outside the near plane, v1 inside
					alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

				}

				if ( bc1far < 0 ) {

					// v1 lies outside the far plane, v2 inside
					alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

				} else if ( bc2far < 0 ) {

					// v2 lies outside the far plane, v2 inside
					alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

				}

				if ( alpha2 < alpha1 ) {

					// The line segment spans two boundaries, but is outside both of them.
					// (This can't happen when we're only clipping against just near/far but good
					//  to leave the check here for future usage if other clip planes are added.)
					return false;

				} else {

					// Update the s1 and s2 vertices to match the clipped line segment.
					s1.lerp( s2, alpha1 );
					s2.lerp( s1, 1 - alpha2 );

					return true;

				}

			}

		}

	};

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	module.exports = {"glyphs":{"ο":{"x_min":0,"x_max":764,"ha":863,"o":"m 380 -25 q 105 87 211 -25 q 0 372 0 200 q 104 660 0 545 q 380 775 209 775 q 658 659 552 775 q 764 372 764 544 q 658 87 764 200 q 380 -25 552 -25 m 379 142 q 515 216 466 142 q 557 373 557 280 q 515 530 557 465 q 379 607 466 607 q 245 530 294 607 q 204 373 204 465 q 245 218 204 283 q 379 142 294 142 "},"S":{"x_min":0,"x_max":826,"ha":915,"o":"m 826 306 q 701 55 826 148 q 423 -29 587 -29 q 138 60 255 -29 q 0 318 13 154 l 208 318 q 288 192 216 238 q 437 152 352 152 q 559 181 506 152 q 623 282 623 217 q 466 411 623 372 q 176 487 197 478 q 18 719 18 557 q 136 958 18 869 q 399 1040 244 1040 q 670 956 561 1040 q 791 713 791 864 l 591 713 q 526 826 583 786 q 393 866 469 866 q 277 838 326 866 q 218 742 218 804 q 374 617 218 655 q 667 542 646 552 q 826 306 826 471 "},"¦":{"x_min":0,"x_max":143,"ha":240,"o":"m 143 462 l 0 462 l 0 984 l 143 984 l 143 462 m 143 -242 l 0 -242 l 0 280 l 143 280 l 143 -242 "},"/":{"x_min":196.109375,"x_max":632.5625,"ha":828,"o":"m 632 1040 l 289 -128 l 196 -128 l 538 1040 l 632 1040 "},"Τ":{"x_min":-0.609375,"x_max":808,"ha":878,"o":"m 808 831 l 508 831 l 508 0 l 298 0 l 298 831 l 0 831 l 0 1013 l 808 1013 l 808 831 "},"y":{"x_min":0,"x_max":738.890625,"ha":828,"o":"m 738 749 l 444 -107 q 361 -238 413 -199 q 213 -277 308 -277 q 156 -275 176 -277 q 120 -271 131 -271 l 120 -110 q 147 -113 134 -111 q 179 -116 161 -116 q 247 -91 226 -116 q 269 -17 269 -67 q 206 173 269 -4 q 84 515 162 301 q 0 749 41 632 l 218 749 l 376 207 l 529 749 l 738 749 "},"Π":{"x_min":0,"x_max":809,"ha":922,"o":"m 809 0 l 598 0 l 598 836 l 208 836 l 208 0 l 0 0 l 0 1012 l 809 1012 l 809 0 "},"ΐ":{"x_min":-162,"x_max":364,"ha":364,"o":"m 364 810 l 235 810 l 235 952 l 364 952 l 364 810 m 301 1064 l 86 810 l -12 810 l 123 1064 l 301 1064 m -33 810 l -162 810 l -162 952 l -33 952 l -33 810 m 200 0 l 0 0 l 0 748 l 200 748 l 200 0 "},"g":{"x_min":0,"x_max":724,"ha":839,"o":"m 724 48 q 637 -223 724 -142 q 357 -304 551 -304 q 140 -253 226 -304 q 23 -72 36 -192 l 243 -72 q 290 -127 255 -110 q 368 -144 324 -144 q 504 -82 470 -144 q 530 71 530 -38 l 530 105 q 441 25 496 51 q 319 0 386 0 q 79 115 166 0 q 0 377 0 219 q 77 647 0 534 q 317 775 166 775 q 534 656 456 775 l 534 748 l 724 748 l 724 48 m 368 167 q 492 237 447 167 q 530 382 530 297 q 490 529 530 466 q 364 603 444 603 q 240 532 284 603 q 201 386 201 471 q 240 239 201 300 q 368 167 286 167 "},"²":{"x_min":0,"x_max":463,"ha":560,"o":"m 463 791 q 365 627 463 706 q 151 483 258 555 l 455 483 l 455 382 l 0 382 q 84 565 0 488 q 244 672 97 576 q 331 784 331 727 q 299 850 331 824 q 228 876 268 876 q 159 848 187 876 q 132 762 132 820 l 10 762 q 78 924 10 866 q 228 976 137 976 q 392 925 322 976 q 463 791 463 874 "},"–":{"x_min":0,"x_max":704.171875,"ha":801,"o":"m 704 297 l 0 297 l 0 450 l 704 450 l 704 297 "},"Κ":{"x_min":0,"x_max":899.671875,"ha":969,"o":"m 899 0 l 646 0 l 316 462 l 208 355 l 208 0 l 0 0 l 0 1013 l 208 1013 l 208 596 l 603 1013 l 863 1013 l 460 603 l 899 0 "},"ƒ":{"x_min":-46,"x_max":440,"ha":525,"o":"m 440 609 l 316 609 l 149 -277 l -46 -277 l 121 609 l 14 609 l 14 749 l 121 749 q 159 949 121 894 q 344 1019 208 1019 l 440 1015 l 440 855 l 377 855 q 326 841 338 855 q 314 797 314 827 q 314 773 314 786 q 314 749 314 761 l 440 749 l 440 609 "},"e":{"x_min":0,"x_max":708,"ha":808,"o":"m 708 321 l 207 321 q 254 186 207 236 q 362 141 298 141 q 501 227 453 141 l 700 227 q 566 36 662 104 q 362 -26 477 -26 q 112 72 213 -26 q 0 369 0 182 q 95 683 0 573 q 358 793 191 793 q 619 677 531 793 q 708 321 708 561 m 501 453 q 460 571 501 531 q 353 612 420 612 q 247 570 287 612 q 207 453 207 529 l 501 453 "},"ό":{"x_min":0,"x_max":764,"ha":863,"o":"m 380 -25 q 105 87 211 -25 q 0 372 0 200 q 104 660 0 545 q 380 775 209 775 q 658 659 552 775 q 764 372 764 544 q 658 87 764 200 q 380 -25 552 -25 m 379 142 q 515 216 466 142 q 557 373 557 280 q 515 530 557 465 q 379 607 466 607 q 245 530 294 607 q 204 373 204 465 q 245 218 204 283 q 379 142 294 142 m 593 1039 l 391 823 l 293 823 l 415 1039 l 593 1039 "},"J":{"x_min":0,"x_max":649,"ha":760,"o":"m 649 294 q 573 48 649 125 q 327 -29 497 -29 q 61 82 136 -29 q 0 375 0 173 l 200 375 l 199 309 q 219 194 199 230 q 321 145 249 145 q 418 193 390 145 q 441 307 441 232 l 441 1013 l 649 1013 l 649 294 "},"»":{"x_min":-0.234375,"x_max":526,"ha":624,"o":"m 526 286 l 297 87 l 296 250 l 437 373 l 297 495 l 297 660 l 526 461 l 526 286 m 229 286 l 0 87 l 0 250 l 140 373 l 0 495 l 0 660 l 229 461 l 229 286 "},"©":{"x_min":3,"x_max":1007,"ha":1104,"o":"m 507 -6 q 129 153 269 -6 q 3 506 3 298 q 127 857 3 713 q 502 1017 266 1017 q 880 855 740 1017 q 1007 502 1007 711 q 882 152 1007 295 q 507 -6 743 -6 m 502 934 q 184 800 302 934 q 79 505 79 680 q 184 210 79 331 q 501 76 302 76 q 819 210 701 76 q 925 507 925 331 q 820 800 925 682 q 502 934 704 934 m 758 410 q 676 255 748 313 q 506 197 605 197 q 298 291 374 197 q 229 499 229 377 q 297 713 229 624 q 494 811 372 811 q 666 760 593 811 q 752 616 739 710 l 621 616 q 587 688 621 658 q 509 719 554 719 q 404 658 441 719 q 368 511 368 598 q 403 362 368 427 q 498 298 438 298 q 624 410 606 298 l 758 410 "},"ώ":{"x_min":0,"x_max":945,"ha":1051,"o":"m 566 528 l 372 528 l 372 323 q 372 298 372 311 q 373 271 372 285 q 360 183 373 211 q 292 142 342 142 q 219 222 243 142 q 203 365 203 279 q 241 565 203 461 q 334 748 273 650 l 130 748 q 36 552 68 650 q 0 337 0 444 q 69 96 0 204 q 276 -29 149 -29 q 390 0 337 -29 q 470 78 444 28 q 551 0 495 30 q 668 -29 608 -29 q 874 96 793 -29 q 945 337 945 205 q 910 547 945 444 q 814 748 876 650 l 610 748 q 703 565 671 650 q 742 365 742 462 q 718 189 742 237 q 651 142 694 142 q 577 190 597 142 q 565 289 565 221 l 565 323 l 566 528 m 718 1039 l 516 823 l 417 823 l 540 1039 l 718 1039 "},"^":{"x_min":197.21875,"x_max":630.5625,"ha":828,"o":"m 630 836 l 536 836 l 413 987 l 294 836 l 197 836 l 331 1090 l 493 1090 l 630 836 "},"«":{"x_min":0,"x_max":526.546875,"ha":624,"o":"m 526 87 l 297 286 l 297 461 l 526 660 l 526 495 l 385 373 l 526 250 l 526 87 m 229 87 l 0 286 l 0 461 l 229 660 l 229 495 l 88 373 l 229 250 l 229 87 "},"D":{"x_min":0,"x_max":864,"ha":968,"o":"m 400 1013 q 736 874 608 1013 q 864 523 864 735 q 717 146 864 293 q 340 0 570 0 l 0 0 l 0 1013 l 400 1013 m 398 837 l 206 837 l 206 182 l 372 182 q 584 276 507 182 q 657 504 657 365 q 594 727 657 632 q 398 837 522 837 "},"∙":{"x_min":0,"x_max":207,"ha":304,"o":"m 207 528 l 0 528 l 0 735 l 207 735 l 207 528 "},"ÿ":{"x_min":0,"x_max":47,"ha":125,"o":"m 47 3 q 37 -7 47 -7 q 28 0 30 -7 q 39 -4 32 -4 q 45 3 45 -1 l 37 0 q 28 9 28 0 q 39 19 28 19 l 47 16 l 47 19 l 47 3 m 37 1 q 44 8 44 1 q 37 16 44 16 q 30 8 30 16 q 37 1 30 1 m 26 1 l 23 22 l 14 0 l 3 22 l 3 3 l 0 25 l 13 1 l 22 25 l 26 1 "},"w":{"x_min":0,"x_max":1056.953125,"ha":1150,"o":"m 1056 749 l 848 0 l 647 0 l 527 536 l 412 0 l 211 0 l 0 749 l 202 749 l 325 226 l 429 748 l 633 748 l 740 229 l 864 749 l 1056 749 "},"$":{"x_min":0,"x_max":704,"ha":800,"o":"m 682 693 l 495 693 q 468 782 491 749 q 391 831 441 824 l 391 579 q 633 462 562 534 q 704 259 704 389 q 616 57 704 136 q 391 -22 528 -22 l 391 -156 l 308 -156 l 308 -22 q 76 69 152 -7 q 0 300 0 147 l 183 300 q 215 191 190 230 q 308 128 245 143 l 308 414 q 84 505 157 432 q 12 700 12 578 q 89 902 12 824 q 308 981 166 981 l 308 1069 l 391 1069 l 391 981 q 595 905 521 981 q 682 693 670 829 m 308 599 l 308 831 q 228 796 256 831 q 200 712 200 762 q 225 642 200 668 q 308 599 251 617 m 391 128 q 476 174 449 140 q 504 258 504 207 q 391 388 504 354 l 391 128 "},"\\":{"x_min":-0.03125,"x_max":434.765625,"ha":532,"o":"m 434 -128 l 341 -128 l 0 1039 l 91 1040 l 434 -128 "},"µ":{"x_min":0,"x_max":647,"ha":754,"o":"m 647 0 l 478 0 l 478 68 q 412 9 448 30 q 330 -11 375 -11 q 261 3 296 -11 q 199 43 226 18 l 199 -277 l 0 -277 l 0 749 l 199 749 l 199 358 q 216 221 199 267 q 322 151 244 151 q 435 240 410 151 q 448 401 448 283 l 448 749 l 647 749 l 647 0 "},"Ι":{"x_min":42,"x_max":250,"ha":413,"o":"m 250 0 l 42 0 l 42 1013 l 250 1013 l 250 0 "},"Ύ":{"x_min":0,"x_max":1211.15625,"ha":1289,"o":"m 1211 1012 l 907 376 l 907 0 l 697 0 l 697 376 l 374 1012 l 583 1012 l 802 576 l 1001 1012 l 1211 1012 m 313 1035 l 98 780 l 0 780 l 136 1035 l 313 1035 "},"’":{"x_min":0,"x_max":192,"ha":289,"o":"m 192 834 q 137 692 192 751 q 0 626 83 634 l 0 697 q 101 831 101 723 l 0 831 l 0 1013 l 192 1013 l 192 834 "},"Ν":{"x_min":0,"x_max":833,"ha":946,"o":"m 833 0 l 617 0 l 206 696 l 206 0 l 0 0 l 0 1013 l 216 1013 l 629 315 l 629 1013 l 833 1013 l 833 0 "},"-":{"x_min":27.78125,"x_max":413.890625,"ha":525,"o":"m 413 279 l 27 279 l 27 468 l 413 468 l 413 279 "},"Q":{"x_min":0,"x_max":995.59375,"ha":1096,"o":"m 995 49 l 885 -70 l 762 42 q 641 -12 709 4 q 497 -29 572 -29 q 135 123 271 -29 q 0 504 0 276 q 131 881 0 731 q 497 1040 270 1040 q 859 883 719 1040 q 994 506 994 731 q 966 321 994 413 q 884 152 938 229 l 995 49 m 730 299 q 767 395 755 344 q 779 504 779 446 q 713 743 779 644 q 505 857 638 857 q 284 745 366 857 q 210 501 210 644 q 279 265 210 361 q 492 157 357 157 q 615 181 557 157 l 508 287 l 620 405 l 730 299 "},"ς":{"x_min":0,"x_max":731.78125,"ha":768,"o":"m 731 448 l 547 448 q 485 571 531 533 q 369 610 440 610 q 245 537 292 610 q 204 394 204 473 q 322 186 204 238 q 540 133 430 159 q 659 -15 659 98 q 643 -141 659 -80 q 595 -278 627 -202 l 423 -278 q 458 -186 448 -215 q 474 -88 474 -133 q 352 0 474 -27 q 123 80 181 38 q 0 382 0 170 q 98 660 0 549 q 367 777 202 777 q 622 683 513 777 q 731 448 731 589 "},"M":{"x_min":0,"x_max":1019,"ha":1135,"o":"m 1019 0 l 823 0 l 823 819 l 618 0 l 402 0 l 194 818 l 194 0 l 0 0 l 0 1013 l 309 1012 l 510 241 l 707 1013 l 1019 1013 l 1019 0 "},"Ψ":{"x_min":0,"x_max":995,"ha":1085,"o":"m 995 698 q 924 340 995 437 q 590 200 841 227 l 590 0 l 404 0 l 404 200 q 70 340 152 227 q 0 698 0 437 l 0 1013 l 188 1013 l 188 694 q 212 472 188 525 q 404 383 254 383 l 404 1013 l 590 1013 l 590 383 q 781 472 740 383 q 807 694 807 525 l 807 1013 l 995 1013 l 995 698 "},"C":{"x_min":0,"x_max":970.828125,"ha":1043,"o":"m 970 345 q 802 70 933 169 q 490 -29 672 -29 q 130 130 268 -29 q 0 506 0 281 q 134 885 0 737 q 502 1040 275 1040 q 802 939 668 1040 q 965 679 936 838 l 745 679 q 649 809 716 761 q 495 857 582 857 q 283 747 361 857 q 214 508 214 648 q 282 267 214 367 q 493 154 359 154 q 651 204 584 154 q 752 345 718 255 l 970 345 "},"!":{"x_min":0,"x_max":204,"ha":307,"o":"m 204 739 q 182 515 204 686 q 152 282 167 398 l 52 282 q 13 589 27 473 q 0 739 0 704 l 0 1013 l 204 1013 l 204 739 m 204 0 l 0 0 l 0 203 l 204 203 l 204 0 "},"{":{"x_min":0,"x_max":501.390625,"ha":599,"o":"m 501 -285 q 229 -209 301 -285 q 176 -35 176 -155 q 182 47 176 -8 q 189 126 189 103 q 156 245 189 209 q 0 294 112 294 l 0 438 q 154 485 111 438 q 189 603 189 522 q 186 666 189 636 q 176 783 176 772 q 231 945 176 894 q 501 1015 306 1015 l 501 872 q 370 833 408 872 q 340 737 340 801 q 342 677 340 705 q 353 569 353 579 q 326 451 353 496 q 207 366 291 393 q 327 289 294 346 q 353 164 353 246 q 348 79 353 132 q 344 17 344 26 q 372 -95 344 -58 q 501 -141 408 -141 l 501 -285 "},"X":{"x_min":0,"x_max":894.453125,"ha":999,"o":"m 894 0 l 654 0 l 445 351 l 238 0 l 0 0 l 316 516 l 0 1013 l 238 1013 l 445 659 l 652 1013 l 894 1013 l 577 519 l 894 0 "},"#":{"x_min":0,"x_max":1019.453125,"ha":1117,"o":"m 1019 722 l 969 582 l 776 581 l 717 417 l 919 417 l 868 279 l 668 278 l 566 -6 l 413 -5 l 516 279 l 348 279 l 247 -6 l 94 -6 l 196 278 l 0 279 l 49 417 l 245 417 l 304 581 l 98 582 l 150 722 l 354 721 l 455 1006 l 606 1006 l 507 721 l 673 722 l 776 1006 l 927 1006 l 826 721 l 1019 722 m 627 581 l 454 581 l 394 417 l 567 417 l 627 581 "},"ι":{"x_min":42,"x_max":242,"ha":389,"o":"m 242 0 l 42 0 l 42 749 l 242 749 l 242 0 "},"Ά":{"x_min":0,"x_max":995.828125,"ha":1072,"o":"m 313 1035 l 98 780 l 0 780 l 136 1035 l 313 1035 m 995 0 l 776 0 l 708 208 l 315 208 l 247 0 l 29 0 l 390 1012 l 629 1012 l 995 0 m 652 376 l 509 809 l 369 376 l 652 376 "},")":{"x_min":0,"x_max":389,"ha":486,"o":"m 389 357 q 319 14 389 187 q 145 -293 259 -134 l 0 -293 q 139 22 90 -142 q 189 358 189 187 q 139 689 189 525 q 0 1013 90 853 l 145 1013 q 319 703 258 857 q 389 357 389 528 "},"ε":{"x_min":16.671875,"x_max":652.78125,"ha":742,"o":"m 652 259 q 565 49 652 123 q 340 -25 479 -25 q 102 39 188 -25 q 16 197 16 104 q 45 299 16 249 q 134 390 75 348 q 58 456 86 419 q 25 552 25 502 q 120 717 25 653 q 322 776 208 776 q 537 710 456 776 q 625 508 625 639 l 445 508 q 415 585 445 563 q 327 608 386 608 q 254 590 293 608 q 215 544 215 573 q 252 469 215 490 q 336 453 280 453 q 369 455 347 453 q 400 456 391 456 l 400 308 l 329 308 q 247 291 280 308 q 204 223 204 269 q 255 154 204 172 q 345 143 286 143 q 426 174 398 143 q 454 259 454 206 l 652 259 "},"Δ":{"x_min":0,"x_max":981.953125,"ha":1057,"o":"m 981 0 l 0 0 l 386 1013 l 594 1013 l 981 0 m 715 175 l 490 765 l 266 175 l 715 175 "},"}":{"x_min":0,"x_max":500,"ha":597,"o":"m 500 294 q 348 246 390 294 q 315 128 315 209 q 320 42 315 101 q 326 -48 326 -17 q 270 -214 326 -161 q 0 -285 196 -285 l 0 -141 q 126 -97 90 -141 q 154 8 154 -64 q 150 91 154 37 q 146 157 146 145 q 172 281 146 235 q 294 366 206 339 q 173 451 208 390 q 146 576 146 500 q 150 655 146 603 q 154 731 154 708 q 126 831 154 799 q 0 872 90 872 l 0 1015 q 270 944 196 1015 q 326 777 326 891 q 322 707 326 747 q 313 593 313 612 q 347 482 313 518 q 500 438 390 438 l 500 294 "},"‰":{"x_min":0,"x_max":1681,"ha":1775,"o":"m 861 484 q 1048 404 979 484 q 1111 228 1111 332 q 1048 51 1111 123 q 859 -29 979 -29 q 672 50 740 -29 q 610 227 610 122 q 672 403 610 331 q 861 484 741 484 m 861 120 q 939 151 911 120 q 967 226 967 183 q 942 299 967 270 q 861 333 912 333 q 783 301 811 333 q 756 226 756 269 q 783 151 756 182 q 861 120 810 120 m 904 984 l 316 -28 l 205 -29 l 793 983 l 904 984 m 250 984 q 436 904 366 984 q 499 730 499 832 q 436 552 499 626 q 248 472 366 472 q 62 552 132 472 q 0 728 0 624 q 62 903 0 831 q 250 984 132 984 m 249 835 q 169 801 198 835 q 140 725 140 768 q 167 652 140 683 q 247 621 195 621 q 327 654 298 621 q 357 730 357 687 q 329 803 357 772 q 249 835 301 835 m 1430 484 q 1618 404 1548 484 q 1681 228 1681 332 q 1618 51 1681 123 q 1429 -29 1548 -29 q 1241 50 1309 -29 q 1179 227 1179 122 q 1241 403 1179 331 q 1430 484 1311 484 m 1431 120 q 1509 151 1481 120 q 1537 226 1537 183 q 1511 299 1537 270 q 1431 333 1482 333 q 1352 301 1380 333 q 1325 226 1325 269 q 1352 151 1325 182 q 1431 120 1379 120 "},"a":{"x_min":0,"x_max":700,"ha":786,"o":"m 700 0 l 488 0 q 465 93 469 45 q 365 5 427 37 q 233 -26 303 -26 q 65 37 130 -26 q 0 205 0 101 q 120 409 0 355 q 343 452 168 431 q 465 522 465 468 q 424 588 465 565 q 337 611 384 611 q 250 581 285 611 q 215 503 215 552 l 26 503 q 113 707 26 633 q 328 775 194 775 q 538 723 444 775 q 657 554 657 659 l 657 137 q 666 73 657 101 q 700 33 675 45 l 700 0 m 465 297 l 465 367 q 299 322 358 340 q 193 217 193 287 q 223 150 193 174 q 298 127 254 127 q 417 175 370 127 q 465 297 465 224 "},"—":{"x_min":0,"x_max":941.671875,"ha":1039,"o":"m 941 297 l 0 297 l 0 450 l 941 450 l 941 297 "},"=":{"x_min":29.171875,"x_max":798.609375,"ha":828,"o":"m 798 502 l 29 502 l 29 635 l 798 635 l 798 502 m 798 204 l 29 204 l 29 339 l 798 339 l 798 204 "},"N":{"x_min":0,"x_max":833,"ha":949,"o":"m 833 0 l 617 0 l 206 695 l 206 0 l 0 0 l 0 1013 l 216 1013 l 629 315 l 629 1013 l 833 1013 l 833 0 "},"ρ":{"x_min":0,"x_max":722,"ha":810,"o":"m 364 -17 q 271 0 313 -17 q 194 48 230 16 l 194 -278 l 0 -278 l 0 370 q 87 656 0 548 q 358 775 183 775 q 626 655 524 775 q 722 372 722 541 q 621 95 722 208 q 364 -17 520 -17 m 360 607 q 237 529 280 607 q 201 377 201 463 q 234 229 201 292 q 355 147 277 147 q 467 210 419 147 q 515 374 515 273 q 471 537 515 468 q 360 607 428 607 "},"2":{"x_min":64,"x_max":764,"ha":828,"o":"m 764 685 q 675 452 764 541 q 484 325 637 415 q 307 168 357 250 l 754 168 l 754 0 l 64 0 q 193 301 64 175 q 433 480 202 311 q 564 673 564 576 q 519 780 564 737 q 416 824 475 824 q 318 780 358 824 q 262 633 270 730 l 80 633 q 184 903 80 807 q 415 988 276 988 q 654 907 552 988 q 764 685 764 819 "},"¯":{"x_min":0,"x_max":775,"ha":771,"o":"m 775 958 l 0 958 l 0 1111 l 775 1111 l 775 958 "},"Z":{"x_min":0,"x_max":804.171875,"ha":906,"o":"m 804 836 l 251 182 l 793 182 l 793 0 l 0 0 l 0 176 l 551 830 l 11 830 l 11 1013 l 804 1013 l 804 836 "},"u":{"x_min":0,"x_max":668,"ha":782,"o":"m 668 0 l 474 0 l 474 89 q 363 9 425 37 q 233 -19 301 -19 q 61 53 123 -19 q 0 239 0 126 l 0 749 l 199 749 l 199 296 q 225 193 199 233 q 316 146 257 146 q 424 193 380 146 q 469 304 469 240 l 469 749 l 668 749 l 668 0 "},"k":{"x_min":0,"x_max":688.890625,"ha":771,"o":"m 688 0 l 450 0 l 270 316 l 196 237 l 196 0 l 0 0 l 0 1013 l 196 1013 l 196 483 l 433 748 l 675 748 l 413 469 l 688 0 "},"Η":{"x_min":0,"x_max":837,"ha":950,"o":"m 837 0 l 627 0 l 627 450 l 210 450 l 210 0 l 0 0 l 0 1013 l 210 1013 l 210 635 l 627 635 l 627 1013 l 837 1013 l 837 0 "},"Α":{"x_min":0,"x_max":966.671875,"ha":1043,"o":"m 966 0 l 747 0 l 679 208 l 286 208 l 218 0 l 0 0 l 361 1013 l 600 1013 l 966 0 m 623 376 l 480 809 l 340 376 l 623 376 "},"s":{"x_min":0,"x_max":681,"ha":775,"o":"m 681 229 q 568 33 681 105 q 340 -29 471 -29 q 107 39 202 -29 q 0 245 0 114 l 201 245 q 252 155 201 189 q 358 128 295 128 q 436 144 401 128 q 482 205 482 166 q 363 284 482 255 q 143 348 181 329 q 25 533 25 408 q 129 716 25 647 q 340 778 220 778 q 554 710 465 778 q 658 522 643 643 l 463 522 q 419 596 458 570 q 327 622 380 622 q 255 606 290 622 q 221 556 221 590 q 339 473 221 506 q 561 404 528 420 q 681 229 681 344 "},"B":{"x_min":0,"x_max":835,"ha":938,"o":"m 674 547 q 791 450 747 518 q 835 304 835 383 q 718 75 835 158 q 461 0 612 0 l 0 0 l 0 1013 l 477 1013 q 697 951 609 1013 q 797 754 797 880 q 765 630 797 686 q 674 547 734 575 m 438 621 q 538 646 495 621 q 590 730 590 676 q 537 814 590 785 q 436 838 494 838 l 199 838 l 199 621 l 438 621 m 445 182 q 561 211 513 182 q 618 311 618 247 q 565 410 618 375 q 444 446 512 446 l 199 446 l 199 182 l 445 182 "},"…":{"x_min":0,"x_max":819,"ha":963,"o":"m 206 0 l 0 0 l 0 207 l 206 207 l 206 0 m 512 0 l 306 0 l 306 207 l 512 207 l 512 0 m 819 0 l 613 0 l 613 207 l 819 207 l 819 0 "},"?":{"x_min":1,"x_max":687,"ha":785,"o":"m 687 734 q 621 563 687 634 q 501 454 560 508 q 436 293 436 386 l 251 293 l 251 391 q 363 557 251 462 q 476 724 476 653 q 432 827 476 788 q 332 866 389 866 q 238 827 275 866 q 195 699 195 781 l 1 699 q 110 955 1 861 q 352 1040 210 1040 q 582 963 489 1040 q 687 734 687 878 m 446 0 l 243 0 l 243 203 l 446 203 l 446 0 "},"H":{"x_min":0,"x_max":838,"ha":953,"o":"m 838 0 l 628 0 l 628 450 l 210 450 l 210 0 l 0 0 l 0 1013 l 210 1013 l 210 635 l 628 635 l 628 1013 l 838 1013 l 838 0 "},"ν":{"x_min":0,"x_max":740.28125,"ha":828,"o":"m 740 749 l 473 0 l 266 0 l 0 749 l 222 749 l 373 211 l 529 749 l 740 749 "},"c":{"x_min":0,"x_max":751.390625,"ha":828,"o":"m 751 282 q 625 58 725 142 q 384 -26 526 -26 q 107 84 215 -26 q 0 366 0 195 q 98 651 0 536 q 370 774 204 774 q 616 700 518 774 q 751 486 715 626 l 536 486 q 477 570 516 538 q 380 607 434 607 q 248 533 298 607 q 204 378 204 466 q 242 219 204 285 q 377 139 290 139 q 483 179 438 139 q 543 282 527 220 l 751 282 "},"¶":{"x_min":0,"x_max":566.671875,"ha":678,"o":"m 21 892 l 52 892 l 98 761 l 145 892 l 176 892 l 178 741 l 157 741 l 157 867 l 108 741 l 88 741 l 40 871 l 40 741 l 21 741 l 21 892 m 308 854 l 308 731 q 252 691 308 691 q 227 691 240 691 q 207 696 213 695 l 207 712 l 253 706 q 288 733 288 706 l 288 763 q 244 741 279 741 q 193 797 193 741 q 261 860 193 860 q 287 860 273 860 q 308 854 302 855 m 288 842 l 263 843 q 213 796 213 843 q 248 756 213 756 q 288 796 288 756 l 288 842 m 566 988 l 502 988 l 502 -1 l 439 -1 l 439 988 l 317 988 l 317 -1 l 252 -1 l 252 602 q 81 653 155 602 q 0 805 0 711 q 101 989 0 918 q 309 1053 194 1053 l 566 1053 l 566 988 "},"β":{"x_min":0,"x_max":703,"ha":789,"o":"m 510 539 q 651 429 600 501 q 703 262 703 357 q 617 53 703 136 q 404 -29 532 -29 q 199 51 279 -29 l 199 -278 l 0 -278 l 0 627 q 77 911 0 812 q 343 1021 163 1021 q 551 957 464 1021 q 649 769 649 886 q 613 638 649 697 q 510 539 577 579 m 344 136 q 452 181 408 136 q 497 291 497 227 q 435 409 497 369 q 299 444 381 444 l 299 600 q 407 634 363 600 q 452 731 452 669 q 417 820 452 784 q 329 857 382 857 q 217 775 246 857 q 199 622 199 725 l 199 393 q 221 226 199 284 q 344 136 254 136 "},"Μ":{"x_min":0,"x_max":1019,"ha":1132,"o":"m 1019 0 l 823 0 l 823 818 l 617 0 l 402 0 l 194 818 l 194 0 l 0 0 l 0 1013 l 309 1013 l 509 241 l 708 1013 l 1019 1013 l 1019 0 "},"Ό":{"x_min":0.15625,"x_max":1174,"ha":1271,"o":"m 676 -29 q 312 127 451 -29 q 179 505 179 277 q 311 883 179 733 q 676 1040 449 1040 q 1040 883 901 1040 q 1174 505 1174 733 q 1041 127 1174 277 q 676 -29 903 -29 m 676 154 q 890 266 811 154 q 961 506 961 366 q 891 745 961 648 q 676 857 812 857 q 462 747 541 857 q 392 506 392 648 q 461 266 392 365 q 676 154 540 154 m 314 1034 l 98 779 l 0 779 l 136 1034 l 314 1034 "},"Ή":{"x_min":0,"x_max":1248,"ha":1361,"o":"m 1248 0 l 1038 0 l 1038 450 l 621 450 l 621 0 l 411 0 l 411 1012 l 621 1012 l 621 635 l 1038 635 l 1038 1012 l 1248 1012 l 1248 0 m 313 1035 l 98 780 l 0 780 l 136 1035 l 313 1035 "},"•":{"x_min":-27.78125,"x_max":691.671875,"ha":775,"o":"m 691 508 q 588 252 691 358 q 331 147 486 147 q 77 251 183 147 q -27 508 -27 355 q 75 761 -27 655 q 331 868 179 868 q 585 763 479 868 q 691 508 691 658 "},"¥":{"x_min":0,"x_max":836,"ha":931,"o":"m 195 625 l 0 1013 l 208 1013 l 427 576 l 626 1013 l 836 1013 l 650 625 l 777 625 l 777 472 l 578 472 l 538 389 l 777 389 l 777 236 l 532 236 l 532 0 l 322 0 l 322 236 l 79 236 l 79 389 l 315 389 l 273 472 l 79 472 l 79 625 l 195 625 "},"(":{"x_min":0,"x_max":388.890625,"ha":486,"o":"m 388 -293 l 243 -293 q 70 14 130 -134 q 0 357 0 189 q 69 703 0 526 q 243 1013 129 856 l 388 1013 q 248 695 297 860 q 200 358 200 530 q 248 24 200 187 q 388 -293 297 -138 "},"U":{"x_min":0,"x_max":813,"ha":926,"o":"m 813 362 q 697 79 813 187 q 405 -29 582 -29 q 114 78 229 -29 q 0 362 0 186 l 0 1013 l 210 1013 l 210 387 q 260 226 210 291 q 408 154 315 154 q 554 226 500 154 q 603 387 603 291 l 603 1013 l 813 1013 l 813 362 "},"γ":{"x_min":0.0625,"x_max":729.234375,"ha":815,"o":"m 729 749 l 457 37 l 457 -278 l 257 -278 l 257 37 q 218 155 243 95 q 170 275 194 215 l 0 749 l 207 749 l 363 284 l 522 749 l 729 749 "},"α":{"x_min":-1,"x_max":722,"ha":835,"o":"m 722 0 l 531 0 l 530 101 q 433 8 491 41 q 304 -25 375 -25 q 72 104 157 -25 q -1 372 -1 216 q 72 643 -1 530 q 308 775 158 775 q 433 744 375 775 q 528 656 491 713 l 528 749 l 722 749 l 722 0 m 361 601 q 233 527 277 601 q 196 375 196 464 q 232 224 196 288 q 358 144 277 144 q 487 217 441 144 q 528 370 528 281 q 489 523 528 457 q 361 601 443 601 "},"F":{"x_min":0,"x_max":706.953125,"ha":778,"o":"m 706 837 l 206 837 l 206 606 l 645 606 l 645 431 l 206 431 l 206 0 l 0 0 l 0 1013 l 706 1013 l 706 837 "},"­":{"x_min":0,"x_max":704.171875,"ha":801,"o":"m 704 297 l 0 297 l 0 450 l 704 450 l 704 297 "},":":{"x_min":0,"x_max":207,"ha":304,"o":"m 207 528 l 0 528 l 0 735 l 207 735 l 207 528 m 207 0 l 0 0 l 0 207 l 207 207 l 207 0 "},"Χ":{"x_min":0,"x_max":894.453125,"ha":978,"o":"m 894 0 l 654 0 l 445 351 l 238 0 l 0 0 l 316 516 l 0 1013 l 238 1013 l 445 660 l 652 1013 l 894 1013 l 577 519 l 894 0 "},"*":{"x_min":115,"x_max":713,"ha":828,"o":"m 713 740 l 518 688 l 651 525 l 531 438 l 412 612 l 290 439 l 173 523 l 308 688 l 115 741 l 159 880 l 342 816 l 343 1013 l 482 1013 l 481 816 l 664 880 l 713 740 "},"†":{"x_min":0,"x_max":809,"ha":894,"o":"m 509 804 l 809 804 l 809 621 l 509 621 l 509 0 l 299 0 l 299 621 l 0 621 l 0 804 l 299 804 l 299 1011 l 509 1011 l 509 804 "},"°":{"x_min":-1,"x_max":363,"ha":460,"o":"m 181 808 q 46 862 94 808 q -1 992 -1 917 q 44 1118 -1 1066 q 181 1175 96 1175 q 317 1118 265 1175 q 363 991 363 1066 q 315 862 363 917 q 181 808 267 808 m 181 908 q 240 933 218 908 q 263 992 263 958 q 242 1051 263 1027 q 181 1075 221 1075 q 120 1050 142 1075 q 99 991 99 1026 q 120 933 99 958 q 181 908 142 908 "},"V":{"x_min":0,"x_max":895.828125,"ha":997,"o":"m 895 1013 l 550 0 l 347 0 l 0 1013 l 231 1013 l 447 256 l 666 1013 l 895 1013 "},"Ξ":{"x_min":0,"x_max":751.390625,"ha":800,"o":"m 733 826 l 5 826 l 5 1012 l 733 1012 l 733 826 m 681 432 l 65 432 l 65 617 l 681 617 l 681 432 m 751 0 l 0 0 l 0 183 l 751 183 l 751 0 "}," ":{"x_min":0,"x_max":0,"ha":853},"Ϋ":{"x_min":-0.21875,"x_max":836.171875,"ha":914,"o":"m 610 1046 l 454 1046 l 454 1215 l 610 1215 l 610 1046 m 369 1046 l 212 1046 l 212 1215 l 369 1215 l 369 1046 m 836 1012 l 532 376 l 532 0 l 322 0 l 322 376 l 0 1012 l 208 1012 l 427 576 l 626 1012 l 836 1012 "},"0":{"x_min":51,"x_max":779,"ha":828,"o":"m 415 -26 q 142 129 242 -26 q 51 476 51 271 q 141 825 51 683 q 415 984 242 984 q 687 825 585 984 q 779 476 779 682 q 688 131 779 271 q 415 -26 587 -26 m 415 137 q 529 242 485 137 q 568 477 568 338 q 530 713 568 619 q 415 821 488 821 q 303 718 344 821 q 262 477 262 616 q 301 237 262 337 q 415 137 341 137 "},"”":{"x_min":0,"x_max":469,"ha":567,"o":"m 192 834 q 137 692 192 751 q 0 626 83 634 l 0 697 q 101 831 101 723 l 0 831 l 0 1013 l 192 1013 l 192 834 m 469 834 q 414 692 469 751 q 277 626 360 634 l 277 697 q 379 831 379 723 l 277 831 l 277 1013 l 469 1013 l 469 834 "},"@":{"x_min":0,"x_max":1276,"ha":1374,"o":"m 1115 -52 q 895 -170 1015 -130 q 647 -211 776 -211 q 158 -34 334 -211 q 0 360 0 123 q 179 810 0 621 q 698 1019 377 1019 q 1138 859 981 1019 q 1276 514 1276 720 q 1173 210 1276 335 q 884 75 1062 75 q 784 90 810 75 q 737 186 749 112 q 647 104 698 133 q 532 75 596 75 q 360 144 420 75 q 308 308 308 205 q 398 568 308 451 q 638 696 497 696 q 731 671 690 696 q 805 604 772 647 l 840 673 l 964 673 q 886 373 915 490 q 856 239 856 257 q 876 201 856 214 q 920 188 895 188 q 1084 284 1019 188 q 1150 511 1150 380 q 1051 779 1150 672 q 715 905 934 905 q 272 734 439 905 q 121 363 121 580 q 250 41 121 170 q 647 -103 394 -103 q 863 -67 751 -103 q 1061 26 975 -32 l 1115 -52 m 769 483 q 770 500 770 489 q 733 567 770 539 q 651 596 695 596 q 508 504 566 596 q 457 322 457 422 q 483 215 457 256 q 561 175 509 175 q 671 221 625 175 q 733 333 718 268 l 769 483 "},"Ί":{"x_min":0,"x_max":619,"ha":732,"o":"m 313 1035 l 98 780 l 0 780 l 136 1035 l 313 1035 m 619 0 l 411 0 l 411 1012 l 619 1012 l 619 0 "},"i":{"x_min":14,"x_max":214,"ha":326,"o":"m 214 830 l 14 830 l 14 1013 l 214 1013 l 214 830 m 214 0 l 14 0 l 14 748 l 214 748 l 214 0 "},"Β":{"x_min":0,"x_max":835,"ha":961,"o":"m 675 547 q 791 450 747 518 q 835 304 835 383 q 718 75 835 158 q 461 0 612 0 l 0 0 l 0 1013 l 477 1013 q 697 951 609 1013 q 797 754 797 880 q 766 630 797 686 q 675 547 734 575 m 439 621 q 539 646 496 621 q 590 730 590 676 q 537 814 590 785 q 436 838 494 838 l 199 838 l 199 621 l 439 621 m 445 182 q 561 211 513 182 q 618 311 618 247 q 565 410 618 375 q 444 446 512 446 l 199 446 l 199 182 l 445 182 "},"υ":{"x_min":0,"x_max":656,"ha":767,"o":"m 656 416 q 568 55 656 145 q 326 -25 490 -25 q 59 97 137 -25 q 0 369 0 191 l 0 749 l 200 749 l 200 369 q 216 222 200 268 q 326 142 245 142 q 440 247 411 142 q 456 422 456 304 l 456 749 l 656 749 l 656 416 "},"]":{"x_min":0,"x_max":349,"ha":446,"o":"m 349 -300 l 0 -300 l 0 -154 l 163 -154 l 163 866 l 0 866 l 0 1013 l 349 1013 l 349 -300 "},"m":{"x_min":0,"x_max":1065,"ha":1174,"o":"m 1065 0 l 866 0 l 866 483 q 836 564 866 532 q 759 596 807 596 q 663 555 700 596 q 627 454 627 514 l 627 0 l 433 0 l 433 481 q 403 563 433 531 q 323 596 374 596 q 231 554 265 596 q 197 453 197 513 l 197 0 l 0 0 l 0 748 l 189 748 l 189 665 q 279 745 226 715 q 392 775 333 775 q 509 744 455 775 q 606 659 563 713 q 695 744 640 713 q 814 775 749 775 q 992 702 920 775 q 1065 523 1065 630 l 1065 0 "},"χ":{"x_min":0,"x_max":759.71875,"ha":847,"o":"m 759 -299 l 548 -299 l 379 66 l 215 -299 l 0 -299 l 261 233 l 13 749 l 230 749 l 379 400 l 527 749 l 738 749 l 500 238 l 759 -299 "},"8":{"x_min":57,"x_max":770,"ha":828,"o":"m 625 516 q 733 416 697 477 q 770 284 770 355 q 675 69 770 161 q 415 -29 574 -29 q 145 65 244 -29 q 57 273 57 150 q 93 413 57 350 q 204 516 130 477 q 112 609 142 556 q 83 718 83 662 q 177 905 83 824 q 414 986 272 986 q 650 904 555 986 q 745 715 745 822 q 716 608 745 658 q 625 516 688 558 m 414 590 q 516 624 479 590 q 553 706 553 659 q 516 791 553 755 q 414 828 480 828 q 311 792 348 828 q 275 706 275 757 q 310 624 275 658 q 414 590 345 590 m 413 135 q 527 179 487 135 q 564 279 564 218 q 525 386 564 341 q 411 436 482 436 q 298 387 341 436 q 261 282 261 344 q 300 178 261 222 q 413 135 340 135 "},"ί":{"x_min":42,"x_max":371.171875,"ha":389,"o":"m 242 0 l 42 0 l 42 748 l 242 748 l 242 0 m 371 1039 l 169 823 l 71 823 l 193 1039 l 371 1039 "},"Ζ":{"x_min":0,"x_max":804.171875,"ha":886,"o":"m 804 835 l 251 182 l 793 182 l 793 0 l 0 0 l 0 176 l 551 829 l 11 829 l 11 1012 l 804 1012 l 804 835 "},"R":{"x_min":0,"x_max":836.109375,"ha":947,"o":"m 836 0 l 608 0 q 588 53 596 20 q 581 144 581 86 q 581 179 581 162 q 581 215 581 197 q 553 345 581 306 q 428 393 518 393 l 208 393 l 208 0 l 0 0 l 0 1013 l 491 1013 q 720 944 630 1013 q 819 734 819 869 q 778 584 819 654 q 664 485 738 513 q 757 415 727 463 q 794 231 794 358 l 794 170 q 800 84 794 116 q 836 31 806 51 l 836 0 m 462 838 l 208 838 l 208 572 l 452 572 q 562 604 517 572 q 612 704 612 640 q 568 801 612 765 q 462 838 525 838 "},"o":{"x_min":0,"x_max":764,"ha":871,"o":"m 380 -26 q 105 86 211 -26 q 0 371 0 199 q 104 660 0 545 q 380 775 209 775 q 658 659 552 775 q 764 371 764 544 q 658 86 764 199 q 380 -26 552 -26 m 379 141 q 515 216 466 141 q 557 373 557 280 q 515 530 557 465 q 379 607 466 607 q 245 530 294 607 q 204 373 204 465 q 245 217 204 282 q 379 141 294 141 "},"5":{"x_min":59,"x_max":767,"ha":828,"o":"m 767 319 q 644 59 767 158 q 382 -29 533 -29 q 158 43 247 -29 q 59 264 59 123 l 252 264 q 295 165 252 201 q 400 129 339 129 q 512 172 466 129 q 564 308 564 220 q 514 437 564 387 q 398 488 464 488 q 329 472 361 488 q 271 420 297 456 l 93 428 l 157 958 l 722 958 l 722 790 l 295 790 l 271 593 q 348 635 306 621 q 431 649 389 649 q 663 551 560 649 q 767 319 767 453 "},"7":{"x_min":65.28125,"x_max":762.5,"ha":828,"o":"m 762 808 q 521 435 604 626 q 409 0 438 244 l 205 0 q 313 422 227 234 q 548 789 387 583 l 65 789 l 65 958 l 762 958 l 762 808 "},"K":{"x_min":0,"x_max":900,"ha":996,"o":"m 900 0 l 647 0 l 316 462 l 208 355 l 208 0 l 0 0 l 0 1013 l 208 1013 l 208 595 l 604 1013 l 863 1013 l 461 603 l 900 0 "},",":{"x_min":0,"x_max":206,"ha":303,"o":"m 206 5 q 150 -151 206 -88 q 0 -238 94 -213 l 0 -159 q 84 -100 56 -137 q 111 -2 111 -62 l 0 -2 l 0 205 l 206 205 l 206 5 "},"d":{"x_min":0,"x_max":722,"ha":836,"o":"m 722 0 l 530 0 l 530 101 q 303 -26 449 -26 q 72 103 155 -26 q 0 373 0 214 q 72 642 0 528 q 305 775 156 775 q 433 743 373 775 q 530 656 492 712 l 530 1013 l 722 1013 l 722 0 m 361 600 q 234 523 280 600 q 196 372 196 458 q 233 220 196 286 q 358 143 278 143 q 489 216 442 143 q 530 369 530 280 q 491 522 530 456 q 361 600 443 600 "},"¨":{"x_min":212,"x_max":609,"ha":933,"o":"m 609 1046 l 453 1046 l 453 1216 l 609 1216 l 609 1046 m 369 1046 l 212 1046 l 212 1216 l 369 1216 l 369 1046 "},"E":{"x_min":0,"x_max":761.109375,"ha":824,"o":"m 761 0 l 0 0 l 0 1013 l 734 1013 l 734 837 l 206 837 l 206 621 l 690 621 l 690 446 l 206 446 l 206 186 l 761 186 l 761 0 "},"Y":{"x_min":0,"x_max":836,"ha":931,"o":"m 836 1013 l 532 376 l 532 0 l 322 0 l 322 376 l 0 1013 l 208 1013 l 427 576 l 626 1013 l 836 1013 "},"\"":{"x_min":0,"x_max":357,"ha":454,"o":"m 357 604 l 225 604 l 225 988 l 357 988 l 357 604 m 132 604 l 0 604 l 0 988 l 132 988 l 132 604 "},"‹":{"x_min":35.984375,"x_max":791.671875,"ha":828,"o":"m 791 17 l 36 352 l 35 487 l 791 823 l 791 672 l 229 421 l 791 168 l 791 17 "},"„":{"x_min":0,"x_max":483,"ha":588,"o":"m 206 5 q 150 -151 206 -88 q 0 -238 94 -213 l 0 -159 q 84 -100 56 -137 q 111 -2 111 -62 l 0 -2 l 0 205 l 206 205 l 206 5 m 483 5 q 427 -151 483 -88 q 277 -238 371 -213 l 277 -159 q 361 -100 334 -137 q 388 -2 388 -62 l 277 -2 l 277 205 l 483 205 l 483 5 "},"δ":{"x_min":6,"x_max":732,"ha":835,"o":"m 732 352 q 630 76 732 177 q 354 -25 529 -25 q 101 74 197 -25 q 6 333 6 174 q 89 581 6 480 q 323 690 178 690 q 66 864 201 787 l 66 1013 l 669 1013 l 669 856 l 348 856 q 532 729 461 789 q 673 566 625 651 q 732 352 732 465 m 419 551 q 259 496 321 551 q 198 344 198 441 q 238 208 198 267 q 357 140 283 140 q 484 203 437 140 q 526 344 526 260 q 499 466 526 410 q 419 551 473 521 "},"έ":{"x_min":16.671875,"x_max":652.78125,"ha":742,"o":"m 652 259 q 565 49 652 123 q 340 -25 479 -25 q 102 39 188 -25 q 16 197 16 104 q 45 299 16 250 q 134 390 75 348 q 58 456 86 419 q 25 552 25 502 q 120 717 25 653 q 322 776 208 776 q 537 710 456 776 q 625 508 625 639 l 445 508 q 415 585 445 563 q 327 608 386 608 q 254 590 293 608 q 215 544 215 573 q 252 469 215 490 q 336 453 280 453 q 369 455 347 453 q 400 456 391 456 l 400 308 l 329 308 q 247 291 280 308 q 204 223 204 269 q 255 154 204 172 q 345 143 286 143 q 426 174 398 143 q 454 259 454 206 l 652 259 m 579 1039 l 377 823 l 279 823 l 401 1039 l 579 1039 "},"ω":{"x_min":0,"x_max":945,"ha":1051,"o":"m 565 323 l 565 289 q 577 190 565 221 q 651 142 597 142 q 718 189 694 142 q 742 365 742 237 q 703 565 742 462 q 610 749 671 650 l 814 749 q 910 547 876 650 q 945 337 945 444 q 874 96 945 205 q 668 -29 793 -29 q 551 0 608 -29 q 470 78 495 30 q 390 0 444 28 q 276 -29 337 -29 q 69 96 149 -29 q 0 337 0 204 q 36 553 0 444 q 130 749 68 650 l 334 749 q 241 565 273 650 q 203 365 203 461 q 219 222 203 279 q 292 142 243 142 q 360 183 342 142 q 373 271 373 211 q 372 298 372 285 q 372 323 372 311 l 372 528 l 566 528 l 565 323 "},"´":{"x_min":0,"x_max":132,"ha":299,"o":"m 132 604 l 0 604 l 0 988 l 132 988 l 132 604 "},"±":{"x_min":29,"x_max":798,"ha":828,"o":"m 798 480 l 484 480 l 484 254 l 344 254 l 344 480 l 29 480 l 29 615 l 344 615 l 344 842 l 484 842 l 484 615 l 798 615 l 798 480 m 798 0 l 29 0 l 29 136 l 798 136 l 798 0 "},"|":{"x_min":0,"x_max":143,"ha":240,"o":"m 143 462 l 0 462 l 0 984 l 143 984 l 143 462 m 143 -242 l 0 -242 l 0 280 l 143 280 l 143 -242 "},"ϋ":{"x_min":0,"x_max":656,"ha":767,"o":"m 535 810 l 406 810 l 406 952 l 535 952 l 535 810 m 271 810 l 142 810 l 142 952 l 271 952 l 271 810 m 656 417 q 568 55 656 146 q 326 -25 490 -25 q 59 97 137 -25 q 0 369 0 192 l 0 748 l 200 748 l 200 369 q 216 222 200 268 q 326 142 245 142 q 440 247 411 142 q 456 422 456 304 l 456 748 l 656 748 l 656 417 "},"§":{"x_min":0,"x_max":633,"ha":731,"o":"m 633 469 q 601 356 633 406 q 512 274 569 305 q 570 197 548 242 q 593 105 593 152 q 501 -76 593 -5 q 301 -142 416 -142 q 122 -82 193 -142 q 43 108 43 -15 l 212 108 q 251 27 220 53 q 321 1 283 1 q 389 23 360 1 q 419 83 419 46 q 310 194 419 139 q 108 297 111 295 q 0 476 0 372 q 33 584 0 537 q 120 659 62 626 q 72 720 91 686 q 53 790 53 755 q 133 978 53 908 q 312 1042 207 1042 q 483 984 412 1042 q 574 807 562 921 l 409 807 q 379 875 409 851 q 307 900 349 900 q 244 881 270 900 q 218 829 218 862 q 324 731 218 781 q 524 636 506 647 q 633 469 633 565 m 419 334 q 473 411 473 372 q 451 459 473 436 q 390 502 430 481 l 209 595 q 167 557 182 577 q 153 520 153 537 q 187 461 153 491 q 263 413 212 440 l 419 334 "},"b":{"x_min":0,"x_max":722,"ha":822,"o":"m 416 -26 q 289 6 346 -26 q 192 101 232 39 l 192 0 l 0 0 l 0 1013 l 192 1013 l 192 656 q 286 743 226 712 q 415 775 346 775 q 649 644 564 775 q 722 374 722 533 q 649 106 722 218 q 416 -26 565 -26 m 361 600 q 232 524 279 600 q 192 371 192 459 q 229 221 192 284 q 357 145 275 145 q 487 221 441 145 q 526 374 526 285 q 488 523 526 460 q 361 600 442 600 "},"q":{"x_min":0,"x_max":722,"ha":833,"o":"m 722 -298 l 530 -298 l 530 97 q 306 -25 449 -25 q 73 104 159 -25 q 0 372 0 216 q 72 643 0 529 q 305 775 156 775 q 430 742 371 775 q 530 654 488 709 l 530 750 l 722 750 l 722 -298 m 360 601 q 234 527 278 601 q 197 378 197 466 q 233 225 197 291 q 357 144 277 144 q 488 217 441 144 q 530 370 530 282 q 491 523 530 459 q 360 601 443 601 "},"Ω":{"x_min":-0.03125,"x_max":1008.53125,"ha":1108,"o":"m 1008 0 l 589 0 l 589 199 q 717 368 670 265 q 764 580 764 471 q 698 778 764 706 q 504 855 629 855 q 311 773 380 855 q 243 563 243 691 q 289 360 243 458 q 419 199 336 262 l 419 0 l 0 0 l 0 176 l 202 176 q 77 355 123 251 q 32 569 32 459 q 165 908 32 776 q 505 1040 298 1040 q 844 912 711 1040 q 977 578 977 785 q 931 362 977 467 q 805 176 886 256 l 1008 176 l 1008 0 "},"ύ":{"x_min":0,"x_max":656,"ha":767,"o":"m 656 417 q 568 55 656 146 q 326 -25 490 -25 q 59 97 137 -25 q 0 369 0 192 l 0 748 l 200 748 l 201 369 q 218 222 201 269 q 326 142 245 142 q 440 247 411 142 q 456 422 456 304 l 456 748 l 656 748 l 656 417 m 579 1039 l 378 823 l 279 823 l 401 1039 l 579 1039 "},"z":{"x_min":0,"x_max":663.890625,"ha":753,"o":"m 663 0 l 0 0 l 0 154 l 411 591 l 25 591 l 25 749 l 650 749 l 650 584 l 245 165 l 663 165 l 663 0 "},"™":{"x_min":0,"x_max":951,"ha":1063,"o":"m 405 921 l 255 921 l 255 506 l 149 506 l 149 921 l 0 921 l 0 1013 l 405 1013 l 405 921 m 951 506 l 852 506 l 852 916 l 750 506 l 643 506 l 539 915 l 539 506 l 442 506 l 442 1013 l 595 1012 l 695 625 l 794 1013 l 951 1013 l 951 506 "},"ή":{"x_min":0,"x_max":669,"ha":779,"o":"m 669 -278 l 469 -278 l 469 390 q 448 526 469 473 q 348 606 417 606 q 244 553 288 606 q 201 441 201 501 l 201 0 l 0 0 l 0 749 l 201 749 l 201 665 q 301 744 244 715 q 423 774 359 774 q 606 685 538 774 q 669 484 669 603 l 669 -278 m 495 1039 l 293 823 l 195 823 l 317 1039 l 495 1039 "},"Θ":{"x_min":0,"x_max":993,"ha":1092,"o":"m 497 -29 q 133 127 272 -29 q 0 505 0 277 q 133 883 0 733 q 497 1040 272 1040 q 861 883 722 1040 q 993 505 993 733 q 861 127 993 277 q 497 -29 722 -29 m 497 154 q 711 266 631 154 q 782 506 782 367 q 712 746 782 648 q 497 858 634 858 q 281 746 361 858 q 211 506 211 648 q 280 266 211 365 q 497 154 359 154 m 676 430 l 316 430 l 316 593 l 676 593 l 676 430 "},"®":{"x_min":3,"x_max":1007,"ha":1104,"o":"m 507 -6 q 129 153 269 -6 q 3 506 3 298 q 127 857 3 713 q 502 1017 266 1017 q 880 855 740 1017 q 1007 502 1007 711 q 882 152 1007 295 q 507 -6 743 -6 m 502 934 q 184 800 302 934 q 79 505 79 680 q 184 210 79 331 q 501 76 302 76 q 819 210 701 76 q 925 507 925 331 q 820 800 925 682 q 502 934 704 934 m 782 190 l 639 190 q 627 225 632 202 q 623 285 623 248 l 623 326 q 603 411 623 384 q 527 439 584 439 l 388 439 l 388 190 l 257 190 l 257 829 l 566 829 q 709 787 654 829 q 772 654 772 740 q 746 559 772 604 q 675 497 720 514 q 735 451 714 483 q 756 341 756 419 l 756 299 q 760 244 756 265 q 782 212 764 223 l 782 190 m 546 718 l 388 718 l 388 552 l 541 552 q 612 572 584 552 q 641 635 641 593 q 614 695 641 672 q 546 718 587 718 "},"~":{"x_min":0,"x_max":851,"ha":949,"o":"m 851 968 q 795 750 851 831 q 599 656 730 656 q 406 744 506 656 q 259 832 305 832 q 162 775 193 832 q 139 656 139 730 l 0 656 q 58 871 0 787 q 251 968 124 968 q 442 879 341 968 q 596 791 544 791 q 691 849 663 791 q 712 968 712 892 l 851 968 "},"Ε":{"x_min":0,"x_max":761.546875,"ha":824,"o":"m 761 0 l 0 0 l 0 1012 l 735 1012 l 735 836 l 206 836 l 206 621 l 690 621 l 690 446 l 206 446 l 206 186 l 761 186 l 761 0 "},"³":{"x_min":0,"x_max":467,"ha":564,"o":"m 467 555 q 393 413 467 466 q 229 365 325 365 q 70 413 134 365 q 0 565 0 467 l 123 565 q 163 484 131 512 q 229 461 190 461 q 299 486 269 461 q 329 553 329 512 q 281 627 329 607 q 187 641 248 641 l 187 722 q 268 737 237 722 q 312 804 312 758 q 285 859 312 837 q 224 882 259 882 q 165 858 189 882 q 135 783 140 834 l 12 783 q 86 930 20 878 q 230 976 145 976 q 379 931 314 976 q 444 813 444 887 q 423 744 444 773 q 365 695 402 716 q 439 640 412 676 q 467 555 467 605 "},"[":{"x_min":0,"x_max":347.21875,"ha":444,"o":"m 347 -300 l 0 -300 l 0 1013 l 347 1013 l 347 866 l 188 866 l 188 -154 l 347 -154 l 347 -300 "},"L":{"x_min":0,"x_max":704.171875,"ha":763,"o":"m 704 0 l 0 0 l 0 1013 l 208 1013 l 208 186 l 704 186 l 704 0 "},"σ":{"x_min":0,"x_max":851.3125,"ha":940,"o":"m 851 594 l 712 594 q 761 369 761 485 q 658 83 761 191 q 379 -25 555 -25 q 104 87 208 -25 q 0 372 0 200 q 103 659 0 544 q 378 775 207 775 q 464 762 407 775 q 549 750 521 750 l 851 750 l 851 594 m 379 142 q 515 216 466 142 q 557 373 557 280 q 515 530 557 465 q 379 608 465 608 q 244 530 293 608 q 203 373 203 465 q 244 218 203 283 q 379 142 293 142 "},"ζ":{"x_min":0,"x_max":622,"ha":701,"o":"m 622 -32 q 604 -158 622 -98 q 551 -278 587 -218 l 373 -278 q 426 -180 406 -229 q 446 -80 446 -131 q 421 -22 446 -37 q 354 -8 397 -8 q 316 -9 341 -8 q 280 -11 291 -11 q 75 69 150 -11 q 0 283 0 150 q 87 596 0 437 q 291 856 162 730 l 47 856 l 47 1013 l 592 1013 l 592 904 q 317 660 422 800 q 197 318 197 497 q 306 141 197 169 q 510 123 408 131 q 622 -32 622 102 "},"θ":{"x_min":0,"x_max":714,"ha":817,"o":"m 357 1022 q 633 833 534 1022 q 714 486 714 679 q 634 148 714 288 q 354 -25 536 -25 q 79 147 175 -25 q 0 481 0 288 q 79 831 0 679 q 357 1022 177 1022 m 510 590 q 475 763 510 687 q 351 862 430 862 q 233 763 272 862 q 204 590 204 689 l 510 590 m 510 440 l 204 440 q 233 251 204 337 q 355 131 274 131 q 478 248 434 131 q 510 440 510 337 "},"Ο":{"x_min":0,"x_max":995,"ha":1092,"o":"m 497 -29 q 133 127 272 -29 q 0 505 0 277 q 132 883 0 733 q 497 1040 270 1040 q 861 883 722 1040 q 995 505 995 733 q 862 127 995 277 q 497 -29 724 -29 m 497 154 q 711 266 632 154 q 781 506 781 365 q 711 745 781 647 q 497 857 632 857 q 283 747 361 857 q 213 506 213 647 q 282 266 213 365 q 497 154 361 154 "},"Γ":{"x_min":0,"x_max":703.84375,"ha":742,"o":"m 703 836 l 208 836 l 208 0 l 0 0 l 0 1012 l 703 1012 l 703 836 "}," ":{"x_min":0,"x_max":0,"ha":375},"%":{"x_min":0,"x_max":1111,"ha":1213,"o":"m 861 484 q 1048 404 979 484 q 1111 228 1111 332 q 1048 51 1111 123 q 859 -29 979 -29 q 672 50 740 -29 q 610 227 610 122 q 672 403 610 331 q 861 484 741 484 m 861 120 q 939 151 911 120 q 967 226 967 183 q 942 299 967 270 q 861 333 912 333 q 783 301 811 333 q 756 226 756 269 q 783 151 756 182 q 861 120 810 120 m 904 984 l 316 -28 l 205 -29 l 793 983 l 904 984 m 250 984 q 436 904 366 984 q 499 730 499 832 q 436 552 499 626 q 248 472 366 472 q 62 552 132 472 q 0 728 0 624 q 62 903 0 831 q 250 984 132 984 m 249 835 q 169 801 198 835 q 140 725 140 768 q 167 652 140 683 q 247 621 195 621 q 327 654 298 621 q 357 730 357 687 q 329 803 357 772 q 249 835 301 835 "},"P":{"x_min":0,"x_max":771,"ha":838,"o":"m 208 361 l 208 0 l 0 0 l 0 1013 l 450 1013 q 682 919 593 1013 q 771 682 771 826 q 687 452 771 544 q 466 361 604 361 l 208 361 m 421 837 l 208 837 l 208 544 l 410 544 q 525 579 480 544 q 571 683 571 615 q 527 792 571 747 q 421 837 484 837 "},"Έ":{"x_min":0,"x_max":1172.546875,"ha":1235,"o":"m 1172 0 l 411 0 l 411 1012 l 1146 1012 l 1146 836 l 617 836 l 617 621 l 1101 621 l 1101 446 l 617 446 l 617 186 l 1172 186 l 1172 0 m 313 1035 l 98 780 l 0 780 l 136 1035 l 313 1035 "},"Ώ":{"x_min":0.4375,"x_max":1189.546875,"ha":1289,"o":"m 1189 0 l 770 0 l 770 199 q 897 369 849 263 q 945 580 945 474 q 879 778 945 706 q 685 855 810 855 q 492 773 561 855 q 424 563 424 691 q 470 360 424 458 q 600 199 517 262 l 600 0 l 180 0 l 180 176 l 383 176 q 258 355 304 251 q 213 569 213 459 q 346 908 213 776 q 686 1040 479 1040 q 1025 912 892 1040 q 1158 578 1158 785 q 1112 362 1158 467 q 986 176 1067 256 l 1189 176 l 1189 0 m 314 1092 l 99 837 l 0 837 l 136 1092 l 314 1092 "},"_":{"x_min":61.109375,"x_max":766.671875,"ha":828,"o":"m 766 -333 l 61 -333 l 61 -190 l 766 -190 l 766 -333 "},"Ϊ":{"x_min":-56,"x_max":342,"ha":503,"o":"m 342 1046 l 186 1046 l 186 1215 l 342 1215 l 342 1046 m 101 1046 l -56 1046 l -56 1215 l 101 1215 l 101 1046 m 249 0 l 41 0 l 41 1012 l 249 1012 l 249 0 "},"+":{"x_min":43,"x_max":784,"ha":828,"o":"m 784 353 l 483 353 l 483 0 l 343 0 l 343 353 l 43 353 l 43 489 l 343 489 l 343 840 l 483 840 l 483 489 l 784 489 l 784 353 "},"½":{"x_min":0,"x_max":1090,"ha":1188,"o":"m 1090 380 q 992 230 1090 301 q 779 101 886 165 q 822 94 784 95 q 924 93 859 93 l 951 93 l 973 93 l 992 93 l 1009 93 q 1046 93 1027 93 q 1085 93 1066 93 l 1085 0 l 650 0 l 654 38 q 815 233 665 137 q 965 376 965 330 q 936 436 965 412 q 869 461 908 461 q 806 435 831 461 q 774 354 780 409 l 659 354 q 724 505 659 451 q 870 554 783 554 q 1024 506 958 554 q 1090 380 1090 459 m 868 998 l 268 -28 l 154 -27 l 757 999 l 868 998 m 272 422 l 147 422 l 147 799 l 0 799 l 0 875 q 126 900 91 875 q 170 973 162 926 l 272 973 l 272 422 "},"Ρ":{"x_min":0,"x_max":771,"ha":838,"o":"m 208 361 l 208 0 l 0 0 l 0 1012 l 450 1012 q 682 919 593 1012 q 771 681 771 826 q 687 452 771 544 q 466 361 604 361 l 208 361 m 422 836 l 209 836 l 209 544 l 410 544 q 525 579 480 544 q 571 683 571 614 q 527 791 571 747 q 422 836 484 836 "},"'":{"x_min":0,"x_max":192,"ha":289,"o":"m 192 834 q 137 692 192 751 q 0 626 82 632 l 0 697 q 101 830 101 726 l 0 830 l 0 1013 l 192 1013 l 192 834 "},"ª":{"x_min":0,"x_max":350,"ha":393,"o":"m 350 625 l 245 625 q 237 648 241 636 q 233 672 233 661 q 117 611 192 611 q 33 643 66 611 q 0 727 0 675 q 116 846 0 828 q 233 886 233 864 q 211 919 233 907 q 168 931 190 931 q 108 877 108 931 l 14 877 q 56 977 14 942 q 165 1013 98 1013 q 270 987 224 1013 q 329 903 329 955 l 329 694 q 332 661 329 675 q 350 641 336 648 l 350 625 m 233 774 l 233 809 q 151 786 180 796 q 97 733 97 768 q 111 700 97 712 q 149 689 126 689 q 210 713 187 689 q 233 774 233 737 "},"΅":{"x_min":57,"x_max":584,"ha":753,"o":"m 584 810 l 455 810 l 455 952 l 584 952 l 584 810 m 521 1064 l 305 810 l 207 810 l 343 1064 l 521 1064 m 186 810 l 57 810 l 57 952 l 186 952 l 186 810 "},"T":{"x_min":0,"x_max":809,"ha":894,"o":"m 809 831 l 509 831 l 509 0 l 299 0 l 299 831 l 0 831 l 0 1013 l 809 1013 l 809 831 "},"Φ":{"x_min":0,"x_max":949,"ha":1032,"o":"m 566 0 l 385 0 l 385 121 q 111 230 222 121 q 0 508 0 340 q 112 775 0 669 q 385 892 219 875 l 385 1013 l 566 1013 l 566 892 q 836 776 732 875 q 949 507 949 671 q 838 231 949 341 q 566 121 728 121 l 566 0 m 566 285 q 701 352 650 285 q 753 508 753 419 q 703 658 753 597 q 566 729 653 720 l 566 285 m 385 285 l 385 729 q 245 661 297 717 q 193 516 193 604 q 246 356 193 427 q 385 285 300 285 "},"j":{"x_min":-45.828125,"x_max":242,"ha":361,"o":"m 242 830 l 42 830 l 42 1013 l 242 1013 l 242 830 m 242 -119 q 180 -267 242 -221 q 20 -308 127 -308 l -45 -308 l -45 -140 l -24 -140 q 25 -130 8 -140 q 42 -88 42 -120 l 42 748 l 242 748 l 242 -119 "},"Σ":{"x_min":0,"x_max":772.21875,"ha":849,"o":"m 772 0 l 0 0 l 0 140 l 368 526 l 18 862 l 18 1012 l 740 1012 l 740 836 l 315 836 l 619 523 l 298 175 l 772 175 l 772 0 "},"1":{"x_min":197.609375,"x_max":628,"ha":828,"o":"m 628 0 l 434 0 l 434 674 l 197 674 l 197 810 q 373 837 318 810 q 468 984 450 876 l 628 984 l 628 0 "},"›":{"x_min":36.109375,"x_max":792,"ha":828,"o":"m 792 352 l 36 17 l 36 168 l 594 420 l 36 672 l 36 823 l 792 487 l 792 352 "},"<":{"x_min":35.984375,"x_max":791.671875,"ha":828,"o":"m 791 17 l 36 352 l 35 487 l 791 823 l 791 672 l 229 421 l 791 168 l 791 17 "},"£":{"x_min":0,"x_max":716.546875,"ha":814,"o":"m 716 38 q 603 -9 658 5 q 502 -24 548 -24 q 398 -10 451 -24 q 239 25 266 25 q 161 12 200 25 q 77 -29 122 0 l 0 113 q 110 211 81 174 q 151 315 151 259 q 117 440 151 365 l 0 440 l 0 515 l 73 515 q 35 610 52 560 q 15 710 15 671 q 119 910 15 831 q 349 984 216 984 q 570 910 480 984 q 693 668 674 826 l 501 668 q 455 791 501 746 q 353 830 414 830 q 256 795 298 830 q 215 705 215 760 q 249 583 215 655 q 283 515 266 548 l 479 515 l 479 440 l 309 440 q 316 394 313 413 q 319 355 319 374 q 287 241 319 291 q 188 135 263 205 q 262 160 225 152 q 332 168 298 168 q 455 151 368 168 q 523 143 500 143 q 588 152 558 143 q 654 189 617 162 l 716 38 "},"t":{"x_min":0,"x_max":412,"ha":511,"o":"m 412 -6 q 349 -8 391 -6 q 287 -11 307 -11 q 137 38 177 -11 q 97 203 97 87 l 97 609 l 0 609 l 0 749 l 97 749 l 97 951 l 297 951 l 297 749 l 412 749 l 412 609 l 297 609 l 297 191 q 315 152 297 162 q 366 143 334 143 q 389 143 378 143 q 412 143 400 143 l 412 -6 "},"¬":{"x_min":0,"x_max":704,"ha":801,"o":"m 704 93 l 551 93 l 551 297 l 0 297 l 0 450 l 704 450 l 704 93 "},"λ":{"x_min":0,"x_max":701.390625,"ha":775,"o":"m 701 0 l 491 0 l 345 444 l 195 0 l 0 0 l 238 697 l 131 1013 l 334 1013 l 701 0 "},"W":{"x_min":0,"x_max":1291.671875,"ha":1399,"o":"m 1291 1013 l 1002 0 l 802 0 l 645 777 l 490 0 l 288 0 l 0 1013 l 215 1013 l 388 298 l 534 1012 l 757 1013 l 904 299 l 1076 1013 l 1291 1013 "},">":{"x_min":36.109375,"x_max":792,"ha":828,"o":"m 792 352 l 36 17 l 36 168 l 594 420 l 36 672 l 36 823 l 792 487 l 792 352 "},"v":{"x_min":0,"x_max":740.28125,"ha":828,"o":"m 740 749 l 473 0 l 266 0 l 0 749 l 222 749 l 373 211 l 529 749 l 740 749 "},"τ":{"x_min":0.28125,"x_max":618.734375,"ha":699,"o":"m 618 593 l 409 593 l 409 0 l 210 0 l 210 593 l 0 593 l 0 749 l 618 749 l 618 593 "},"ξ":{"x_min":0,"x_max":640,"ha":715,"o":"m 640 -14 q 619 -157 640 -84 q 563 -299 599 -230 l 399 -299 q 442 -194 433 -223 q 468 -85 468 -126 q 440 -25 468 -41 q 368 -10 412 -10 q 333 -11 355 -10 q 302 -13 311 -13 q 91 60 179 -13 q 0 259 0 138 q 56 426 0 354 q 201 530 109 493 q 106 594 144 553 q 65 699 65 642 q 94 787 65 747 q 169 856 123 828 l 22 856 l 22 1013 l 597 1013 l 597 856 l 497 857 q 345 840 398 857 q 257 736 257 812 q 366 614 257 642 q 552 602 416 602 l 552 446 l 513 446 q 313 425 379 446 q 199 284 199 389 q 312 162 199 184 q 524 136 418 148 q 640 -14 640 105 "},"&":{"x_min":-1,"x_max":910.109375,"ha":1007,"o":"m 910 -1 l 676 -1 l 607 83 q 291 -47 439 -47 q 50 100 135 -47 q -1 273 -1 190 q 51 431 -1 357 q 218 568 104 505 q 151 661 169 629 q 120 769 120 717 q 201 951 120 885 q 382 1013 276 1013 q 555 957 485 1013 q 635 789 635 894 q 584 644 635 709 q 468 539 548 597 l 615 359 q 664 527 654 440 l 844 527 q 725 223 824 359 l 910 -1 m 461 787 q 436 848 461 826 q 381 870 412 870 q 325 849 349 870 q 301 792 301 829 q 324 719 301 757 q 372 660 335 703 q 430 714 405 680 q 461 787 461 753 m 500 214 l 318 441 q 198 286 198 363 q 225 204 198 248 q 347 135 268 135 q 425 153 388 135 q 500 214 462 172 "},"Λ":{"x_min":0,"x_max":894.453125,"ha":974,"o":"m 894 0 l 666 0 l 447 757 l 225 0 l 0 0 l 344 1013 l 547 1013 l 894 0 "},"I":{"x_min":41,"x_max":249,"ha":365,"o":"m 249 0 l 41 0 l 41 1013 l 249 1013 l 249 0 "},"G":{"x_min":0,"x_max":971,"ha":1057,"o":"m 971 -1 l 829 -1 l 805 118 q 479 -29 670 -29 q 126 133 261 -29 q 0 509 0 286 q 130 884 0 737 q 493 1040 268 1040 q 790 948 659 1040 q 961 698 920 857 l 736 698 q 643 813 709 769 q 500 857 578 857 q 285 746 364 857 q 213 504 213 644 q 285 263 213 361 q 505 154 365 154 q 667 217 598 154 q 761 374 736 280 l 548 374 l 548 548 l 971 548 l 971 -1 "},"ΰ":{"x_min":0,"x_max":655,"ha":767,"o":"m 583 810 l 454 810 l 454 952 l 583 952 l 583 810 m 186 810 l 57 809 l 57 952 l 186 952 l 186 810 m 516 1039 l 315 823 l 216 823 l 338 1039 l 516 1039 m 655 417 q 567 55 655 146 q 326 -25 489 -25 q 59 97 137 -25 q 0 369 0 192 l 0 748 l 200 748 l 201 369 q 218 222 201 269 q 326 142 245 142 q 439 247 410 142 q 455 422 455 304 l 455 748 l 655 748 l 655 417 "},"`":{"x_min":0,"x_max":190,"ha":288,"o":"m 190 654 l 0 654 l 0 830 q 55 970 0 909 q 190 1040 110 1031 l 190 969 q 111 922 134 952 q 88 836 88 892 l 190 836 l 190 654 "},"·":{"x_min":0,"x_max":207,"ha":304,"o":"m 207 528 l 0 528 l 0 735 l 207 735 l 207 528 "},"Υ":{"x_min":-0.21875,"x_max":836.171875,"ha":914,"o":"m 836 1013 l 532 376 l 532 0 l 322 0 l 322 376 l 0 1013 l 208 1013 l 427 576 l 626 1013 l 836 1013 "},"r":{"x_min":0,"x_max":431.9375,"ha":513,"o":"m 431 564 q 269 536 320 564 q 200 395 200 498 l 200 0 l 0 0 l 0 748 l 183 748 l 183 618 q 285 731 224 694 q 431 768 345 768 l 431 564 "},"x":{"x_min":0,"x_max":738.890625,"ha":826,"o":"m 738 0 l 504 0 l 366 238 l 230 0 l 0 0 l 252 382 l 11 749 l 238 749 l 372 522 l 502 749 l 725 749 l 488 384 l 738 0 "},"μ":{"x_min":0,"x_max":647,"ha":754,"o":"m 647 0 l 477 0 l 477 68 q 411 9 448 30 q 330 -11 374 -11 q 261 3 295 -11 q 199 43 226 18 l 199 -278 l 0 -278 l 0 749 l 199 749 l 199 358 q 216 222 199 268 q 322 152 244 152 q 435 240 410 152 q 448 401 448 283 l 448 749 l 647 749 l 647 0 "},"h":{"x_min":0,"x_max":669,"ha":782,"o":"m 669 0 l 469 0 l 469 390 q 449 526 469 472 q 353 607 420 607 q 248 554 295 607 q 201 441 201 501 l 201 0 l 0 0 l 0 1013 l 201 1013 l 201 665 q 303 743 245 715 q 425 772 362 772 q 609 684 542 772 q 669 484 669 605 l 669 0 "},".":{"x_min":0,"x_max":206,"ha":303,"o":"m 206 0 l 0 0 l 0 207 l 206 207 l 206 0 "},"φ":{"x_min":-1,"x_max":921,"ha":990,"o":"m 542 -278 l 367 -278 l 367 -22 q 99 92 200 -22 q -1 376 -1 206 q 72 627 -1 520 q 288 769 151 742 l 288 581 q 222 495 243 550 q 202 378 202 439 q 240 228 202 291 q 367 145 285 157 l 367 776 l 515 776 q 807 667 694 776 q 921 379 921 558 q 815 93 921 209 q 542 -22 709 -22 l 542 -278 m 542 145 q 672 225 625 145 q 713 381 713 291 q 671 536 713 470 q 542 611 624 611 l 542 145 "},";":{"x_min":0,"x_max":208,"ha":306,"o":"m 208 528 l 0 528 l 0 735 l 208 735 l 208 528 m 208 6 q 152 -151 208 -89 q 0 -238 96 -212 l 0 -158 q 87 -100 61 -136 q 113 0 113 -65 l 0 0 l 0 207 l 208 207 l 208 6 "},"f":{"x_min":0,"x_max":424,"ha":525,"o":"m 424 609 l 300 609 l 300 0 l 107 0 l 107 609 l 0 609 l 0 749 l 107 749 q 145 949 107 894 q 328 1019 193 1019 l 424 1015 l 424 855 l 362 855 q 312 841 324 855 q 300 797 300 827 q 300 773 300 786 q 300 749 300 761 l 424 749 l 424 609 "},"“":{"x_min":0,"x_max":468,"ha":567,"o":"m 190 631 l 0 631 l 0 807 q 55 947 0 885 q 190 1017 110 1010 l 190 947 q 88 813 88 921 l 190 813 l 190 631 m 468 631 l 278 631 l 278 807 q 333 947 278 885 q 468 1017 388 1010 l 468 947 q 366 813 366 921 l 468 813 l 468 631 "},"A":{"x_min":0,"x_max":966.671875,"ha":1069,"o":"m 966 0 l 747 0 l 679 208 l 286 208 l 218 0 l 0 0 l 361 1013 l 600 1013 l 966 0 m 623 376 l 480 810 l 340 376 l 623 376 "},"6":{"x_min":57,"x_max":771,"ha":828,"o":"m 744 734 l 544 734 q 500 802 533 776 q 425 828 466 828 q 315 769 359 828 q 264 571 264 701 q 451 638 343 638 q 691 537 602 638 q 771 315 771 449 q 683 79 771 176 q 420 -29 586 -29 q 134 123 227 -29 q 57 455 57 250 q 184 865 57 721 q 452 988 293 988 q 657 916 570 988 q 744 734 744 845 m 426 128 q 538 178 498 128 q 578 300 578 229 q 538 422 578 372 q 415 479 493 479 q 303 430 342 479 q 264 313 264 381 q 308 184 264 240 q 426 128 352 128 "},"‘":{"x_min":0,"x_max":190,"ha":289,"o":"m 190 631 l 0 631 l 0 807 q 55 947 0 885 q 190 1017 110 1010 l 190 947 q 88 813 88 921 l 190 813 l 190 631 "},"ϊ":{"x_min":-55,"x_max":337,"ha":389,"o":"m 337 810 l 208 810 l 208 952 l 337 952 l 337 810 m 74 810 l -55 810 l -55 952 l 74 952 l 74 810 m 242 0 l 42 0 l 42 748 l 242 748 l 242 0 "},"π":{"x_min":0.5,"x_max":838.890625,"ha":938,"o":"m 838 593 l 750 593 l 750 0 l 549 0 l 549 593 l 287 593 l 287 0 l 88 0 l 88 593 l 0 593 l 0 749 l 838 749 l 838 593 "},"ά":{"x_min":-1,"x_max":722,"ha":835,"o":"m 722 0 l 531 0 l 530 101 q 433 8 491 41 q 304 -25 375 -25 q 72 104 157 -25 q -1 372 -1 216 q 72 643 -1 530 q 308 775 158 775 q 433 744 375 775 q 528 656 491 713 l 528 749 l 722 749 l 722 0 m 361 601 q 233 527 277 601 q 196 375 196 464 q 232 224 196 288 q 358 144 277 144 q 487 217 441 144 q 528 370 528 281 q 489 523 528 457 q 361 601 443 601 m 579 1039 l 377 823 l 279 823 l 401 1039 l 579 1039 "},"O":{"x_min":0,"x_max":994,"ha":1094,"o":"m 497 -29 q 133 127 272 -29 q 0 505 0 277 q 131 883 0 733 q 497 1040 270 1040 q 860 883 721 1040 q 994 505 994 733 q 862 127 994 277 q 497 -29 723 -29 m 497 154 q 710 266 631 154 q 780 506 780 365 q 710 745 780 647 q 497 857 631 857 q 283 747 361 857 q 213 506 213 647 q 282 266 213 365 q 497 154 361 154 "},"n":{"x_min":0,"x_max":669,"ha":782,"o":"m 669 0 l 469 0 l 469 452 q 442 553 469 513 q 352 601 412 601 q 245 553 290 601 q 200 441 200 505 l 200 0 l 0 0 l 0 748 l 194 748 l 194 659 q 289 744 230 713 q 416 775 349 775 q 600 700 531 775 q 669 509 669 626 l 669 0 "},"3":{"x_min":61,"x_max":767,"ha":828,"o":"m 767 290 q 653 51 767 143 q 402 -32 548 -32 q 168 48 262 -32 q 61 300 61 140 l 250 300 q 298 173 250 219 q 405 132 343 132 q 514 169 471 132 q 563 282 563 211 q 491 405 563 369 q 343 432 439 432 l 343 568 q 472 592 425 568 q 534 701 534 626 q 493 793 534 758 q 398 829 453 829 q 306 789 344 829 q 268 669 268 749 l 80 669 q 182 909 80 823 q 410 986 274 986 q 633 916 540 986 q 735 719 735 840 q 703 608 735 656 q 615 522 672 561 q 727 427 687 486 q 767 290 767 369 "},"9":{"x_min":58,"x_max":769,"ha":828,"o":"m 769 492 q 646 90 769 232 q 384 -33 539 -33 q 187 35 271 -33 q 83 224 98 107 l 282 224 q 323 154 286 182 q 404 127 359 127 q 513 182 471 127 q 563 384 563 248 q 475 335 532 355 q 372 315 418 315 q 137 416 224 315 q 58 642 58 507 q 144 877 58 781 q 407 984 239 984 q 694 827 602 984 q 769 492 769 699 m 416 476 q 525 521 488 476 q 563 632 563 566 q 521 764 563 709 q 403 826 474 826 q 297 773 337 826 q 258 649 258 720 q 295 530 258 577 q 416 476 339 476 "},"l":{"x_min":41,"x_max":240,"ha":363,"o":"m 240 0 l 41 0 l 41 1013 l 240 1013 l 240 0 "},"¤":{"x_min":40.265625,"x_max":727.203125,"ha":825,"o":"m 727 792 l 594 659 q 620 552 620 609 q 598 459 620 504 l 725 331 l 620 224 l 491 352 q 382 331 443 331 q 273 352 322 331 l 144 224 l 40 330 l 167 459 q 147 552 147 501 q 172 658 147 608 l 40 794 l 147 898 l 283 759 q 383 776 330 776 q 482 759 434 776 l 620 898 l 727 792 m 383 644 q 308 617 334 644 q 283 551 283 590 q 309 489 283 517 q 381 462 335 462 q 456 488 430 462 q 482 554 482 515 q 455 616 482 588 q 383 644 429 644 "},"κ":{"x_min":0,"x_max":691.84375,"ha":779,"o":"m 691 0 l 479 0 l 284 343 l 196 252 l 196 0 l 0 0 l 0 749 l 196 749 l 196 490 l 440 749 l 677 749 l 416 479 l 691 0 "},"4":{"x_min":53,"x_max":775.21875,"ha":828,"o":"m 775 213 l 660 213 l 660 0 l 470 0 l 470 213 l 53 213 l 53 384 l 416 958 l 660 958 l 660 370 l 775 370 l 775 213 m 474 364 l 474 786 l 204 363 l 474 364 "},"p":{"x_min":0,"x_max":722,"ha":824,"o":"m 415 -26 q 287 4 346 -26 q 192 92 228 34 l 192 -298 l 0 -298 l 0 750 l 192 750 l 192 647 q 289 740 230 706 q 416 775 347 775 q 649 645 566 775 q 722 375 722 534 q 649 106 722 218 q 415 -26 564 -26 m 363 603 q 232 529 278 603 q 192 375 192 465 q 230 222 192 286 q 360 146 276 146 q 487 221 441 146 q 526 371 526 285 q 488 523 526 458 q 363 603 443 603 "},"‡":{"x_min":0,"x_max":809,"ha":894,"o":"m 299 621 l 0 621 l 0 804 l 299 804 l 299 1011 l 509 1011 l 509 804 l 809 804 l 809 621 l 509 621 l 509 387 l 809 387 l 809 205 l 509 205 l 509 0 l 299 0 l 299 205 l 0 205 l 0 387 l 299 387 l 299 621 "},"ψ":{"x_min":0,"x_max":875,"ha":979,"o":"m 522 142 q 657 274 620 163 q 671 352 671 316 l 671 748 l 875 748 l 875 402 q 806 134 875 240 q 525 -22 719 -1 l 525 -278 l 349 -278 l 349 -22 q 65 135 152 -1 q 0 402 0 238 l 0 748 l 204 748 l 204 352 q 231 240 204 295 q 353 142 272 159 l 353 922 l 524 922 l 522 142 "},"η":{"x_min":0,"x_max":669,"ha":779,"o":"m 669 -278 l 469 -278 l 469 390 q 448 526 469 473 q 348 606 417 606 q 244 553 288 606 q 201 441 201 501 l 201 0 l 0 0 l 0 749 l 201 749 l 201 665 q 301 744 244 715 q 423 774 359 774 q 606 685 538 774 q 669 484 669 603 l 669 -278 "}},"cssFontWeight":"bold","ascender":1216,"underlinePosition":-100,"cssFontStyle":"normal","boundingBox":{"yMin":-333,"xMin":-162,"yMax":1216,"xMax":1681},"resolution":1000,"original_font_information":{"postscript_name":"Helvetiker-Bold","version_string":"Version 1.00 2004 initial release","vendor_url":"http://www.magenta.gr","full_font_name":"Helvetiker Bold","font_family_name":"Helvetiker","copyright":"Copyright (c) Magenta ltd, 2004.","description":"","trademark":"","designer":"","designer_url":"","unique_font_identifier":"Magenta ltd:Helvetiker Bold:22-10-104","license_url":"http://www.ellak.gr/fonts/MgOpen/license.html","license_description":"Copyright (c) 2004 by MAGENTA Ltd. All Rights Reserved.\r\n\r\nPermission is hereby granted, free of charge, to any person obtaining a copy of the fonts accompanying this license (\"Fonts\") and associated documentation files (the \"Font Software\"), to reproduce and distribute the Font Software, including without limitation the rights to use, copy, merge, publish, distribute, and/or sell copies of the Font Software, and to permit persons to whom the Font Software is furnished to do so, subject to the following conditions: \r\n\r\nThe above copyright and this permission notice shall be included in all copies of one or more of the Font Software typefaces.\r\n\r\nThe Font Software may be modified, altered, or added to, and in particular the designs of glyphs or characters in the Fonts may be modified and additional glyphs or characters may be added to the Fonts, only if the fonts are renamed to names not containing the word \"MgOpen\", or if the modifications are accepted for inclusion in the Font Software itself by the each appointed Administrator.\r\n\r\nThis License becomes null and void to the extent applicable to Fonts or Font Software that has been modified and is distributed under the \"MgOpen\" name.\r\n\r\nThe Font Software may be sold as part of a larger software package but no copy of one or more of the Font Software typefaces may be sold by itself. \r\n\r\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL MAGENTA OR PERSONS OR BODIES IN CHARGE OF ADMINISTRATION AND MAINTENANCE OF THE FONT SOFTWARE BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.","manufacturer_name":"Magenta ltd","font_sub_family_name":"Bold"},"descender":-334,"familyName":"Helvetiker","lineHeight":1549,"underlineThickness":50}


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	var PI = Math.PI
	var THREE = __webpack_require__(5)
	var util = __webpack_require__(8)
	var Cube = __webpack_require__(4).Cube
	var Face = __webpack_require__(9).Face
	var faces = __webpack_require__(9).faces
	var Axis = __webpack_require__(9).Axis

	var facemap = {}
	facemap[Face.RIGHT] = 0
	facemap[Face.LEFT] = 1
	facemap[Face.BACK] = 2
	facemap[Face.FRONT] = 3
	facemap[Face.UP] = 4
	facemap[Face.DOWN] = 5

	var facestr = [
	  'RIGHT',
	  'LEFT',
	  'BACK',
	  'FRONT',
	  'UP',
	  'DOWN'
	]

	Cubie.prototype = Object.create(THREE.Mesh.prototype)
	Cubie.prototype.constructor = Cubie

	function Cubie (geo, map, cube, i, j, k) {
	  this.cube = cube
	  this.origCoords = new THREE.Vector3(i, j, k)
	  this.coords = new THREE.Vector3(i, j, k)
	  this.map = map

	  this._prepareDefaultStickers()
	  var mat = this._getMaterials()
	  THREE.Mesh.apply(this, [geo, mat])
	}

	Cubie.prototype._updateMaterials = function _updateMaterials () {
	  var mat = this._getMaterials()
	}

	// Returns the sticker on the specified face of this cubie
	// or null if no sticker on that face
	Cubie.prototype.getSticker = function getSticker (face) {
	  return this.stickers[face]
	}

	Cubie.prototype.setSticker = function setSticker (face, sticker) {
	  this.stickers[face] = sticker

	  var axis = util.faceToAxis(face)
	  var r = new THREE.Euler()
	  r.copy(this.rotation)
	  // need to invert it
	  r.set(-r.x, -r.y, -r.z, r.order.split('').reverse().join(''))
	  axis.applyEuler(r)
	  var f = util.axisToFace(axis)
	  var dst = facemap[f]

	  this.material.materials[dst].isSticker = true
	  this.material.materials[dst].sticker = sticker
	  this.material.materials[dst].color.setHex(this.cube.stickers[sticker])
	}
	// Only valid when all cubies are in their original positions.
	// Order:
	// R L B F U D
	Cubie.prototype.setStickers = function setStickers (stickers) {
	  if (stickers.length > 6) {
	    throw new Error('stickers.length must be at most 6')
	  }
	  this.stickers = stickers
	}

	// Updates the internal state of the stickers to the world rotation
	Cubie.prototype._rotateStickers = function _rotateStickers (axis) {
	  //    console.log("Rotating stickers... axis=",axis)
	  var cw = axis > 0
	  if (Math.abs(axis) == Axis.X) rot(this.stickers, [Face.FRONT, Face.UP, Face.BACK, Face.DOWN], cw)
	  if (Math.abs(axis) == Axis.Y) rot(this.stickers, [Face.LEFT, Face.DOWN, Face.RIGHT, Face.UP], cw)
	  if (Math.abs(axis) == Axis.Z) rot(this.stickers, [Face.FRONT, Face.LEFT, Face.BACK, Face.RIGHT], cw)
	}

	function rot (obj, indexes, cw) {
	  var l = indexes.length
	  if (cw) {
	    var tmp = obj[indexes[l - 1]]
	    for (var i = l - 2; i >= 0; i--) obj[indexes[i + 1]] = obj[indexes[i]]
	    obj[indexes[0]] = tmp
	  } else {
	    var tmp = obj[indexes[0]]
	    for (var i = 0; i < l - 1; i++) obj[indexes[i]] = obj[indexes[i + 1]]
	    obj[indexes[l - 1]] = tmp
	  }
	}

	Cubie.prototype.roundRotation = function roundRotation () {
	  this.rotation.x = intRound(mod(this.rotation.x, PI * 2), PI / 2)
	  this.rotation.y = intRound(mod(this.rotation.y, PI * 2), PI / 2)
	  this.rotation.z = intRound(mod(this.rotation.z, PI * 2), PI / 2)
	}

	function mod (a, b) {
	  var m = a % b
	  if (m < 0) m += b
	  return m
	}
	function intRound (what, to) {
	  var res = what + to / 2 - (what + to / 2) % to
	  return res
	}

	Cubie.prototype._prepareDefaultStickers = function _prepareDefaultStickers () {
	  var s = this.cube.size - 1

	  var stickers = {}
	  stickers[Face.RIGHT] = this.coords.x == s ? Face.RIGHT : undefined
	  stickers[Face.LEFT] = this.coords.x == 0 ? Face.LEFT : undefined
	  stickers[Face.BACK] = this.coords.y == s ? Face.BACK : undefined
	  stickers[Face.FRONT] = this.coords.y == 0 ? Face.FRONT : undefined
	  stickers[Face.UP] = this.coords.z == s ? Face.UP : undefined
	  stickers[Face.DOWN] = this.coords.z == 0 ? Face.DOWN : undefined
	  this.setStickers(stickers)
	}

	Cubie.prototype._getMaterials = function _getMaterials (stickers) {
	  var wf = this.cube.wireframe
	  var map = this.map
	  var d = new THREE.MeshBasicMaterial({
	    color: this.cube.colors.cube,
	    wireframe: wf,
	    wireframeLinewidth: 2,
	    map: map
	  })
	  var self = this
	  function mat (face) {
	    return self.stickers[face] ?
	      getStickerMaterial(self.cube.stickers[self.stickers[face]], map, wf, face) : d
	  }
	  var materials = [
	    // R L B F U D
	    mat(Face.RIGHT),
	    mat(Face.LEFT),
	    mat(Face.BACK),
	    mat(Face.FRONT),
	    mat(Face.UP),
	    mat(Face.DOWN)
	  ]
	  return new THREE.MeshFaceMaterial(materials)
	}

	function getStickerMaterial (color, map, wireframe, face) {
	  var mat = new THREE.MeshBasicMaterial({
	    color: color,
	    map: map,
	    wireframe: wireframe,
	    wireframeLinewidth: 2,
	    side: THREE.FrontSide
	  })
	  mat.isSticker = true
	  mat.sticker = face
	  return mat
	}

	Cubie.prototype.invalidateColor = function invalidateColor (face) {
	  var dst = facemap[face]
	  if (this.material.materials[dst].isSticker)
	    this.material.materials[dst].color.setHex(this.cube.stickers[face])
	}
	Cubie.prototype.invalidateColors = function invalidateColors () {
	  var m = this.material.materials
	  for (var i = 0; i < m.length; i++) {
	    if (m[i].isSticker) m[i].color.setHex(this.cube.stickers[m[i].sticker])
	  }
	}

	module.exports = {
	  Cubie: Cubie
	}


/***/ }),
/* 13 */
/***/ (function(module, exports) {

	function random (length) {
	  if (!length) length = 30
	  function randInt (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
	  var turns = 'ULFRBD'
	  var alg = []
	  while (alg.length < length) {
	    var m = turns[randInt(0, turns.length - 1)]
	    var n = randInt(0, 2)
	    if (n == 1) m += '2'
	    if (n == 2) m += "'"
	    alg.push(m)
	    alg = optimize(alg)
	  }
	  return alg.join(' ')
	}

	function invert (alg) {
	  var arr = alg.split(' ').reverse()
	  arr.forEach(function (e, i, a) {
	    a[i] = inv(e)
	  })
	  var rev = arr.join(' ')
	  return rev
	}

	function replaceAll (str, search, replacement) {
	  return str.replace(new RegExp(search, 'g'), replacement)
	}

	function transform (alg, map) {
	  var faces = Array.from('ULFRBD')
	  faces.forEach(function (c) { alg = replaceAll(alg, c, '_' + c); })
	  for (var x in map) {
	    if (!map.hasOwnProperty(x)) continue
	    alg = replaceAll(alg, '_' + x, map[x])
	  }
	  faces.forEach(function (c) { alg = replaceAll(alg, '_' + c, c); })
	  return alg
	}

	// copy of cube.optimizequeue
	// input as an array of moves
	function optimize (algorithm) {
	  var alg
	  if (typeof (algorithm) == 'string') alg = algorithm.split(' ')
	  else alg = algorithm
	  var found = true
	  while (found) {
	    found = false
	    // remove opposite moves
	    for (var i = alg.length - 2; i >= 0; i--) {
	      if (alg[i] == inv(alg[i + 1])) {
	        found = true
	        alg.splice(i, 2)
	        i--
	      }
	    }
	    // remove 4 consecutive equal moves
	    for (var i = alg.length - 3; i >= 0; i--) {
	      if (alg[i] == alg[i + 1] &&
	        alg[i + 1] == alg[i + 2]
	      ) {
	        found = true
	        alg[i] = inv(alg[i])
	        alg.splice(i + 1, 2)
	        i--
	      }
	    }
	  }
	  if (typeof (algorithm) == 'string') return alg.join(' ')
	  return alg
	}

	function inv (move) {
	  if (move.slice(-1) == "'") return move.substr(0, move.length - 1)
	  else return move + "'"
	}

	function rot (move) {
	  var rot = 1
	  if (isTwo(move)) rot *= 2
	  if (isPrime(move)) rot *= -1
	  return rot
	}

	function isTwo (move) {
	  return move.charAt(1) == '2'
	}

	function isPrime (move) {
	  return move.charAt(move.length - 1) == "'"
	}

	module.exports = {
	  random: random,
	  invert: invert,
	  transform: transform,
	  optimize: optimize,
	  rot: rot,
	  isTwo: isTwo,
	  isPrime: isPrime
	}


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	var model = __webpack_require__(9);
	var util = __webpack_require__(8);
	var algorithm = __webpack_require__(13);

	// Faces by their index
	var FACES = ["U", "L", "F", "R", "B", "D"];

	// Faces adjacent to eachother
	// Each line represents a face which is commented
	// For each line we have two entries: The first one is the face on the top
	// and the second one is the face on the right
	var ADJ = [
	    ["B", "R", "F", "L"], // UP
	    ["U", "F", "D", "B"], // LEFT
	    ["U", "R", "D", "L"], // FRONT
	    ["U", "B", "D", "F"], // RIGHT
	    ["U", "L", "D", "R"], // BACK
	    ["F", "R", "B", "L"], // DOWN
	];

	// Rotations for each of the faces in the ADJ matrix
	// each rotation is the amount of degrees to turn the face so that it aligns
	// perfectly with the face of that line
	// The unit is 90º, so a value of 1 means we have to turn the face 90º so that
	// it aligns with the face of that line
	// values are [0..3]
	var _ = null;
	var ROT = [
	    [_, 3, 0, 1, 2, _], // U [ULFRBD]
	    [1, _, 0, _, 0, 3], // L [ULFRBD]
	    [0, 0, _, 0, _, 0], // F [ULFRBD]
	    [3, _, 0, _, 0, 1], // R [ULFRBD]
	    [2, 0, _, 0, _, 2], // B [ULFRBD]
	    [_, 1, 0, 3, 2, _], // D [ULFRBD]
	];


	function State(state) {
	    if (typeof(state) == "number") {
	        var s = "";
	        for (var i = 0; i < FACES.length; i++) for (var j = 0; j < state*state; j++) s += FACES[i];
	        state = s;
	    }
	    if (typeof(state) !== "string") throw new Error("State should be a string!");
	    if (state.length % 6 != 0) throw new Error("State's length must be a multiple of 6");
	    this.size = Math.sqrt(state.length / 6);
	    if (this.size%1 != 0) throw new Error("Faces should be square");
	    this.state = Array.from(state);
	}

	State.prototype.offset = function offset(face) {
	    return FACES.indexOf(face) * this.size * this.size;
	}

	// index of a sticker inside the state
	State.prototype.index = function index(face, row, col) {
	    return this.offset(face) + row*this.size + col;
	}

	State.prototype.row = function row(face, num) {
	    return this._line(face, true, num);
	}

	State.prototype.col = function col(face, num) {
	    return this._line(face, false, num);
	}

	State.prototype._line = function _line(face, isRow, num) {
	    res = [];
	    var offset = this.offset(face);
	    var step;
	    if (isRow) {
	        step = 1;
	        offset += num * this.size;
	    } else {
	        step = this.size;
	        offset += num * 1;
	    }
	    for (var i = 0; i < this.size; i++) res.push(offset + i*step);
	    return res;
	}

	/*
	Rotates layers around a face
	*/
	State.prototype.rotate = function rotate(face, rot, layers) {
	    if (layers == undefined) layers = [0];
	    for (var n = 0; n < ((rot%4+4)%4); n++) {
	      for (var i = 0; i < layers.length; i++) {
	          if (layers[i] == 0) this._rotateFace(face, true);
	          if (layers[i] == this.size-1) this._rotateFace(util.opposite(face), false);
	          this._rotateRing(face, layers[i], true);
	      }
	    }
	}

	// Rotates the stickers on a face
	State.prototype._rotateFace = function _rotateFace(face, cw) {
	    var s = this.size;
	    var rings = s / 2;
	    for (var i = 0; i < rings; i++) {
	        // offset = i
	        for (var j = 0; j < s-i*2-1; j++) {
	            swap4(this.state,
	                this.index(face, i,i+j),
	                this.index(face, i+j,s-1-i),
	                this.index(face, s-1-i,s-1-i-j),
	                this.index(face, s-1-i-j,i),
	                cw
	            );
	        }
	    }
	}
	// Rotates the stickers on a layer
	State.prototype._rotateRing = function _rotateRing(face, layer, cw) {
	    var lines = [];
	    for (var i = 0; i < 4; i++) lines.push(this._getAdjacentLine(face, i, layer));
	    for (var j = 0; j < this.size; j++) {
	        swap4(this.state, lines[0][j], lines[1][j], lines[2][j], lines[3][j], cw);
	    }
	}

	State.prototype._getAdjacentLine = function _getAdjacentLine(face, direction, layer) {
	    var index = FACES.indexOf(face);
	    var dst = ADJ[index][direction]; // target face
	    var dsti = FACES.indexOf(dst);
	    var fdir = (ROT[index][dsti]+direction+2) % 4;
	    return this._getRotatedLine(dst, fdir, layer).reverse();
	}

	// Gets the clockwise rotated line of a face
	State.prototype._getRotatedLine = function _getRotatedLine(face, direction, layer) {
	    switch (direction) {
	        case 0: return this.row(face, layer);
	        case 1: return this.col(face, this.size-1-layer);
	        case 2: return this.row(face, this.size-1-layer).reverse();
	        case 3: return this.col(face, layer).reverse();
	    }
	}

	// Gets the clockwise rotated index of a line on a face
	State.prototype._getRotatedIndex = function _getRotatedIndex(face, direction, offset) {
	    var s = this.size;
	    switch (direction) {
	        case 0: return this.index(face, 0, offset);
	        case 1: return this.index(face, offset, s-1);
	        case 2: return this.index(face, s-1, s-1-offset);
	        case 3: return this.index(face, s-1-offset, 0);
	    }
	}



	// TODO Add support for > 3x3 cubes
	// Returns whatever is at the intersecion of the faces, in the same order
	State.prototype.get = function get(faces) {
	    switch(faces.length) {
	        case 1: return this._getCenter(faces);
	        case 2: return this._getEdge(faces);
	        case 3: return this._getCorner(faces);
	        default: throw new Error("Invalid faces");
	    }
	}

	State.prototype._getCenter = function _getCenter(faces) {
	    return this.index(faces, this.size/2, this.size/2);
	}

	State.prototype._getEdge = function _getEdge(f) {
	    var r0 = ADJ[FACES.indexOf(f[0])].indexOf(f[1]);
	    var r1 = ADJ[FACES.indexOf(f[1])].indexOf(f[0]);
	    var i0 = this._getRotatedIndex(f[0], r0, 1);
	    var i1 = this._getRotatedIndex(f[1], r1, 1);
	    return this.state[i0] + this.state[i1];
	}

	State.prototype._getCorner = function _getCorner(f) {
	    function adj(x,y) { return ADJ[FACES.indexOf(f[x])].indexOf(f[y]); }
	    var r01 = adj(0, 1);
	    var r02 = adj(0, 2);
	    var r10 = adj(1, 0);
	    var r20 = adj(2, 0);

	    var cw = (r01 +1 == r02);
	    var i0 = this._getRotatedIndex(f[0], r01, cw ? this.size-1 : 0);
	    var i1 = this._getRotatedIndex(f[1], r10, cw ? 0 : this.size-1);
	    var i2 = this._getRotatedIndex(f[2], r20, cw ? this.size-1 : 0);
	    return this.state[i0] + this.state[i1] + this.state[i2];
	}

	// returns the faces in which the piece searched for is located
	// in the same order as the input
	// For example find(["U", "L"]) would return ["L", "U"]
	// if the UL edge was at the correct position but wrong orientation
	// stickers: Array of length [0..2] containing the stickers to search for
	State.prototype.find = function find(stickers) {
	    switch(stickers.length) {
	        case 1: return this._findCenter(stickers);
	        case 2: return this._findEdge(stickers);
	        case 3: return this._findCorner(stickers);
	        default: throw new Error("Invalid search");
	    }
	}

	// TODO Add support for > 3x3 cubes
	State.prototype._findCenter = function _findCenter(stickers) {
	    var s2 = this.size * this.size;
	    var offset = parseInt(s2 / 2);
	    var step = s2;
	    for (var i = 0; i < 6; i++) {
	        var pos = offset+step*i;
	        if (this.state[pos] == stickers[0]) {
	            return {
	                "str": FACES[i],
	                "pos": [pos],
	            };
	        }
	    }
	}

	// Finds the next sticker in the given direction
	// Example: _next("U", size-1, 3) would give the sticker at Left(0,0)
	// Pre: Only valid to find stickers on two different faces
	State.prototype._nextIndex = function _nextIndex(face, dir, offset) {
	    var index = FACES.indexOf(face);
	    var dst = ADJ[index][dir]; // target face
	    var dsti = FACES.indexOf(dst);
	    var fdir = (ROT[index][dsti]+dir+2) % 4;

	    var s = this.size;
	    var xx = this._getRotatedIndex(dst, fdir, s-1-offset);
	    return this._getRotatedIndex(dst, fdir, s-1-offset);
	}

	// TODO Add support for > 3x3 cubes
	State.prototype._findEdge = function _findEdge(stickers) {
	    for (var i = 0; i < FACES.length; i++) {
	        var f = FACES[i];
	        for (var j = 0; j < 4; j++) {
	            var pos = [
	                this._getRotatedIndex(f, j, 1),
	                this._nextIndex(f, j, 1),
	            ];
	            if (this.state[pos[0]] != stickers[0]) continue;
	            if (this.state[pos[1]] == stickers[1]) {
	                return {
	                    "str": f + ADJ[i][j],
	                    "pos": pos,
	                };
	            }
	        }
	    }
	}

	State.prototype._findCorner = function _findCorner(stickers) {
	    for (var i = 0; i < FACES.length; i++) {
	        var f = FACES[i];
	        for (var j = 0; j < 4; j++) {
	            var index = this._getRotatedIndex(f, j, 0);
	            if (this.state[index] != stickers[0]) continue;
	            var a = this._nextIndex(f, j, 0);
	            var b = this._nextIndex(f, (j+3)%4, this.size-1);
	            if (this.state[a] == stickers[1] && this.state[b] == stickers[2]) {
	                return {
	                    "str": f + ADJ[i][j] + ADJ[i][(j+3)%4],
	                    "pos": [index, a, b],
	                };
	            }
	            if (this.state[b] == stickers[1] && this.state[a] == stickers[2]) {
	                return {
	                    "str": f + ADJ[i][(j+3)%4] + ADJ[i][j],
	                    "pos": [index, b, a],
	                };
	            }
	        }
	    }
	}



	State.prototype.algorithm = function _algorithm(alg) {
	    //console.log("ALG:",alg);
	    var moves = alg.split(" ");
	    for (var i = 0; i < moves.length; i++) {
	        var move = moves[i].trim();
	        if (move == "") continue;

	        var c = move.charAt(0);
	        var face = c.toUpperCase();
	        var upper = (c == c.toUpperCase()); // uppercase letter is clockwise
	        // process prime (inverts turn direction)
	        var rot = algorithm.rot(move);

	        if (isFace(face)) {
	            var layers = [0];
	            if (!upper) layers.push(1);
	        } else if (isAxis(c)) {
	            var layers = []; for (var j = 0; j < this.size; j++) layers.push(j);
	            face = axisToFace(c);
	        } else {
	            console.log("Invalid move: " + move);
	            continue;
	        }
	        this.rotate(face, rot, layers);
	    }
	}


	State.prototype.rowOf = function rowOf(index) {
	    var s = this.size;
	    return parseInt((index%(s*s))/s);
	}

	State.prototype.colOf = function colOf(index) {
	    var s = this.size;
	    return (index%(s*s))%s;
	}

	State.prototype.faceOf = function faceOf(index) {
	    return FACES[parseInt(index / (this.size*this.size))];
	}

	State.prototype.describeIndex = function describeIndex(index) {
	    var row = this.rowOf(index);
	    var col = this.colOf(index);
	    var f = this.faceOf(index);
	    return index + ":" + this.state[index] + " (f=" + f + ",r=" + row + ",c=" + col + ")";
	}

	function axisToFace(axis) { switch(axis){ case "X": return "R"; case "Y": return "U"; case "Z": return "F"; }}
	function isFace(char) { return FACES.indexOf(char) != -1; }
	function isAxis(char) { return "XYZ".indexOf(char) != -1; }
	function swap4(v, i0, i1, i2, i3, cw) { if (cw) swap4CW(v, i0, i1, i2, i3); else swap4CCW(v, i0, i1, i2, i3); }
	function swap4CCW(v, i0, i1, i2, i3) { swap4CW(v, i3, i2, i1, i0); }
	function swap4CW(v, i0, i1, i2, i3) { tmp = v[i3]; v[i3] = v[i2]; v[i2] = v[i1]; v[i1] = v[i0]; v[i0] = tmp; }

	window.state = State;
	module.exports = { State: State };


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	This file implements the solver for a 3x3 Cube
	*/
	var util = __webpack_require__(8);
	var algorithm = __webpack_require__(13);

	function solve(state) {
	    //console.log("Solving", state.state.join(""));
	    var alg = [];
	    alg = alg.concat(solveCenters(state));
	    alg = alg.concat(solveCross(state));
	    alg = alg.concat(solveFirstLayer(state));

	    alg = alg.concat(solveSecondLayer(state));

	    alg = alg.concat(solveYellowCrossOrientation(state));
	    alg = alg.concat(solveYellowCrossPermutation(state));

	    alg = alg.concat(solveCornersPermutation(state));
	    alg = alg.concat(solveCornersOrientation(state));

	    return alg.join(" ");
	}

	// We rotate the cube so that the white center is down and the red at the front
	function solveCenters(state) {
	    function run(x) { alg.push(x); state.algorithm(x); }
	    var f = state.find("D").str;
	    var alg = [];
	    switch (f) {
	        case "L": run("Z'"); break;
	        case "R": run("Z"); break;
	        case "F": run("X'"); break;
	        case "B": run("X"); break;
	        case "U": run("X"); run("X"); break;
	    }
	    while (state.find("F").str != "F") { run("Y"); }
	    return alg;
	}

	function solveCross(state) {
	    function run(x,u) { alg.push(x); state.algorithm(x); if (u) w = state.find(p); }
	    var alg = [];
	    var i = 0;
	    var pieces = ["DR","DL", "DF", "DB"];
	    while (pieces.length > 0 && i < 10) {
	        var p = pieces.shift(); // current piece
	        var w = state.find(p); // where the piece was found
	        if (inLayer(w.str, "U")) {
	            while (!inLayer(w.str, p[1]) && i < 10) { run("U", true); }
	            var f = p[1];
	            if (w.str[0] == "U") {
	                run(f);
	                run(f);
	            } else {
	                run(f);
	                run("D");
	                run(inv(right(f)));
	                run("D'");
	            }
	        } else if (!inLayer(w.str, "D")) {
	            var f = w.str[1];
	            var cw = state.colOf(w.pos[1]) == 0;
	            run(f+(cw?"":"'"));
	            run("U");
	            run(f+(!cw?"":"'"));
	            pieces.unshift(p);
	        } else if (w.str != p) {
	            var f = after(w.str, "D");
	            run(f);
	            run(f);
	            pieces.unshift(p);
	        }
	    }
	    return alg;
	}
	function solveFirstLayer(state) {
	    function run(x,u) { alg.push(x); state.algorithm(x); if (u) w = state.find(p); }
	    var alg = [];
	    var pieces = ["DLF", "DFR", "DRB", "DBL"];
	    var crashCount = 0;
	    while (pieces.length > 0 && crashCount++ < 20) {
	        var p = pieces.shift(); // current piece
	        var w = state.find(p); // where the piece was found
	        if (w.str == p) continue; // already ok
	        if (inLayer(w.str, "U")) {
	            // move it to above the target
	            var tgt = "U" + p.substr(1);
	            while (!eq(w.str, tgt)) { run("U", true); }
	            // if white is up, rotate and insert
	            if (w.str[0] == "U") {
	                run(w.str[1]);
	                run("U'");
	                run(inv(w.str[1]));
	                pieces.unshift(p);
	            } else if (w.str[2] == "U") { // if white is right (3rd color is up)
	                run(w.str[0]);
	                run("U");
	                run(inv(w.str[0]));
	            } else { // white is left
	                run(inv(w.str[0]));
	                run("U'");
	                run(w.str[0]);
	            }
	        } else {
	            // in the result, whatever face is to the left of D, turn that one
	            var f = before(w.str, "D");
	            run(f);
	            run("U");
	            run(inv(f));
	            // we MUST handle the same piece again directly,
	            // if we don't we could have a deadlock: moving one piece up
	            // puts another one in it's place, and moving the other one up
	            // puts the first one in it's place
	            // solving the pieces in order solves this problem
	            pieces.unshift(p);
	        }
	    }
	    return alg;
	}
	function solveSecondLayer(state) {
	    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); if (u) w = state.find(p); }
	    var alg = [];
	    var pieces = ["LF", "FR", "RB", "BL"];
	    while (pieces.length > 0) {
	        var p = pieces.shift(); // current piece
	        var w = state.find(p); // where the piece was found
	        if (w.str == p) continue; // already ok
	        if (inLayer(w.str, "U")) {
	            function up() { return whichIs(p, w.str, "U"); }
	            function other() { return after(p, up()); }
	            var tgt = util.opposite(up());
	            // place the piece at the opposite side of the target
	            while (after(w.str, "U") != tgt) run("U", true);
	            if (p[0] == other()) sol = "F U F' U' L' U' L"; // for front, left
	            else sol = "L' U' L U F U F'"; // mirrorred
	            run(algorithm.transform(sol, {"L":p[0], "F": p[1]}));
	        } else {
	            // move it out
	            var a = w.str[0];
	            var b = w.str[1];
	            if (w.str[0] == right(w.str[1])) { a = w.str[1]; b = w.str[0]; }
	            run(algorithm.transform("F U F' U' L' U' L", {"L":a, "F": b}));
	            pieces.unshift(p);
	        }
	    }
	    return alg;
	}

	function solveYellowCrossOrientation(state) {
	    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); if (u) find(); }
	    var alg = [];
	    var pieces = ["UL", "UF", "UR", "UB"];
	    var w, up, cnt;
	    function find() {
	        w = []; up = []; cnt = 0;
	        for (var i = 0; i < 4; i++) {
	            w.push(state.get(pieces[i]));
	            up.push(w[i][0] == "U");
	            if (up[i]) cnt++;
	        }
	    }
	    find();
	    if (cnt == 0) {
	        run("F R U R' U' F'");
	        run("F R U R' U' F'");
	        run("U");
	        run("F R U R' U' F'");
	    } else if (cnt == 2) {

	        var h = up[0] && up[2];
	        var v = up[1] && up[3];
	        if (v) run("U");
	        if (h || v) run ("F R U R' U' F'");
	        else { // L shape
	            while (!(up[1] && up[2])) { run("U", true); }
	            run("F R U R' U' F'");
	            run("U");
	            run("F R U R' U' F'");
	        }
	    } else if (cnt != 4) {
	        throw new Error("Invalid state "+ cnt);
	    }
	    return alg;
	}

	function solveYellowCrossPermutation(state) {
	    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); }
	    function g(x) { return state.get(x); }
	    var alg = [];
	    var pieces = ["UL", "UF", "UR", "UB"];
	    while (g("UF") != "UF") run("U");

	    if (!(g("UL") == "UL" && g("UF") == "UF" && g("UR") == "UR" && g("UB") == "UB")) {
	        if      (g("UB") == "UL" && g("UL") == "UB") run("R' U' R U' R' U U R U'"); // L <=> B
	        else if (g("UB") == "UR" && g("UR") == "UB") run("L U L' U L U U L' U"); // R <=> B
	        else if (g("UB") == "UB")                    run("R' U' R U' R' U U R U'" + " " + "L' U' L U' L' U U L"); // v swap
	        else if (g("UL") == "UB")                    run("L' U' L U' L' U U L"); // cw
	        else                                         run("R U R' U R U U R'"); // ccw
	    }

	    return alg;
	}

	function solveCornersPermutation(state) {
	    var niklas_ccw =  "R U' L' U R' U' L U";
	    var niklas_cw = "L' U R U' L U R' U'";
	    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); }
	    var alg = [];
	    // First put the UFL corner at it's correct position
	    var ufl = state.find("UFL");
	    if (!eq(ufl.str, "UFL")) {
	        if      (eq(ufl.str, "UBL")) { run("Y"); run(niklas_ccw); run("Y'"); }
	        else if (eq(ufl.str, "URB")) { run(niklas_cw); }
	        else                         { run("Y"); run(niklas_cw); run("Y'") }
	    }
	    // now rotate the other 3 pieces
	    var ulb = state.find("ULB");
	    if (!eq(ulb.str, "ULB")) {
	        if (eq(ulb.str, "UBR")) { run(niklas_ccw); }
	        else                    { run("Y'"); run(niklas_cw); run("Y"); }
	    }
	    return alg;
	}

	function solveCornersOrientation(state) {
	    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); }
	    var alg = [];
	    for (var i = 0; i < 4; i++) {
	        var rot = state.get("URF").indexOf("U");
	        if (rot == 1) run("R' D' R D R' D' R D");
	        if (rot == 2) run("D' R' D R D' R' D R");
	        run("U");
	    }
	    return alg;
	}

	function inLayer(piece, layer) {
	    return piece.indexOf(layer) > -1;
	}
	// returns the face to the left of this face
	function left(faceChar) {
	    var s = "LFRB";
	    return s[(s.indexOf(faceChar)+3)%4];
	}
	// returns the face to the right of this face
	function right(faceChar) {
	    var s = "LFRB";
	    return s[(s.indexOf(faceChar)+1)%4];
	}


	function eq(a, b) {
	    function f(x) { return Array.from(x.toLowerCase()).sort().join(""); }
	    return f(a) == f(b);
	}


	function inv(move) {
	    if (move.slice(-1) == "'") return move.substr(0,move.length-1);
	    else return move + "'";
	}

	// returns the char that comes after this one
	function after(piece, char) {
	    return piece[(piece.indexOf(char)+1)%piece.length];
	}

	// returns the char that comes before this one
	function before(piece, char) {
	    return piece[(piece.indexOf(char)+-1+piece.length)%piece.length];
	}

	// if 1 argument: returns the piece rotated clockwise 1 step
	// if 2 arguments: returns the steps necessary to rotate p to obtain p2
	function rot(p, p2) {
	    if (!p2) return piece.substr(1) + piece[0];
	    var i = 0;
	    while (p != p2) { rot(p); i++; }
	    return i;
	}

	// returns the char at p of the same index as face at p2
	function whichIs(p, p2, face) {
	    return p[p2.indexOf(face)];
	}


	var CubejsWorker = __webpack_require__(16);
	function createCubejsSolver(cb) {
	  var worker = new CubejsWorker();
	  worker.addEventListener("message", function (e) {
	    if (e.data.name !== "ready") return;
	    cb(new CubejsSolver(worker));
	  });
	}

	function CubejsSolver(worker) {
	  this.worker = worker;
	  this.queues = {};
	  this.worker.addEventListener("message", function (e) {
	    if (e.data.name !== "solved") return;
	    this.queues[e.data.state].forEach(function (cb) {
	      cb(e.data.alg);
	    });
	    delete this.queues[e.data.state];
	  }.bind(this));
	}

	CubejsSolver.prototype.solve = function (state, cb) {
	  if (state in this.queues) return this.queues[state].push(cb);
	  this.queues[state] = [ cb ];
	  this.worker.postMessage({ name: "solve", state: state });
	};


	module.exports = {
	    solve: solve,
	    createCubejsSolver: createCubejsSolver,
	};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = function() {
		return new Worker(__webpack_require__.p + "27e9e5c9243f9eecc7d5.worker.js");
	};

/***/ }),
/* 17 */
/***/ (function(module, exports) {

	function check (interpolator) {
	  // They should go from 0 to 1, 
	  // even though intermediate points may be out of the range [0,1]
	  if (interpolator(0) != 0) return false
	  if (interpolator(1) != 1) return false
	  return true
	}

	var interpolators = {}

	interpolators.linear = function linear () {
	  return function interpolator (t) { return t; }
	}

	interpolators.accelerateDecelerate = function accelerateDecelerate () {
	  return function interpolator (t) {
	    return (Math.cos((t + 1) * Math.PI) / 2.0) + 0.5
	  }
	}

	interpolators.accelerate = function accelerate (factor) {
	  var factor = factor
	  return function interpolator (t) {
	    if (!factor || factor == 1.0)
	      return t * t
	    return Math.pow(t, factor * 2)
	  }
	}

	// An interpolator where the change starts backward then flings forward.
	interpolators.anticipate = function anticipate (tension) {
	  tension = tension || 2.0
	  return function interpolator (t) {
	    return t * t * ((tension + 1) * t - tension)
	  }
	}

	// An interpolator where the change flings forward and overshoots the last value
	// then comes back.
	interpolators.overshoot = function overshoot (tension) {
	  tension = tension || 2.0
	  return function interpolator (t) {
	    t -= 1.0
	    return t * t * ((tension + 1) * t + tension) + 1.0
	  }
	}

	// An interpolator where the change starts backward then flings forward and overshoots
	// the target value and finally goes back to the final value.
	interpolators.anticipateOvershoot = function anticipateOvershoot (tension) {
	  tension = tension || 2.0
	  tension *= 1.2
	  var a = function (t, s) { return t * t * ((s + 1) * t - s); }
	  var o = function (t, s) { return t * t * ((s + 1) * t + s); }
	  return function interpolator (t) {
	    if (t < 0.5) return 0.5 * a(t * 2.0, tension)
	    else return 0.5 * (o(t * 2.0 - 2.0, tension) + 2.0)
	  }
	}

	interpolators.bounce = function bounce () {
	  var bounce = function (t) { return t * t * 8.0; }
	  return function interpolator (t) {
	    t *= 1.1226
	    if (t < 0.3535) return bounce(t)
	    else if (t < 0.7408) return bounce(t - 0.54719) + 0.7
	    else if (t < 0.9644) return bounce(t - 0.8526) + 0.9
	    else return bounce(t - 1.0435) + 0.95
	  }
	}

	function get (interpolator) {
	  if (typeof interpolator === 'string') {
	    if (!(interpolator in interpolators))
	      throw new Error('Invalid interpolator name given')
	    interpolator = interpolators[interpolator]()
	  }

	  if (!check(interpolator))
	    throw new Error('the interpolator is expected to be a valid function or string')

	  return interpolator
	}

	module.exports = {
	  get: get,
	  interpolators: interpolators
	}


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	var Face = __webpack_require__(9).Face

	var stickers = [
	  0xFFFFFF, //U, white
	  0xFF5800, //L, orange
	  0x009E60, //F, green
	  0xC41E3A, //R, red
	  0x0051BA, //B, blue
	  0xFFD500  //D, yellow

	//  0xFFD500, //U, yellow
	//  0x0051BA, //L, blue
	//  0xC41E3A, //F, red
	//  0x009E60, //R, green
	//  0xFF5800, //B, orange
	//  0xFFFFFF  //D, white
	]

	var prod_defaults = {
	  size: 3,
	  cubieWidth: 100,
	  cubieSpacing: 0, // in terms of cubieWidth (now only for debugging)
	  showLabels: true,
	  labelMargin: 0.5, // in terms of cubieWidth * cubieSize

	  // R L B F U D
	  stickers: stickers,
	  colors: {
	    axisX: 0xAA0000,
	    axisY: 0x00AA00,
	    axisZ: 0x0000AA,
	    label: 0xCFD8DC,
	    background: 0xFFFFFF,
	    cube: 0x000000,
	    emptySticker: 0xCCCCCC,
	  },

	  wireframe: false,

	  animation: {
	    duration: 300, // ms
	    interpolator: 'linear' // name or function
	  },

	  click: true,
	  longClick: false,
	  longClickDelay: 400,

	  moveStartListener: function () {},
	  moveEndListener: function () {}
	}

	module.exports = { defaults: prod_defaults }


/***/ })
/******/ ]);