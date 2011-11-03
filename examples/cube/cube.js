var plask = require("plask");
var em    = require("../../src/main-plask");

em.require([
    "embr/core",
    "embr/material/ColorMaterial",
    "embr/material/NormalMaterial"
], function(core, ColorMaterial, NormalMaterial){
    plask.simpleWindow({
        settings: {
            type:   "3d",
            width:  512,
            height: 512,
            vsync:  true,
            center: true
        },
        init: function(){
            this.framerate(60);

            this.projection = new core.Mat4().perspective(60, this.width / this.height, 0.01, 8);
            this.modelview  = new core.Mat4().lookAt(
                0, 0,-4,  // Eye Position
                0, 0, 0,  // Target Position
                0, 1, 0   // Up Vector
            );

            var gl = this.gl;
            gl.enable(gl.DEPTH_TEST);

            // Make Materials
            this.material_normal = new NormalMaterial(gl);
            this.material_color = new ColorMaterial(gl);
            this.material_color.use({
                color: new core.Vec4(1,1,0,1)
            });

            // Make Cube
            this.cube = core.Vbo.createBox(gl, 1, 1, 1);
        },
        draw: function(){
            this.modelview.rotate(Math.sin(this.frametime) * 0.03, 0, 1, 0);
            this.modelview.rotate(Math.cos(this.frametime) * 0.07, 1, 0, 0);

            var gl = this.gl;

            // Clear Buffer
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            this.material_normal.use({
                modelview:  this.modelview,
                projection: this.projection
            });
            this.cube.draw(this.material_normal);

            // Clear Depth Buffer only
            gl.clear(gl.DEPTH_BUFFER_BIT);

            this.material_color.use({
                modelview: this.modelview.dup().scale(0.5, 0.5, 0.5));
                projection: this.projection
            });
            this.cube.draw(this.material_color);
        }
    });
});
