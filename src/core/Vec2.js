define(function(){

    "use strict";

    function Vec2(x, y) {
      this.x = x; this.y = y;
    }

    Vec2.prototype = {

        function(x, y){
            this.x = x; this.y = y;
            return this;
        },

        setVec2: function(v){
            this.x = v.x; this.y = v.y;
            return this;
        },

        dot: function(b){
            return this.x * b.x + this.y * b.y;
        },

        add2: function(a, b){
            this.x = a.x + b.x;
            this.y = a.y + b.y;
            return this;
        },
        add: function(b){
            return this.add2(this, b);
        },
        added: function(b){
            return new Vec2(this.x + b.x,
                            this.y + b.y);
        },

        sub2: function(a, b){
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            return this;
        },
        sub: function(b){
            return this.sub2(this, b);
        },
        subbed: function(b){
            return new Vec2(this.x - b.x,
                            this.y - b.y);
        },

        mul2: function(a, b){
            this.x = a.x * b.x;
            this.y = a.y * b.y;
            return this;
        },
        mul: function(b){
            return this.mul2(this, b);
        },
        mulled: function(b){
            return new Vec2(this.x * b.x,
                            this.y * b.y);
        },

        scale: function(s){
            this.x *= s; this.y *= s;
            return this;
        },
        scaled: function(s){
            return new Vec2(this.x * s, this.y * s);
        },

        lerp: function(b, t){
            this.x = this.x + (b.x - this.x) * t;
            this.y = this.y + (b.y - this.y) * t;
            return this;
        },
        lerped: function(b, t){
            return new Vec2(this.x + (b.x - this.x) * t,
                            this.y + (b.y - this.y) * t);
        },

        length: function(){
            var x = this.x, y = this.y;
            return Math.sqrt(x * x + y * y);
        },
        lengthSquared: function(){
            var x = this.x, y = this.y;
            return x * x + y * y;
        },

        dist: function(b){
            var x = b.x - this.x;
            var y = b.y - this.y;
            return Math.sqrt(x * x + y * y);
        },
        distSquared: function(b){
            var x = b.x - this.x;
            var y = b.y - this.y;
            return x * x + y * y;
        },

        normalize: function(){
            return this.scale(1 / this.length());
        },
        normalized: function(){
            return this.dup().normalize();
        },

        // Rotate around the origin by |theta| radians.
        rotate: function(theta){
            var st = Math.sin(theta);
            var ct = Math.cos(theta);
            var x = this.x, y = this.y;
            this.x = x * ct - y * st;
            this.y = x * st + y * ct;
            return this;
        },
        rotated: function(theta){
            return this.dup().rotate(theta);
        },

        // Reflect a vector about the normal |n|. The vectors should both be unit.
        reflect = function(n){
            var s = this.dot(n) * 2;
            this.x -= n.x * s;
            this.y -= n.y * s;
            return this;
        },
        reflected = function(n){
            var s = this.dot(n) * 2;
            return new Vec2(this.x - n.x * s,
                            this.y - n.y * s);
        },

        dup: function(){
            return new Vec2(this.x, this.y);
        }

    };

    return Vec2;

});
