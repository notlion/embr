var fs = require("fs");
var requirejs = require("requirejs");

exports.require = requirejs.config({
    nodeRequire: require,
    baseUrl: __dirname
});
