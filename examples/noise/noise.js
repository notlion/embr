var plask = require("plask");
var em    = require("../../src/main-plask");

em.require([
    "embr/core",
    "text!noise3D.glsl",
    "text!noise.glsl"
], function(core, glsl_noise3D, glsl_noise){
    plask.simpleWindow({
        settings: {
            type: "3d",
            width: 512,
            height: 512
        },
        init: function()
        {
            this.framerate(60);
            var gl = this.gl;

            this.projection = new core.Mat4().ortho(0, 1, 0, 1, -1, 1);

            // Make Shaders
            core.Program.include("noise3D.glsl", glsl_noise3D);
            this.prog_noise = new core.Program(gl, glsl_noise);
            this.prog_noise.link();

            // Make Plane (for rendering FBOs)
            this.plane = core.Vbo.createPlane(gl, 0, 0, 1, 1);
            this.plane.attributes.position.location = this.prog_noise.locations.a_position;
            this.plane.attributes.texcoord.location = this.prog_noise.locations.a_texcoord;
        },
        draw: function()
        {
            var gl = this.gl;

            this.prog_noise.use({
                u_mvp_matrix: this.projection,
                u_time:       this.frametime
            });
            this.plane.draw();
        }
    });
});
