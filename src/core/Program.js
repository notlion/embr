Embr.Program = (function(){

    var kShaderPrefix = "#ifdef GL_ES\nprecision highp float;\n#endif\n";


    function Program(gl, src_vertex, src_fragment){
        this.gl = gl;

        var sv = this.shader_vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(sv, kShaderPrefix + src_vertex);
        gl.compileShader(sv);
        if(gl.getShaderParameter(sv, gl.COMPILE_STATUS) !== true)
            throw gl.getShaderInfoLog(sv);

        var sf = this.shader_frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(sf, kShaderPrefix + src_fragment);
        gl.compileShader(sf);
        if(gl.getShaderParameter(sf, gl.COMPILE_STATUS) !== true)
            throw gl.getShaderInfoLog(sf);

        this.handle = gl.createProgram();
    }

    Program.prototype.link = function(){
        var gl     = this.gl
        ,   handle = this.handle;
        gl.attachShader(handle, this.shader_vert);
        gl.attachShader(handle, this.shader_frag);
        gl.linkProgram(handle);
        if(gl.getProgramParameter(handle, gl.LINK_STATUS) !== true)
            throw gl.getProgramInfoLog(handle);

        function makeUniformSetter(type, location){
            switch(type){
                case gl.BOOL:
                case gl.INT:
                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    return function(value){
                        gl.uniform1i(location, value);
                        return this;
                    };
                case gl.FLOAT:
                    return function(value){
                        gl.uniform1f(location, value);
                        return this;
                    };
                case gl.FLOAT_VEC2:
                    return function(v){
                        gl.uniform2f(location, v.x, v.y);
                    };
                case gl.FLOAT_VEC3:
                    return function(v){
                        gl.uniform3f(location, v.x, v.y, v.z);
                    };
                case gl.FLOAT_VEC4:
                    return function(v){
                        gl.uniform4f(location, v.x, v.y, v.z, v.w);
                    };
                case gl.FLOAT_MAT4:
                    return function(mat4){
                        gl.uniformMatrix4fv(location, false, mat4.toFloat32Array());
                    };
            }
            return function(){
                throw "Unknown uniform type: " + type;
            };
        }

        this.locations = {};

        var nu = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
        for(var i = 0; i < nu; ++i){
            var info     = gl.getActiveUniform(handle, i);
            var location = gl.getUniformLocation(handle, info.name);
            var setter_name = info.name.charAt(0).toUpperCase() + info.name.slice(1);
            this["set" + setter_name] = makeUniformSetter(info.type, location);
            this.locations[info.name] = location;
        }

        var na = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
        for(var i = 0; i < na; ++i){
            var info     = gl.getActiveAttrib(handle, i);
            var location = gl.getAttribLocation(handle, info.name);
            this.locations[info.name] = location;
        }
    };

    Program.prototype.use = function(){
        this.gl.useProgram(this.handle);
    };

    Program.prototype.dispose = function(){
        this.gl.deleteShader(this.shader_vert);
        this.gl.deleteShader(this.shader_frag);
        this.gl.deleteProgram(this.handle);
    };


    return Program;

})();
