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

    init: function(){
        this.framerate(60);

        this.projection = new em.Mat4().perspective(60, this.width / this.height, 0.01, 8);
        this.modelview  = new em.Mat4().lookAt( 0, 0,-4,  // Eye Position
                                                0, 0, 0,  // Target Position
                                                0, 1, 0); // Up Vector

        var gl = this.gl;
        gl.enable(gl.DEPTH_TEST);

        // Make Materials
        this.material_normal = new em.NormalMaterial(gl);
        this.material_color  = new em.ColorMaterial(gl);
        this.material_color.use({
            color: new em.Vec4(1,1,0,1)
        });

        // Make Cube
        this.cube = em.Vbo.makeCube(gl, 1, 1, 1);
        this.material_normal.assignLocations(this.cube);
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
        this.material_normal.assignLocations(this.cube);
        this.cube.draw();

        // Clear Depth Buffer only
        gl.clear(gl.DEPTH_BUFFER_BIT);

        this.material_color.use();
        this.material_color.uniforms.modelview(this.modelview.dup().scale(0.5, 0.5, 0.5));
        this.material_color.uniforms.projection(this.projection);
        this.material_color.assignLocations(this.cube);
        this.cube.draw();
    }
});
