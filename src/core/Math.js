// Math and Random Utilities

define([

    "embr/core/Vec3",
    "embr/core/Mat4"

], function(Vec3, Mat4){

    "use strict";

    var math = {};

    var kPI2 = Math.kPI2 = Math.PI / 2;
    var kPI4 = Math.kPI4 = Math.PI / 4;
    var k2PI = Math.k2PI = Math.PI * 2;

    math.rand = function(max){
        return Math.random() * max;
    };
    math.randInt = function(max){
        return Math.floor(Math.random() * max);
    };

    math.rand2 = function(min, max){
        return min + Math.random() * (max - min);
    };
    math.randInt2 = function(min, max){
        return Math.floor(min + Math.random() * (max - min));
    };

    math.randSym = function(max){
        return max * 2 * Math.random() - max;
    };

    math.lerp = function(min, max, t){
        return min + (max - min) * t;
    };

    math.lmap = function(v, in_min, in_max, out_min, out_max){
        return out_min + (out_max - out_min) * ((v - in_min) / (in_max - in_min));
    };

    math.clamp = function(v, min, max){
        return (v < min) ? min : ((v > max) ? max : v);
    };

    // Random point on a sphere
    math.randVec3 = function(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Vec3( rho * Math.cos(phi) * radius
                       , rho * Math.sin(phi) * radius
                       , costheta * radius );
    };

    return math;

});
