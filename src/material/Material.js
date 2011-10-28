define([

    "core/Util",
    "core/Program"

], function(Util, Program){

    "use strict";

    function Material(gl, src_vertex, src_fragment, options){
        if(!src_fragment)
            src_fragment = src_vertex;

        if(options && options.flags){
            var src_prefix = "";
            for(var o in options.flags){
                if(options.flags[o])
                    src_prefix += "#define " + o + "\n";
            }
            src_vertex   = src_prefix + src_vertex;
            src_fragment = src_prefix + src_fragment;
        }

        Program.call(this, gl, src_vertex, src_fragment);
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
