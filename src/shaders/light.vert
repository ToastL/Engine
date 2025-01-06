#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

uniform mat3 u_world;
uniform mat3 u_object;
uniform vec2 u_camera;

out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;

    gl_Position = vec4(u_world * u_object * vec3(a_position + u_camera, 1.0), 1.0);
}