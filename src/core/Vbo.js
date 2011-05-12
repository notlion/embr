// Vertex Buffer Object

Embr.Vbo = (function(){

    // |type| gl.POINTS, gl.TRIANGLES etc..
    // |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
    // |attributes| an array of objects in the format: [{ data: [], size: 3, location: 0 }]

    function Vbo(gl, type, usage, attributes){
        this.gl    = gl;
        this.type  = type;
        this.usage = usage;

        this.attributes = {};

        var vbo = this;
        function addAttr(name, target, data){
            var buffer = gl.createBuffer();
            gl.bindBuffer(target, buffer);
            gl.bufferData(target, data, usage);

            Embr.Util.glCheckErr(gl, "Error adding attribute '" + name + "'");

            var attr = attributes[name]
            ,   size = attr.size !== undefined ? attr.size : 1;

            vbo.attributes[name] = { buffer:   buffer
                                   , target:   target
                                   , size:     size
                                   , length:   Math.floor(data.length / size)
                                   , location: attr.location };
        }

        for(var name in attributes){
            var attr = attributes[name];
            if(name == "indices")
                addAttr(name, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(attr.data));
            else
                addAttr(name, gl.ARRAY_BUFFER, new Float32Array(attr.data));
        }

        // If no indices are given we fall back to glDrawArrays
        if(!this.attributes.indices){
            this.length = Number.MAX_VALUE;
            for(var name in this.attributes)
                this.length = Math.min(this.length, this.attributes[name].length);
        }
    }

    Vbo.prototype.draw = function(){
        var gl = this.gl;

        for(var name in this.attributes){
            var attr = this.attributes[name];
            if(attr.target == gl.ARRAY_BUFFER){
                gl.bindBuffer(attr.target, attr.buffer);
                gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(attr.location);
            }
        }

        var indices = this.attributes.indices;
        if(indices){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
            gl.drawElements(this.type, indices.length, gl.UNSIGNED_SHORT, 0);
        }
        else{
            gl.drawArrays(this.type, 0, this.length);
        }

        Embr.Util.glCheckErr(gl, "Error drawing Vbo");
    }

    Vbo.prototype.destroy = function(){
        var gl = this.gl;
        for(var i = attributes.length; --i >= 0;)
            gl.deleteBuffer(attributes[i])
    }


    // Plane

    Vbo.makePlane = function(gl, x1, y1, x2, y2, loc_vtx, loc_txc){
        var vertices  = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
        var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
        return new Embr.Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
            vertices:  { data: vertices,  size: 3, location: loc_vtx },
            texcoords: { data: texcoords, size: 2, location: loc_txc }
        });
    }


    // Cube

    Vbo.makeCube = function(gl, sx, sy, sz, loc_vtx, loc_nrm, loc_txc){
        var vertices = [ sx, sy, sz,  sx,-sy, sz,  sx,-sy,-sz,  sx, sy,-sz,  // +X
                         sx, sy, sz,  sx, sy,-sz, -sx, sy,-sz, -sx, sy, sz,  // +Y
                         sx, sy, sz, -sx, sy, sz, -sx,-sy, sz,  sx,-sy, sz,  // +Z
                        -sx, sy, sz, -sx, sy,-sz, -sx,-sy,-sz, -sx,-sy, sz,  // -X
                        -sx,-sy,-sz,  sx,-sy,-sz,  sx,-sy, sz, -sx,-sy, sz,  // -Y
                         sx,-sy,-sz, -sx,-sy,-sz, -sx, sy,-sz,  sx, sy,-sz]; // -Z

        var normals = [ 1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
                        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
                        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
                       -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
                        0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
                        0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1];

        var texcoords = [0,1, 1,1, 1,0, 0,0,
                         1,1, 1,0, 0,0, 0,1,
                         0,1, 1,1, 1,0, 0,0,
                         1,1, 1,0, 0,0, 0,1,
                         1,0, 0,0, 0,1, 1,1,
                         1,0, 0,0, 0,1, 1,1];

        var indices = [ 0, 1, 2, 0, 2, 3,
                        4, 5, 6, 4, 6, 7,
                        8, 9,10, 8,10,11,
                       12,13,14,12,14,15,
                       16,17,18,16,18,19,
                       20,21,22,20,22,23];

        return new Embr.Vbo(gl, gl.TRIANGLES, gl.STATIC_DRAW, {
            vertices:  { data: vertices,  size: 3, location: loc_vtx },
            normals:   { data: normals,   size: 3, location: loc_nrm },
            texcoords: { data: texcoords, size: 2, location: loc_txc },
            indices:   { data: indices }
        });
    }

    return Vbo;

})();