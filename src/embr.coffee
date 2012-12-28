# Copyright Ryan Alexander.

# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to permit
# persons to whom the Software is furnished to do so, subject to the
# following conditions:

# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
# NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
# OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
# USE OR OTHER DEALINGS IN THE SOFTWARE.

(->

  embr = {}
  gl = gl_enums = gl_mipmap_filters = null


  ## Set GL context.
  # This must be called first.

  embr.setContext = (_gl) ->
    embr.gl = gl = _gl

    # Cache GL constants for later use.
    gl_mipmap_filters = [
      gl.NEAREST_MIPMAP_NEAREST
      gl.LINEAR_MIPMAP_NEAREST
      gl.NEAREST_MIPMAP_LINEAR
      gl.LINEAR_MIPMAP_LINEAR
    ]

    # Set default parameters.

    embr.Vbo.default_attr_settings =
      size:   1
      stride: 0
      offset: 0

    embr.Texture.default_settings =
      target:          gl.TEXTURE_2D
      unit:            0
      format:          gl.RGBA
      format_internal: gl.RGBA
      type:            gl.UNSIGNED_BYTE
      filter:          gl.NEAREST
      filter_min:      null
      filter_mag:      null
      wrap:            gl.CLAMP_TO_EDGE
      wrap_s:          null
      wrap_t:          null
      width:           0
      height:          0

      # Flip Y only works when `element` is specified.
      flip_y:          false

    embr.Rbo.default_settings =
      target:          gl.RENDERBUFFER
      format_internal: gl.DEPTH_COMPONENT16
      width:           0
      height:          0

    return


  ## General Utilities

  embr.getGLEnumName = (e) ->
    if gl_enums == null
      # Build GL enums lookup dictionary if necessary.
      gl_enums = {}
      for name of gl
        if typeof gl[name] == 'number'
          gl_enums[gl[name]] = name
    return gl_enums[e]

  embr.checkError = (gl, msg) ->
    errs = []
    # Check for any GL errors.
    while (err = gl.getError()) != gl.NO_ERROR
      errs.push(err)
    if errs.length > 0
      # Throw all GL errors.
      names = (embr.getGLEnumName(e) for e in errs)
      throw "#{msg}: #{names.join(', ')}"

  # Create a GL context which checks for errors after every call.
  embr.wrapContextWithErrorChecks = (gl) ->
    wrapFn = (name, fn) ->
      return ->
        res = fn.apply(gl, arguments)
        embr.checkError(gl, "GL Error in #{name}")
        return res
    wrapped = {}
    for name of gl
      prop = gl[name]
      wrapped[name] = if typeof prop == 'function'
        wrapFn(name, prop)
      else
        prop
    return wrapped

  setOpts = (src, dest, defaults) ->
    for name of defaults
      if src[name]?
        dest[name] = src[name]
      else if dest[name] is undefined
        dest[name] = defaults[name]
    return


  ## Shader Program

  class embr.Program

    constructor: (opts) ->
      @program = null
      @linked = false
      @compile(opts) if opts?

    compile: (opts = {}) ->
      # Ensure there is a program to attach to.
      program = @program = @program ? gl.createProgram()

      compileAndAttach = (src, type) ->
        shader = gl.createShader(type)
        gl.shaderSource(shader, src)
        gl.compileShader(shader)

        if !gl.getShaderParameter(shader, gl.COMPILE_STATUS)
          throw gl.getShaderInfoLog(shader)

        gl.attachShader(program, shader)
        gl.deleteShader(shader)

      compileAndAttach(opts.vertex, gl.VERTEX_SHADER) if opts.vertex?
      compileAndAttach(opts.fragment, gl.FRAGMENT_SHADER) if opts.fragment?

      return @

    link: ->
      program = @program

      gl.linkProgram(program)
      if !gl.getProgramParameter(program, gl.LINK_STATUS)
        throw gl.getProgramInfoLog(program)

      makeUniformSetter = (type, location) ->
        switch type
          when gl.BOOL, gl.INT, gl.SAMPLER_2D, gl.SAMPLER_CUBE
            return (value) -> gl.uniform1i(location, value)
          when gl.FLOAT
            return (value) -> gl.uniform1f(location, value)
          when gl.FLOAT_VEC2
            return (array) -> gl.uniform2fv(location, array)
          when gl.FLOAT_VEC3
            return (array) -> gl.uniform3fv(location, array)
          when gl.FLOAT_VEC4
            return (array) -> gl.uniform4fv(location, array)
          when gl.FLOAT_MAT2
            return (array) -> gl.uniformMatrix2fv(location, false, array)
          when gl.FLOAT_MAT3
            return (array) -> gl.uniformMatrix3fv(location, false, array)
          when gl.FLOAT_MAT4
            return (array) -> gl.uniformMatrix4fv(location, false, array)
        return -> throw "Unknown uniform type: #{type}"

      @uniforms = {}
      @locations = {}

      for i in [0...gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)]
        info = gl.getActiveUniform(program, i)
        location = gl.getUniformLocation(program, info.name)

        # GLSL uniform arrays come with [0] appended. Since multiple variables
        # with the same name are not allowed we should be able to ignore this.
        name = info.name.replace('[0]', '')

        @uniforms[name] = makeUniformSetter(info.type, location)
        @locations[name] = location

      for i in [0...gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)]
        info = gl.getActiveAttrib(program, i)
        location = gl.getAttribLocation(program, info.name)
        @locations[info.name] = location

      @linked = true

      return @

    use: (uniforms) ->
      if @linked
        gl.useProgram(@program)
        if uniforms?
          for name of uniforms
            @uniforms[name]?(uniforms[name])
      return @

    cleanup: ->
      gl.deleteProgram(@program)
      return @


  ## Vertex Buffer Object

  class embr.Vbo

    constructor: (@type, @usage = gl.STATIC_DRAW) ->
      @program = null
      @indices = null
      @attributes = {}

    setAttr: (name, opts) ->
      # Create buffer if none exists
      if not @attributes[name]?
        @attributes[name] =
          buffer:   gl.createBuffer()
          location: null

      attr = @attributes[name]

      setOpts(opts, attr, embr.Vbo.default_attr_settings)

      if (data = opts["data"])
        # Ensure data is a typed array
        if not (data instanceof Float32Array)
          data = new Float32Array(data)

        attr.length = Math.floor(
          if attr.stride > 0
            data.byteLength / attr.stride
          else
            data.length / attr.size
        )

        # Buffer data
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, data, @usage)

      return @

    setIndices: (data) ->
      # Create buffer if none exists
      @indices = buffer: gl.createBuffer() if @indices is null
      @indices.length = data.length

      # Ensure data is a typed array
      data = new Uint16Array(data) if not (data instanceof Uint16Array)

      # Buffer data
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, @indices.buffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, @usage)

      return @

    # Associate attribute locations with a shader program. This must be called
    # before each time the VBO is drawn with a different program.
    setProgram: (program) ->
      if program.linked
        @program = program
        for name of @attributes
          @attributes[name].location =
            if program.locations[name] then program.locations[name] else null
      return @

    draw: ->
      indices = @indices
      length = Number.MAX_VALUE
      enabled_locations = []

      # Bind any attributes that are used in our shader.
      for name of @attributes
        attr = @attributes[name]
        if attr.location? and attr.length > 0
          gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
          gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, attr.stride, attr.offset)
          gl.enableVertexAttribArray(attr.location)
          enabled_locations.push(attr)
          length = Math.min(length, attr.length)

      # If no attributes are enabled, bail out.
      return if enabled_locations.length == 0

      # If indices are present, use glDrawElements.
      if indices?
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer)
        gl.drawElements(@type, indices.length, gl.UNSIGNED_SHORT, 0)
      # Otherwise, use glDrawArrays.
      else
        gl.drawArrays(@type, 0, length)

      # Clean up GL state.
      for location in enabled_locations
        gl.disableVertexAttribArray(location)

      return @

    cleanup: ->
      for name of @attributes
        gl.deleteBuffer(@attributes[name].buffer)
      return @


  ## Texture Object

  class embr.Texture

    constructor: (opts) ->
      @texture = null
      @settings = {}
      @set(opts) if opts?

    set: (opts = {}) ->
      settings = @settings
      pw = settings.width
      ph = settings.height
      self = @

      setOpts(opts, settings, embr.Texture.default_settings)

      target = settings.target

      createAndBind = ->
        self.texture = gl.createTexture() if self.texture is null
        self.bind()

      if settings.width > 0 and settings.height > 0
        createAndBind()
        if opts.data? and pw == settings.width and ph == settings.height
          gl.texSubImage2D(target, 0, 0, 0, settings.width, settings.height, settings.format, settings.type, opts.data)
        else
          gl.texImage2D(target, 0, settings.format_internal, settings.width, settings.height, 0, settings.format, settings.type, opts.data)
      else if opts.element?
        createAndBind()
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) if settings.flip_y
        gl.texImage2D(target, 0, settings.format_internal, settings.format, settings.type, opts.element)

      if @texture?
        fmin = settings.filter_min ? settings.filter
        fmag = settings.filter_mag ? settings.filter
        ws = settings.wrap_s ? settings.wrap
        wt = settings.wrap_t ? settings.wrap

        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, fmin)
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, fmag)
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, ws)
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, wt)

        # Generate mipmap if necessary.
        for filter in gl_mipmap_filters
          if fmin == filter
            gl.generateMipmap(target)
            break

      @unbind()

      return @

    bind: (unit) ->
      @settings.unit ?= unit
      if @texture?
        gl.activeTexture(gl.TEXTURE0 + @settings.unit)
        gl.bindTexture(@settings.target, @texture)
      return @

    unbind: ->
      if @texture?
        gl.activeTexture(gl.TEXTURE0 + @settings.unit)
        gl.bindTexture(@settings.target, null)
      return @

    cleanup: ->
      gl.deleteTexture(@texture)
      return @


  ## Render Buffer Object

  class embr.Rbo

    constructor: (opts) ->
      @buffer = gl.createRenderbuffer()
      @settings = {}
      @set(opts) if opts?

    set: (opts = {}) ->
      settings = @settings
      pw = settings.width
      ph = settings.height

      setOpts(opts, settings, embr.Rbo.default_settings)

      if pw != settings.width or ph != settings.height
        @bind()
        gl.renderbufferStorage(settings.target, settings.format_internal, settings.width, settings.height)

      return @

    bind: ->
      gl.bindRenderbuffer(@settings.target, @buffer)
      return @

    unbind: ->
      gl.bindRenderbuffer(@settings.target, null)
      return @

    cleanup: ->
      gl.deleteRenderbuffer(@buffer)
      return @


  ## Frame Buffer Object

  class embr.Fbo

    constructor: ->
      @buffer = gl.createFramebuffer()
      @textures = []
      @renderbuffers = []

    # WebGL does not currently support multiple render targets, and will error
    # with any color attachment above COLOR_ATTACHMENT0.
    getNextColorAttachment: -> gl.COLOR_ATTACHMENT0

    attach: (obj, attachment) ->
      @bind()
      obj.bind()

      if obj instanceof embr.Texture
        attachment = attachment ? @getNextColorAttachment()
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, obj.settings.target, obj.texture, 0)
        @textures.push(obj)
      else if obj instanceof embr.Rbo
        attachment = attachment ? gl.DEPTH_ATTACHMENT
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, obj.settings.target, obj.buffer)
        @renderbuffers.push(obj)

      obj.unbind()
      @unbind()

      return @

    fbo_status_suffixes = [
      'INCOMPLETE_ATTACHMENT'
      'INCOMPLETE_MISSING_ATTACHMENT'
      'INCOMPLETE_DIMENSIONS'
      'UNSUPPORTED'
    ]

    check: ->
      @bind()
      status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
      if status != gl.FRAMEBUFFER_COMPLETE
        for suffix in fbo_status_suffixes
          if status == gl["FRAMEBUFFER_#{suffix}"]
            throw "Framebuffer Status: #{status}"
      @unbind()
      return @

    bind: ->
      gl.bindFramebuffer(gl.FRAMEBUFFER, @buffer)
      return @

    unbind: ->
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return @

    cleanup: ->
      gl.deleteFramebuffer(@buffer)
      for texture in @textures
        texture.cleanup()
      for renderbuffer in @renderbuffers
        renderbuffer.cleanup()
      return @


  ## Presets

  # TODO(ryan): These should probably be moved to their own optional file and
  # included via a build step.

  embr.Program.default_build_settings =
    color:         true
    texture:       false
    positionName:  'position'
    texcoordName:  'texcoord'
    colorOperator: '*'

  embr.Program.buildProgram = (opts) ->
    setOpts(opts, settings = {}, embr.Program.default_build_settings)

    fs_color_parts = []
    if settings.color
      fs_color_parts.push('uColor')
    if settings.texture
      fs_color_parts.push('texture2D(uTexture, vTexcoord)')

    vs = """
      uniform mat4 uTransform;
      attribute vec3 #{settings.positionName};
      attribute vec2 #{settings.texcoordName};
      varying vec2 vTexcoord;
      void main(){
        vTexcoord = #{settings.texcoordName};
        gl_Position = uTransform * vec4(#{settings.positionName}, 1.);
      }
      """
    fs = """
      #ifdef GL_ES
      precision highp float;
      #endif
      uniform vec4 uColor;
      uniform sampler2D uTexture;
      varying vec2 vTexcoord;
      void main(){
        gl_FragColor = #{fs_color_parts.join(settings.colorOperator)};
      }
      """

    return new embr.Program(vertex: vs, fragment: fs)

  embr.Vbo.createPlane = (xa, ya, xb, yb) ->
    positions = [ xa, ya, 0, xa, yb, 0, xb, ya, 0, xb, yb, 0 ]
    normals = [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ]
    texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ]

    return new embr.Vbo(gl.TRIANGLE_STRIP)
      .setAttr('position', data: positions, size: 3)
      .setAttr('normal',   data: normals,   size: 3)
      .setAttr('texcoord', data: texcoords, size: 2)

  embr.Vbo.createBox = (xa, ya, za, xb, yb, zb) ->
    positions = [
      xb,yb,zb, xb,ya,zb, xb,ya,za, xb,yb,za, # +X
      xb,yb,zb, xb,yb,za, xa,yb,za, xa,yb,zb, # +Y
      xb,yb,zb, xa,yb,zb, xa,ya,zb, xb,ya,zb, # +Z
      xa,yb,zb, xa,yb,za, xa,ya,za, xa,ya,zb, # -X
      xa,ya,za, xb,ya,za, xb,ya,zb, xa,ya,zb, # -Y
      xb,ya,za, xa,ya,za, xa,yb,za, xb,yb,za  # -Z
    ]
    normals = [
       1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
       0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
       0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
       0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
       0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1
    ]
    texcoords = [
      0,1, 1,1, 1,0, 0,0,
      1,1, 1,0, 0,0, 0,1,
      0,1, 1,1, 1,0, 0,0,
      1,1, 1,0, 0,0, 0,1,
      1,0, 0,0, 0,1, 1,1,
      1,0, 0,0, 0,1, 1,1
    ]
    indices = [
       0, 1, 2, 0, 2, 3,
       4, 5, 6, 4, 6, 7,
       8, 9,10, 8,10,11,
      12,13,14,12,14,15,
      16,17,18,16,18,19,
      20,21,22,20,22,23
    ]

    return new embr.Vbo(gl.TRIANGLES)
      .setAttr("position", data: positions, size: 3)
      .setAttr("normal",   data: normals,   size: 3)
      .setAttr("texcoord", data: texcoords, size: 2)
      .setIndices(indices)


  # Export for Node.js
  if module? and module.exports?
    module.exports = embr

  # Export for AMD (RequireJS and similar)
  else if typeof define is 'function' and define.amd?
    define(-> return embr)

  # Just append to the current context
  else
    this.embr = embr

  return

).call(this)
