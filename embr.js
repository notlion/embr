var fs    = require('fs')
,   plask = require('plask');


// Shader Loader
// Parses includes: #include "incl.glsl"
// Allows vertex and fragment code to be in the same file but surrounded by
// #ifdef VERTEX or FRAGMENT

var kVertexShaderPrefix   = "#define VERTEX\n";
var kFragmentShaderPrefix = "#define FRAGMENT\n";

var programs = {};

function processShaderIncludes(src){
    var match, re = /^ *#include +"([\w\-\.]+)"/gm;
    while(match = re.exec(src)){
        var fn = match[1];
        if(fn in programs){
            var incl_src = programs[fn];
            src = src.replace(new RegExp(match[0]), incl_src);
            re.lastIndex = match.index + incl_src.length;
        }
    }
    return src;
}

exports.loadProgram = function(filename) {
    var src = processShaderIncludes(fs.readFileSync(filename, 'utf8'));
    programs[filename] = src;
}

exports.makeProgram = function(gl, filename) {
    var src = processShaderIncludes(fs.readFileSync(filename, 'utf8'));
    programs[filename] = src;

    var vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, kVertexShaderPrefix + src);
    gl.compileShader(vshader);
    if(gl.getShaderParameter(vshader, gl.COMPILE_STATUS) !== true)
        throw gl.getShaderInfoLog(vshader);

    var fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, kFragmentShaderPrefix + src);
    gl.compileShader(fshader);
    if(gl.getShaderParameter(fshader, gl.COMPILE_STATUS) !== true)
        throw gl.getShaderInfoLog(fshader);

    var prog = gl.createProgram();
    gl.attachShader(prog, vshader);
    gl.attachShader(prog, fshader);
    gl.linkProgram(prog);
    if(gl.getProgramParameter(prog, gl.LINK_STATUS) !== true)
        throw gl.getProgramInfoLog(prog);

    return prog;
}


// Magic Program taken from Dean McNamee's PreGL
exports.MagicProgram = function(gl, program){
    this.gl = gl;
    this.program = program;

    this.useProgram = function(){
        gl.useProgram(program);
    };

    function makeSetter(type, loc){
        switch(type){
            case gl.BOOL:  // NOTE: bool could be set with 1i or 1f.
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
            default:
            break;
        }

        return function(){
            throw "MagicProgram doesn't know how to set type: " + type;
        };
    }

    var num_uniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(var i = 0; i < num_uniforms; ++i){
        var info = gl.getActiveUniform(program, i);
        var name = info.name;
        var loc = gl.getUniformLocation(program, name);
        this['set_' + name] = makeSetter(info.type, loc);
        this['location_' + name] = loc;
    }

    var num_attribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(var i = 0; i < num_attribs; ++i){
        var info = gl.getActiveAttrib(program, i);
        var name = info.name;
        var loc = gl.getAttribLocation(program, name);
        this['location_' + name] = loc;
    }
}


// Object Creation Helpers

// Texture
// |data| typed array (Uint32Array, Float32Array)
exports.makeTexture = function(gl, width, height, data, fmt){
    var target     = fmt.target !== undefined ? fmt.target : gl.TEXTURE_2D
    ,   unit       = fmt.unit !== undefined ? fmt.unit : 0
    ,   formati    = fmt.formati !== undefined ? fmt.formati : gl.RGBA
    ,   format     = fmt.format !== undefined ? fmt.format : gl.RGBA
    ,   type       = fmt.type !== undefined ? fmt.type : gl.UNSIGNED_BYTE
    ,   filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
    ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
    ,   wrap_s     = fmt.wrap_s !== undefined ? fmt.wrap_s : gl.CLAMP_TO_EDGE
    ,   wrap_t     = fmt.wrap_t !== undefined ? fmt.wrap_t : gl.CLAMP_TO_EDGE
    ,   tex_data   = data !== undefined ? data : null;
    var obj = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(target, obj);
    gl.texImage2D(target, 0, formati, width, height, 0, format, type, tex_data);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter_min);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter_mag);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap_s);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap_t);

    return {
        width:  width,
        height: height,
        obj:    obj,
        target: target,
        unit:   unit,
        bind: function(gl, unit){
            if(unit !== undefined)
                this.unit = unit;
            gl.activeTexture(gl.TEXTURE0 + this.unit);
            gl.bindTexture(this.target, this.obj);
        },
        unbind: function(gl, unit){
            gl.activeTexture(gl.TEXTURE0 + this.unit);
            gl.bindTexture(this.target, null);
        }
    };
}


// Frame Buffer Object
exports.makeFbo = function(gl, width, height, formats){
    var attachments = [];
    var fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    for(var i = 0, n = formats.length; i < n; i++){
        var fmt = formats[i];
        var target     = fmt.target !== undefined ? fmt.target : gl.TEXTURE_2D
        ,   unit       = fmt.unit !== undefined ? fmt.unit : 0
        ,   formati    = fmt.formati !== undefined ? fmt.formati : gl.RGBA
        ,   format     = fmt.format !== undefined ? fmt.format : gl.RGBA
        ,   type       = fmt.type !== undefined ? fmt.type : gl.UNSIGNED_BYTE
        ,   filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
        ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
        ,   wrap_s     = fmt.wrap_s !== undefined ? fmt.wrap_s : gl.CLAMP_TO_EDGE
        ,   wrap_t     = fmt.wrap_t !== undefined ? fmt.wrap_t : gl.CLAMP_TO_EDGE
        ,   fbo_attach = format == gl.DEPTH_COMPONENT ? gl.DEPTH_ATTACHMENT : gl.COLOR_ATTACHMENT0 + i;
        var obj = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(target, obj);
        gl.texImage2D(target, 0, formati, width, height, 0, format, type, null);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter_min);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter_mag);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap_s);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap_t);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, fbo_attach, target, obj, 0);
        attachments.push({ obj: obj, target: target });
    }

    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){
        throw "Incomplete frame buffer object.";
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        width:  width,
        height: height,
        obj:    fbo,
        attachments: attachments,
        bind: function(gl){
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.obj);
        },
        unbind: function(gl){
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        bindTexture: function(gl, i, unit){
            var att = this.attachments[i];
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(att.target, att.obj);
        },
        unbindTexture: function(gl, i, unit){
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(this.attachments[i].target, 0);
        }
    };
}


// Static Vertex Buffer Object
// |type| gl.POINTS, gl.TRIANGLES etc..
// |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
// |attributes| an array of objects in the format:
// [{ data: [], size: 3, location: 0 }]
function makeVbo(gl, type, usage, attributes){
    var attribs = [];
    var n_indices = Number.MAX_VALUE;

    for(var i = attributes.length; --i >= 0;){
        var att = attributes[i];
        n_indices = Math.min(n_indices, att.data.length / att.size);
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(att.data), usage);
        attribs.push({
            buffer:   buffer,
            location: att.location,
            size:     att.size
        });
    }

    return {
        draw: function(gl){
            for(var a, i = attribs.length; --i >= 0;){
                a = attribs[i];
                gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
                gl.vertexAttribPointer(a.location, a.size, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(a.location);
            }
            gl.drawArrays(type, 0, n_indices);
        },
        destroy: function(gl){
            for(var i = attribs.length; --i >= 0;)
            gl.deleteBuffer(attribs[i])
        }
    };
}


// Plane
exports.makePlane = function(gl, x1, y1, x2, y2, loc_vtx, loc_txc){
    var plane_verts = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
    var plane_texcs = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
    return makeVbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, [
        { data: plane_verts, size: 3, location: loc_vtx },
        { data: plane_texcs, size: 2, location: loc_txc }
    ]);
}


exports.makeVbo = makeVbo;
