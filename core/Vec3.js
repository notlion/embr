// Vec3 adapted from Dean McNamee's PreGL
// https://github.com/deanm/pregl


function Vec3(x, y, z){
    this.x = x; this.y = y; this.z = z;
}


Vec3.prototype.set = function(x, y, z){
    this.x = x; this.y = y; this.z = z;
    return this;
}

Vec3.prototype.setVec3 = function(v){
    this.x = v.x; this.y = v.y; this.z = v.z;
    return this;
}


// Cross product, this = a x b.
Vec3.prototype.cross2 = function(a, b){
    var ax = a.x, ay = a.y, az = a.z,
        bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
}

// Cross product, this = this x b.
Vec3.prototype.cross = function(b){
    return this.cross2(this, b);
}

// Returns the dot product, this . b.
Vec3.prototype.dot = function(b){
    return this.x * b.x + this.y * b.y + this.z * b.z;
}


// Add two Vec3s, this = a + b.
Vec3.prototype.add2 = function(a, b){
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;
}

Vec3.prototype.added2 = function(a, b){
    return new Vec3(a.x + b.x,
                    a.y + b.y,
                    a.z + b.z);
}

// Add a Vec3, this = this + b.
Vec3.prototype.add = function(b){
    return this.add2(this, b);
}

Vec3.prototype.added = function(b){
    return this.added2(this, b);
}


// Subtract two Vec3s, this = a - b.
Vec3.prototype.sub2 = function(a, b){
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;
}

Vec3.prototype.subbed2 = function(a, b){
    return new Vec3(a.x - b.x,
                    a.y - b.y,
                    a.z - b.z);
}

// Subtract another Vec3, this = this - b.
Vec3.prototype.sub = function(b){
    return this.sub2(this, b);
}

Vec3.prototype.subbed = function(b){
    return this.subbed2(this, b);
}


// Multiply two Vec3s, this = a * b.
Vec3.prototype.mult2 = function(a, b){
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;
}

Vec3.prototype.multed2 = function(a, b){
    return new Vec3(a.x * b.x,
                    a.y * b.y,
                    a.z * b.z);
}

// Multiply by another Vec3, this = this * b.
Vec3.prototype.mult = function(b){
    return this.mult2(this, b);
}

Vec3.prototype.multed = function(b){
    return this.multed2(this, b);
}


// Multiply by a scalar.
Vec3.prototype.scale = function(s){
    this.x *= s; this.y *= s; this.z *= s;

    return this;
}

Vec3.prototype.scaled = function(s){
    return new Vec3(this.x * s, this.y * s, this.z * s);
}


// Interpolate between this and another Vec3 |b|, based on |t|.
Vec3.prototype.lerp = function(b, t){
    this.x = this.x + (b.x-this.x)*t;
    this.y = this.y + (b.y-this.y)*t;
    this.z = this.z + (b.z-this.z)*t;

    return this;
}

Vec3.prototype.lerped = function(b, t){
    return new Vec3(this.x + (b.x-this.x)*t,
                    this.y + (b.y-this.y)*t,
                    this.z + (b.z-this.z)*t);
}


// Magnitude (length).
Vec3.prototype.length = function(){
    var x = this.x, y = this.y, z = this.z;
    return Math.sqrt(x*x + y*y + z*z);
}

// Magnitude squared.
Vec3.prototype.lengthSquared = function(){
    var x = this.x, y = this.y, z = this.z;
    return x*x + y*y + z*z;
}

// Normalize, scaling so the magnitude is 1.  Invalid for a zero vector.
Vec3.prototype.normalize = function(){
    return this.scale(1/this.length());
}

Vec3.prototype.normalized = function(){
    return this.dup().normalize();
}


Vec3.prototype.dup = function(){
    return new Vec3(this.x, this.y, this.z);
}


Vec3.prototype.debugString = function(){
    return 'x: ' + this.x + ' y: ' + this.y + ' z: ' + this.z;
}


exports.Vec3 = Vec3
