Embr.ColorMaterial = (function(){

    var src_vertex = [
        "uniform mat4 modelview, projection;",

        "attribute vec3 a_position;",
        "attribute vec4 a_color;",

        "varying vec4 v_color;",

        "void main(){",
            "v_color = a_color;",
            "gl_Position = projection * modelview * vec4(a_position, 1.0);",
        "}"
    ].join("\n");

    var src_fragment = [
        "uniform vec4 color;",

        "varying vec4 v_color;",

        "void main(){",
            "gl_FragColor = v_color * color;",
        "}"
    ].join("\n");


    function ColorMaterial(gl){
        Embr.Material.call(this, gl, src_vertex, src_fragment);

        this.attribute_locations = {
            position: this.program.locations.a_position,
            color:    this.program.locations.a_color
        };
    }

    ColorMaterial.prototype = Object.create(Embr.Material);


    return ColorMaterial;

})();