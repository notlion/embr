define([

    "embr/material/Material",
    "embr/material/ColorMaterial",
    "embr/material/NormalMaterial",
    "embr/material/LambertMaterial"

], function(Material, ColorMaterial, NormalMaterial, LambertMaterial){
    return {
        Material:        Material,
        ColorMaterial:   ColorMaterial,
        NormalMaterial:  NormalMaterial,
        LambertMaterial: LambertMaterial
    };
});
