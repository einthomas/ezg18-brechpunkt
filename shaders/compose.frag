#version 330 core

uniform sampler2D dofTex;
uniform sampler2D bloomTex;

in vec2 texCoord;

out vec4 color;

void main() {
    vec3 inColor = mix(
        texture(dofTex, texCoord).rgb, texture(bloomTex, texCoord).rgb, 0.05f
    );

    color = vec4(pow(inColor, vec3(1.0f / 2.2f)), 1.0f);

    color = vec4(texture(dofTex, texCoord).xyz, 1.0f);

    //color = vec4(pow(texture(bloomTex, texCoord).rgb, vec3(1.0f / 2.2f)), 1.0f);
}
