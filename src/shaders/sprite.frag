#version 300 es

precision mediump float;

in vec2 v_texcoord;

uniform sampler2D u_image;
uniform vec4 u_color;

out vec4 fragColor;

void main() {
    fragColor = u_color * texture(u_image, v_texcoord);
}