var fs    = require('fs')
,   plask = require('plask')

var Vec2  = plask.Vec2
,   Vec3  = plask.Vec3
,   Vec4  = plask.Vec4
,   Mat4  = plask.Mat4
,   Quat  = require('./core/Quat').Quat


// Shader Loader
// Parses #include "source.glsl" where source.glsl is a filename previously
// loaded via loadProgram() or makeProgram().
// Allows vertex and fragment code to be in the same file if surrounded by
// #ifdef VERTEX or FRAGMENT.

var kVertexShaderPrefix   = "#define VERTEX\n"
,   kFragmentShaderPrefix = "#define FRAGMENT\n"
,   programs = {};

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

function loadProgram(filename) {
    var src = processShaderIncludes(fs.readFileSync(filename, 'utf8'));
    programs[filename] = src;
};

function makeProgram(gl, filename) {
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
};


// Magic Program taken from Dean McNamee's PreGL
// https://github.com/deanm/pregl

function MagicProgram(gl, program){
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
        this['loc_' + name] = loc;
    }

    var num_attribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(var i = 0; i < num_attribs; ++i){
        var info = gl.getActiveAttrib(program, i);
        var name = info.name;
        var loc = gl.getAttribLocation(program, name);
        this['loc_' + name] = loc;
    }
};


// Texture
// |data| typed array (Uint32Array, Float32Array)

function makeTexture(gl, width, height, data, fmt){
    if(fmt === undefined) fmt = {};

    var target     = fmt.target !== undefined ? fmt.target : gl.TEXTURE_2D
    ,   formati    = fmt.formati !== undefined ? fmt.formati : gl.RGBA
    ,   format     = fmt.format !== undefined ? fmt.format : gl.RGBA
    ,   type       = fmt.type !== undefined ? fmt.type : gl.UNSIGNED_BYTE
    ,   filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
    ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
    ,   wrap_s     = fmt.wrap_s !== undefined ? fmt.wrap_s : gl.CLAMP_TO_EDGE
    ,   wrap_t     = fmt.wrap_t !== undefined ? fmt.wrap_t : gl.CLAMP_TO_EDGE
    ,   tex_data   = data !== undefined ? data : null;
    var obj = gl.createTexture();
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
        bind: function(unit){
            if(unit !== undefined)
                gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(target, obj);
        },
        unbind: function(unit){
            if(unit !== undefined)
                gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(target, null);
        },
        update: function(data){
            gl.bindTexture(target, obj);
            gl.texSubImage2D(target, 0, 0, 0, width, height, format, type, data);
        }
    };
};


// Skia Canvas to Texture

function makeTextureSkCanvas(gl, canvas, fmt){
    if(fmt === undefined) fmt = {};

    var target     = fmt.target !== undefined ? fmt.target : gl.TEXTURE_2D
    ,   filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
    ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
    ,   wrap_s     = fmt.wrap_s !== undefined ? fmt.wrap_s : gl.CLAMP_TO_EDGE
    ,   wrap_t     = fmt.wrap_t !== undefined ? fmt.wrap_t : gl.CLAMP_TO_EDGE;
    var obj = gl.createTexture();
    gl.bindTexture(target, obj);
    gl.texImage2DSkCanvas(target, 0, canvas);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter_min);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter_mag);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap_s);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap_t);

    return {
        width:  canvas.width,
        height: canvas.height,
        obj:    obj,
        target: target,
        bind: function(unit){
            if(unit !== undefined)
                gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(target, obj);
        },
        unbind: function(unit){
            if(unit !== undefined)
                gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(target, null);
        }
    };
};


// Frame Buffer Object

function makeFbo(gl, width, height, formats){
    var tex_attachments = []
    ,   render_attachments = []
    ,   fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    for(var i = 0, n = formats.length, cai = 0; i < n; i++){
        var fmt = formats[i]
        ,   target  = fmt.target !== undefined ? fmt.target : gl.TEXTURE_2D
        ,   formati = fmt.formati !== undefined ? fmt.formati : gl.RGBA
        ,   attach  = fmt.attach !== undefined ? fmt.attach : gl.COLOR_ATTACHMENT0 + cai++;
        if(target == gl.RENDERBUFFER){
            var rb = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
            gl.renderbufferStorage(target, formati, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attach, target, rb);
            render_attachments.push({ obj: rb });
        }
        else{
            var format     = fmt.format !== undefined ? fmt.format : gl.RGBA
            ,   type       = fmt.type !== undefined ? fmt.type : gl.UNSIGNED_BYTE
            ,   filter_min = fmt.filter_min !== undefined ? fmt.filter_min : gl.NEAREST
            ,   filter_mag = fmt.filter_mag !== undefined ? fmt.filter_mag : gl.NEAREST
            ,   wrap_s     = fmt.wrap_s !== undefined ? fmt.wrap_s : gl.CLAMP_TO_EDGE
            ,   wrap_t     = fmt.wrap_t !== undefined ? fmt.wrap_t : gl.CLAMP_TO_EDGE
            ,   tex = gl.createTexture();
            gl.bindTexture(target, tex);
            gl.texImage2D(target, 0, formati, width, height, 0, format, type, null);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter_min);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter_mag);
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap_s);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap_t);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attach, target, tex, 0);
            tex_attachments.push({ obj: tex, target: target, unit: gl.TEXTURE0 });
        }
    }

    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){
        throw "Incomplete frame buffer object.";
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        width:  width,
        height: height,
        obj:    fbo,
        bind: function(){
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        },
        unbind: function(){
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        bindTexture: function(i, unit){
            var att = tex_attachments[i];
            if(unit !== undefined)
                att.unit = gl.TEXTURE0 + unit;
            gl.activeTexture(att.unit);
            gl.bindTexture(att.target, att.obj);
        },
        unbindTexture: function(i){
            var att = tex_attachments[i];
            gl.activeTexture(att.unit);
            gl.bindTexture(att.target, null);
        }
    };
}


// Ping-Pong
// Two swappable framebuffers. Used for feedback effects and GPGPU where it's
// necessary to access the state of the last iteration.

function PingPong(gl, width, height, formats){
    this.wbuffer = makeFbo(gl, width, height, formats);
    this.rbuffer = makeFbo(gl, width, height, formats);
    this.swap();
}
PingPong.prototype.swap = function(){
    var tmp = this.wbuffer;
    this.wbuffer = this.rbuffer;
    this.rbuffer = tmp;

    this.bind   = this.wbuffer.bind;
    this.unbind = this.wbuffer.unbind;
    this.bindTexture   = this.rbuffer.bindTexture;
    this.unbindTexture = this.rbuffer.unbindTexture;
};


// Vertex Buffer Object
// |type| gl.POINTS, gl.TRIANGLES etc..
// |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
// |attributes| an array of objects in the format:
// [{ data: [], size: 3, location: 0 }]

function Vbo(gl, type, usage, attributes){
    this.gl    = gl;
    this.type  = type;
    this.usage = usage;

    this.attributes = {};

    var vbo = this;
    function addAttr(name, target, data){
        var buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);

        var attr = attributes[name]
        ,   size = attr.size !== undefined ? attr.size : 1;

        vbo.attributes[name] = { buffer:   buffer
                               , target:   target
                               , size:     size
                               , length:   Math.floor(data.length / size)
                               , location: attr.location };
    }

    for(var name in attributes){
        var attr = attributes[name];
        if(name == "indices")
            addAttr(name, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(attr.data));
        else
            addAttr(name, gl.ARRAY_BUFFER, new Float32Array(attr.data));
    }

    if(!this.attributes.indices){
        this.length = Number.MAX_VALUE;
        for(var name in this.attributes)
            this.length = Math.min(this.length, this.attributes[name].length);
    }
}

Vbo.prototype.draw = function(){
    var gl = this.gl;

    for(var name in this.attributes){
        var attr = this.attributes[name];
        if(attr.target == gl.ARRAY_BUFFER){
            gl.bindBuffer(attr.target, attr.buffer);
            gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(attr.location);
        }
    }

    var indices = this.attributes.indices;
    if(indices){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
        gl.drawElements(this.type, indices.length, gl.UNSIGNED_INT, 0);
    }
    else{
        gl.drawArrays(this.type, 0, this.length);
    }
}

Vbo.prototype.destroy = function(){
    var gl = this.gl;
    for(var i = attributes.length; --i >= 0;)
        gl.deleteBuffer(attributes[i])
}


// Plane

function makePlane(gl, x1, y1, x2, y2, loc_vtx, loc_txc){
    var vertices  = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
    var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
    return new Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
        vertices:  { data: vertices,  size: 3, location: loc_vtx },
        texcoords: { data: texcoords, size: 2, location: loc_txc }
    });
};


// Cube

function makeCube(gl, sx, sy, sz, loc_vtx, loc_nrm, loc_txc){
    var vertices = [ sx, sy, sz,  sx,-sy, sz,  sx,-sy,-sz,  sx, sy,-sz,  // +X
                     sx, sy, sz,  sx, sy,-sz, -sx, sy,-sz, -sx, sy, sz,  // +Y
                     sx, sy, sz, -sx, sy, sz, -sx,-sy, sz,  sx,-sy, sz,  // +Z
                    -sx, sy, sz, -sx, sy,-sz, -sx,-sy,-sz, -sx,-sy, sz,  // -X
                    -sx,-sy,-sz,  sx,-sy,-sz,  sx,-sy, sz, -sx,-sy, sz,  // -Y
                     sx,-sy,-sz, -sx,-sy,-sz, -sx, sy,-sz,  sx, sy,-sz]; // -Z

    var normals = [ 1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
                    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
                    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
                   -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
                    0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
                    0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1];

    var texcoords = [0,1, 1,1, 1,0, 0,0,
                     1,1, 1,0, 0,0, 0,1,
                     0,1, 1,1, 1,0, 0,0,
                     1,1, 1,0, 0,0, 0,1,
                     1,0, 0,0, 0,1, 1,1,
                     1,0, 0,0, 0,1, 1,1]

    var indices = [ 0, 1, 2, 0, 2, 3,
                    4, 5, 6, 4, 6, 7,
                    8, 9,10, 8,10,11,
                   12,13,14,12,14,15,
                   16,17,18,16,18,19,
                   20,21,22,20,22,23]

    return new Vbo(gl, gl.TRIANGLES, gl.STATIC_DRAW, {
        vertices:  { data: vertices,  size: 3, location: loc_vtx },
        normals:   { data: normals,   size: 3, location: loc_nrm },
        texcoords: { data: texcoords, size: 2, location: loc_txc },
        indices:   { data: indices }
    })
};


// Math Helpers

var kPI  = Math.PI
var kPI2 = Math.PI / 2
var kPI4 = Math.PI / 4
var k2PI = Math.PI * 2


function rand(min, max){
    return min + Math.random() * (max - min);
}

function randSym(max){
    return max * 2 * Math.random() - max;
}

function randVec3(radius){
    var phi      = Math.random() * k2PI
    var costheta = Math.random() * 2 - 1

    var rho = Math.sqrt(1 - costheta * costheta)

    return new Vec3( rho * Math.cos(phi) * radius
                   , rho * Math.sin(phi) * radius
                   , costheta * radius )
}


exports.noise = require('./noise')

exports.Vec2 = Vec2
exports.Vec3 = Vec3
exports.Vec4 = Vec4
exports.Quat = Quat
exports.Mat4 = Mat4

exports.loadProgram  = loadProgram
exports.makeProgram  = makeProgram
exports.MagicProgram = MagicProgram

exports.makeTexture         = makeTexture
exports.makeTextureSkCanvas = makeTextureSkCanvas

exports.makeFbo  = makeFbo
exports.PingPong = PingPong

exports.Vbo = Vbo
exports.makePlane = makePlane
exports.makeCube  = makeCube

exports.kPI  = kPI
exports.kPI2 = kPI2
exports.kPI4 = kPI4
exports.k2PI = k2PI

exports.rand     = rand
exports.randSym  = randSym
exports.randVec3 = randVec3
