var Face = require('./model').Face

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
