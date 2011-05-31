var Embr = (Embr !== undefined) ? Embr : {};

if(!window.requestAnimationFrame){
    window.requestAnimationFrame = (function(){
            return window.webkitRequestAnimationFrame ||
                   window.mozRequestAnimationFrame    ||
                   window.oRequestAnimationFrame      ||
                   window.msRequestAnimationFrame     ||
                   function(callback, element){
                       window.setTimeout(callback, 1000 / 60);
                   };
    })();
}

Embr.run = function(canvas, obj){
    var gl = null;
    try{
        gl = canvas.getContext('experimental-webgl');
    }
    catch(err){
        console.error(err);
    }

    if(gl){
        console.log([
            "EMBR made a GL context!",
            gl.getParameter(gl.VERSION),
            gl.getParameter(gl.VENDOR),
            gl.getParameter(gl.RENDERER),
            gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
        ].join(" | "));

        obj.gl = gl;
        obj.width  = canvas.width  = canvas.clientWidth;
        obj.height = canvas.height = canvas.clientHeight;

        gl.viewport(0, 0, obj.width, obj.height);

        var step_iterval_handle = null;
        obj.framerate = function(fps){
            if(step_iterval_handle !== null)
                clearInterval(step_iterval_handle);
            if(fps === 0)
                return;

            step_iterval_handle = setInterval(function(){
                obj._step();
            }, 1000 / fps);
        };

        if(obj.init){
            try{
                obj.init();
            }
            catch(e){
                console.error('Exception caught in init: ' + e);
            }
        }

        var frameid = 0;
        var frame_start_time = Date.now();
        var frame_dirty = true;
        obj._step = function(){
            if(obj.step){
                obj.frameid   = frameid;
                obj.frametime = (Date.now() - frame_start_time) / 1000; // Secs.

                try{
                    obj.step();
                }
                catch(e){
                    console.error('Exception caught in step: ' + e);
                }

                frame_dirty = true;
                frameid++;
            }
        };
        obj._draw = function(){
            if(obj.draw && frame_dirty){
                try{
                    obj.draw();
                }
                catch(e){
                    console.error('Exception caught in draw: ' + e);
                }

                frame_dirty = false;
            }
            window.requestAnimationFrame(obj._draw, canvas);
        };

        obj._step();
        obj._draw();

        return obj;
    }
};
// Vector and Matrix utilities from Plask
// http://plask.org

(function(){

  // A class representing a 3 dimensional point and/or vector.  There isn't a
  // good reason to differentiate between the two, and you often want to change
  // how you think about the same set of values.  So there is only "vector".
  //
  // The class is designed without accessors or individual mutators, you should
  // access the x, y, and z values directly on the object.
  //
  // Almost all of the core operations happen in place, writing to the current
  // object.  If you want a copy, you can call dup().  For convenience, many
  // operations have a passed-tense version that returns a new object.  Most
  // methods return this to support chaining.
  function Vec3(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }

  Vec3.prototype.set = function(x, y, z) {
    this.x = x; this.y = y; this.z = z;

    return this;
  };

  Vec3.prototype.setVec3 = function(v) {
    this.x = v.x; this.y = v.y; this.z = v.z;

    return this;
  };

  // Cross product, this = a x b.
  Vec3.prototype.cross2 = function(a, b) {
    var ax = a.x, ay = a.y, az = a.z,
        bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  };

  // Cross product, this = this x b.
  Vec3.prototype.cross = function(b) {
    return this.cross2(this, b);
  };

  // Returns the dot product, this . b.
  Vec3.prototype.dot = function(b) {
    return this.x * b.x + this.y * b.y + this.z * b.z;
  };

  // Add two Vec3s, this = a + b.
  Vec3.prototype.add2 = function(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;
  };

  Vec3.prototype.added2 = function(a, b) {
    return new Vec3(a.x + b.x,
                    a.y + b.y,
                    a.z + b.z);
  };

  // Add a Vec3, this = this + b.
  Vec3.prototype.add = function(b) {
    return this.add2(this, b);
  };

  Vec3.prototype.added = function(b) {
    return this.added2(this, b);
  };

  // Subtract two Vec3s, this = a - b.
  Vec3.prototype.sub2 = function(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;
  };

  Vec3.prototype.subbed2 = function(a, b) {
    return new Vec3(a.x - b.x,
                    a.y - b.y,
                    a.z - b.z);
  };

  // Subtract another Vec3, this = this - b.
  Vec3.prototype.sub = function(b) {
    return this.sub2(this, b);
  };

  Vec3.prototype.subbed = function(b) {
    return this.subbed2(this, b);
  };

  // Multiply by a scalar.
  Vec3.prototype.scale = function(s) {
    this.x *= s; this.y *= s; this.z *= s;

    return this;
  };

  Vec3.prototype.scaled = function(s) {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  };

  // Interpolate between this and another Vec3 |b|, based on |t|.
  Vec3.prototype.lerp = function(b, t) {
    this.x = this.x + (b.x-this.x)*t;
    this.y = this.y + (b.y-this.y)*t;
    this.z = this.z + (b.z-this.z)*t;

    return this;
  };

  Vec3.prototype.lerped = function(b, t) {
    return new Vec3(this.x + (b.x-this.x)*t,
                    this.y + (b.y-this.y)*t,
                    this.z + (b.z-this.z)*t);
  };

  // Magnitude (length).
  Vec3.prototype.length = function() {
    var x = this.x, y = this.y, z = this.z;
    return Math.sqrt(x*x + y*y + z*z);
  };

  // Magnitude squared.
  Vec3.prototype.lengthSquared = function() {
    var x = this.x, y = this.y, z = this.z;
    return x*x + y*y + z*z;
  };

  // Normalize, scaling so the magnitude is 1.  Invalid for a zero vector.
  Vec3.prototype.normalize = function() {
    return this.scale(1/this.length());
  };

  Vec3.prototype.normalized = function() {
    return this.dup().normalize();
  };

  Vec3.prototype.dup = function() {
    return new Vec3(this.x, this.y, this.z);
  };

  Vec3.prototype.debugString = function() {
    return 'x: ' + this.x + ' y: ' + this.y + ' z: ' + this.z;
  };


  // Like a z-less Vec3, Vec2.
  function Vec2(x, y) {
    this.x = x; this.y = y;
  }

  Vec2.prototype.set = function(x, y) {
    this.x = x; this.y = y

    return this;
  };

  Vec2.prototype.setVec2 = function(v) {
    this.x = v.x; this.y = v.y;

    return this;
  };

  // Returns the dot product, this . b.
  Vec2.prototype.dot = function(b) {
    return this.x * b.x + this.y * b.y;
  };

  // Add two Vec2s, this = a + b.
  Vec2.prototype.add2 = function(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;

    return this;
  };

  Vec2.prototype.added2 = function(a, b) {
    return new Vec2(a.x + b.x,
                    a.y + b.y);
  };

  // Add a Vec2, this = this + b.
  Vec2.prototype.add = function(b) {
    return this.add2(this, b);
  };

  Vec2.prototype.added = function(b) {
    return this.added2(this, b);
  };

  // Subtract two Vec2s, this = a - b.
  Vec2.prototype.sub2 = function(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  };

  Vec2.prototype.subbed2 = function(a, b) {
    return new Vec2(a.x - b.x,
                    a.y - b.y);
  };

  // Subtract another Vec2, this = this - b.
  Vec2.prototype.sub = function(b) {
    return this.sub2(this, b);
  };

  Vec2.prototype.subbed = function(b) {
    return this.subbed2(this, b);
  };

  // Multiply by a scalar.
  Vec2.prototype.scale = function(s) {
    this.x *= s; this.y *= s;

    return this;
  };

  Vec2.prototype.scaled = function(s) {
    return new Vec2(this.x * s, this.y * s);
  };

  // Interpolate between this and another Vec2 |b|, based on |t|.
  Vec2.prototype.lerp = function(b, t) {
    this.x = this.x + (b.x-this.x)*t;
    this.y = this.y + (b.y-this.y)*t;

    return this;
  };

  Vec2.prototype.lerped = function(b, t) {
    return new Vec2(this.x + (b.x-this.x)*t,
                    this.y + (b.y-this.y)*t);
  };

  // Magnitude (length).
  Vec2.prototype.length = function() {
    var x = this.x, y = this.y;
    return Math.sqrt(x*x + y*y);
  };

  // Magnitude squared.
  Vec2.prototype.lengthSquared = function() {
    var x = this.x, y = this.y;
    return x*x + y*y;
  };

  // Normalize, scaling so the magnitude is 1.  Invalid for a zero vector.
  Vec2.prototype.normalize = function() {
    return this.scale(1/this.length());
  };

  Vec2.prototype.normalized = function() {
    return this.dup().normalize();
  };

  Vec2.prototype.dup = function() {
    return new Vec2(this.x, this.y);
  };

  Vec2.prototype.debugString = function() {
    return 'x: ' + this.x + ' y: ' + this.y;
  };


  // TODO(deanm): Vec4 is currently a skeleton container, it should match the
  // features of Vec3.
  function Vec4(x, y, z, w) {
    this.x = x; this.y = y; this.z = z; this.w = w;
  }

  Vec4.prototype.set = function(x, y, z, w) {
    this.x = x; this.y = y; this.z = z; this.w = w;

    return this;
  };

  Vec4.prototype.setVec4 = function(v) {
    this.x = v.x; this.y = v.y; this.z = v.z; this.w = v.w;

    return this;
  };

  Vec4.prototype.dup = function() {
    return new Vec4(this.x, this.y, this.z, this.w);
  };

  Vec4.prototype.toVec3 = function() {
    return new Vec3(this.x, this.y, this.z);
  };


  // This represents an affine 4x4 matrix, using mathematical notation,
  // numbered (starting from 1) as aij, where i is the row and j is the column.
  //   a11 a12 a13 a14
  //   a21 a22 a23 a24
  //   a31 a32 a33 a34
  //   a41 a42 a43 a44
  //
  // Almost all operations are multiplies to the current matrix, and happen
  // in place.  You can use dup() to return a copy.
  //
  // Most operations return this to support chaining.
  //
  // It's common to use toFloat32Array to get a Float32Array in OpenGL (column
  // major) memory ordering.  NOTE: The code tries to be explicit about whether
  // things are row major or column major, but remember that GLSL works in
  // column major ordering, and PreGL generally uses row major ordering.
  function Mat4() {
    this.reset();
  }

  // Set the full 16 elements of the 4x4 matrix, arguments in row major order.
  // The elements are specified in row major order.  TODO(deanm): set4x4c.
  Mat4.prototype.set4x4r = function(a11, a12, a13, a14, a21, a22, a23, a24,
                                    a31, a32, a33, a34, a41, a42, a43, a44) {
    this.a11 = a11; this.a12 = a12; this.a13 = a13; this.a14 = a14;
    this.a21 = a21; this.a22 = a22; this.a23 = a23; this.a24 = a24;
    this.a31 = a31; this.a32 = a32; this.a33 = a33; this.a34 = a34;
    this.a41 = a41; this.a42 = a42; this.a43 = a43; this.a44 = a44;

    return this;
  };

  // Reset the transform to the identity matrix.
  Mat4.prototype.reset = function() {
    this.set4x4r(1, 0, 0, 0,
                 0, 1, 0, 0,
                 0, 0, 1, 0,
                 0, 0, 0, 1);

    return this;
  };

  // Matrix multiply this = a * b
  Mat4.prototype.mul2 = function(a, b) {
    var a11 = a.a11, a12 = a.a12, a13 = a.a13, a14 = a.a14,
        a21 = a.a21, a22 = a.a22, a23 = a.a23, a24 = a.a24,
        a31 = a.a31, a32 = a.a32, a33 = a.a33, a34 = a.a34,
        a41 = a.a41, a42 = a.a42, a43 = a.a43, a44 = a.a44;
    var b11 = b.a11, b12 = b.a12, b13 = b.a13, b14 = b.a14,
        b21 = b.a21, b22 = b.a22, b23 = b.a23, b24 = b.a24,
        b31 = b.a31, b32 = b.a32, b33 = b.a33, b34 = b.a34,
        b41 = b.a41, b42 = b.a42, b43 = b.a43, b44 = b.a44;

    this.a11 = a11*b11 + a12*b21 + a13*b31 + a14*b41;
    this.a12 = a11*b12 + a12*b22 + a13*b32 + a14*b42;
    this.a13 = a11*b13 + a12*b23 + a13*b33 + a14*b43;
    this.a14 = a11*b14 + a12*b24 + a13*b34 + a14*b44;
    this.a21 = a21*b11 + a22*b21 + a23*b31 + a24*b41;
    this.a22 = a21*b12 + a22*b22 + a23*b32 + a24*b42;
    this.a23 = a21*b13 + a22*b23 + a23*b33 + a24*b43;
    this.a24 = a21*b14 + a22*b24 + a23*b34 + a24*b44;
    this.a31 = a31*b11 + a32*b21 + a33*b31 + a34*b41;
    this.a32 = a31*b12 + a32*b22 + a33*b32 + a34*b42;
    this.a33 = a31*b13 + a32*b23 + a33*b33 + a34*b43;
    this.a34 = a31*b14 + a32*b24 + a33*b34 + a34*b44;
    this.a41 = a41*b11 + a42*b21 + a43*b31 + a44*b41;
    this.a42 = a41*b12 + a42*b22 + a43*b32 + a44*b42;
    this.a43 = a41*b13 + a42*b23 + a43*b33 + a44*b43;
    this.a44 = a41*b14 + a42*b24 + a43*b34 + a44*b44;

    return this;
  };

  // Matrix multiply this = this * b
  Mat4.prototype.mul = function(b) {
    return this.mul2(this, b);
  };

  // Multiply the current matrix by 16 elements that would compose a Mat4
  // object, but saving on creating the object.  this = this * b.
  // The elements are specific in row major order.  TODO(deanm): mul4x4c.
  // TODO(deanm): It's a shame to duplicate the multiplication code.
  Mat4.prototype.mul4x4r = function(b11, b12, b13, b14, b21, b22, b23, b24,
                                    b31, b32, b33, b34, b41, b42, b43, b44) {
    var a11 = this.a11, a12 = this.a12, a13 = this.a13, a14 = this.a14,
        a21 = this.a21, a22 = this.a22, a23 = this.a23, a24 = this.a24,
        a31 = this.a31, a32 = this.a32, a33 = this.a33, a34 = this.a34,
        a41 = this.a41, a42 = this.a42, a43 = this.a43, a44 = this.a44;

    this.a11 = a11*b11 + a12*b21 + a13*b31 + a14*b41;
    this.a12 = a11*b12 + a12*b22 + a13*b32 + a14*b42;
    this.a13 = a11*b13 + a12*b23 + a13*b33 + a14*b43;
    this.a14 = a11*b14 + a12*b24 + a13*b34 + a14*b44;
    this.a21 = a21*b11 + a22*b21 + a23*b31 + a24*b41;
    this.a22 = a21*b12 + a22*b22 + a23*b32 + a24*b42;
    this.a23 = a21*b13 + a22*b23 + a23*b33 + a24*b43;
    this.a24 = a21*b14 + a22*b24 + a23*b34 + a24*b44;
    this.a31 = a31*b11 + a32*b21 + a33*b31 + a34*b41;
    this.a32 = a31*b12 + a32*b22 + a33*b32 + a34*b42;
    this.a33 = a31*b13 + a32*b23 + a33*b33 + a34*b43;
    this.a34 = a31*b14 + a32*b24 + a33*b34 + a34*b44;
    this.a41 = a41*b11 + a42*b21 + a43*b31 + a44*b41;
    this.a42 = a41*b12 + a42*b22 + a43*b32 + a44*b42;
    this.a43 = a41*b13 + a42*b23 + a43*b33 + a44*b43;
    this.a44 = a41*b14 + a42*b24 + a43*b34 + a44*b44;

    return this;
  };

  // TODO(deanm): Some sort of mat3x3.  There are two ways you could do it
  // though, just multiplying the 3x3 portions of the 4x4 matrix, or doing a
  // 4x4 multiply with the last row/column implied to be 0, 0, 0, 1.  This
  // keeps true to the original matrix even if it's last row is not 0, 0, 0, 1.

  // IN RADIANS, not in degrees like OpenGL.  Rotate about x, y, z.
  // The caller must supply a x, y, z as a unit vector.
  Mat4.prototype.rotate = function(theta, x, y, z) {
    // http://www.cs.rutgers.edu/~decarlo/428/gl_man/rotate.html
    var s = Math.sin(theta);
    var c = Math.cos(theta);
    this.mul4x4r(
        x*x*(1-c)+c, x*y*(1-c)-z*s, x*z*(1-c)+y*s, 0,
      y*x*(1-c)+z*s,   y*y*(1-c)+c, y*z*(1-c)-x*s, 0,
      x*z*(1-c)-y*s, y*z*(1-c)+x*s,   z*z*(1-c)+c, 0,
                  0,             0,             0, 1);

    return this;
  };

  // Multiply by a translation of x, y, and z.
  Mat4.prototype.translate = function(dx, dy, dz) {
    // TODO(deanm): Special case the multiply since most goes unchanged.
    this.mul4x4r(1, 0, 0, dx,
                 0, 1, 0, dy,
                 0, 0, 1, dz,
                 0, 0, 0,  1);

    return this;
  };

  // Multiply by a scale of x, y, and z.
  Mat4.prototype.scale = function(sx, sy, sz) {
    // TODO(deanm): Special case the multiply since most goes unchanged.
    this.mul4x4r(sx,  0,  0, 0,
                  0, sy,  0, 0,
                  0,  0, sz, 0,
                  0,  0,  0, 1);

    return this;
  };

  // Multiply by a look at matrix, computed from the eye, center, and up points.
  Mat4.prototype.lookAt = function(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    var z = (new Vec3(ex - cx, ey - cy, ez - cz)).normalize();
    var x = (new Vec3(ux, uy, uz)).cross(z).normalize();
    var y = z.dup().cross(x).normalize();
    // The new axis basis is formed as row vectors since we are transforming
    // the coordinate system (alias not alibi).
    this.mul4x4r(x.x, x.y, x.z, 0,
                 y.x, y.y, y.z, 0,
                 z.x, z.y, z.z, 0,
                   0,   0,   0, 1);
    this.translate(-ex, -ey, -ez);

    return this;
  };

  // Multiply by a frustum matrix computed from left, right, bottom, top,
  // near, and far.
  Mat4.prototype.frustum = function(l, r, b, t, n, f) {
    this.mul4x4r(
        (n+n)/(r-l),           0, (r+l)/(r-l),             0,
                  0, (n+n)/(t-b), (t+b)/(t-b),             0,
                  0,           0, (f+n)/(n-f), (2*f*n)/(n-f),
                  0,           0,          -1,             0);

    return this;
  };

  // Multiply by a perspective matrix, computed from the field of view, aspect
  // ratio, and the z near and far planes.
  Mat4.prototype.perspective = function(fovy, aspect, znear, zfar) {
    // This could also be done reusing the frustum calculation:
    // var ymax = znear * Math.tan(fovy * kPI / 360.0);
    // var ymin = -ymax;
    //
    // var xmin = ymin * aspect;
    // var xmax = ymax * aspect;
    //
    // return makeFrustumAffine(xmin, xmax, ymin, ymax, znear, zfar);

    var f = 1.0 / Math.tan(fovy * Math.PI / 360.0);
    this.mul4x4r(
        f/aspect, 0,                         0,                         0,
               0, f,                         0,                         0,
               0, 0, (zfar+znear)/(znear-zfar), 2*znear*zfar/(znear-zfar),
               0, 0,                        -1,                         0);

    return this;
  };

  // Multiply by a orthographic matrix, computed from the clipping planes.
  Mat4.prototype.ortho = function(l, r, b, t, n, f) {
    this.mul4x4r(2/(r-l),        0,        0,  (r+l)/(l-r),
                       0,  2/(t-b),        0,  (t+b)/(b-t),
                       0,        0,  2/(n-f),  (f+n)/(n-f),
                       0,        0,        0,            1);

    return this;
  };

  // Invert the matrix.  The matrix must be invertable.
  Mat4.prototype.invert = function() {
    // Based on the math at:
    //   http://www.geometrictools.com/LibMathematics/Algebra/Wm5Matrix4.inl
    var  x0 = this.a11,  x1 = this.a12,  x2 = this.a13,  x3 = this.a14,
         x4 = this.a21,  x5 = this.a22,  x6 = this.a23,  x7 = this.a24,
         x8 = this.a31,  x9 = this.a32, x10 = this.a33, x11 = this.a34,
        x12 = this.a41, x13 = this.a42, x14 = this.a43, x15 = this.a44;

    var a0 = x0*x5 - x1*x4,
        a1 = x0*x6 - x2*x4,
        a2 = x0*x7 - x3*x4,
        a3 = x1*x6 - x2*x5,
        a4 = x1*x7 - x3*x5,
        a5 = x2*x7 - x3*x6,
        b0 = x8*x13 - x9*x12,
        b1 = x8*x14 - x10*x12,
        b2 = x8*x15 - x11*x12,
        b3 = x9*x14 - x10*x13,
        b4 = x9*x15 - x11*x13,
        b5 = x10*x15 - x11*x14;

    // TODO(deanm): These terms aren't reused, so get rid of the temporaries.
    var invdet = 1 / (a0*b5 - a1*b4 + a2*b3 + a3*b2 - a4*b1 + a5*b0);

    this.a11 = (+ x5*b5 - x6*b4 + x7*b3) * invdet;
    this.a12 = (- x1*b5 + x2*b4 - x3*b3) * invdet;
    this.a13 = (+ x13*a5 - x14*a4 + x15*a3) * invdet;
    this.a14 = (- x9*a5 + x10*a4 - x11*a3) * invdet;
    this.a21 = (- x4*b5 + x6*b2 - x7*b1) * invdet;
    this.a22 = (+ x0*b5 - x2*b2 + x3*b1) * invdet;
    this.a23 = (- x12*a5 + x14*a2 - x15*a1) * invdet;
    this.a24 = (+ x8*a5 - x10*a2 + x11*a1) * invdet;
    this.a31 = (+ x4*b4 - x5*b2 + x7*b0) * invdet;
    this.a32 = (- x0*b4 + x1*b2 - x3*b0) * invdet;
    this.a33 = (+ x12*a4 - x13*a2 + x15*a0) * invdet;
    this.a34 = (- x8*a4 + x9*a2 - x11*a0) * invdet;
    this.a41 = (- x4*b3 + x5*b1 - x6*b0) * invdet;
    this.a42 = (+ x0*b3 - x1*b1 + x2*b0) * invdet;
    this.a43 = (- x12*a3 + x13*a1 - x14*a0) * invdet;
    this.a44 = (+ x8*a3 - x9*a1 + x10*a0) * invdet;

    return this;
  };

  // Transpose the matrix, rows become columns and columns become rows.
  Mat4.prototype.transpose = function() {
    var a11 = this.a11, a12 = this.a12, a13 = this.a13, a14 = this.a14,
        a21 = this.a21, a22 = this.a22, a23 = this.a23, a24 = this.a24,
        a31 = this.a31, a32 = this.a32, a33 = this.a33, a34 = this.a34,
        a41 = this.a41, a42 = this.a42, a43 = this.a43, a44 = this.a44;

    this.a11 = a11; this.a12 = a21; this.a13 = a31; this.a14 = a41;
    this.a21 = a12; this.a22 = a22; this.a23 = a32; this.a24 = a42;
    this.a31 = a13; this.a32 = a23; this.a33 = a33; this.a34 = a43;
    this.a41 = a14; this.a42 = a24; this.a43 = a34; this.a44 = a44;

    return this;
  };

  // Multiply Vec3 |v| by the current matrix, returning a Vec3 of this * v.
  Mat4.prototype.mulVec3 = function(v) {
    var x = v.x, y = v.y, z = v.z;
    return new Vec3(this.a14 + this.a11*x + this.a12*y + this.a13*z,
                    this.a24 + this.a21*x + this.a22*y + this.a23*z,
                    this.a34 + this.a31*x + this.a32*y + this.a33*z);
  };

  // Multiply Vec4 |v| by the current matrix, returning a Vec4 of this * v.
  Mat4.prototype.mulVec4 = function(v) {
    var x = v.x, y = v.y, z = v.z, w = v.w;
    return new Vec4(this.a14*w + this.a11*x + this.a12*y + this.a13*z,
                    this.a24*w + this.a21*x + this.a22*y + this.a23*z,
                    this.a34*w + this.a31*x + this.a32*y + this.a33*z,
                    this.a44*w + this.a41*x + this.a42*y + this.a43*z);
  };

  Mat4.prototype.dup = function() {
    var m = new Mat4();  // TODO(deanm): This could be better.
    m.set4x4r(this.a11, this.a12, this.a13, this.a14,
              this.a21, this.a22, this.a23, this.a24,
              this.a31, this.a32, this.a33, this.a34,
              this.a41, this.a42, this.a43, this.a44);
    return m;
  };

  Mat4.prototype.toFloat32Array = function() {
    return new Float32Array([this.a11, this.a21, this.a31, this.a41,
                             this.a12, this.a22, this.a32, this.a42,
                             this.a13, this.a23, this.a33, this.a43,
                             this.a14, this.a24, this.a34, this.a44]);
  };

  Mat4.prototype.debugString = function() {
    var s = [this.a11, this.a12, this.a13, this.a14,
             this.a21, this.a22, this.a23, this.a24,
             this.a31, this.a32, this.a33, this.a34,
             this.a41, this.a42, this.a43, this.a44];
    var row_lengths = [0, 0, 0, 0];
    for (var i = 0; i < 16; ++i) {
      s[i] += '';  // Stringify.
      var len = s[i].length;
      var row = i & 3;
      if (row_lengths[row] < len)
        row_lengths[row] = len;
    }

    var out = '';
    for (var i = 0; i < 16; ++i) {
      var len = s[i].length;
      var row_len = row_lengths[i & 3];
      var num_spaces = row_len - len;
      while (num_spaces--) out += ' ';
      out += s[i] + ((i & 3) === 3 ? '\n' : '  ');
    }

    return out;
  };

  Embr.Vec2 = Vec2;
  Embr.Vec3 = Vec3;
  Embr.Vec4 = Vec4;
  Embr.Mat4 = Mat4;

})();
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


    function cloneOptions(options){
        var result = {};
        for(var key in options){
            if(options[key] instanceof Object)
                result[key] = cloneOptions(options[key]);
            else
                result[key] = options[key];
        }
        return result;
    }

    function mergeOptions(defaults, options){
        if(options === undefined)
            return cloneOptions(defaults);
        var option, result = {};
        for(var key in defaults){
            option = (key in options) ? options[key] : defaults[key];
            if(option instanceof Object)
                result[key] = mergeOptions(defaults[key], options[key]);
            else
                result[key] = option;
        }
        return result;
    }


    return {
        glCheckErr:   glCheckErr,
        mergeOptions: mergeOptions
    }

})();
// Math and Random Utilities

Embr.rand = function(max){
    return Math.random() * max;
};

Embr.rand2 = function(min, max){
    return min + Math.random() * (max - min);
};

Embr.randSym = function(max){
    return max * 2 * Math.random() - max;
};

(function(){

    var kPI  = Embr.kPI  = Math.PI;
    var kPI2 = Embr.kPI2 = Math.PI / 2;
    var kPI4 = Embr.kPI4 = Math.PI / 4;
    var k2PI = Embr.k2PI = Math.PI * 2;

    // Random point on a sphere of radius
    Embr.randVec3 = function(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Embr.Vec3( rho * Math.cos(phi) * radius
                            , rho * Math.sin(phi) * radius
                            , costheta * radius );
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
// Simplex Noise adapted from Stefan Gustavson's 2005 paper "Simplex Noise Demystified"
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf

Embr.Noise = (function(){

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
// Vertex Buffer Object

Embr.Vbo = (function(){

    // |type| gl.POINTS, gl.TRIANGLES etc..
    // |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
    // |attributes| an array of objects in the format: [{ data: [], size: 3, location: 0 }]

    function Vbo(gl, type, usage, attributes){
        this.gl    = gl;
        this.type  = type;
        this.usage = usage;

        this.attributes = {};

        var vbo = this
        ,   loc_i = 0;
        function addAttr(name, target, data){
            var buffer = gl.createBuffer();
            gl.bindBuffer(target, buffer);
            gl.bufferData(target, data, usage);

            Embr.Util.glCheckErr(gl, "Error adding attribute '" + name + "'");

            var attr = attributes[name]
            ,   size = attr.size !== undefined ? attr.size : 1
            ,   location = attr.location;

            if(attr.location === undefined && target === gl.ARRAY_BUFFER)
                location = -1;

            vbo.attributes[name] = { buffer:   buffer
                                   , target:   target
                                   , size:     size
                                   , length:   Math.floor(data.length / size)
                                   , location: location };
        }

        for(var name in attributes){
            if(name === "index")
                addAttr(name, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(attributes[name].data));
            else
                addAttr(name, gl.ARRAY_BUFFER, new Float32Array(attributes[name].data));
        }

        // If no indices are given we fall back to glDrawArrays
        if(!this.attributes.index){
            this.length = Number.MAX_VALUE;
            for(var name in this.attributes)
                this.length = Math.min(this.length, this.attributes[name].length);
        }
    }

    Vbo.prototype.draw = function(){
        var gl = this.gl;

        for(var name in this.attributes){
            var attr = this.attributes[name];
            if(attr.target == gl.ARRAY_BUFFER && attr.location >= 0){
                gl.bindBuffer(attr.target, attr.buffer);
                gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(attr.location);
            }
        }

        var index = this.attributes.index;
        if(index){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index.buffer);
            gl.drawElements(this.type, index.length, gl.UNSIGNED_SHORT, 0);
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

    Vbo.makePlane = function(gl, x1, y1, x2, y2, loc_vtx, loc_txc){
        var positions = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
        var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
        return new Embr.Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
            position: { data: positions, size: 3 },
            texcoord: { data: texcoords, size: 2 }
        });
    }


    // Cube

    Vbo.makeCube = function(gl, sx, sy, sz, loc_vtx, loc_nrm, loc_txc){
        var positions = [ sx, sy, sz,  sx,-sy, sz,  sx,-sy,-sz,  sx, sy,-sz,  // +X
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
            position: { data: positions, size: 3 },
            normal:   { data: normals,   size: 3 },
            texcoord: { data: texcoords, size: 2 },
            index:    { data: indices }
        });
    }

    return Vbo;

})();
Embr.Program = (function(){

    var kShaderPrefix = "#ifdef GL_ES\nprecision highp float;\n#endif\n";


    function Program(gl, src_vertex, src_fragment){
        this.gl = gl;

        var sv = this.shader_vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(sv, kShaderPrefix + src_vertex);
        gl.compileShader(sv);
        if(gl.getShaderParameter(sv, gl.COMPILE_STATUS) !== true)
            throw gl.getShaderInfoLog(sv);

        var sf = this.shader_frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(sf, kShaderPrefix + src_fragment);
        gl.compileShader(sf);
        if(gl.getShaderParameter(sf, gl.COMPILE_STATUS) !== true)
            throw gl.getShaderInfoLog(sf);

        this.handle = gl.createProgram();
    }

    Program.prototype.link = function(){
        var gl     = this.gl
        ,   handle = this.handle;
        gl.attachShader(handle, this.shader_vert);
        gl.attachShader(handle, this.shader_frag);
        gl.linkProgram(handle);
        if(gl.getProgramParameter(handle, gl.LINK_STATUS) !== true)
            throw gl.getProgramInfoLog(handle);

        function makeUniformSetter(type, location){
            switch(type){
                case gl.BOOL:
                case gl.INT:
                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    return function(value){
                        gl.uniform1i(location, value);
                        return this;
                    };
                case gl.FLOAT:
                    return function(value){
                        gl.uniform1f(location, value);
                        return this;
                    };
                case gl.FLOAT_VEC2:
                    return function(v){
                        gl.uniform2f(location, v.x, v.y);
                    };
                case gl.FLOAT_VEC3:
                    return function(v){
                        gl.uniform3f(location, v.x, v.y, v.z);
                    };
                case gl.FLOAT_VEC4:
                    return function(v){
                        gl.uniform4f(location, v.x, v.y, v.z, v.w);
                    };
                case gl.FLOAT_MAT4:
                    return function(mat4){
                        gl.uniformMatrix4fv(location, false, mat4.toFloat32Array());
                    };
            }
            return function(){
                throw "Unknown uniform type: " + type;
            };
        }

        this.uniforms  = {};
        this.locations = {};

        var nu = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
        for(var i = 0; i < nu; ++i){
            var info     = gl.getActiveUniform(handle, i);
            var location = gl.getUniformLocation(handle, info.name);
            this.uniforms[info.name] = makeUniformSetter(info.type, location);
            this.locations[info.name] = location;
        }

        var na = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
        for(var i = 0; i < na; ++i){
            var info     = gl.getActiveAttrib(handle, i);
            var location = gl.getAttribLocation(handle, info.name);
            this.locations[info.name] = location;
        }
    };

    Program.prototype.use = function(){
        this.gl.useProgram(this.handle);
    };

    Program.prototype.useUniforms = function(obj){
        this.use();
        var uniforms = this.uniforms;
        for(var u in obj){
            uniforms[u](obj[u]);
        }
    };

    Program.prototype.dispose = function(){
        this.gl.deleteShader(this.shader_vert);
        this.gl.deleteShader(this.shader_frag);
        this.gl.deleteProgram(this.handle);
    };


    return Program;

})();
Embr.Material = (function(){

    function Material(gl, src_vertex, src_fragment, options){
        if(options && options.flags){
            var src_prefix = "";
            for(var o in options.flags){
                if(options.flags[o])
                    src_prefix += "#define " + o + "\n";
            }
            src_vertex   = src_prefix + src_vertex;
            src_fragment = src_prefix + src_fragment;
        }

        Embr.Program.call(this, gl, src_vertex, src_fragment);
        this.link();

        this.attribute_locations = {};
        if(options && options.attributes){
            var attr;
            for(var a in options.attributes){
                attr = options.attributes[a];
                if(attr in this.locations)
                    this.attribute_locations[a] = this.locations[attr];
            }
        }
    }

    Material.prototype = Object.create(Embr.Program.prototype);

    Material.prototype.assignLocations = function(vbo){
        for(var attr in vbo.attributes){
            if(attr in this.attribute_locations)
                vbo.attributes[attr].location = this.attribute_locations[attr];
            else
                vbo.attributes[attr].location = -1;
        }
    };


    return Material;

})();
Embr.ColorMaterial = (function(){

    var src_vertex = [
        "uniform mat4 modelview, projection;",

        "attribute vec3 a_position;",

        "#ifdef use_vertex_color",
            "attribute vec4 a_color;",
            "varying vec4 v_color;",
        "#endif",

        "void main(){",
            "#ifdef use_vertex_color",
                "v_color = a_color;",
            "#endif",
            "gl_Position = projection * modelview * vec4(a_position, 1.0);",
        "}"
    ].join("\n");

    var src_fragment = [
        "uniform vec4 color;",

        "#ifdef use_vertex_color",
        "varying vec4 v_color;",
        "#endif",

        "void main(){",
            "#ifdef use_vertex_color",
                "gl_FragColor = v_color * color;",
            "#else",
                "gl_FragColor = color;",
            "#endif",
        "}"
    ].join("\n");


    var default_options = {
        attributes: {
            position: "a_position",
            color:    "a_color"
        },
        flags: {
            use_vertex_color: false
        }
    };


    function ColorMaterial(gl, options){
        options = Embr.Util.mergeOptions(default_options, options);
        Embr.Material.call(this, gl, src_vertex, src_fragment, options);
    }

    ColorMaterial.prototype = Object.create(Embr.Material.prototype);


    return ColorMaterial;

})();Embr.NormalMaterial = (function(){

    var src_vertex = [
        "uniform mat4 modelview, projection;",

        "attribute vec3 a_position;",
        "attribute vec3 a_normal;",

        "varying vec4 v_color;",

        "void main(){",
            "vec4 normal = modelview * vec4(a_normal, 0.0);",
            "v_color = vec4((normal.xyz + 1.0) * 0.5, 1.0);",
            "gl_Position = projection * modelview * vec4(a_position, 1.0);",
        "}"
    ].join("\n");

    var src_fragment = [
        "varying vec4 v_color;",

        "void main(){",
            "gl_FragColor = v_color;",
        "}"
    ].join("\n");


    var default_options = {
        attributes: {
            position: "a_position",
            normal:   "a_normal"
        }
    };


    function NormalMaterial(gl, options){
        options = Embr.Util.mergeOptions(default_options, options);
        Embr.Material.call(this, gl, src_vertex, src_fragment, options);
    }

    NormalMaterial.prototype = Object.create(Embr.Material.prototype);


    return NormalMaterial;

})();
