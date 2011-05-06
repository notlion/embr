#ifdef VERTEX

uniform mat4 u_mvp;

attribute vec3 a_pos;
attribute vec2 a_texc;

varying vec2 v_texc;

void main()
{
    v_texc = a_texc;
    gl_Position = u_mvp * vec4(a_pos, 1.0);
}

#endif


#ifdef FRAGMENT
#include "noise3D.glsl"

uniform float u_time;

varying vec2 v_texc;

void main()
{
    gl_FragColor = vec4(vec3(
        snoise(vec3(v_texc * 1.0, u_time)),
        snoise(vec3(v_texc * 2.0, u_time)),
        snoise(vec3(v_texc * 4.0, u_time))
    ), 1.0);
}

#endif