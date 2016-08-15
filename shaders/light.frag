#version 300 es
precision mediump float;

out vec4 outColor;

const vec3 LightColor = vec3(0.1, 0.2, 0.8);

void main()
{
	outColor = vec4(LightColor, 1.0);
}