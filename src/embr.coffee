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

    embr.VboAttr.default_settings =
      size:   1
      type:   gl.FLOAT
      usage:  gl.STATIC_DRAW
      stride: 0
      offset: 0

    embr.VboIndices.default_settings =
      usage: gl.STATIC_DRAW

    embr.Texture.default_settings =
      target:         gl.TEXTURE_2D
      unit:           0
      format:         gl.RGBA
      formatInternal: gl.RGBA
      type:           gl.UNSIGNED_BYTE
      filter:         gl.NEAREST
      filterMin:      null
      filterMag:      null
      wrap:           gl.CLAMP_TO_EDGE
      wrapS:          null
      wrapT:          null
      width:          0
      height:         0

      # Flip Y only works when `element` is specified.
      flipY:          false

    embr.Rbo.default_settings =
      target:         gl.RENDERBUFFER
      formatInternal: gl.DEPTH_COMPONENT16
      width:          0
      height:         0

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

      makeUniformSetter = (type, location, is_array) ->
        switch type
          when gl.BOOL, gl.INT, gl.SAMPLER_2D, gl.SAMPLER_CUBE
            if is_array
              return (array) -> gl.uniform1iv(location, array)
            return (value) -> gl.uniform1i(location, value)
          when gl.FLOAT
            if is_array
              return (array) -> gl.uniform1fv(location, array)
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
        name = info.name

        # GLSL uniform arrays come with [0] appended. Since multiple variables
        # with the same name are not allowed we should be able to ignore this.
        is_array = name.slice(-3) == '[0]'
        name = name.slice(0, -3) if is_array

        @uniforms[name] = makeUniformSetter(info.type, location, is_array)
        @locations[name] = location

      for i in [0...gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)]
        info = gl.getActiveAttrib(program, i)
        location = gl.getAttribLocation(program, info.name)
        @locations[info.name] = location

      @linked = true

      return @

    use: (uniforms) ->
      if not @linked
        throw 'Program must be linked before use.'
      gl.useProgram(@program)
      if uniforms?
        for name of uniforms
          @uniforms[name]?(uniforms[name])
      return @

    setUniform: (name, value) ->
      @uniforms[name]?(value)
      return @

    cleanup: ->
      gl.deleteProgram(@program)
      return @


  ## Vertex Buffer Object

  class embr.VboAttr

    constructor: (@name, opts) ->
      @buffer = null
      @location = null
      @length = null
      @settings = {}
      @set(opts) if opts?

    set: (opts = {}) ->
      settings = @settings

      setOpts(opts, settings, embr.VboAttr.default_settings)

      # Data is not copied into settings so we look in opts.
      if opts.data?
        # Create buffer if none exists.
        @buffer = gl.createBuffer() if @buffer is null

        data = opts.data

        # Ensure data is a typed array
        if not (data.buffer instanceof ArrayBuffer)
          throw 'Data must be an ArrayBufferView.'

        if settings.stride > 0
          @length = Math.floor(data.byteLength / settings.stride)
        else
          @length = Math.floor(data.length / settings.size)

        # Buffer data
        gl.bindBuffer(gl.ARRAY_BUFFER, @buffer)
        gl.bufferData(gl.ARRAY_BUFFER, data, settings.usage)

      return @

    enable: ->
      if @location?
        settings = @settings
        gl.bindBuffer(gl.ARRAY_BUFFER, @buffer)
        gl.vertexAttribPointer(@location, settings.size, settings.type, false, settings.stride, settings.offset)
        gl.enableVertexAttribArray(@location)
      return @

    disable: ->
      gl.enableVertexAttribArray(@location) if @location?
      return @

    cleanup: ->
      gl.deleteBuffer(@buffer)
      return @


  class embr.VboIndices

    constructor: (opts) ->
      @buffer = null
      @settings = {}
      @set(opts) if opts?

    set: (opts = {}) ->
      settings = @settings

      setOpts(opts, settings, embr.VboIndices.default_settings)

      if opts.data?
        # Create buffer if none exists.
        @buffer = gl.createBuffer() if @buffer is null

        data = opts.data

        # Ensure data is a typed array.
        if not (data.buffer instanceof ArrayBuffer)
          throw 'Data must be an ArrayBufferView.'

        @length = data.length

        # Buffer data
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, @buffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, settings.usage)

    bind: ->
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, @buffer)
      return @

    unbind: ->
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
      return @

    cleanup: ->
      gl.deleteBuffer(@buffer)
      return @


  class embr.Vbo

    constructor: (@type) ->
      @program = null
      @indices = null
      @attributes = {}

    getAttr: (name) -> @attributes[name]
    setAttr: (attr) ->
      @attributes[attr.name] = attr
      return @

    getIndices: -> @indices
    setIndices: (indices) ->
      @indices = indices
      return @

    createAttr: (name, opts) -> @setAttr(new embr.VboAttr(name, opts))
    createIndices: (opts) -> @setIndices(new embr.VboIndices(opts))

    getProgram: -> @program

    # Associate attribute locations with a shader program. This must be called
    # before each time the VBO is drawn with a different program.
    setProgram: (program) ->
      if program.linked
        @program = program
        for name of @attributes
          attr = @attributes[name]
          attr.location = program.locations[attr.name] ? null
      return @

    draw: ->
      indices = @indices
      attributes = @attributes
      min_length = Number.MAX_VALUE
      enabled_attrs = []

      # Bind any attributes that are used in our shader.
      for name of attributes
        attr = attributes[name]
        if attr.location? and attr.length > 0
          attr.enable()
          enabled_attrs.push(attr)
          min_length = attr.length if attr.length < min_length

      # If no attributes are enabled, bail out.
      return if enabled_attrs.length == 0

      # If indices are present, use glDrawElements.
      if indices?
        indices.bind()
        gl.drawElements(@type, indices.length, gl.UNSIGNED_SHORT, 0)
        indices.unbind()
      # Otherwise, use glDrawArrays.
      else
        gl.drawArrays(@type, 0, min_length)

      # Clean up GL state.
      attr.disable() for attr in enabled_attrs

      return @

    cleanup: ->
      for name of @attributes
        @attributes[name].cleanup()
      @indices?.cleanup()
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

      setOpts(opts, settings, embr.Texture.default_settings)

      target = settings.target

      createAndBind = =>
        @texture = gl.createTexture() if @texture is null
        @bind()

      if opts.data != undefined and settings.width > 0 and settings.height > 0
        createAndBind()
        if pw == settings.width and ph == settings.height
          gl.texSubImage2D(target, 0, 0, 0, settings.width, settings.height, settings.format, settings.type, opts.data)
        else
          gl.texImage2D(target, 0, settings.formatInternal, settings.width, settings.height, 0, settings.format, settings.type, opts.data)
      else if opts.element?
        createAndBind()
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) if settings.flipY
        gl.texImage2D(target, 0, settings.formatInternal, settings.format, settings.type, opts.element)

      if @texture?
        filterMin = settings.filterMin ? settings.filter
        filterMag = settings.filterMag ? settings.filter
        wrapS = settings.wrapS ? settings.wrap
        wrapT = settings.wrapT ? settings.wrap

        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filterMin)
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filterMag)
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrapS)
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrapT)

        # Generate mipmap if necessary.
        for filter in gl_mipmap_filters
          if filterMin == filter
            gl.generateMipmap(target)
            break

      @unbind()

      return @

    bind: (unit) ->
      @settings.unit = unit if unit?
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
        gl.renderbufferStorage(settings.target, settings.formatInternal, settings.width, settings.height)

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
          name = "FRAMEBUFFER_#{suffix}"
          if status == gl[name]
            throw "Framebuffer Status: #{name}"
      @unbind()
      return @

    bind: ->
      gl.bindFramebuffer(gl.FRAMEBUFFER, @buffer)
      return @

    unbind: ->
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return @

    bindTexture: (i, unit) ->
      @textures[i].bind(unit)
      return @

    unbindTexture: (i) ->
      @textures[i].unbind()
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
    color:         false
    texture:       false
    uvs:           false
    precision:     'highp'
    positionName:  'position'
    texcoordName:  'texcoord'
    colorOperator: '*'

  embr.Program.buildProgram = (opts = {}) ->
    setOpts(opts, settings = {}, embr.Program.default_build_settings)

    fs_color_parts = []
    if settings.color
      fs_color_parts.push('uColor')
    if settings.texture
      fs_color_parts.push('texture2D(uTexture, vTexcoord)')
    if settings.uvs
      fs_color_parts.push('vec4(vTexcoord, 0., 1.)')

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
      precision #{settings.precision} float;
      #endif
      uniform vec4 uColor;
      uniform sampler2D uTexture;
      varying vec2 vTexcoord;
      void main(){
        gl_FragColor = #{fs_color_parts.join(settings.colorOperator)};
      }
      """

    return new embr.Program(vertex: vs, fragment: fs).link()

  embr.Vbo.createPlane = (xa, ya, xb, yb) ->
    positions = new Float32Array([ xa, ya, 0, xa, yb, 0, xb, ya, 0, xb, yb, 0 ])
    normals = new Float32Array([ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ])
    texcoords = new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ])

    return new embr.Vbo(gl.TRIANGLE_STRIP)
      .createAttr('position', data: positions, size: 3)
      .createAttr('normal',   data: normals,   size: 3)
      .createAttr('texcoord', data: texcoords, size: 2)

  embr.Vbo.createBox = (xa, ya, za, xb, yb, zb) ->
    positions = new Float32Array([
      xb,yb,zb, xb,ya,zb, xb,ya,za, xb,yb,za, # +X
      xb,yb,zb, xb,yb,za, xa,yb,za, xa,yb,zb, # +Y
      xb,yb,zb, xa,yb,zb, xa,ya,zb, xb,ya,zb, # +Z
      xa,yb,zb, xa,yb,za, xa,ya,za, xa,ya,zb, # -X
      xa,ya,za, xb,ya,za, xb,ya,zb, xa,ya,zb, # -Y
      xb,ya,za, xa,ya,za, xa,yb,za, xb,yb,za  # -Z
    ])
    normals = new Float32Array([
       1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
       0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
       0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
       0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
       0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1
    ])
    texcoords = new Float32Array([
      0,1, 1,1, 1,0, 0,0,
      1,1, 1,0, 0,0, 0,1,
      0,1, 1,1, 1,0, 0,0,
      1,1, 1,0, 0,0, 0,1,
      1,0, 0,0, 0,1, 1,1,
      1,0, 0,0, 0,1, 1,1
    ])
    indices = new Uint16Array([
       0, 1, 2, 0, 2, 3,
       4, 5, 6, 4, 6, 7,
       8, 9,10, 8,10,11,
      12,13,14,12,14,15,
      16,17,18,16,18,19,
      20,21,22,20,22,23
    ])

    return new embr.Vbo(gl.TRIANGLES)
      .createAttr('position', data: positions, size: 3)
      .createAttr('normal',   data: normals,   size: 3)
      .createAttr('texcoord', data: texcoords, size: 2)
      .createIndices(indices)

  embr.Vbo.createEllipse = (xRadius, yRadius, numSegments) ->
    len = (numSegments + 2) * 3
    iToTheta = Math.PI * 2 / (len - 6)

    positions = new Float32Array(len)
    normals = new Float32Array(len)
    texcoords = new Float32Array(len)

    for i in [0...len] by 3
      theta = i * iToTheta
      ct = Math.cos(theta)
      st = Math.sin(theta)

      # The first three elements of the arrays should be zeroed implicitly so
      # we can skip those.
      i0 = i + 3
      i1 = i + 4
      i2 = i + 5

      positions[i0] = ct * xRadius
      positions[i1] = st * yRadius
      positions[i2] = 0
      normals[i0] = 0
      normals[i1] = 0
      normals[i2] = 1
      texcoords[i0] = ct * 0.5 + 0.5
      texcoords[i1] = st * 0.5 + 0.5
      texcoords[i2] = 0

    return new embr.Vbo(gl.TRIANGLE_FAN)
      .createAttr('position', data: positions, size: 3)
      .createAttr('normal',   data: normals,   size: 3)
      .createAttr('texcoord', data: texcoords, size: 2)


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
