var names = [
    "Vec2",
    "Vec3",
    "Vec4",
    "Mat4",
    "Quat",

    "Math",
    "Util",
    "Noise",

    "Program",
    "Texture",
    "Vbo",
    "Fbo",
    "PingPong",

    "Arcball"
];

define(names.map(function(name){
    return "embr/core/" + name;
}), function(){
    var core = {};
    for(var i = names.length; --i >= 0;)
        core[names[i]] = arguments[i];
    return core;
});
