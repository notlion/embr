// Vec2 adapted from Dean McNamee's PreGL
// https://github.com/deanm/pregl


function Vec2(x, y) {
    this.x = x; this.y = y;
}


Vec2.prototype.set = function(x, y){
    this.x = x; this.y = y
    return this;
}

Vec2.prototype.setVec2 = function(v){
    this.x = v.x; this.y = v.y;
    return this;
}


Vec2.prototype.dot = function(b){
    return this.x * b.x + this.y * b.y;
}


Vec2.prototype.add2 = function(a, b){
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    return this;
}

Vec2.prototype.added2 = function(a, b){
    return new Vec2(a.x + b.x,
                    a.y + b.y);
}

Vec2.prototype.add = function(b){
    return this.add2(this, b);
}

Vec2.prototype.added = function(b){
    return this.added2(this, b);
}


Vec2.prototype.sub2 = function(a, b){
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    return this;
}

Vec2.prototype.subbed2 = function(a, b){
    return new Vec2(a.x - b.x,
                    a.y - b.y);
}

Vec2.prototype.sub = function(b){
    return this.sub2(this, b);
}

Vec2.prototype.subbed = function(b){
    return this.subbed2(this, b);
}


Vec2.prototype.mult2 = function(a, b){
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    return this;
}

Vec2.prototype.multed2 = function(a, b){
    return new Vec2(a.x * b.x,
                    a.y * b.y);
}

Vec2.prototype.mult = function(b){
    return this.mult2(this, b);
}

Vec2.prototype.multed = function(b){
    return this.multed2(this, b);
}

Vec2.prototype.scale = function(s){
    this.x *= s; this.y *= s;
    return this;
}

Vec2.prototype.scaled = function(s) {
    return new Vec2(this.x * s, this.y * s);
}


Vec2.prototype.lerp = function(b, t){
    this.x = this.x + (b.x-this.x)*t;
    this.y = this.y + (b.y-this.y)*t;
    return this;
}

Vec2.prototype.lerped = function(b, t){
    return new Vec2(this.x + (b.x-this.x)*t,
                    this.y + (b.y-this.y)*t);
}


Vec2.prototype.length = function(){
    var x = this.x, y = this.y;
    return Math.sqrt(x*x + y*y);
}

Vec2.prototype.lengthSquared = function(){
    var x = this.x, y = this.y;
    return x*x + y*y;
}

Vec2.prototype.normalize = function(){
    return this.scale(1 / this.length());
}

Vec2.prototype.normalized = function(){
    return this.dup().normalize();
}


Vec2.prototype.dup = function(){
    return new Vec2(this.x, this.y);
}


exports.Vec2 = Vec2
