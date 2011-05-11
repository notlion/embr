// Math and Random Utilities

Embr.Math = (function(){

    var kPI  = Math.PI;
    var kPI2 = Math.PI / 2;
    var kPI4 = Math.PI / 4;
    var k2PI = Math.PI * 2;


    function rand(min, max){
        return min + Math.random() * (max - min);
    }

    function randSym(max){
        return max * 2 * Math.random() - max;
    }

    // Random point on a sphere of radius
    function randVec3(radius){
        var phi      = Math.random() * k2PI;
        var costheta = Math.random() * 2 - 1;

        var rho = Math.sqrt(1 - costheta * costheta);

        return new Embr.Vec3( rho * Math.cos(phi) * radius
                            , rho * Math.sin(phi) * radius
                            , costheta * radius );
    }

    return {
        kPI:  kPI,
        kPI2: kPI2,
        kPI4: kPI4,
        k2PI: k2PI,

        rand:     rand,
        randSym:  randSym,
        randVec3: randVec3
    };

})();
