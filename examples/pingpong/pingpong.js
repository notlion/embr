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
        this.smear_prog.link();

        this.color_mater = new em.ColorMaterial(gl);
        this.color_mater.useUniforms({
            projection: this.projection,
            modelview:  new em.Mat4()
        });

        this.tex_mater = new em.ColorMaterial(gl, {
            flags: { use_texture: true }
        });
        this.tex_mater.useUniforms({
            projection: this.projection,
            modelview:  new em.Mat4(),
            texture:    0,
            color:      new em.Vec4(1,1,1,1)
        });

        // Make PingPong Framebuffers
        this.pp = new em.PingPong(gl, 512, 512, [
            { target: gl.TEXTURE_2D, format: gl.RGBA, filter_mag: gl.LINEAR, filter_min: gl.LINEAR },
            { target: gl.RENDERBUFFER, attach: gl.DEPTH_ATTACHMENT, formati: gl.DEPTH_COMPONENT16 }
        ]);

        // Make Plane
        this.plane = em.Vbo.makePlane(gl, -1, -1, 1, 1);
        this.plane.attributes.position.location = this.smear_prog.locations.a_position;
        this.plane.attributes.texcoord.location = this.smear_prog.locations.a_texcoord;

        this.cube = em.Vbo.makeCube(gl, 0.1, 0.1, 0.1);
        this.color_mater.assignLocations(this.cube);
    },

    draw: function()
    {
        var gl = this.gl;
        var time = this.frametime;

        // First Pass: Render to FBO

        this.pp.bind();

        var r = em.Noise.sn2(0, time / 10) * 0.1;
        this.smear_prog.useUniforms({
            u_mvp_matrix: this.projection.dup().rotate(r, 0,0,1).scale(1.04, 1.04, 1.04),
            u_time:       this.frametime / 4,
            u_scale:      0.01,
            u_tex:        0
        });

        this.pp.bindTexture(0);
        this.plane.draw();
        this.pp.unbindTexture(0);

        this.color_mater.use();
        this.color_mater.uniforms.color(
            new em.Vec4(Math.sin(time * 2), Math.sin(time * 3), Math.cos(time * 4), 0.25)
        );
        this.cube.draw();

        this.pp.unbind();


        // Second Pass: Render to Screen

        this.tex_mater.use();

        this.pp.bindTexture(0);
        this.plane.draw();
        this.pp.unbindTexture(0);


        this.pp.swap();
    }
});
