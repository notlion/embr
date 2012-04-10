var plask = require("plask");
var embr = require("../src/embr").Embr;

require("../lib/gl-matrix");

var vsh = [
  "uniform mat4 mvp;",
  "attribute vec4 position;",
  "void main(){",
    "gl_Position = mvp * position;",
  "}"
].join("\n");

var fsh = [
  "#ifdef GL_ES",
    "precision highp float;",
  "#endif",
  "uniform vec4 color;",
  "void main(){",
    "gl_FragColor = color;",
  "}"
].join("\n");

plask.simpleWindow({

  settings: {
    type: "3d",
    width: 500, height: 300
  },

  init: function(){
    var gl = this.gl;

    // Do this first
    embr.setContext(embr.wrapContextWithErrorChecks(gl));

    this.prog = new embr.Program(vsh, fsh).link();

    this.line = new embr.Vbo(gl.LINE_STRIP)
      .setAttr("position", { size: 4 })
      .setProg(this.prog);

    var points = [];
    this.on("mouseMoved", function(e){
      points.push(e.x, e.y, 0, 1);
      this.line.setAttr("position", {
        data: points
      });
    });

    var aspect = this.width / this.height;
    this.modelview = mat4.lookAt([0, 1, 5], [0, 0, 0], [0, 0, 1]);
    this.projection = mat4.perspective(60, aspect, 0.1, 10);

    this.framerate(60);
  },

  draw: function(){
    var gl = this.gl;

    gl.clearColor(0, 0, 1, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    this.prog.use({
      mvp: mat4.ortho(0, this.width, 0, this.height, -1, 1),
      color: [1, 1, 0, 1]
    });
    this.line.draw();
  }

});
