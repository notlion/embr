// Math and Random Utilities

Embr.rand = function(min, max){
    return min + Math.random() * (max - min);
};

Embr.randSym = function(max){
    return max * 2 * Math.random() - max;
};

(function(){

    var kPI  = Embr.kPI  = Math.PI;
    var kPI2 = Embr.kPI2 = Math.PI / 2;
    var kPI4 = Embr.kPI4 = Math.PI / 4;
    var k2PI = Embr.k2PI = Math.PI * 2;

    // Random point on a sphere of radius
    Embr.randVec3 = function(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Embr.Vec3( rho * Math.cos(phi) * radius
                            , rho * Math.sin(phi) * radius
                            , costheta * radius );
    };

})();
