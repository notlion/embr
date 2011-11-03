// Vertex Buffer Object

define([

    "embr/core/Util"

], function(Util){

    "use strict";

    // |type| gl.POINTS, gl.TRIANGLES etc..
    // |usage| gl.STATIC_DRAW, gl.STREAM_DRAW or gl.DYNAMIC_DRAW
    // |attributes| an array of objects in the format: [{ data: [], size: 3 }]

    function Vbo(gl, type, usage, attributes){
        this.gl    = gl;
        this.type  = type;
        this.usage = usage;

        this.attributes = {};

        if(attributes)
            this.update(attributes);
    }

    Vbo.prototype = {

        dispose: function(){
            var gl = this.gl;
            for(var i = attributes.length; --i >= 0;)
                gl.deleteBuffer(attributes[i])
        },

        update: function(attributes){
            var attr, attr_in, data, gl = this.gl;
            for(var name in attributes){
                // Create new attribute buffers
                if(!(name in this.attributes))
                    this.attributes[name] = { buffer: gl.createBuffer() };

                attr_in = attributes[name];
                attr = this.attributes[name];

                attr.target   = attr_in.target || attr.target || (name === "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER);
                attr.size     = attr_in.size   || attr.size   || 1;
                attr.location = attr_in.location !== undefined ? attr_in.location // Location can be zero which means we need
                              : attr.location    !== undefined ? attr.location       // to check for undefined vs just falsy
                              : -1;

                data = attr_in.data;
                if(data){
                    attr.length = Math.floor(data.length / attr.size);

                    // Ensure data is a typed array
                    if(attr.target === gl.ELEMENT_ARRAY_BUFFER && !(data instanceof Uint16Array))
                        data = new Uint16Array(data);
                    else if(!(data instanceof Float32Array))
                        data = new Float32Array(data);

                    // Buffer data
                    gl.bindBuffer(attr.target, attr.buffer);
                    gl.bufferData(attr.target, data, this.usage);

                    Util.glCheckErr(gl, "Error updating attribute '" + name + "'");
                }
            }

            // If no indices are given we fall back to glDrawArrays
            if(!this.attributes.index){
                // Set length to minimum length of all attributes
                this.length = Number.MAX_VALUE;
                for(var name in this.attributes)
                    this.length = Math.min(this.length, this.attributes[name].length);
            }
        },

        draw: function(material){
            var gl = this.gl;

            if(material){
                material.assignLocations(this);
                material.use();
            }

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

    };


    // Plane

    Vbo.createPlane = function(gl, x1, y1, x2, y2){
        var positions = [ x1, y1, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0 ];
        var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
        return new Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
            position: { data: positions, size: 3 },
            texcoord: { data: texcoords, size: 2 }
        });
    }


    // Box

    Vbo.createBox = function(gl, sx, sy, sz){
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

        return new Vbo(gl, gl.TRIANGLES, gl.STATIC_DRAW, {
            position: { data: positions, size: 3 },
            normal:   { data: normals,   size: 3 },
            texcoord: { data: texcoords, size: 2 },
            index:    { data: indices }
        });
    }

    return Vbo;

});
