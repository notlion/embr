define([

    "embr/core/Vec3",
    "embr/core/Quat"

], function(Vec3, Quat){

    "use strict";

    function Arcball(center, radius){
        this.center = center;
        this.radius = radius;
        this.orientation = Quat.identity();
        this.inverted = false;
    }

    Arcball.prototype = {

        screenToSphere: function(x, y, invert){
            var pos = new Vec3(
                (x - this.center.x) / this.radius,
                (y - this.center.y) / this.radius,
                0
            );

            if(this.inverted)
                pos.scale(-1);

            var len2 = pos.lengthSquared();
            if(len2 > 1){
                pos.scale(1 / Math.sqrt(len2));
            }
            else {
                pos.z = Math.sqrt(1 - len2);
                pos.normalize();
            }

            return pos;
        },

        down: function(x, y){
            this.down_pos = this.screenToSphere(x, y);
            this.down_ori = this.orientation.dup();
        },

        drag: function(x, y){
            var pos  = this.screenToSphere(x, y);
            var axis = this.down_pos.dup().cross(pos);
            this.orientation = this.down_ori.mulled(new Quat(axis.x, axis.y, axis.z, this.down_pos.dot(pos)));
            this.orientation.normalize();
        }

    };

    return Arcball;

});
