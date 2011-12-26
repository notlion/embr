// Quaternion

define([

    "embr/core/Mat4"

], function(Mat4){

    "use strict";

    function Quat(x, y, z, w){
        this.x = x; this.y = y; this.z = z; this.w = w;
    }

    Quat.identity = function(){
        return new Quat(0, 0, 0, 1);
    }

    Quat.prototype = {

        set: function(x, y, z, w){
            this.x = x; this.y = y; this.z = z; this.w = w;
            return this;
        },

        reset: function(){
            return this.set(0, 0, 0, 1);
        },

        length: function(){
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return Math.sqrt(x*x + y*y + z*z + w*w);
        },

        dot: function(b){
            return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
        },

        mul2: function(a, b){
            var ax = a.x, ay = a.y, az = a.z, aw = a.w
            ,   bx = b.x, by = b.y, bz = b.z, bw = b.w;

            this.x = bw*ax + bx*aw + by*az - bz*ay;
            this.y = bw*ay + by*aw + bz*ax - bx*az;
            this.z = bw*az + bz*aw + bx*ay - by*ax;
            this.w = bw*aw - bx*ax - by*ay - bz*az;

            return this;
        },

        mul: function(q){
            return this.mul2(this, q);
        },

        mulled: function(q){
            return this.dup().mul2(this, q);
        },

        mul4: function(x, y, z, w){
            var ax = this.x, ay = this.y, az = this.z, aw = this.w;

            this.x = w*ax + x*aw + y*az - z*ay;
            this.y = w*ay + y*aw + z*ax - x*az;
            this.z = w*az + z*aw + x*ay - y*ax;
            this.w = w*aw - x*ax - y*ay - z*az;

            return this;
        },

        normalize: function(){
            var len = this.length();

            if(len > 0){
                this.x /= len
                this.y /= len
                this.z /= len
                this.w /= len
            }

            return this;
        },

        rotate: function(theta, x, y, z){
            var len = Math.sqrt(x*x + y*y + z*z)

            if(len > 0){
                var t2  = theta / 2
                ,   st2 = Math.sin(t2);
                this.mul4((x / len) * st2,
                          (y / len) * st2,
                          (z / len) * st2,
                          Math.cos(t2));
            }

            return this;
        },

        slerp: function(q, t){
            // get cosine of "angle" between quaternions
            var ct = this.dot(q);
            var start, end, theta, recit_st;

            // if "angle" between quaternions is less than 90 degrees
            if(ct >= 0){
                // if angle is greater than zero
                if(1 - ct > 0){
                    // use standard slerp
                    theta = Math.acos(ct);
                    recip_st = 1 / Math.sin(theta);

                    start = Math.sin((1 - t) * theta) * recip_st;
                    end = Math.sin(t * theta) * recip_st;
                }
                // angle is close to zero
                else {
                    // use linear interpolation
                    start = 1 - t;
                    end = t;
                }
            }
            // otherwise, take the shorter route
            else{
                // if angle is less than 180 degrees
                if(1 + ct > 0){
                    // use slerp w/negation of start quaternion
                    theta = Math.acos(-ct);
                    recip_st = 1 / Math.sin(theta);

                    start = Math.sin((t - 1) * theta) * recip_st;
                    end = Math.sin(t * theta) * recip_st;
                }
                // angle is close to 180 degrees
                else {
                    // use lerp w/negation of start quaternion
                    start = t - 1;
                    end = t;
                }
            }

            return this.set(
                this.x * start + q.x * end,
                this.y * start + q.y * end,
                this.z * start + q.z * end,
                this.w * start + q.w * end
            );
        },

        getPitch: function(){
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return Math.asin(2 * (w*y + z*x));
        },

        getYaw: function(){
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return Math.atan2(2 * (w*z + x*y), 1 - 2 * (y*y + z*z));
        },

        getRoll: function(){
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return Math.atan2(2 * (w*x + y*z), 1 - 2 * (x*x + y*y));
        },

        toMat4: function(){
            var xs = this.x + this.x
            ,   ys = this.y + this.y
            ,   zs = this.z + this.z
            ,   wx = this.w * xs
            ,   wy = this.w * ys
            ,   wz = this.w * zs
            ,   xx = this.x * xs
            ,   xy = this.x * ys
            ,   xz = this.x * zs
            ,   yy = this.y * ys
            ,   yz = this.y * zs
            ,   zz = this.z * zs;

            return new Mat4().set4x4r(
                1 - (yy+zz), xy - wz,      xz + wy,     0,
                xy + wz,     1 - (xx+zz ), yz - wx,     0,
                xz - wy,     yz + wx,      1 - (xx+yy), 0,
                0,           0,            0,           1
            );
        },

        dup: function(){
            return new Quat(this.x, this.y, this.z, this.w);
        }

    };

    return Quat;

});
