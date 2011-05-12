var plask = require('plask')
,   fs    = require('fs');

var Embr = {};

// Export Embr via CommonJS (for Node.js, etc)
module.exports = Embr;


// Define Plask specific overrides

Embr.Vec2 = plask.Vec2;
Embr.Vec3 = plask.Vec3;
Embr.Vec4 = plask.Vec4;
Embr.Mat4 = plask.Mat4;
Embr.Util = (function(){

    var gl_enums = null;

    function glCheckErr(gl, msg){
        var err = gl.getError();
        if(err !== gl.NO_ERROR){
            if(gl_enums === null){
                gl_enums = {};
                for(var name in gl){
                    if(typeof gl[name] == 'number')
                        gl_enums[gl[name]] = name;
                }
            }
            throw msg + " (" + gl_enums[err] + ")";
        }
    }

    return {
        glCheckErr: glCheckErr
    }

})();// Math and Random Utilities

Embr.Math = (function(){

    var kPI  = Math.PI;
    var kPI2 = Math.PI / 2;
    var kPI4 = Math.PI / 4;
    var k2PI = Math.PI * 2;


    function rand(min, max){
        return min + Math.random() * (max - min);
    }

    function randSym(max){
        return max * 2 * Math.random() - max;
    }

    // Random point on a sphere of radius
    function randVec3(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Embr.Vec3( rho * Math.cos(phi) * radius
                            , rho * Math.sin(phi) * radius
                            , costheta * radius );
    }

    return {
        kPI:  kPI,
        kPI2: kPI2,
        kPI4: kPI4,
        k2PI: k2PI,

        rand:     rand,
        randSym:  randSym,
        randVec3: randVec3
    };

})();
// Quaternion

Embr.Quat = (function(){

    var kEpsilon = Math.pow(2, -24);

    function Quat(){
        this.reset();
    }

    Quat.prototype.set = function(x, y, z, w){
        this.x = x; this.y = y; this.z = z; this.w = w;
        return this;
    };

    Quat.prototype.reset = function(){
        return this.set(0, 0, 0, 1);
    };


    Quat.prototype.length = function(){
        var x = this.x, y = this.y, z = this.z, w = this.w;
        return Math.sqrt(x*x + y*y + z*z + w*w);
    };


    Quat.prototype.dot = function(b){
        return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
    };


    Quat.prototype.mult2 = function(a, b){
        var ax = a.x, ay = a.y, az = a.z, aw = a.w
        ,   bx = b.x, by = b.y, bz = b.z, bw = b.w;

        this.x = bw*ax + bx*aw + by*az - bz*ay;
        this.y = bw*ay + by*aw + bz*ax - bx*az;
        this.z = bw*az + bz*aw + bx*ay - by*ax;
        this.w = bw*aw - bx*ax - by*ay - bz*az;

        return this;
    };

    Quat.prototype.mult = function(b){
        return this.mult2(this, b);
    };

    Quat.prototype.mult4 = function(x, y, z, w){
        var ax = this.x, ay = this.y, az = this.z, aw = this.w;

        this.x = w*ax + x*aw + y*az - z*ay;
        this.y = w*ay + y*aw + z*ax - x*az;
        this.z = w*az + z*aw + x*ay - y*ax;
        this.w = w*aw - x*ax - y*ay - z*az;

        return this;
    };

    Quat.prototype.normalize = function(){
        var len = this.length();

        if(len > kEpsilon){
            this.x /= len
            this.y /= len
            this.z /= len
            this.w /= len
        }

        return this;
    };


    Quat.prototype.rotate = function(theta, x, y, z){
        var len = Math.sqrt(x*x + y*y + z*z)

        if(len > kEpsilon){
            var t2  = theta / 2
            ,   st2 = Math.sin(t2);
            this.mult4((x / len) * st2,
                       (y / len) * st2,
                       (z / len) * st2,
                       Math.cos(t2));
        }

        return this;
    };


    Quat.prototype.toMat4 = function(){
        var xs = this.x + this.x
        ,   ys = this.y + this.y
        ,   zs = this.z + this.z
        ,   wx = this.w * xs
        ,   wy = this.w * ys
        ,   wz = this.w * zs
        ,   xx = this.x * xs
        ,   xy = this.x * ys
        ,   xz = this.x * zs
        ,   yy = this.y * ys
        ,   yz = this.y * zs
        ,   zz = this.z * zs;

        return new Embr.Mat4().set4x4r(
            1 - (yy+zz), xy - wz,      xz + wy,     0,
            xy + wz,     1 - (xx+zz ), yz - wx,     0,
            xz - wy,     yz + wx,      1 - (xx+yy), 0,
            0,           0,            0,           1
        );
    };


    Quat.prototype.dup = function(){
        return new Quat().set(this.x, this.y, this.z, this.w);
    };


    return Quat;

})();
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

    Fbo.prototype.bind = function(){
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
    };

    Fbo.prototype.unbind = function(){
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    Fbo.prototype.bindTexture = function(i, unit){
        var gl  = this.gl
        ,   att = this.tex_attachments[i];
        if(unit !== undefined)
            att.unit = gl.TEXTURE0 + unit;
        gl.activeTexture(att.unit);
        gl.bindTexture(att.target, att.handle);
    };

    Fbo.prototype.unbindTexture = function(i){
        var gl  = this.gl
        ,   att = this.tex_attachments[i];
        gl.activeTexture(att.unit);
        gl.bindTexture(att.target, null);
    };

    return Fbo;

})();
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

})();// Vertex Buffer Object

Embr.Vbo = (function(){

    // |type| gl.POINTS, gl.TRIANGLES etc..
    // |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
    // |attributes| an array of objects in the format: [{ data: [], size: 3, location: 0 }]

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

            Embr.Util.glCheckErr(gl, "Error adding attribute '" + name + "'");

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
                addAttr(name, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(attr.data));
            else
                addAttr(name, gl.ARRAY_BUFFER, new Float32Array(attr.data));
        }

        // If no indices are given we fall back to glDrawArrays
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
            gl.drawElements(this.type, indices.length, gl.UNSIGNED_SHORT, 0);
        }
        else{
            gl.drawArrays(this.type, 0, this.length);
        }

        Embr.Util.glCheckErr(gl, "Error drawing Vbo");
    }

    Vbo.prototype.destroy = function(){
        var gl = this.gl;
        for(var i = attributes.length; --i >= 0;)
            gl.deleteBuffer(attributes[i])
    }


    // Plane

    Vbo.makePlane = function(gl, x1, y1, x2, y2, loc_vtx, loc_txc){
        var vertices  = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
        var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
        return new Embr.Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
            vertices:  { data: vertices,  size: 3, location: loc_vtx },
            texcoords: { data: texcoords, size: 2, location: loc_txc }
        });
    }


    // Cube

    Vbo.makeCube = function(gl, sx, sy, sz, loc_vtx, loc_nrm, loc_txc){
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
                         1,0, 0,0, 0,1, 1,1];

        var indices = [ 0, 1, 2, 0, 2, 3,
                        4, 5, 6, 4, 6, 7,
                        8, 9,10, 8,10,11,
                       12,13,14,12,14,15,
                       16,17,18,16,18,19,
                       20,21,22,20,22,23];

        return new Embr.Vbo(gl, gl.TRIANGLES, gl.STATIC_DRAW, {
            vertices:  { data: vertices,  size: 3, location: loc_vtx },
            normals:   { data: normals,   size: 3, location: loc_nrm },
            texcoords: { data: texcoords, size: 2, location: loc_txc },
            indices:   { data: indices }
        });
    }

    return Vbo;

})();// Simplex Noise adapted from Stefan Gustavson's 2005 paper "Simplex Noise Demystified"
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf

Embr.noise = (function(){

    var grad3 = [[ 1, 1, 0],[-1, 1, 0],[ 1,-1, 0],[-1,-1, 0],
                 [ 1, 0, 1],[-1, 0, 1],[ 1, 0,-1],[-1, 0,-1],
                 [ 0, 1, 1],[ 0,-1, 1],[ 0, 1,-1],[ 0,-1,-1]];

    var p = [151,160,137, 91, 90, 15,131, 13,201, 95, 96, 53,194,233,  7,225,
             140, 36,103, 30, 69,142,  8, 99, 37,240, 21, 10, 23,190,  6,148,
             247,120,234, 75,  0, 26,197, 62, 94,252,219,203,117, 35, 11, 32,
              57,177, 33, 88,237,149, 56, 87,174, 20,125,136,171,168, 68,175,
              74,165, 71,134,139, 48, 27,166, 77,146,158,231, 83,111,229,122,
              60,211,133,230,220,105, 92, 41, 55, 46,245, 40,244,102,143, 54,
              65, 25, 63,161,  1,216, 80, 73,209, 76,132,187,208, 89, 18,169,
             200,196,135,130,116,188,159, 86,164,100,109,198,173,186,  3, 64,
              52,217,226,250,124,123,  5,202, 38,147,118,126,255, 82, 85,212,
             207,206, 59,227, 47, 16, 58, 17,182,189, 28, 42,223,183,170,213,
             119,248,152,  2, 44,154,163, 70,221,153,101,155,167, 43,172,  9,
             129, 22, 39,253, 19, 98,108,110, 79,113,224,232,178,185,112,104,
             218,246, 97,228,251, 34,242,193,238,210,144, 12,191,179,162,241,
              81, 51,145,235,249, 14,239,107, 49,192,214, 31,181,199,106,157,
             184, 84,204,176,115,121, 50, 45,127,  4,150,254,138,236,205, 93,
             222,114, 67, 29, 24, 72,243,141,128,195, 78, 66,215, 61,156,180];

    // To remove the need for index wrapping, double the permutation table length
    var perm = new Array(512);
    for(var i = 0; i < 512; i++){
        perm[i] = p[i & 255];
    }

    function dot2(g, x, y){
        return g[0]*x + g[1]*y;
    }
    function dot3(g, x, y, z){
        return g[0]*x + g[1]*y + g[2]*z;
    }


    // 2D simplex noise

    var F2 = 0.5*(Math.sqrt(3.0)-1.0);
    var G2 = (3.0-Math.sqrt(3.0))/6.0;

    function sn2(xin, yin){
        var n0, n1, n2; // Noise contributions from the three corners

        // Skew the input space to determine which simplex cell we're in
        var s = (xin+yin)*F2; // Hairy factor for 2D
        var i = Math.floor(xin+s);
        var j = Math.floor(yin+s);
        var t = (i+j)*G2;
        var X0 = i-t; // Unskew the cell origin back to (x,y) space
        var Y0 = j-t;
        var x0 = xin-X0; // The x,y distances from the cell origin
        var y0 = yin-Y0;

        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if(x0 > y0){ i1=1; j1=0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else { i1=0; j1=1; }       // upper triangle, YX order: (0,0)->(0,1)->(1,1)

        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var gi0 = perm[ii + perm[jj]] % 12;
        var gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
        var gi2 = perm[ii + 1 + perm[jj + 1]] % 12;

         // Calculate the contribution from the three corners
        var t0 = 0.5 - x0*x0 - y0*y0;
        if(t0 < 0) n0 = 0.0;
        else{
            t0 *= t0;
            n0 = t0 * t0 * dot2(grad3[gi0], x0, y0);  // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1*x1 - y1*y1;
        if(t1 < 0) n1 = 0.0;
        else{
            t1 *= t1;
            n1 = t1 * t1 * dot2(grad3[gi1], x1, y1);
        }
        var t2 = 0.5 - x2*x2 - y2*y2;
        if(t2 < 0) n2 = 0.0;
        else{
            t2 *= t2;
            n2 = t2 * t2 * dot2(grad3[gi2], x2, y2);
        }

        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }


    // 3D simplex noise

    var F3 = 1 / 3;
    var G3 = 1 / 6;

    function sn3(xin, yin, zin){
        var n0, n1, n2, n3; // Noise contributions from the four corners

        // Skew the input space to determine which simplex cell we're in
        var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D
        var i = Math.floor(xin+s);
        var j = Math.floor(yin+s);
        var k = Math.floor(zin+s);
        var t = (i+j+k)*G3;
        var X0 = i-t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j-t;
        var Z0 = k-t;
        var x0 = xin-X0; // The x,y,z distances from the cell origin
        var y0 = yin-Y0;
        var z0 = zin-Z0;

        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if(x0 >= y0){
            if(y0 >= z0)     { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order
            else if(x0 >= z0){ i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order
            else             { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order
        }
        else{ // x0<y0
            if(y0 < z0)     { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order
            else if(x0 < z0){ i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order
            else            { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order
        }

        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6

        var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
        var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0*G3;
        var z2 = z0 - k2 + 2.0*G3;
        var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0*G3;
        var z3 = z0 - 1.0 + 3.0*G3;

        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
        var gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
        var gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
        var gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;

        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
        if(t0 < 0) n0 = 0.0;
        else{
          t0 *= t0;
          n0 = t0 * t0 * dot3(grad3[gi0], x0, y0, z0);
        }
        var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
        if(t1 < 0) n1 = 0.0;
        else{
            t1 *= t1;
            n1 = t1 * t1 * dot3(grad3[gi1], x1, y1, z1);
        }
        var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
        if(t2 < 0) n2 = 0.0;
        else{
            t2 *= t2;
            n2 = t2 * t2 * dot3(grad3[gi2], x2, y2, z2);
        }
        var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
        if(t3 < 0) n3 = 0.0;
        else{
            t3 *= t3;
            n3 = t3 * t3 * dot3(grad3[gi3], x3, y3, z3);
        }

        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    }

    return {
        sn2: sn2,
        sn3: sn3
    };

})();
