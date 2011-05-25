var Embr = (Embr !== undefined) ? Embr : {};

if(!window.requestAnimationFrame){
    window.requestAnimationFrame = (function(){
            return window.webkitRequestAnimationFrame ||
                   window.mozRequestAnimationFrame    ||
                   window.oRequestAnimationFrame      ||
                   window.msRequestAnimationFrame     ||
                   function(callback, element){
                       window.setTimeout(callback, 1000 / 60);
                   };
    })();
}

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
        obj.width  = canvas.width  = canvas.clientWidth;
        obj.height = canvas.height = canvas.clientHeight;

        gl.viewport(0, 0, obj.width, obj.height);

        var step_iterval_handle = null;
        obj.framerate = function(fps){
            if(step_iterval_handle !== null)
                clearInterval(step_iterval_handle);
            if(fps === 0)
                return;

            step_iterval_handle = setInterval(function(){
                obj._step();
            }, 1000 / fps);
        };

        if(obj.init){
            try{
                obj.init();
            }
            catch(e){
                console.error('Exception caught in init: ' + e);
            }
        }

        var frameid = 0;
        var frame_start_time = Date.now();
        var frame_dirty = true;
        obj._step = function(){
            if(obj.step){
                obj.frameid   = frameid;
                obj.frametime = (Date.now() - frame_start_time) / 1000; // Secs.

                try{
                    obj.step();
                }
                catch(e){
                    console.error('Exception caught in step: ' + e);
                }

                frame_dirty = true;
                frameid++;
            }
        };
        obj._draw = function(){
            if(obj.draw && frame_dirty){
                try{
                    obj.draw();
                }
                catch(e){
                    console.error('Exception caught in draw: ' + e);
                }

                frame_dirty = false;
            }
            window.requestAnimationFrame(obj._draw, canvas);
        };

        obj._step();
        obj._draw();

        return obj;
    }
};
