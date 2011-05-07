#ifdef VERTEX

    uniform mat4 u_mvp_matrix;

    attribute vec3 a_position;

    void main()
    {
        gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
    }

#endif


#ifdef FRAGMENT

    uniform vec4 u_color;

    void main()
    {
        gl_FragColor = u_color;
    }

#endif