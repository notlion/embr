// Math and Random Utilities

define([

    "embr/core/Vec3",
    "embr/core/Mat4"

], function(Vec3, Mat4){

    "use strict";

    var Math = {};

    var kPI2 = Math.kPI2 = Math.PI / 2;
    var kPI4 = Math.kPI4 = Math.PI / 4;
    var k2PI = Math.k2PI = Math.PI * 2;

    Math.rand = function(max){
        return Math.random() * max;
    };

    Math.rand2 = function(min, max){
        return min + Math.random() * (max - min);
    };

    Math.randSym = function(max){
        return max * 2 * Math.random() - max;
    };

    Math.lerp = function(min, max, t){
        return min + (max - min) * t;
    };

    Math.lmap = function(v, in_min, in_max, out_min, out_max){
        return out_min + (out_max - out_min) * ((v - in_min) / (in_max - in_min));
    };

    // Random point on a sphere
    Math.randVec3 = function(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Vec3( rho * Math.cos(phi) * radius
                       , rho * Math.sin(phi) * radius
                       , costheta * radius );
    };

});
