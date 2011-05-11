// Ping-Pong
// Two swappable framebuffers. Used for feedback effects and GPGPU where it's necessary to access the state of the last iteration.

Embr.PingPong = (function(){

    function PingPong(gl, width, height, formats){
        this.wbuffer = new Embr.Fbo(gl, width, height, formats);
        this.rbuffer = new Embr.Fbo(gl, width, height, formats);
        this.swap();
    }

    PingPong.prototype.swap = function(){
        var tmp = this.wbuffer;
        this.wbuffer = this.rbuffer;
        this.rbuffer = tmp;
    };

    PingPong.prototype.bind = function(){
        this.wbuffer.bind();
    };
    PingPong.prototype.unbind = function(){
        this.wbuffer.unbind();
    };

    PingPong.prototype.bindTexture = function(){
        this.rbuffer.bindTexture.apply(this.rbuffer, arguments);
    };
    PingPong.prototype.unbindTexture = function(){
        this.rbuffer.unbindTexture.apply(this.rbuffer, arguments);
    };

    return PingPong;

})();
