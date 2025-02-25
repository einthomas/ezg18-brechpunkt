#version 330 core

layout(location = 0) out vec3 color;

const int NUM_SAMPLES = 16;
const float RADIUS = 0.33f;

uniform samplerCube cubemap;

in vec3 uvw;

void main() {
    vec3 stepX = normalize(cross(uvw, vec3(0, 0, 1)));
    vec3 stepY = cross(stepX, uvw);

    color = vec3(0);

    for (int x = 0; x < NUM_SAMPLES; x++) {
        for (int y = 0; y < NUM_SAMPLES; y++) {
            vec2 offset = vec2(x, y) * 2 / (NUM_SAMPLES - 1) - 1;

            color += texture(
                cubemap,
                uvw + (stepX * offset.x + stepY * offset.y) * 0.5
            ).rgb;
        }
    }

    color /= NUM_SAMPLES * NUM_SAMPLES;
}
