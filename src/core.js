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
    "PingPong"
];

define(names.map(function(name){
    return "embr/core/" + name;
}), function(){
    var module = {};
    for(var i = names.length; --i >= 0;)
        module[names[i]] = arguments[i];
    return module;
});
