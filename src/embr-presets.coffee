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

## Presets

presets = {}

# Export for Node.js
if module? and module.exports?
  embr = require('embr')
  module.exports = presets

# Just append to the current context
else
  embr = @embr or {}
  embr.presets = presets

presets.createPlane = (xa, ya, xb, yb) ->
  positions = new Float32Array([ xa, ya, 0, xa, yb, 0, xb, ya, 0, xb, yb, 0 ])
  normals = new Float32Array([ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ])
  texcoords = new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ])

  return new embr.Vbo(gl.TRIANGLE_STRIP)
    .createAttr('position', data: positions, size: 3)
    .createAttr('normal',   data: normals,   size: 3)
    .createAttr('texcoord', data: texcoords, size: 2)

presets.createBox = (xa, ya, za, xb, yb, zb) ->
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

presets.createEllipse = (xRadius, yRadius, numSegments) ->
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
