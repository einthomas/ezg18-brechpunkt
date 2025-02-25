#include "Effect.h"

#include <iostream>

GLuint generateFramebuffer() {
    GLuint framebuffer;
    glGenFramebuffers(1, &framebuffer);
    return framebuffer;
}

Effect::Effect(
    const char *fragmentShaderPath, int width, int height,
    std::initializer_list<EffectInputParameter> inputs,
    std::initializer_list<EffectOutputParameter> outputs,
    GLuint framebuffer
) :
    shader("shaders/effect.vert", fragmentShaderPath),
    framebuffer(framebuffer)
{
    outputCount = static_cast<int>(outputs.size());

    if (outputs.size() > 8) {
        throw std::runtime_error("More than 8 outputs are not supported!");
    }

    if (framebuffer != 0) {
        glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);

        GLuint drawBuffers[8]{GL_NONE};

        glGenTextures(static_cast<GLsizei>(outputs.size()), outputTextures);
        glActiveTexture(GL_TEXTURE0);

        for (unsigned int i = 0; i < outputs.size(); i++) {
            auto output = *(outputs.begin() + i);

            output.textureName = outputTextures[i];

            GLint location = glGetFragDataLocation(
                shader.program, output.identifier
            );

            if (location != -1) {
                // output is used in shader
                drawBuffers[location] = GL_COLOR_ATTACHMENT0 + i;

                glBindTexture(GL_TEXTURE_2D, outputTextures[i]);

                glTexParameteri(
                    GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE
                );
                glTexParameteri(
                    GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE
                );
                glTexParameteri(
                    GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR
                );
                glTexParameteri(
                    GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR
                    );

                glTexStorage2D(
                    GL_TEXTURE_2D, 1, output.internalFormat, width, height
                );

                glFramebufferTexture2D(
                    GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0 + i,
                    GL_TEXTURE_2D, outputTextures[i], 0
                );

            } else {
                std::cout << "Unused output " << output.identifier << std::endl;
            }
        }

        glDrawBuffers(8, drawBuffers);
    }

    shader.use();

    for (unsigned int i = 0; i < inputs.size(); i++) {
        auto input = *(inputs.begin() + i);

        this->inputs.push_back({input.textureName, input.textureTarget});

        glUniform1i(
            glGetUniformLocation(shader.program, input.identifier), i
        );
    }
}

Effect::Effect(
    const char *fragmentShaderPath, int width, int height,
    std::initializer_list<EffectInputParameter> inputs,
    std::initializer_list<EffectOutputParameter> outputs
) : Effect(
    fragmentShaderPath, width, height, inputs, outputs, generateFramebuffer()
) {}

Effect::Effect(
    const char *fragmentShaderPath, int width, int height,
    std::initializer_list<EffectInputParameter> inputs, GLuint framebuffer
) : Effect(
    fragmentShaderPath, width, height, inputs, {}, framebuffer
) {}

Effect::~Effect() {
    if (framebuffer != 0) {
        glDeleteFramebuffers(1, &framebuffer);
        glDeleteTextures(outputCount, outputTextures);
    }
}

void Effect::render() {
    glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
    for (int i = 0; i < inputs.size(); i++) {
        glActiveTexture(GL_TEXTURE0 + i);
        glBindTexture(inputs[i].textureTarget, inputs[i].textureName);
    }
    shader.use();
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
