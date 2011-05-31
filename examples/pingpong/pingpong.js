 var fs = require('fs')
,   plask = require('plask')
,   em = require('../../embr-plask');

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

        this.projection = new em.Mat4().ortho(-1, 1, -1, 1, -1, 1);

        // Make Shaders
        em.Program.include("noise3D.glsl", fs.readFileSync("noise3D.glsl", "utf8"));
        this.smear_prog = new em.Program(gl, fs.readFileSync("smear.glsl", "utf8"));
        this.tex_prog   = new em.Program(gl, fs.readFileSync("texture.glsl", "utf8"));
        this.color_prog = new em.Program(gl, fs.readFileSync("color.glsl", "utf8"));

        // Make PingPong Framebuffers
        this.pp = new em.PingPong(gl, 512, 512, [
            { target: gl.TEXTURE_2D, format: gl.RGBA, filter_mag: gl.LINEAR, filter_min: gl.LINEAR },
            { target: gl.RENDERBUFFER, attach: gl.DEPTH_ATTACHMENT, formati: gl.DEPTH_COMPONENT16 }
        ]);

        // Make Plane
        this.plane = em.Vbo.makePlane(gl, -1, -1, 1, 1);
        this.plane.attributes.position.location = this.smear_prog.loc_a_position;
        this.plane.attributes.texcoord.location = this.smear_prog.loc_a_texcoord;

        // Make Brush (todo: somehow this is broken)
        this.cube = em.Vbo.makeCube(gl, 0.1, 0.1, 0.1);
        this.cube.attributes.position.location = this.color_prog.loc_a_position;

        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },

    draw: function()
    {
        var gl = this.gl;
        var prog;

        var time = this.frametime;

        // First Pass: Render to FBO

        this.pp.bind();

        prog = this.smear_prog;
        prog.use();
        var r = em.Noise.sn2(0, time / 10) * 0.1;
        prog.set_u_mvp_matrix(this.projection.dup().rotate(r, 0,0,1).scale(1.04, 1.04, 1.04));
        prog.set_u_time(this.frametime / 4);
        prog.set_u_scale(0.01);
        prog.set_u_tex(0);

        this.pp.bindTexture(0);
        this.plane.draw();
        this.pp.unbindTexture(0);

        prog = this.color_prog;
        prog.use();
        prog.set_u_mvp_matrix(this.projection);
        prog.set_u_color(new em.Vec4(Math.sin(time * 2), Math.sin(time * 3), Math.cos(time * 4), 0.25));
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
