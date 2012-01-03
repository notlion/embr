var plask = require('plask')
var em = require('../../src/main-plask');

em.require([
    "embr/core",
    "embr/material",
    "embr/Arcball"
], function(core, material, Arcball){
    plask.simpleWindow({
        settings: {
            type: "3d",
            width: 512,
            height: 512
        },
        init: function(){
            this.framerate(60);

            this.projection = new core.Mat4().perspective(60, this.width / this.height, 0.01, 8);
            this.camera_mv  = new core.Mat4().lookAt(0, 0,-4,  // Eye Position
                                                     0, 0, 0,  // Target Position
                                                     0, 1, 0); // Up Vector

            var arcball = this.arcball = new Arcball(
                new core.Vec2(this.width, this.height).scale(0.5),
                Math.min(this.width, this.height) / 2
            );

            this.on("leftMouseDown", function(e){
                arcball.down(e.x, e.y);
            });
            this.on("leftMouseDragged", function(e){
                arcball.drag(e.x, e.y);
            });

            var gl = this.gl;
            gl.enable(gl.DEPTH_TEST);

            // Make Material
            this.material_normal = new material.NormalMaterial(gl);

            // Make Cube
            this.cube = core.Vbo.createBox(gl, 1, 1, 1);
        },
        draw: function(){
            var gl = this.gl;

            // Clear Buffer
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var mv = this.camera_mv.dup().mul(this.arcball.orientation.toMat4())

            this.material_normal.use({
                modelview:  mv,
                projection: this.projection
            });
            this.material_normal.assignLocations(this.cube);
            this.cube.draw();
        }
    });
});
