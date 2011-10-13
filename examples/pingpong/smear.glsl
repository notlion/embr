varying vec2 v_texcoord;


#ifdef EM_VERTEX

    uniform mat4 u_mvp_matrix;

    attribute vec3 a_position;
    attribute vec2 a_texcoord;

    void main()
    {
        v_texcoord = a_texcoord;
        gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
    }

#endif


#ifdef EM_FRAGMENT

#include "noise3D.glsl"

    uniform sampler2D u_tex;

    uniform float u_time;
    uniform float u_scale;

    void main()
    {
        vec2 offset = vec2(
            snoise(vec3(v_texcoord * 3.0, u_time)) * u_scale,
            snoise(vec3(v_texcoord * 3.0 + vec2(0.0, 100.0), u_time)) * u_scale
        );

        vec4 color = texture2D(u_tex, v_texcoord + offset);
        color.rgb -= 2.0 / 255.0;

        gl_FragColor = color;
    }

#endif
