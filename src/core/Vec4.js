define(function(){

    "use strict";

    function Vec4(x, y, z, w){
        this.x = x; this.y = y; this.z = z; this.w = w;
    }

    Vec4.prototype = {

        set: function(x, y, z, w){
            this.x = x; this.y = y; this.z = z; this.w = w;
            return this;
        },
        setVec4: function(v){
            this.x = v.x; this.y = v.y; this.z = v.z; this.w = v.w;
            return this;
        },

        dup: function(){
            return new Vec4(this.x, this.y, this.z, this.w);
        }

    };

    return Vec4;

});
