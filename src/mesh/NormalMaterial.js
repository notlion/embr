Embr.NormalMaterial = (function(){

    var src_vertex = [
        "uniform mat4 modelview, projection;",

        "attribute vec3 a_position;",
        "attribute vec3 a_normal;",

        "varying vec4 v_color;",

        "void main(){",
            "vec4 normal = modelview * vec4(a_normal, 0.0);",
            "v_color = vec4((normal.xyz + 1.0) * 0.5, 1.0);",
            "gl_Position = projection * modelview * vec4(a_position, 1.0);",
        "}"
    ].join("\n");

    var src_fragment = [
        "varying vec4 v_color;",

        "void main(){",
            "gl_FragColor = v_color;",
        "}"
    ].join("\n");


    function NormalMaterial(gl){
        Embr.Material.call(this, gl, src_vertex, src_fragment);

        this.attribute_locations = {
            position: this.locations.a_position,
            normal:   this.locations.a_normal
        };
    }

    NormalMaterial.prototype = Object.create(Embr.Material.prototype);


    return NormalMaterial;

})();
