var fs = require("fs");
var path = require("path");
var requirejs = require("requirejs");

exports.require = requirejs.config({
    nodeRequire: require,
    paths: {
        "embr": __dirname,
        "text": path.join(__dirname, "lib", "text")
    }
});
