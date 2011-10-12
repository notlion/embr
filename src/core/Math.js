// Math and Random Utilities

Embr.rand = function(max){
    return Math.random() * max;
};

Embr.rand2 = function(min, max){
    return min + Math.random() * (max - min);
};

Embr.randSym = function(max){
    return max * 2 * Math.random() - max;
};

Embr.lerp = function(min, max, t){
    return min + (max - min) * t;
};

(function(){

    var kPI  = Embr.kPI  = Math.PI;
    var kPI2 = Embr.kPI2 = Math.PI / 2;
    var kPI4 = Embr.kPI4 = Math.PI / 4;
    var k2PI = Embr.k2PI = Math.PI * 2;

    // Random point on a sphere
    Embr.randVec3 = function(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Embr.Vec3( rho * Math.cos(phi) * radius
                            , rho * Math.sin(phi) * radius
                            , costheta * radius );
    };

})();

// Matrix Utilities

// Parallel Transport Frame
// Expects tangents to be pre-normalized

Embr.ptFirstFrame = function(first_pnt, second_pnt, first_tan){
    var n = first_tan.dup().cross(second_pnt.subbed(first_pnt));
    if(n.lengthSquared() === 0){
        var atx = Math.abs(first_tan.x);
        var aty = Math.abs(first_tan.y);
        var atz = Math.abs(first_tan.z);
        if(atz < atx && atz < aty)
            n = first_tan.dup().cross(new Embr.Vec3(0, 0, first_tan.z));
        else if(aty > atx && aty > atz)
            n = first_tan.dup().cross(new Embr.Vec3(0, first_tan.y, 0));
        else
            n = first_tan.dup().cross(new Embr.Vec3(first_tan.x, 0, 0));
    }
    n.normalize();

    var b = first_tan.dup().cross(n);

    return new Embr.Mat4().set4x4r(
        b.x, n.x, first_tan.x, first_pnt.x,
        b.y, n.y, first_tan.y, first_pnt.y,
        b.z, n.z, first_tan.z, first_pnt.z,
          0,   0,           0,           1
    );
};

Embr.ptNextFrame = function(prev_mtx, prev_pnt, current_pnt, prev_tan, current_tan){
    var theta = Math.acos(prev_tan.dot(current_tan));
    var axis = prev_tan.dup().cross(current_tan);

    if(theta !== 0 && axis.lengthSquared() !== 0){
        axis.normalize();
        return new Embr.Mat4()
            .translate(current_pnt.x, current_pnt.y, current_pnt.z)
            .rotate(theta, axis.x, axis.y, axis.z)
            .translate(-prev_pnt.x, -prev_pnt.y, -prev_pnt.z)
            .mul(prev_mtx);
    }

    return new Embr.Mat4()
        .translate(current_pnt.x - prev_pnt.x, current_pnt.y - prev_pnt.y, current_pnt.z - prev_pnt.z)
        .mul(prev_mtx);
};
