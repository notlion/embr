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

    return {
        glCheckErr: glCheckErr
    }

})();