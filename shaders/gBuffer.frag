#version 330 core

layout(location = 0) out vec4 colorOut;
layout(location = 1) out vec4 positionOut;
layout(location = 2) out vec4 normalOut;
layout(location = 3) out vec4 reflectionOut;
layout(location = 4) out vec3 emissionOut;
layout(location = 5) out float primitiveIDOut;

struct PointLight {
    vec3 pos;
    vec3 color;
    float brightness;
    float constantTerm;
    float linearTerm;
    float quadraticTerm;
};
const int NUM_LIGHTS = 36;

uniform PointLight pointLights[NUM_LIGHTS];
uniform sampler2D diffuseTex;
uniform sampler2D reflectionTex;
uniform sampler2D normalTex;
uniform bool useDiffuseTex;
uniform bool useNormalTex;
uniform bool useReflectionTex;
uniform vec3 diffuseColor;
uniform float emissionColorBrightness;
uniform vec3 emissionColor;

uniform mat4 view;
uniform mat4 model;

in vec3 worldPos;
in vec3 normal;
in vec2 texCoord;

void main() {    
    if (useNormalTex) {
        vec3 tangent = normalize(dFdx(worldPos));
        vec3 bitangent = normalize(cross(normal, tangent)); //normalize(dFdy(worldPos));
        mat3 tbn = mat3(tangent, bitangent, normalize(normal));

        vec3 textureNormal = texture(normalTex, texCoord).xyz * 2.0 - 1.0;

        normalOut = vec4(normalize(tbn * textureNormal), 1.0f);
    } else {
        normalOut = vec4(normal, 1.0f);
    }

    vec3 emissive = vec3(0.0f);
    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec3 lightDir = pointLights[i].pos - worldPos;
        float lightDist = length(lightDir);
        float attenuation = pointLights[i].brightness / (
            pointLights[i].constantTerm +
            pointLights[i].linearTerm * lightDist +
            pointLights[i].quadraticTerm * lightDist * lightDist
        );
        emissive += max(0.0f, dot(normalOut.xyz, normalize(lightDir))) * pointLights[i].color * attenuation;
    }
    emissionOut = (emissionColor * emissionColorBrightness + emissive);
    
    vec3 diffuseColor_ = diffuseColor;
    if (useDiffuseTex) {
		diffuseColor_ = texture(diffuseTex, texCoord).xyz;
    }
    colorOut = vec4(diffuseColor_, 1.0f);

    positionOut = vec4(worldPos, 1.0f);
    
    if (useReflectionTex) {
	    reflectionOut = vec4(texture(reflectionTex, texCoord).xyz, 1.0f);
    } else {
        reflectionOut = vec4(0.0f);
    }

    primitiveIDOut = mod(gl_PrimitiveID, 256) / 255.0f;
}
