var plask = require('plask');
var em    = require('../../src/main-plask');

em.require([
    "embr/core",
    "embr/noise",
    "embr/material",
    "text!noise3D.glsl",
    "text!smear.glsl"
], function(core, noise, material, glsl_noise3D, glsl_smear){
    plask.simpleWindow({
        settings: {
            type: "3d",
            width: 512,
            height: 512
        },
        init: function(){
            var gl = this.gl;

            this.projection = new core.Mat4().ortho(-1, 1, -1, 1, -1, 1);

            // Make Shaders
            core.Program.include("noise3D.glsl", glsl_noise3D);

            this.m_smear = new material.Material(gl, glsl_smear, null, {
                attributes: {
                    position: "a_position",
                    texcoord: "a_texcoord"
                }
            });

            this.m_color = new material.ColorMaterial(gl);
            this.m_color.use({
                projection: this.projection,
                modelview:  new core.Mat4()
            });

            this.m_texture = new material.ColorMaterial(gl, {
                flags: { use_texture: true }
            });
            this.m_texture.use({
                projection: this.projection,
                modelview:  new core.Mat4(),
                texture:    0,
                color:      new core.Vec4(1,1,1,1)
            });

            // Make PingPong Framebuffers
            this.pp = new core.PingPong(gl, 512, 512, [
                { target: gl.TEXTURE_2D, format: gl.RGBA, filter_mag: gl.LINEAR, filter_min: gl.LINEAR },
                { target: gl.RENDERBUFFER, attach: gl.DEPTH_ATTACHMENT, formati: gl.DEPTH_COMPONENT16 }
            ]);

            // Make Plane
            this.plane = core.Vbo.makePlane(gl, -1, -1, 1, 1);
            this.cube = core.Vbo.makeCube(gl, 0.05, 0.05, 0.05);

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

            var r = noise.sn2(0, this.frametime / 10) * 0.1;
            this.m_smear.uniforms.u_mvp_matrix(
                this.projection.dup().rotate(r, 0, 0, 1).scale(1.03, 1.03, 1.03)
            );

            this.pp.bindTexture(0);
            this.plane.draw(this.m_smear);
            this.pp.unbindTexture(0);

            this.m_color.use();
            this.m_color.uniforms.color(
                new core.Vec4(
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
});
