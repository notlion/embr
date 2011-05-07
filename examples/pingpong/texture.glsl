varying vec2 v_texcoord;


#ifdef VERTEX

    uniform mat4 u_mvp_matrix;

    attribute vec3 a_position;
    attribute vec2 a_texcoord;

    void main()
    {
        v_texcoord = a_texcoord;
        gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
    }

#endif


#ifdef FRAGMENT

    uniform sampler2D u_tex;

    void main()
    {
        gl_FragColor = texture2D(u_tex, v_texcoord);
    }

#endif