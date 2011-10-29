var names = [
    "Material",
    "ColorMaterial",
    "NormalMaterial"
];

define(names.map(function(name){
    return "embr/material/" + name;
}), function(){
    var module = {};
    for(var i = names.length; --i >= 0;)
        module[names[i]] = arguments[i];
    return module;
});
