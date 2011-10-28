define(function(){

    "use strict";

    function Vec3(x, y, z){
        this.x = x; this.y = y; this.z = z;
    }

    Vec3.prototype = {

        set: function(x, y, z){
            this.x = x; this.y = y; this.z = z;
            return this;
        },
        setVec3: function(v){
            this.x = v.x; this.y = v.y; this.z = v.z;
            return this;
        },

        cross2: function(a, b){
            var ax = a.x, ay = a.y, az = a.z,
                bx = b.x, by = b.y, bz = b.z;

            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;

            return this;
        },
        cross: function(b){
            return this.cross2(this, b);
        },

        dot: function(b){
            return this.x * b.x + this.y * b.y + this.z * b.z;
        },

        add2: function(a, b){
            this.x = a.x + b.x;
            this.y = a.y + b.y;
            this.z = a.z + b.z;
            return this;
        },
        add: function(b){
            return this.add2(this, b);
        },
        added: function(b){
            return new Vec3(this.x + b.x,
                            this.y + b.y,
                            this.z + b.z);
        },

        sub2: function(a, b){
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            this.z = a.z - b.z;
            return this;
        },
        sub: function(b){
            return this.sub2(this, b);
        },
        subbed: function(b){
            return new Vec3(this.x - b.x,
                            this.y - b.y,
                            this.z - b.z);
        },

        mul2: function(a, b){
            this.x = a.x * b.x;
            this.y = a.y * b.y;
            this.z = a.z * b.z;
            return this;
        },
        mul: function(b){
            return this.mul2(this, b);
        },
        mulled: function(b){
            return new Vec3(this.x * b.x,
                            this.y * b.y,
                            this.z * b.z);
        },

        scale: function(s){
            this.x *= s; this.y *= s; this.z *= s;
            return this;
        },
        scaled: function(s){
            return new Vec3(this.x * s, this.y * s, this.z * s);
        },

        lerp: function(b, t){
            this.x = this.x + (b.x - this.x) * t;
            this.y = this.y + (b.y - this.y) * t;
            this.z = this.z + (b.z - this.z) * t;
            return this;
        },
        lerped: function(b, t){
            return new Vec3(this.x + (b.x - this.x) * t,
                            this.y + (b.y - this.y) * t,
                            this.z + (b.z - this.z) * t);
        },

        length: function(){
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        },
        lengthSquared: function(){
            var x = this.x, y = this.y, z = this.z;
            return x * x + y * y + z * z;
        },

        dist: function(b){
          var x = b.x - this.x;
          var y = b.y - this.y;
          var z = b.z - this.z;
          return Math.sqrt(x*x + y*y + z*z);
        },
        distSquared: function(b){
            var x = b.x - this.x;
            var y = b.y - this.y;
            var z = b.z - this.z;
            return x * x + y * y + z * z;
        },

        normalize: function(){
            return this.scale(1/this.length());
        },
        normalized: function(){
            return this.dup().normalize();
        },

        dup: function(){
            return new Vec3(this.x, this.y, this.z);
        }

    };

    return Vec3;

});
