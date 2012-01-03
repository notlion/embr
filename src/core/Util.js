define(function(){

    "use strict";

    var gl_enums = null;

    function glCheckErr(gl, msg){
        var err, errs = [];
        while((err = gl.getError()) !== gl.NO_ERROR)
            errs.push(err);
        if(errs.length > 0){
            if(gl_enums === null){
                gl_enums = {};
                for(var name in gl){
                    if(typeof gl[name] == 'number')
                        gl_enums[gl[name]] = name;
                }
            }
            throw msg + " (" + errs.map(function(err){
                return gl_enums[err];
            }).join(", ") + ")";
        }
    }

    function glWrapContextWithErrorChecks(gl){
        var key, property, gl_wrapped = {};
        for(key in gl){
            property = gl[key];
            if(typeof(property) === "function"){
                gl_wrapped[key] = (function(key, func){
                    return function(){
                        var result = func.apply(gl, arguments);
                        glCheckErr(gl, "GL Error in " + key);
                        return result;
                    };
                })(key, property);
            }
            else
                gl_wrapped[key] = property;
        }
        return gl_wrapped;
    }

    function extend(parent, child){
        for(var key in parent){
            if(parent.hasOwnProperty(key))
                child[key] = parent[key];
        }
        function ctor(){
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor;
        return child;
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
        glCheckErr: glCheckErr,
        glWrapContextWithErrorChecks: glWrapContextWithErrorChecks,
        extend: extend,
        mergeOptions: mergeOptions
    };

});
