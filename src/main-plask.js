var plask = require('plask')
,   fs    = require('fs');

var Embr = {};

// Export Embr via CommonJS (for Node.js, etc)
module.exports = Embr;


// Define Plask specific overrides

Embr.Vec2 = plask.Vec2;
Embr.Vec3 = plask.Vec3;
Embr.Vec4 = plask.Vec4;
Embr.Mat4 = plask.Mat4;
