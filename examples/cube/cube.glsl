varying vec3 v_normal;
varying vec2 v_texcoord;


#ifdef VERTEX

uniform mat4 u_modelview, u_projection;

attribute vec3 a_position, a_normal;
attribute vec2 a_texcoord;

void main()
{
    v_texcoord = a_texcoord;
    v_normal   = ((u_modelview * vec4(a_normal, 0.0)).xyz + 1.0) * 0.5;

    gl_Position = u_projection * u_modelview * vec4(a_position, 1.0);
}

#endif


#ifdef FRAGMENT

void main()
{
    gl_FragColor = vec4(v_normal, 1.0);
}

#endif