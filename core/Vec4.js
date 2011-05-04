// Vec4 adapted from Dean McNamee's PreGL
// https://github.com/deanm/pregl


var Vec3 = require('./Vec3')


function Vec4(x, y, z, w) {
    this.x = x; this.y = y; this.z = z; this.w = w;
}


Vec4.prototype.set = function(x, y, z, w) {
    this.x = x; this.y = y; this.z = z; this.w = w;
    return this;
}

Vec4.prototype.setVec4 = function(v) {
    this.x = v.x; this.y = v.y; this.z = v.z; this.w = v.w;
    return this;
}


// Interpolate between this and another Vec4 |b|, based on |t|.
Vec4.prototype.lerp = function(b, t) {
    this.x += (b.x - this.x) * t;
    this.y += (b.y - this.y) * t;
    this.z += (b.z - this.z) * t;
    this.w += (b.w - this.w) * t;

    return this;
}


Vec4.prototype.dup = function(){
  return new Vec4(this.x, this.y, this.z, this.w);
}


Vec4.prototype.toVec3 = function(){
  return new Vec3(this.x, this.y, this.z);
}


Vec4.prototype.debugString = function(){
  return 'x: ' + this.x + ' y: ' + this.y + ' z: ' + this.z + ' w: ';
}


exports.Vec4 = Vec4
