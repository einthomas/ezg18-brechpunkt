#version 330 core

layout(location = 0) out vec4 colorOut;
layout(location = 1) out vec4 positionOut;
layout(location = 2) out vec4 normalOut;
layout(location = 3) out vec4 reflectionOut;

uniform sampler2D diffuseTex;
uniform sampler2D reflectionTex;
uniform sampler2D normalTex;
uniform bool useDiffuseTex;
uniform bool useNormalTex;

uniform mat4 view;
uniform mat4 model;
uniform vec3 color;

in vec3 worldPos;
in vec3 normal;
in vec2 texCoord;

void main() {
    vec3 c;
    if (useDiffuseTex) {
		c = texture(diffuseTex, texCoord).xyz;
    } else {
		c = color;
    }
    colorOut = vec4(c, 1.0f);
    
    if (useNormalTex) {
        vec3 tangent = normalize(dFdx(worldPos));
        vec3 bitangent = normalize(cross(normal, tangent)); //normalize(dFdy(worldPos));
        mat3 tbn = mat3(tangent, bitangent, normalize(normal));

        vec3 textureNormal = texture(normalTex, texCoord).xyz * 2.0 - 1.0;
        normalOut = vec4(normalize(tbn * textureNormal), 1.0f);
    } else {
        normalOut = vec4(normal, 1.0f);
    }

    positionOut = vec4(worldPos, 1.0f);
    
	reflectionOut = vec4(texture(reflectionTex, texCoord).xyz, 1.0f);
}
