// Skia Canvas Texture

Embr.TextureSkCanvas = (function(){

    function TextureSkCanvas(gl, canvas, fmt){
        this.gl     = gl;
        this.width  = canvas.width;
        this.height = canvas.height;

        if(fmt === undefined) fmt = {};

        var filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
        ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
        ,   wrap_s     = fmt.wrap_s     !== undefined ? fmt.wrap_s     : gl.CLAMP_TO_EDGE
        ,   wrap_t     = fmt.wrap_t     !== undefined ? fmt.wrap_t     : gl.CLAMP_TO_EDGE;

        this.target = fmt.target !== undefined ? fmt.target : gl.TEXTURE_2D;
        this.unit   = fmt.unit   !== undefined ? fmt.unit   : gl.TEXTURE0;

        this.handle = gl.createTexture();
        gl.bindTexture(this.target, this.handle);
        gl.texImage2DSkCanvas(this.target, 0, canvas);
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, filter_min);
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, filter_mag);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrap_s);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrap_t);
    }

    TextureSkCanvas.prototype = {
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
        },
        update: function(data){
            var gl = this.gl;
            gl.bindTexture(this.target, this.handle);
            gl.texSubImage2D(this.target, 0, 0, 0, this.width, this.height, this.format, this.type, data);
        }
    };

    return TextureSkCanvas;

})();
