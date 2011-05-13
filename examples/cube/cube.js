var fs = require('fs')
,   plask = require('plask')
,   em = require('../../embr-plask');

plask.simpleWindow({
    settings: {
        title:   "CuBe",
        type:    "3d",
        width:   512,
        height:  512,
        vsync:   true,
        center:  true
    },

    init: function()
    {
        this.framerate(60);

        this.projection = new em.Mat4().perspective(60, this.width / this.height, 0.01, 8);
        this.modelview  = new em.Mat4().lookAt( 0, 0,-4,  // Eye Position
                                                0, 0, 0,  // Target Position
                                                0, 1, 0); // Up Vector

        var gl = this.gl;
        gl.enable(gl.DEPTH_TEST)

        // Make Shader
        this.prog = new em.Program(gl, fs.readFileSync("cube.glsl", "utf8"));

        // Make Cube
        this.cube = em.Vbo.makeCube(gl, 1, 1, 1);
        this.cube.attributes.position.location = this.prog.loc_a_position;
        this.cube.attributes.normal.location   = this.prog.loc_a_normal;
        this.cube.attributes.texcoord.location = this.prog.loc_a_texcoord;
    },

    draw: function()
    {
        var gl = this.gl

        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.modelview.rotate(Math.sin(this.frametime) * 0.03, 0, 1, 0);
        this.modelview.rotate(Math.cos(this.frametime) * 0.07, 1, 0, 0);

        var prog = this.prog;
        prog.use();
        prog.set_u_modelview(this.modelview);
        prog.set_u_projection(this.projection);

        this.cube.draw();
    }
});
