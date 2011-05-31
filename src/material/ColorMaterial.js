Embr.ColorMaterial = (function(){

    var src_vertex = [
        "uniform mat4 modelview, projection;",

        "attribute vec3 a_position;",

        "#ifdef use_vertex_color",
            "attribute vec4 a_color;",
            "varying vec4 v_color;",
        "#endif",

        "void main(){",
            "#ifdef use_vertex_color",
                "v_color = a_color;",
            "#endif",
            "gl_Position = projection * modelview * vec4(a_position, 1.0);",
        "}"
    ].join("\n");

    var src_fragment = [
        "uniform vec4 color;",

        "#ifdef use_vertex_color",
        "varying vec4 v_color;",
        "#endif",

        "void main(){",
            "#ifdef use_vertex_color",
                "gl_FragColor = v_color * color;",
            "#else",
                "gl_FragColor = color;",
            "#endif",
        "}"
    ].join("\n");


    var default_options = {
        attributes: {
            position: "a_position",
            color:    "a_color"
        },
        flags: {
            use_vertex_color: false
        }
    };


    function ColorMaterial(gl, options){
        options = Embr.Util.mergeOptions(default_options, options);
        Embr.Material.call(this, gl, src_vertex, src_fragment, options);
    }

    ColorMaterial.prototype = Object.create(Embr.Material.prototype);


    return ColorMaterial;

})();
