// Vertex Buffer Object

Embr.Vbo = (function(){

    // |type| gl.POINTS, gl.TRIANGLES etc..
    // |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
    // |attributes| an array of objects in the format: [{ data: [], size: 3 }]

    function Vbo(gl, type, usage, attributes){
        this.gl    = gl;
        this.type  = type;
        this.usage = usage;

        this.attributes = {};

        // First Pass. Create attribute buffers
        var attr, size;
        for(var name in attributes){
            attr = attributes[name];
            size = attr.size !== undefined ? attr.size : 1;

            this.attributes[name] = { buffer: gl.createBuffer()
                                    , target: attr.target !== undefined ? attr.target : (name === "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER)
                                    , size: size
                                    , length: Math.floor(attr.data.length / size)
                                    , location: attr.location !== undefined ? attr.location : -1
                                    };
        }

        this.update(attributes);

        // If no indices are given we fall back to glDrawArrays
        if(!this.attributes.index){
            this.length = Number.MAX_VALUE;
            for(var name in this.attributes)
                this.length = Math.min(this.length, this.attributes[name].length);
        }
    }

    Vbo.prototype.update = function(attributes){
        var attr, data, gl = this.gl;
        for(var name in attributes){
            if(name in this.attributes){
                attr = this.attributes[name];

                // Ensure data is a typed array
                data = attributes[name].data;
                if(attr.target === gl.ELEMENT_ARRAY_BUFFER && !(data instanceof Uint16Array))
                    data = new Uint16Array(data);
                else if(!(data instanceof Float32Array))
                    data = new Float32Array(data);

                gl.bindBuffer(attr.target, attr.buffer);
                gl.bufferData(attr.target, data, this.usage);

                Embr.Util.glCheckErr(gl, "Error updating attribute '" + name + "'");
            }
        }
    }

    Vbo.prototype.draw = function(){
        var gl = this.gl;

        for(var name in this.attributes){
            var attr = this.attributes[name];
            if(attr.target === gl.ARRAY_BUFFER && attr.location >= 0){
                gl.bindBuffer(attr.target, attr.buffer);
                gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(attr.location);
            }
        }

        var index = this.attributes.index;
        if(index){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index.buffer);
            gl.drawElements(this.type, index.length, gl.UNSIGNED_SHORT, 0);
        }
        else{
            gl.drawArrays(this.type, 0, this.length);
        }
    }

    Vbo.prototype.dispose = function(){
        var gl = this.gl;
        for(var i = attributes.length; --i >= 0;)
            gl.deleteBuffer(attributes[i])
    }


    // Plane

    Vbo.makePlane = function(gl, x1, y1, x2, y2){
        var positions = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
        var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
        return new Embr.Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
            position: { data: positions, size: 3 },
            texcoord: { data: texcoords, size: 2 }
        });
    }


    // Cube

    Vbo.makeCube = function(gl, sx, sy, sz){
        var positions = [ sx, sy, sz,  sx,-sy, sz,  sx,-sy,-sz,  sx, sy,-sz,  // +X
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
            position: { data: positions, size: 3 },
            normal:   { data: normals,   size: 3 },
            texcoord: { data: texcoords, size: 2 },
            index:    { data: indices }
        });
    }

    return Vbo;

})();
