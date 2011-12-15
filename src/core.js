(function(){

    var names = [
        "Vec2",
        "Vec3",
        "Vec4",
        "Mat4",
        "Quat",

        "math",
        "Util",

        "Program",
        "Texture",
        "Vbo",
        "Fbo",
        "PingPong"
    ];

    define(names.map(function(name){
        return "embr/core/" + name;
    }), function(){
        var exports = {};
        for(var i = names.length; --i >= 0;)
            exports[names[i]] = arguments[i];
        return exports;
    });

})();
