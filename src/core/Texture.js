// Texture
// |data| typed array (Uint32Array, Float32Array)

Embr.Texture = (function(){

    function Texture(gl, width, height, data, fmt){
        this.width  = width;
        this.height = heigth;

        if(fmt === undefined) fmt = {};

        var filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
        ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
        ,   wrap_s     = fmt.wrap_s     !== undefined ? fmt.wrap_s     : gl.CLAMP_TO_EDGE
        ,   wrap_t     = fmt.wrap_t     !== undefined ? fmt.wrap_t     : gl.CLAMP_TO_EDGE;

        this.target  = fmt.target  !== undefined ? fmt.target  : gl.TEXTURE_2D;
        this.format  = fmt.format  !== undefined ? fmt.format  : gl.RGBA;
        this.formati = fmt.formati !== undefined ? fmt.formati : gl.RGBA;
        this.type    = fmt.type    !== undefined ? fmt.type    : gl.UNSIGNED_BYTE;

        this.handle = gl.createTexture();
        gl.bindTexture(this.target, this.handle);
        gl.texImage2D(target, 0, this.formati, width, height, 0, this.format, type, tex_data);
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, filter_min);
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, filter_mag);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrap_s);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrap_t);
    }

    Texture.prototype.bind = function(unit){
        var gl = this.gl;
        if(unit !== undefined)
            gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(this.target, obj);
    }

    Texture.prototype.unbind = function(unit){
        var gl = this.gl;
        if(unit !== undefined)
            gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(this.target, null);
    }

    Texture.prototype.update = function(data){
        var gl = this.gl;
        gl.bindTexture(this.target, this.handle);
        gl.texSubImage2D(this.target, 0, 0, 0, this.width, this.height, this.format, this.type, data);
    }

    return Texture;

})();
