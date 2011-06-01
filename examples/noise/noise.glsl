#ifdef EM_VERTEX

uniform mat4 u_mvp_matrix;

attribute vec3 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;

void main()
{
    v_texcoord = a_texcoord;
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
}

#endif


#ifdef EM_FRAGMENT
#include "noise3D.glsl"

uniform float u_time;

varying vec2 v_texcoord;

void main()
{
    gl_FragColor = vec4(vec3(
        snoise(vec3(v_texcoord * 1.0, u_time)),
        snoise(vec3(v_texcoord * 2.0, u_time)),
        snoise(vec3(v_texcoord * 4.0, u_time))
    ), 1.0);
}

#endif