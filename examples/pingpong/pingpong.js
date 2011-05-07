var fs = require('fs')
,   plask = require('plask')
,   em = require('../../embr');

plask.simpleWindow({
    settings: {
        title:   "PiNg.pOnG",
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

        this.projection = new plask.Mat4().ortho(-1, 1, -1, 1, -1, 1);

        // Make Shaders
        em.loadProgram("noise3D.glsl");
        this.smear_prog = new em.Program(gl, "smear.glsl");
        this.tex_prog   = new em.Program(gl, "texture.glsl");
        this.color_prog = new em.Program(gl, "color.glsl");

        // Make PingPong Framebuffers
        this.pp = new em.PingPong(gl, 512, 512, [
            { target: gl.TEXTURE_2D, format: gl.RGBA, filter_mag: gl.LINEAR, filter_min: gl.LINEAR },
            { target: gl.RENDERBUFFER, attach: gl.DEPTH_ATTACHMENT, formati: gl.DEPTH_COMPONENT16 }
        ]);

        // Make Plane
        this.plane = em.makePlane(gl, -1, -1, 1, 1, this.smear_prog.loc_a_position,
                                                    this.smear_prog.loc_a_texcoord);

        // Make Brush (todo: somehow this is broken)
        this.cube = em.makeCube(gl, 0.1, 0.1, 0.1, this.color_prog.loc_a_position);
    },

    draw: function()
    {
        var gl = this.gl;
        var prog;


        // First Pass: Render to FBO

        this.pp.bind();

        prog = this.smear_prog;
        prog.use();
        prog.set_u_mvp_matrix(this.projection.dup().scale(1.02, 1.02, 1.02));
        prog.set_u_time(this.frametime / 2);
        prog.set_u_scale(0.01);
        prog.set_u_tex(0);

        this.pp.bindTexture(0);
        this.plane.draw();
        this.pp.unbindTexture(0);

        prog = this.color_prog;
        prog.use();
        prog.set_u_mvp_matrix(this.projection.dup().rotate(this.frametime, 1,1,0));
        var color_time = this.frametime / 10;
        prog.set_u_color(new em.Vec4(1, Math.sin(color_time), Math.cos(color_time), 1));
        this.cube.draw();

        this.pp.unbind();


        // Second Pass: Render to Screen

        prog = this.tex_prog;
        prog.use();
        prog.set_u_mvp_matrix(this.projection);
        prog.set_u_tex(0);

        this.pp.bindTexture(0);
        this.plane.draw();
        this.pp.unbindTexture(0);


        this.pp.swap();
    }
});
