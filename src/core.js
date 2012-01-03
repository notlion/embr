define([

    "embr/core/Math",
    "embr/core/Util",

    "embr/core/Vec2",
    "embr/core/Vec3",
    "embr/core/Vec4",
    "embr/core/Mat4",
    "embr/core/Quat",

    "embr/core/Program",
    "embr/core/Texture",
    "embr/core/Vbo",
    "embr/core/Fbo",
    "embr/core/PingPong"

], function(math, util, Vec2, Vec3, Vec4, Mat4, Quat, Program, Texture, Vbo, Fbo, PingPong){
    return {
        math:     math,
        util:     util,
        Vec2:     Vec2,
        Vec3:     Vec3,
        Vec4:     Vec4,
        Mat4:     Mat4,
        Quat:     Quat,
        Program:  Program,
        Texture:  Texture,
        Vbo:      Vbo,
        Fbo:      Fbo,
        PingPong: PingPong
    };
});
