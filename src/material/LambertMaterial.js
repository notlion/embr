define([

    "embr/core/Util",
    "embr/material/Material"

], function(Util, Material){

    "use strict";

    var src_vertex = [
        "uniform mat4 modelview_matrix, projection_matrix;",
        "uniform mat3 normal_matrix;",

        "attribute vec3 a_position;",
        "attribute vec3 a_normal;",

        "varying vec3 v_normal;",

        "void main(){",
            "v_normal = normal_matrix * a_normal;",
            "gl_Position = projection_matrix * modelview_matrix * vec4(a_position, 1.0);",
        "}"
    ].join("\n");

    var src_fragment = [
        "uniform vec3 light_direction;",
        "uniform vec4 ambient_color, diffuse_color;",

        "varying vec3 v_normal;",

        "void main(){",
            "float i = clamp(dot(light_direction, normalize(v_normal)), 0.0, 1.0);",
            "gl_FragColor = ambient_color;",
            "gl_FragColor += diffuse_color * i;",
        "}"
    ].join("\n");


    var default_options = {
        attributes: {
            position: "a_position",
            normal:   "a_normal"
        },
        flags: {
            use_vertex_color: false
        }
    };


    return Util.extend(Material, function NormalMaterial(gl, options){
        options = Util.mergeOptions(default_options, options);
        Material.call(this, gl, src_vertex, src_fragment, options);
    });

});
