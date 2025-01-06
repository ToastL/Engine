#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;

    gl_Position = vec4(a_position, 1.0, 1.0);
}