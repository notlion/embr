(function (context) {

  "use strict";


  var Embr = {};

  var gl = null;
  Embr.setContext = function (_gl) {
    Embr.gl = gl = _gl;

    // Set default parameters which require the GL context.

    Vbo.attr_param_defaults = {
      "size": 1,
      "stride": 0,
      "offset": 0
    };

    Texture.param_defaults = {
      "target": gl.TEXTURE_2D,
      "unit": 0,
      "format": gl.RGBA,
      "format_internal": gl.RGBA,
      "type": gl.UNSIGNED_BYTE,
      "filter": gl.NEAREST,
      "wrap": gl.CLAMP_TO_EDGE,
      "width": 0,
      "height": 0,
      "flip_y": false // Only works when 'element' is specified currently.
    };

    Rbo.param_defaults = {
      "target": gl.RENDERBUFFER,
      "format_internal": gl.DEPTH_COMPONENT16,
      "width": 0,
      "height": 0
    };
  };


  // ### Utility

  var gl_enums = null;

  Embr.getGLEnumName = function (e) {
    if(!gl_enums) {
      // Build GL enums lookup dictionary if necessary.
      gl_enums = {};
      for(var name in gl) {
        if(typeof gl[name] == "number")
          gl_enums[gl[name]] = name;
      }
    }
    return gl_enums[e];
  };

  Embr.checkError = function (gl, msg) {
    var err, errs = [];
    // Check for any GL errors.
    while((err = gl.getError()) !== gl.NO_ERROR) {
      errs.push(err);
    }
    if(errs.length > 0) {
      // Throw all GL errors.
      throw msg + ": " + errs.map(function (err) {
        return Embr.getGLEnumName(err);
      }).join(", ");
    }
  };

  // Create a GL context which checks for errors after every call.
  Embr.wrapContextWithErrorChecks = function (gl) {
    var name, prop, wrapped = {};
    for(name in gl) {
      prop = gl[name];
      if(typeof(prop) === "function") {
        wrapped[name] = (function (name, fn) {
          return function () {
            var res = fn.apply(gl, arguments);
            Embr.checkError(gl, "GL Error in '" + name + "'");
            return res;
          };
        })(name, prop);
      }
      else
        wrapped[name] = prop;
    }
    return wrapped;
  };

  function setParams (opts, dest, defaults) {
    for(var name in defaults) {
      if(opts[name] !== undefined)
        dest[name] = opts[name];
      else if(dest[name] === undefined)
        dest[name] = defaults[name];
    }
  }


  // ### Program

  Embr.Program = function (vsrc, fsrc) {
    if(vsrc || fsrc)
      this.compile(vsrc, fsrc);
    this.linked = false;
  };
  Embr.Program.prototype = {

    compile: function (vsrc, fsrc) {
      var program = this.program = gl.createProgram();

      function compileAndAttach (src, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true)
          throw gl.getShaderInfoLog(shader);

        gl.attachShader(program, shader);
        gl.deleteShader(shader);
      }

      if(vsrc)
        compileAndAttach(vsrc, gl.VERTEX_SHADER);
      if(fsrc)
        compileAndAttach(fsrc, gl.FRAGMENT_SHADER);

      return this;
    },

    link: function () {
      var program = this.program;

      gl.linkProgram(program);
      if(gl.getProgramParameter(program, gl.LINK_STATUS) !== true)
        throw gl.getProgramInfoLog(program);

      function makeUniformSetter (type, location) {
        switch(type){
          case gl.BOOL:
          case gl.INT:
          case gl.SAMPLER_2D:
          case gl.SAMPLER_CUBE:
            return function (value) {
              gl.uniform1i(location, value);
            };
          case gl.FLOAT:
            return function (value) {
              gl.uniform1f(location, value);
            };
          case gl.FLOAT_VEC2:
            return function (array) {
              gl.uniform2fv(location, array);
            };
          case gl.FLOAT_VEC3:
            return function (array) {
              gl.uniform3fv(location, array);
            };
          case gl.FLOAT_VEC4:
            return function (array) {
              gl.uniform4fv(location, array);
            };
          case gl.FLOAT_MAT3:
            return function (array) {
              gl.uniformMatrix3fv(location, false, array);
            };
          case gl.FLOAT_MAT4:
            return function (array) {
              gl.uniformMatrix4fv(location, false, array);
            };
        }
        return function () {
          throw "Unknown uniform type: " + type;
        };
      }

      this.uniforms = {};
      this.locations = {};

      var i, n, name, info, location;

      n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for(i = 0; i < n; ++i) {
        info = gl.getActiveUniform(program, i);
        location = gl.getUniformLocation(program, info.name);

        // GLSL uniform arrays come with [0] appended. Since multiple variables
        // with the same name are not allowed we should be able to ignore this.
        name = info.name.replace("[0]", "");

        this.uniforms[name] = makeUniformSetter(info.type, location);
        this.locations[name] = location;
      }

      n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for(i = 0; i < n; ++i) {
        info = gl.getActiveAttrib(program, i);
        location = gl.getAttribLocation(program, info.name);
        this.locations[info.name] = location;
      }

      this.linked = true;

      return this;
    },

    use: function (uniforms) {
      if(this.linked) {
        gl.useProgram(this.program);
        if(uniforms) {
          for(var name in uniforms) {
            if(name in this.uniforms)
              this.uniforms[name](uniforms[name]);
          }
        }
      }
      return this;
    },

    cleanup: function () {
      gl.deleteProgram(this.program);
    }

  };


  // ### Vertex Buffer

  var Vbo = Embr.Vbo = function (type, usage) {
    this.type = type;
    this.usage = usage || gl.STATIC_DRAW;
    this.program = null;
    this.indices = null;
    this.attributes = {};
  }
  Vbo.prototype = {

    setAttr: function (name, opts) {
      // Create buffer if none exists
      if(!(name in this.attributes)) {
        this.attributes[name] = {
          buffer: gl.createBuffer(),
          location: null
        };
      }

      var attr = this.attributes[name];

      setParams(opts, attr, Vbo.attr_param_defaults);

      var data = opts["data"];
      if(data) {
        // Ensure data is a typed array
        if(!(data instanceof Float32Array))
          data = new Float32Array(data);

        attr.length = Math.floor(
          attr.stride > 0 ? data.byteLength / attr.stride
                          : data.length / attr.size
        );

        // Buffer data
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, this.usage);
      }

      return this;
    },

    setIndices: function (data) {
      // Create buffer if none exists
      if(!this.indices)
        this.indices = { buffer: gl.createBuffer() };

      this.indices.length = data.length;

      // Ensure data is a typed array
      if(!(data instanceof Uint16Array))
        data = new Uint16Array(data);

      // Buffer data
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices.buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, this.usage);

      return this;
    },

    // Associate attribute locations with a shader program. This must be called
    // before each time the VBO is drawn with a different program.
    setProg: function (program) {
      if(program.linked) {
        this.program = program;
        for(var name in this.attributes) {
          this.attributes[name].location =
            (name in program.locations) ? program.locations[name] : null;
        }
      }
      return this;
    },

    draw: function () {
      var indices = this.indices
        , length = Number.MAX_VALUE
        , enabled_locations = [];

      // Bind any attributes that are used in our shader.
      for(var name in this.attributes) {
        var attr = this.attributes[name];
        if(attr.location !== null && attr.length > 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
          gl.vertexAttribPointer(
            attr.location, attr.size, gl.FLOAT, false, attr.stride, attr.offset
          );
          gl.enableVertexAttribArray(attr.location);
          enabled_locations.push(attr);
          length = Math.min(length, attr.length);
        }
      }

      // If no attributes are enabled, bail out.
      if(enabled_locations.length === 0)
        return;

      // If indices are present, use glDrawElements.
      if(indices) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
        gl.drawElements(this.type, indices.length, gl.UNSIGNED_SHORT, 0);
      }
      // Otherwise, use glDrawArrays.
      else
        gl.drawArrays(this.type, 0, length);

      // Clean up GL state.
      for(var i = enabled_locations.length; --i >= 0;)
        gl.disableVertexAttribArray(enabled_locations[i]);
    },

    cleanup: function () {
      for(var name in this.attributes)
        gl.deleteBuffer(this.attributes[name].buffer);
    }

  };


  // #### Vbo Primitives

  Vbo.createPlane = function (x1, y1, x2, y2) {
    var positions = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
    var normals = [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ];
    var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
    return new Vbo(gl.TRIANGLE_STRIP)
      .setAttr("position", { data: positions, size: 3 })
      .setAttr("normal",   { data: normals,   size: 3 })
      .setAttr("texcoord", { data: texcoords, size: 2 });
  };

  Vbo.createBox = function (sx, sy, sz) {
    var positions = [
       sx, sy, sz,  sx,-sy, sz,  sx,-sy,-sz,  sx, sy,-sz, // +X
       sx, sy, sz,  sx, sy,-sz, -sx, sy,-sz, -sx, sy, sz, // +Y
       sx, sy, sz, -sx, sy, sz, -sx,-sy, sz,  sx,-sy, sz, // +Z
      -sx, sy, sz, -sx, sy,-sz, -sx,-sy,-sz, -sx,-sy, sz, // -X
      -sx,-sy,-sz,  sx,-sy,-sz,  sx,-sy, sz, -sx,-sy, sz, // -Y
       sx,-sy,-sz, -sx,-sy,-sz, -sx, sy,-sz,  sx, sy,-sz  // -Z
    ];

    var normals = [
       1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
       0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
       0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
       0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
       0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1
    ];

    var texcoords = [
      0,1, 1,1, 1,0, 0,0,
      1,1, 1,0, 0,0, 0,1,
      0,1, 1,1, 1,0, 0,0,
      1,1, 1,0, 0,0, 0,1,
      1,0, 0,0, 0,1, 1,1,
      1,0, 0,0, 0,1, 1,1
    ];

    var indices = [
       0, 1, 2, 0, 2, 3,
       4, 5, 6, 4, 6, 7,
       8, 9,10, 8,10,11,
      12,13,14,12,14,15,
      16,17,18,16,18,19,
      20,21,22,20,22,23
    ];

    return new Vbo(gl.TRIANGLES)
      .setAttr("position", { data: positions, size: 3 })
      .setAttr("normal",   { data: normals,   size: 3 })
      .setAttr("texcoord", { data: texcoords, size: 2 })
      .setIndices(indices);
  };


  // ### Texture

  var Texture = Embr.Texture = function (opts) {
    this.texture = null;
    this.params = {};
    this.set(opts);
  };
  Texture.prototype = {

    set: function (opts) {
      var opts = opts || {}
        , params = this.params
        , prw = params.width, prh = params.height
        , self = this;

      setParams(opts, params, Texture.param_defaults);

      var target = params.target;

      function bind () {
        if(!self.texture)
          self.texture = gl.createTexture();
        self.bind();
      }

      if(opts.data !== undefined) {
        if(prw !== params.width || prh !== params.height) {
          bind();
          gl.texImage2D(target, 0, params.format_internal,
                                   params.width,
                                   params.height,
                                   0,
                                   params.format,
                                   params.type,
                                   opts.data);
        }
        else if(prw && prh) {
          bind();
          gl.texSubImage2D(target, 0, 0, 0, params.width,
                                            params.height,
                                            params.format,
                                            params.type,
                                            opts.data);
        }
      }
      else if(opts.element) {
        bind();
        if(params.flip_y)
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(target, 0, params.format_internal,
                                 params.format,
                                 params.type,
                                 opts.element);
      }

      if(this.texture) {
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, params.filter_min ||
                                                        params.filter);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, params.filter_mag ||
                                                        params.filter);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, params.wrap_s ||
                                                    params.wrap);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, params.wrap_t ||
                                                    params.wrap);
      }

      this.unbind();

      return this;
    },

    bind: function (unit) {
      if(unit !== undefined)
        this.params.unit = unit;
      if(this.texture) {
        gl.activeTexture(gl.TEXTURE0 + this.params.unit);
        gl.bindTexture(this.params.target, this.texture);
      }
    },

    unbind: function () {
      if(this.texture) {
        gl.activeTexture(gl.TEXTURE0 + this.params.unit);
        gl.bindTexture(this.params.target, null);
      }
    },

    cleanup: function () {
      gl.deleteTexture(this.texture);
    }

  };


  // ### Render Buffer

  var Rbo = Embr.Rbo = function (opts) {
    this.buffer = gl.createRenderbuffer();
    this.params = {};
    this.set(opts);
  };
  Rbo.prototype = {

    set: function (opts) {
      var opts = opts || {}
        , params = this.params
        , prw = params.width, prh = params.height;

      setParams(opts, params, Rbo.param_defaults);

      if(prw !== params.width || prh !== this.height) {
        this.bind();
        gl.renderbufferStorage(params.target, params.format_internal,
                                              params.width,
                                              params.height);
      }

      return this;
    },

    bind: function () {
      gl.bindRenderbuffer(this.params.target, this.buffer);
    },

    unbind: function () {
      gl.bindRenderbuffer(this.params.target, null);
    },

    cleanup: function () {
      gl.deleteRenderbuffer(this.buffer);
    }

  };


  // ### Frame Buffer

  Embr.Fbo = function () {
    this.buffer = gl.createFramebuffer();
    this.textures = [];
    this.renderbuffers = [];
  };
  Embr.Fbo.prototype = {

    // WebGL does not currently support multiple render targets, and will error
    // with any color attachment above COLOR_ATTACHMENT0.
    getNextColorAttachment: function () {
      var attachment = gl.COLOR_ATTACHMENT0;
      return attachment;
    },

    attach: function (obj, attachment) {
      this.bind();
      obj.bind();
      if(obj instanceof Embr.Texture) {
        if(attachment === undefined)
          attachment = this.getNextColorAttachment();
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER, attachment, obj.params.target, obj.texture, 0
        );
        this.textures.push(obj);
      }
      else if(obj instanceof Embr.Rbo) {
        if(attachment === undefined)
          attachment = gl.DEPTH_ATTACHMENT;
        gl.framebufferRenderbuffer(
          gl.FRAMEBUFFER, attachment, obj.params.target, obj.buffer
        );
        this.renderbuffers.push(obj);
      }
      obj.unbind();
      this.unbind();

      return this;
    },

    check: function () {
      this.bind();
      var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if(status !== gl.FRAMEBUFFER_COMPLETE) {
        [ "INCOMPLETE_ATTACHMENT",
          "INCOMPLETE_MISSING_ATTACHMENT",
          "INCOMPLETE_DIMENSIONS",
          "UNSUPPORTED"
        ].forEach(function (name) {
          if(status === gl["FRAMEBUFFER_" + name])
            status = name;
        });
        throw "Framebuffer Status: " + status;
      }
      this.unbind();
      return this;
    },

    bind: function () {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
    },

    unbind: function () {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },

    cleanup: function () {
      gl.deleteFramebuffer(this.buffer);
    }

  };


  // ### Export

  // Export for Node.js
  if(typeof module !== "undefined" && module.exports) {
    module.exports = Embr;
  }

  // Export for AMD (RequireJS and similar)
  else if(typeof define === "function" && define.amd) {
    define(function() { return Embr; });
  }

  // Just append to the current context
  else {
    context.Embr = Embr;
  }

})(this);
