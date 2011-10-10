var plask = require("plask");
var em = require("../../embr-plask");

function makeDisc(gl, radius, num_segs){
    var positions = [ 0, 0 ];
    var indices = [];
    for(var theta, i = 0; i < num_segs; ++i){
        theta = i / num_segs * Math.PI * 2;
        positions.push(
            Math.cos(theta) * radius,
            Math.sin(theta) * radius
        );
        indices.push(0, i + 1, ((i + 1) % num_segs) + 1);
    }
    return new em.Vbo(gl, gl.TRIANGLES, gl.STATIC_DRAW, {
        position: { data: positions, size: 2 },
        index:    { data: indices }
    });
}

plask.simpleWindow({
    settings: {
        type: "3d",
        width: 500,
        height: 500,
        multisample: true
    },
    init: function(){
        var gl = this.gl;

        this.modelview = new em.Mat4().lookAt(
            0, 0, 4, // Eye Position
            0, 0, 0, // Target Position
            0, 1, 0  // Up Vector
        );

        this.circle = makeDisc(gl, 1, 32);
        this.material = new em.ColorMaterial(gl);
        this.material.use({
            color: new em.Vec4(1, 1, 0, 1),
            projection: new em.Mat4().perspective(60, this.width / this.height, 0.01, 8)
        });

        this.framerate(60);
    },
    draw: function(){
        var gl = this.gl;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.material.use();
        this.material.uniforms.modelview(this.modelview);
        this.material.assignLocations(this.circle);
        this.circle.draw();

        this.modelview.rotate(0.01, 0, 1, 0);
    }
})
