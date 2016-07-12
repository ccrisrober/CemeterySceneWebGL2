#version 300 es
precision mediump float;
/**
layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 texCoord;
/**/
in vec3 position;
in vec3 normal;
in vec2 texCoord;

uniform mat4 proj;
uniform mat4 view;
uniform mat4 model;

uniform vec3 offset;

out vec3 outPosition;
out vec3 outNormal;
out vec2 outTexCoord;

void main()
{
	vec3 posi = position + offset;
	mat3 normalMatrix = mat3(transpose(inverse(model)));
	outNormal = normalMatrix * normal;
	outPosition = vec3(view * model * vec4(posi, 1.0));
	outTexCoord = texCoord;
    gl_Position = proj * view * model * vec4(posi, 1.0);
}  