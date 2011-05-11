// GLSL Shader Loader
// Parses #include "source.glsl" where source.glsl is a filename previously loaded via loadProgram() or makeProgram().
// Allows vertex and fragment code to be in the same file if surrounded by #ifdef VERTEX or FRAGMENT.

Embr.Program = (function(){

    var kShaderPrefix         = "#ifdef GL_ES\nprecision highp float;\n#endif\n"
    ,   kVertexShaderPrefix   = kShaderPrefix + "#define VERTEX\n"
    ,   kFragmentShaderPrefix = kShaderPrefix + "#define FRAGMENT\n"
    ,   program_cache = {};

    function processIncludes(src){
        var match, re = /^ *#include +"([\w\-\.]+)"/gm;
        while(match = re.exec(src)){
            var fn = match[1];
            if(fn in program_cache){
                var incl_src = program_cache[fn];
                src = src.replace(new RegExp(match[0]), incl_src);
                re.lastIndex = match.index + incl_src.length;
            }
        }
        return src;
    }

    function include(name, src){
        program_cache[name] = src;
    }

    function Program(gl, src){
        this.gl = gl;

        src = processIncludes(src);

        var vshader = this.vshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vshader, kVertexShaderPrefix + src);
        gl.compileShader(vshader);
        if(gl.getShaderParameter(vshader, gl.COMPILE_STATUS) !== true)
            throw gl.getShaderInfoLog(vshader);

        var fshader = this.fshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fshader, kFragmentShaderPrefix + src);
        gl.compileShader(fshader);
        if(gl.getShaderParameter(fshader, gl.COMPILE_STATUS) !== true)
            throw gl.getShaderInfoLog(fshader);

        var handle = this.handle = gl.createProgram();
        gl.attachShader(handle, vshader);
        gl.attachShader(handle, fshader);
        gl.linkProgram(handle);
        if(gl.getProgramParameter(handle, gl.LINK_STATUS) !== true)
            throw gl.getProgramInfoLog(handle);

        function makeSetter(type, loc){
            switch(type){
                case gl.BOOL:
                case gl.INT:
                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    return function(value){
                        gl.uniform1i(loc, value);
                        return this;
                    };
                case gl.FLOAT:
                    return function(value){
                        gl.uniform1f(loc, value);
                        return this;
                    };
                case gl.FLOAT_VEC2:
                    return function(v){
                        gl.uniform2f(loc, v.x, v.y);
                    };
                case gl.FLOAT_VEC3:
                    return function(v){
                        gl.uniform3f(loc, v.x, v.y, v.z);
                    };
                case gl.FLOAT_VEC4:
                    return function(v){
                        gl.uniform4f(loc, v.x, v.y, v.z, v.w);
                    };
                case gl.FLOAT_MAT4:
                    return function(mat4){
                        gl.uniformMatrix4fv(loc, false, mat4.toFloat32Array());
                    };
            }
            return function(){
                throw "Unknown uniform type: " + type;
            };
        }

        // Create Uniform Setters / Getters
        var nu = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
        for(var i = 0; i < nu; i++){
            var info = gl.getActiveUniform(handle, i);
            var loc  = gl.getUniformLocation(handle, info.name);
            this['set_' + info.name] = makeSetter(info.type, loc);
            this['loc_' + info.name] = loc;
        }

        // Create Attribute Setters / Getters
        var na = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
        for(var i = 0; i < na; i++){
            var info = gl.getActiveAttrib(handle, i);
            var loc  = gl.getAttribLocation(handle, info.name);
            this['loc_' + info.name] = loc;
        }
    }

    Program.prototype.use = function(){
        this.gl.useProgram(this.handle);
    };

    Program.include = include;

    return Program;

})();