Embr.Material = (function(){

    function Material(gl, src_vertex, src_fragment){
        Embr.Program.call(this, gl, src_vertex, src_fragment);
        this.link();
    }

    Material.prototype = Object.create(Embr.Program.prototype);

    Material.prototype.assignLocations = function(vbo){
        for(var attr in this.attribute_locations){
            if(attr in vbo.attributes)
                vbo.attributes[attr].location = this.attribute_locations[attr];
        }
    };


    return Material;

})();
