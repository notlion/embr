var Embr = (Embr !== undefined) ? Embr : {};

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
        obj.width  = canvas.width;
        obj.height = canvas.height;

        var framerate_handle = null;
        obj.framerate = function(fps){
            if(framerate_handle !== null)
                clearInterval(framerate_handle);
            if(fps === 0)
                return;

            framerate_handle = setInterval(function(){
                obj._draw();
            }, 1000 / fps);
        }

        if("init" in obj){
            try{
                obj.init();
            }
            catch(e){
                console.error('Exception caught in init: ' + e);
            }
        }

        if("draw" in obj)
            var draw = obj.draw;

        var frameid = 0;
        var frame_start_time = Date.now();
        obj._draw = function(){
            if(draw !== null){
                obj.frameid = frameid;
                obj.frametime = (Date.now() - frame_start_time) / 1000; // Secs.

                try{
                    obj.draw();
                }
                catch(e){
                    console.error('Exception caught in draw: ' + e);
                }

                frameid++;
            }
        };

        obj._draw();

        return obj;
    }
};
