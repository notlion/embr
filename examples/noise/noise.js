var fs = require('fs')
,   plask = require('plask')
,   em = require('../../embr');

plask.simpleWindow({
    settings: {
        title:   "¡NoisE!",
        type:    "3d",
        width:   512,
        height:  512,
        vsync:   true,
        center:  true
    },

    init: function()
    {
        this.framerate(60);
        var gl = this.gl;

        this.projection = new plask.Mat4().ortho(0, 1, 0, 1, -1, 1);

        // Make Shaders
        em.loadProgram("noise3D.glsl");
        this.prog_noise = new em.Program(gl, "noise.glsl");

        // Make Plane (for rendering FBOs)
        this.plane = em.makePlane(gl, 0, 0, 1, 1, this.prog_noise.loc_a_pos,
                                                  this.prog_noise.loc_a_texc);
    },

    draw: function()
    {
        var gl = this.gl;

        var prog = this.prog_noise;
        prog.use();
        prog.set_u_mvp(this.projection);
        prog.set_u_time(this.frametime);
        this.plane.draw();
    }
});
