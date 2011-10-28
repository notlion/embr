// Ping-Pong
// Two swappable framebuffers. Used for feedback effects and GPGPU where it's necessary to access the state of the last iteration.

define([

    "embr/core/Fbo"

], function(Fbo){

    "use strict";

    function PingPong(gl, width, height, formats){
        this.wbuffer = new Fbo(gl, width, height, formats);
        this.rbuffer = new Fbo(gl, width, height, formats);
        this.swap();
    }

    PingPong.prototype = {

        swap: function(){
            var tmp = this.wbuffer;
            this.wbuffer = this.rbuffer;
            this.rbuffer = tmp;
        },

        bind: function(){
            this.wbuffer.bind();
        },
        unbind: function(){
            this.wbuffer.unbind();
        },

        bindTexture: function(){
            this.rbuffer.bindTexture.apply(this.rbuffer, arguments);
        },
        unbindTexture: function(){
            this.rbuffer.unbindTexture.apply(this.rbuffer, arguments);
        }

    };

    return PingPong;

});
