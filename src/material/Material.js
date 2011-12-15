define([

    "embr/core/Util",
    "embr/core/Program"

], function(Util, Program){

    "use strict";

    function Material(gl, src_vert, src_frag, options){
        Program.call(this, gl);

        if(options && options.flags){
            var src_prefix = "";
            for(var o in options.flags){
                if(options.flags[o])
                    src_prefix += "#define " + o + "\n";
            }
            src_vert = src_prefix + src_vert;
            src_frag = src_prefix + src_frag;
        }

        this.compile(src_vert, src_frag);
        this.link();

        this.attribute_locations = {};
        if(options && options.attributes){
            var attr;
            for(var a in options.attributes){
                attr = options.attributes[a];
                if(attr in this.locations)
                    this.attribute_locations[a] = this.locations[attr];
            }
        }
    }

    Util.extend(Program, Material);

    Material.prototype.assignLocations = function(vbo){
        for(var attr in vbo.attributes){
            if(attr in this.attribute_locations)
                vbo.attributes[attr].location = this.attribute_locations[attr];
            else
                vbo.attributes[attr].location = -1;
        }
    };


    return Material;

});
