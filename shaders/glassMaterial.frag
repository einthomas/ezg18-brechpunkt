#version 330 core

layout(location = 0) out vec4 backfaceRefractionOut;
layout(location = 1) out vec4 backfacePosOut;

uniform sampler2D ssdoTex;
uniform sampler2D gWorldPosTex;
uniform sampler2D gNormalTex;

uniform sampler2D gWorldPosRefractiveTex;
uniform sampler2D gNormalRefractiveTex;
uniform sampler2D gOppositePosTex;
uniform sampler2D gRefractionTex;

uniform sampler2D gWorldPosLayer2Tex;
uniform sampler2D gNormalLayer2Tex;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform vec2 size;

in vec2 texCoord;

void main() {
    float refractionFactor = texelFetch(gRefractionTex, ivec2(gl_FragCoord.xy), 0).x;
    if (refractionFactor > 0.0f) {
        vec3 worldPos = texelFetch(gWorldPosRefractiveTex, ivec2(gl_FragCoord.xy), 0).xyz;
        vec3 normal = texelFetch(gNormalRefractiveTex, ivec2(gl_FragCoord.xy), 0).xyz;

        vec3 refractionVector = normalize(refract(normalize(worldPos), normal, 0.67f));
        float depthLayer2 = texelFetch(gWorldPosLayer2Tex, ivec2(gl_FragCoord.xy), 0).z;
        float oppositeVertexDistance = length(
            texelFetch(gOppositePosTex, ivec2(gl_FragCoord.xy), 0).xyz - worldPos
        );

        float refractionAngle = max(dot(-normal, refractionVector), 0.0f);
        float incidentAngle = max(dot(normalize(worldPos), normal), 0.0f);
        float f = incidentAngle / refractionAngle;
        float backfaceHitDistance = mix(oppositeVertexDistance, depthLayer2, f);
        vec3 backfaceHitPoint = worldPos + backfaceHitDistance * refractionVector;

        vec4 hitPointImageSpace = projection * vec4(backfaceHitPoint, 1.0f);
        hitPointImageSpace.xyz /= hitPointImageSpace.w;
        hitPointImageSpace.xyz = hitPointImageSpace.xyz * 0.5f + 0.5f;

        vec3 backfaceNormal = texelFetch(gNormalLayer2Tex, ivec2(hitPointImageSpace.xy * size), 0).xyz;
        vec3 backfaceRefraction = normalize(refract(refractionVector, -normalize(backfaceNormal), 1.5f));

        backfaceRefractionOut = vec4(backfaceRefraction, 1.0f);
        backfacePosOut = vec4(backfaceHitPoint, 1.0f);
    } else {
        discard;
    }
}
