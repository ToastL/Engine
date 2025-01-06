#version 300 es
precision mediump float;

in vec2 v_texcoord;

uniform sampler2D u_image;
      
out vec4 fragColor;

void main() {
    fragColor = texture(u_image, v_texcoord);
}