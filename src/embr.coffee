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

  Embr = {}
  gl = gl_enums = gl_mipmap_filters = null


  ## Set GL context.
  # This must be called first.

  Embr.setContext = (_gl) ->
    Embr.gl = gl = _gl

    # Cache GL constants for later use.
    gl_mipmap_filters = [
      gl.NEAREST_MIPMAP_NEAREST
      gl.LINEAR_MIPMAP_NEAREST
      gl.NEAREST_MIPMAP_LINEAR
      gl.LINEAR_MIPMAP_LINEAR
    ]

    # Set default parameters.

    Embr.Vbo.attr_default_params =
      size:   1
      stride: 0
      offset: 0

    Embr.Texture.default_params =
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

    Embr.Rbo.default_params =
      target:          gl.RENDERBUFFER
      format_internal: gl.DEPTH_COMPONENT16
      width:           0
      height:          0

    return


  ## General Utilities

  Embr.getGLEnumName = (e) ->
    if gl_enums == null
      # Build GL enums lookup dictionary if necessary.
      gl_enums = {}
      for name of gl
        if typeof gl[name] == 'number'
          gl_enums[gl[name]] = name
    return gl_enums[e]

  Embr.checkError = (gl, msg) ->
    errs = []
    # Check for any GL errors.
    while (err = gl.getError()) != gl.NO_ERROR
      errs.push(err)
    if errs.length > 0
      # Throw all GL errors.
      throw msg + ": " + errs.map(Embr.getGLEnumName).join(", ")

  # Create a GL context which checks for errors after every call.
  Embr.wrapContextWithErrorChecks = (gl) ->
    wrapFn = (name, fn) ->
      return ->
        res = fn.apply(gl, arguments)
        Embr.checkError(gl, "GL Error in #{name}")
        return res
    wrapped = {}
    for name of gl
      prop = gl[name]
      wrapped[name] = if typeof prop == 'function'
        wrapFn(name, prop)
      else
        prop
    return wrapped

  setParams = (opts, dest, defaults) ->
    for name of defaults
      if opts[name]?
        dest[name] = opts[name]
      else if dest[name] is undefined
        dest[name] = defaults[name]
    return


  ## Shader Program

  class Embr.Program

    constructor: (vsrc, fsrc) ->
      if vsrc? or fsrc?
        @compile(vsrc, fsrc)
    @linked = false

    compile: (vsrc, fsrc) ->
      program = @program = gl.createProgram()

      compileAndAttach = (src, type) ->
        shader = gl.createShader(type)
        gl.shaderSource(shader, src)
        gl.compileShader(shader)

        if !gl.getShaderParameter(shader, gl.COMPILE_STATUS)
          throw gl.getShaderInfoLog(shader)

        gl.attachShader(program, shader)
        gl.deleteShader(shader)

      compileAndAttach(vsrc, gl.VERTEX_SHADER) if vsrc?
      compileAndAttach(fsrc, gl.FRAGMENT_SHADER) if fsrc?

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
        return -> throw "Unknown uniform type: " + type

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

  class Embr.Vbo

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

      setParams(opts, attr, Embr.Vbo.attr_default_params)

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

  class Embr.Texture

    constructor: (opts) ->
      @texture = null
      @params = {}
      @set(opts)

    set: (opts = {}) ->
      params = @params
      prw = params.width
      prh = params.height
      self = @

      setParams(opts, params, Embr.Texture.default_params)

      target = params.target

      createAndBind = ->
        self.texture = gl.createTexture() if self.texture is null
        self.bind()

      if opts.data? and params.width > 0 and params.height > 0
        createAndBind()
        if prw == params.width and prh == params.height
          gl.texSubImage2D(target, 0, 0, 0, params.width, params.height, params.format, params.type, opts.data)
        else
          gl.texImage2D(target, 0, params.format_internal, params.width, params.height, 0, params.format, params.type, opts.data)
      else if opts.element?
        createAndBind()
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) if params.flip_y
        gl.texImage2D(target, 0, params.format_internal, params.format, params.type, opts.element)

      if @texture?
        fmin = params.filter_min ? params.filter
        fmag = params.filter_mag ? params.filter
        ws = params.wrap_s ? params.wrap
        wt = params.wrap_t ? params.wrap

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
      @params.unit ?= unit
      if @texture?
        gl.activeTexture(gl.TEXTURE0 + @params.unit)
        gl.bindTexture(@params.target, @texture)
      return @

    unbind: ->
      if @texture?
        gl.activeTexture(gl.TEXTURE0 + @params.unit)
        gl.bindTexture(@params.target, null)
      return @

    cleanup: ->
      gl.deleteTexture(@texture)
      return @


  ## Render Buffer Object

  class Embr.Rbo

    constructor: (opts) ->
      @buffer = gl.createRenderbuffer()
      @params = {}
      @set(opts)

    set: (opts = {}) ->
      params = @params
      prw = params.width
      prh = params.height

      setParams(opts, params, Embr.Rbo.default_params)

      if prw != params.width or prh != params.height
        @bind()
        gl.renderbufferStorage(params.target, params.format_internal, params.width, params.height)

      return @

    bind: ->
      gl.bindRenderbuffer(@params.target, @buffer)
      return @

    unbind: ->
      gl.bindRenderbuffer(@params.target, null)
      return @

    cleanup: ->
      gl.deleteRenderbuffer(@buffer)
      return @


  ## Frame Buffer Object

  class Embr.Fbo

    status_suffixes = [
      'INCOMPLETE_ATTACHMENT'
      'INCOMPLETE_MISSING_ATTACHMENT'
      'INCOMPLETE_DIMENSIONS'
      'UNSUPPORTED'
    ]

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

      if obj instanceof Embr.Texture
        attachment = attachment ? @getNextColorAttachment()
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, obj.params.target, obj.texture, 0)
        @textures.push(obj)
      else if obj instanceof Embr.Rbo
        attachment = attachment ? gl.DEPTH_ATTACHMENT
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, obj.params.target, obj.buffer)
        @renderbuffers.push(obj)

      obj.unbind()
      @unbind()

      return @

    check: ->
      @bind()
      status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
      if status != gl.FRAMEBUFFER_COMPLETE
        status_suffixes.forEach (name) ->
          if status == gl["FRAMEBUFFER_#{name}"]
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


  # Export for Node.js
  if module? and module.exports?
    module.exports = Embr

  # Export for AMD (RequireJS and similar)
  else if typeof define is 'function' and define.amd?
    define(-> return Embr)

  # Just append to the current context
  else
    this.Embr = Embr

  return

).call(this)
