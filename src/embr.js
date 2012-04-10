(function(context){

  "use strict";


  var Embr = context.Embr = {};

  var gl = null;
  Embr.setContext = function(_gl){
    Embr.gl = gl = _gl;
  };


  //// PROGRAM ////

  Embr.Program = function(vsrc, fsrc){
    if(vsrc || fsrc)
      compile(vsrc, fsrc);
  };
  Embr.Program.prototype = {

    compile: function(vsrc, fsrc){
      var program = this.program = gl.createProgram();

      function compileAndAttach(src, type){
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
    },

    link: function(){
      var program = this.program;

      gl.linkProgram(program);
      if(gl.getProgramParameter(program, gl.LINK_STATUS) !== true)
        throw gl.getProgramInfoLog(program);

      function makeUniformSetter(type, location){
        switch(type){
          case gl.BOOL:
          case gl.INT:
          case gl.SAMPLER_2D:
          case gl.SAMPLER_CUBE:
            return function(value){
              gl.uniform1i(location, value);
            };
          case gl.FLOAT:
            return function(value){
              gl.uniform1f(location, value);
            };
          case gl.FLOAT_VEC2:
            return function(array){
              gl.uniform2fv(location, array);
            };
          case gl.FLOAT_VEC3:
            return function(array){
              gl.uniform3fv(location, array);
            };
          case gl.FLOAT_VEC4:
            return function(array){
              gl.uniform4fv(location, array);
            };
          case gl.FLOAT_MAT3:
            return function(array){
              gl.uniformMatrix3fv(location, false, array);
            };
          case gl.FLOAT_MAT4:
            return function(array){
              gl.uniformMatrix4fv(location, false, array);
            };
        }
        return function(){
          throw "Unknown uniform type: " + type;
        };
      }

      this.uniforms = {};
      this.locations = {};

      var i, n, info, location;

      n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for(i = 0; i < n; ++i){
        info = gl.getActiveUniform(program, i);
        location = gl.getUniformLocation(program, info.name);
        this.uniforms[info.name] = makeUniformSetter(info.type, location);
        this.locations[info.name] = location;
      }

      n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for(i = 0; i < n; ++i){
        info = gl.getActiveAttrib(program, i);
        location = gl.getAttribLocation(program, info.name);
        this.locations[info.name] = location;
      }

      return this;
    },

    use: function(uniforms) {
      Embr.gl.useProgram(this.program);
      if(uniforms){
        for(var name in uniforms){
          if(name in this.uniforms)
            this.uniforms[name](uniforms[name]);
        }
      }
    },

    cleanup: function(){
      Embr.gl.deleteProgram(this.program);
    }

  };


  //// VBO ////

  function Vbo(type, usage){
    this.type = type;
    this.usage = usage;
    this.program = null;
    this.indices = null;
    this.attributes = {};
  }
  Vbo.prototype = {

    setAttr: function(name, params){
      // Create buffer if none exists
      if(!(name in this.attributes))
        this.attributes[name] = { buffer: gl.createBuffer() };

      var attr = this.attributes[name];

      attr.size = params["size"] || attr.size || 1;
      attr.location = params["location"] || attr.location || -1;

      var data = params.data;
      if(data){
        attr.length = Math.floor(data.length / attr.size);

        // Ensure data is a typed array
        if(!(data instanceof Float32Array))
          data = new Float32Array(data);

        // Buffer data
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, this.usage);
      }

      return this;
    },

    setIndices: function(indices){
      // Create buffer if none exists
      if(!this.indices)
        this.indices = { buffer: gl.createBuffer() };

      var data = params.data;
      if(data){
        indices.length = data.length;

        // Ensure data is a typed array
        if(!(data instanceof Float16Array))
          data = new Float16Array(data);

        // Buffer data
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices.buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, this.usage);
      }

      return this;
    },

    setProgram: function(program){
      for(var name in this.attributes){
        if(name in program.locations)
          this.attributes[name].location = this.locations[name];
      }
    },

    draw: function(){
      var gl = Embr.gl
        , indices = this.indices
        , program = this.program;

      for(var name in this.attributes){
        var attr = this.attributes[name];
        if(attr.location >= 0){
          gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
          gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(attr.location);
        }
      }

      if(indices){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
        gl.drawElements(this.type, indices.length, gl.UNSIGNED_SHORT, 0);
      }
      else{
        gl.drawArrays(this.type, 0, this.length);
      }
    },

    cleanup: function(){
      for(var name in this.attributes)
        Embr.gl.deleteBuffer(this.attributes[name].buffer);
    }

  };

})(this);
