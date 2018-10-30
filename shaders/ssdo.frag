#version 330 core

#define M_PI 3.141592653589

const int NUM_SAMPLES = 16;
const float RADIUS = 0.5f;

uniform sampler2D gColorTex;
uniform sampler2DMS gNormalTex;
uniform sampler2DMS gWorldPosTex;
uniform sampler2D noiseTex;
uniform samplerCube environmentColor;
uniform sampler2DMS gEmissionTex;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 hemisphereSamples[64];
uniform vec2 size;

in vec2 texCoord;

out vec4 color;

void main() {
    vec3 normal = normalize(texelFetch(gNormalTex, ivec2(gl_FragCoord.xy), 0).xyz);
    vec3 worldPos = texelFetch(gWorldPosTex, ivec2(gl_FragCoord.xy), 0).xyz;

    vec2 noiseStep = size / 4.0f;
    vec3 noise = texture(noiseTex, texCoord * noiseStep).xyz;
    
    vec3 right = normalize(noise - normal * dot(noise, normal));
    vec3 forward = cross(normal, right);
    mat3 basis = mat3(right, forward, normal);

    vec3 c = vec3(0.0f);
    for (int i = 0; i < NUM_SAMPLES; i++) {
        vec3 hemisphereSample = basis * hemisphereSamples[i];
        vec3 samplePos = worldPos + hemisphereSample * RADIUS;
        
        vec4 samplePosImageSpace = projection * vec4(samplePos, 1.0f);
        samplePosImageSpace.xyz /= samplePosImageSpace.w;
        samplePosImageSpace.xyz = samplePosImageSpace.xyz * 0.5f + 0.5f;

        vec4 sampleProjected = texelFetch(gWorldPosTex, ivec2(samplePosImageSpace.xy * size), 0);
        
        float visibility = 1.0f;
        if (samplePosImageSpace.x >= 0.0f && samplePosImageSpace.x <= 1.0f &&
            samplePosImageSpace.y >= 0.0f && samplePosImageSpace.y <= 1.0f &&
            sampleProjected.w > 0.0f)
        {
            visibility = sampleProjected.z <= samplePos.z + 0.03 ? 1.0f : smoothstep(0.0f, 1.0f, abs(sampleProjected.z - worldPos.z));
        }

        vec3 sampleCubeMap = texture(
            environmentColor,
            (inverse(view) * vec4(hemisphereSample, 0.0f)).xyz
        ).rgb;

        c += sampleCubeMap * visibility;
    }

    vec3 emissionColor = texelFetch(gEmissionTex, ivec2(gl_FragCoord.xy), 0).xyz;
    vec3 diffuseColor = texture(gColorTex, texCoord).xyz;
    color = vec4((c / NUM_SAMPLES) * diffuseColor + emissionColor, 1.0f);
}
