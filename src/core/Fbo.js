// Frame Buffer Object

Embr.Fbo = (function(){

    function Fbo(gl, width, height, formats){
        this.gl     = gl;
        this.width  = width;
        this.height = height;

        this.tex_attachments = [];
        this.render_attachments = [];

        this.handle = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);

        for(var i = 0, n = formats.length, cai = 0; i < n; i++){
            var fmt = formats[i]
            ,   target  = fmt.target  !== undefined ? fmt.target  : gl.TEXTURE_2D
            ,   formati = fmt.formati !== undefined ? fmt.formati : gl.RGBA
            ,   attach  = fmt.attach  !== undefined ? fmt.attach  : gl.COLOR_ATTACHMENT0 + cai++;

            if(target == gl.RENDERBUFFER){ // Renderbuffer Attachment (Depth, etc)
                var rb_handle = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, rb_handle);
                gl.renderbufferStorage(target, formati, width, height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attach, target, rb_handle);

                this.render_attachments.push({ handle: rb_handle });
            }
            else{ // Texture Attachment
                var format     = fmt.format     !== undefined ? fmt.format     : gl.RGBA
                ,   type       = fmt.type       !== undefined ? fmt.type       : gl.UNSIGNED_BYTE
                ,   filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
                ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
                ,   wrap_s     = fmt.wrap_s     !== undefined ? fmt.wrap_s     : gl.CLAMP_TO_EDGE
                ,   wrap_t     = fmt.wrap_t     !== undefined ? fmt.wrap_t     : gl.CLAMP_TO_EDGE

                var tex_handle = gl.createTexture();
                gl.bindTexture(target, tex_handle);
                gl.texImage2D(target, 0, formati, width, height, 0, format, type, null);
                gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter_min);
                gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter_mag);
                gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap_s);
                gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap_t);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attach, target, tex_handle, 0);

                this.tex_attachments.push({ handle: tex_handle
                                          , target: target
                                          , unit:   gl.TEXTURE0 });
            }
        }

        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){
            throw "Incomplete frame buffer object.";
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    Fbo.prototype = {
        bind: function(){
            var gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
        },
        unbind: function(){
            var gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        bindTexture: function(i, unit){
            var gl  = this.gl
            ,   att = this.tex_attachments[i];
            if(unit !== undefined)
                att.unit = gl.TEXTURE0 + unit;
            gl.activeTexture(att.unit);
            gl.bindTexture(att.target, att.handle);
        },
        unbindTexture: function(i){
            var gl  = this.gl;
            var att = this.tex_attachments[i];
            gl.activeTexture(att.unit);
            gl.bindTexture(att.target, null);
        }
    };

    return Fbo;

})();
