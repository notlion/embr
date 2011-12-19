// Texture

define(function(){

    "use strict";

    function Texture(gl){
        this.gl = gl;
        this.handle = gl.createTexture();
    }

    Texture.prototype = {

        dispose: function(){
            this.gl.deleteTexture(this.handle);
        },

        updateFormat: function(fmt){
            var gl = this.gl;

            if(typeof fmt != "object")
                fmt = {};

            this.target     = fmt.target     || gl.TEXTURE_2D;
            this.format     = fmt.format     || gl.RGBA;
            this.formati    = fmt.formati    || gl.RGBA;
            this.type       = fmt.type       || gl.UNSIGNED_BYTE;
            this.filter_min = fmt.filter_min || gl.NEAREST;
            this.filter_mag = fmt.filter_mag || gl.NEAREST;
            this.wrap_s     = fmt.wrap_s     || gl.CLAMP_TO_EDGE;
            this.wrap_t     = fmt.wrap_t     || gl.CLAMP_TO_EDGE;
            this.unit       = fmt.unit >= 0 ? gl.TEXTURE0 + fmt.unit : gl.TEXTURE0;

            gl.bindTexture(this.target, this.handle);
            gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.filter_min);
            gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, this.filter_mag);
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, this.wrap_s);
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, this.wrap_t);
        },

        setDataWithElement: function(element, fmt){
            var gl = this.gl;
            this.updateFormat(fmt);
            // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(this.target, 0, this.formati, this.format, this.type, element);
        },

        setData: function(width, height, data, fmt){
            var gl = this.gl;
            this.updateFormat(fmt);
            gl.texImage2D(this.target, 0, this.formati, width, height, 0, this.format, this.type, data);
        },

        updateData: function(data){
            var gl = this.gl;
            gl.bindTexture(this.target, this.handle);
            gl.texSubImage2D(this.target, 0, 0, 0, this.width, this.height, this.format, this.type, data);
        },

        bind: function(unit){
            var gl = this.gl;
            if(unit !== undefined)
                this.unit = gl.TEXTURE0 + unit;
            gl.activeTexture(this.unit);
            gl.bindTexture(this.target, this.handle);
        },
        unbind: function(){
            var gl = this.gl;
            gl.activeTexture(this.unit);
            gl.bindTexture(this.target, null);
        }

    };

    return Texture;

});
