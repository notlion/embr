define([

    "core/Util",
    "material/Material"

], function(Util, Material){

    "use strict";

    var src_vertex =
    [   "uniform mat4 modelview, projection;"

    ,   "attribute vec3 a_position;"
    ,   "attribute vec3 a_normal;"

    ,   "varying vec4 v_color;"

    ,   "void main(){"
    ,       "vec4 normal = modelview * vec4(a_normal, 0.0);"
    ,       "v_color = vec4((normal.xyz + 1.0) * 0.5, 1.0);"
    ,       "gl_Position = projection * modelview * vec4(a_position, 1.0);"
    ,   "}"
    ].join("\n");

    var src_fragment =
    [   "varying vec4 v_color;"

    ,   "void main(){"
    ,       "gl_FragColor = v_color;"
    ,   "}"
    ].join("\n");


    var default_options = {
        attributes: {
            position: "a_position",
            normal:   "a_normal"
        }
    };


    return Util.extend(Material, function NormalMaterial(gl, options){
        options = Util.mergeOptions(default_options, options);
        Material.call(this, gl, src_vertex, src_fragment, options);
    });

});
