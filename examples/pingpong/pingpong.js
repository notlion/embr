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

    init: function(){
        var gl = this.gl;

        this.projection = new em.Mat4().ortho(-1, 1, -1, 1, -1, 1);

        // Make Shaders
        em.Program.include("noise3D.glsl", fs.readFileSync("noise3D.glsl", "utf8"));

        this.m_smear = new em.Material(gl, fs.readFileSync("smear.glsl", "utf8"), null, {
            attributes: {
                position: "a_position",
                texcoord: "a_texcoord"
            }
        });

        this.m_color = new em.ColorMaterial(gl);
        this.m_color.use({
            projection: this.projection,
            modelview:  new em.Mat4()
        });

        this.m_texture = new em.ColorMaterial(gl, {
            flags: { use_texture: true }
        });
        this.m_texture.use({
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
        this.cube = em.Vbo.makeCube(gl, 0.05, 0.05, 0.05);

        this.framerate(60);
    },

    draw: function(){
        var gl = this.gl;


        // First Pass: Render to FBO

        this.pp.bind();

        this.m_smear.use();
        this.m_smear.uniforms.u_time( this.frametime / 4 );
        this.m_smear.uniforms.u_scale( 0.01 );
        this.m_smear.uniforms.u_tex( 0 );

        var r = em.Noise.sn2(0, this.frametime / 10) * 0.1;
        this.m_smear.uniforms.u_mvp_matrix(
            this.projection.dup().rotate(r, 0, 0, 1).scale(1.03, 1.03, 1.03)
        );

        this.pp.bindTexture(0);
        this.plane.draw(this.m_smear);
        this.pp.unbindTexture(0);

        this.m_color.use();
        this.m_color.uniforms.color(
            new em.Vec4(
                Math.sin(this.frametime * 2),
                Math.sin(this.frametime * 3),
                Math.cos(this.frametime * 4),
                0.25
            )
        );
        this.cube.draw(this.m_color);

        this.pp.unbind();


        // Second Pass: Render to Screen

        this.pp.bindTexture(0);
        this.plane.draw(this.m_texture);
        this.pp.unbindTexture(0);


        this.pp.swap();
    }
});
