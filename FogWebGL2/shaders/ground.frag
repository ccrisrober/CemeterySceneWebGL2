#version 300 es
precision mediump float;

in vec3 outPosition;
in vec3 outNormal;
in vec2 outTexCoord;
in vec3 lp;

out vec4 outColor;

uniform vec3 viewPos;
uniform vec2 minMaxDist;
uniform int fogType;
uniform float fogDensity;
uniform vec3 LightPosition;
uniform float ambientStrength;

uniform sampler2D texSampler;

const vec3 LightColor = vec3(0.1, 0.2, 0.8);
const float gamma = 1.0/0.6;

uniform bool Rim;
uniform bool OnlyRim;

void main()
{
	vec3 color = texture(texSampler, outTexCoord).rgb;

	outColor = vec4(color, 1.0);

}