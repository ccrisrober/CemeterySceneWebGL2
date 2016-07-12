#version 300 es
precision mediump float;

in vec3 outPosition;
in vec3 outNormal;
in vec2 outTexCoord;

out vec4 color;

uniform vec3 viewPos;
uniform vec2 minMaxDist;
uniform int fogType;
uniform float fogDensity;

uniform sampler2D texSampler;

void main()
{
	vec3 lighting = texture(texSampler, outTexCoord).rgb;//vec3(outTexCoord, 0.0);

	if(fogType >= 0 && fogType <= 2) {
		vec3 viewDir = normalize(viewPos - outPosition);
		float dst = length(outPosition - viewPos);

		float minDist = minMaxDist.x;
		float maxDist = minMaxDist.y;
		vec3 fogColor = vec3(0.0);

		float fogFactor;
		// Linear fog
		if(fogType == 0) {
			fogFactor = (maxDist - dst) / (maxDist - minDist);
		} 
		// Exp Fog
		else if(fogType == 1) {
			fogFactor = 1.0 / exp(dst * fogDensity);
		}
		// Exp2 Fog
		else if(fogType == 2) {
			fogFactor = 1.0 / exp( (dst * fogDensity)* (dst * fogDensity));
		}
		fogFactor = clamp(fogFactor, 0.0, 1.0);
		lighting = mix(fogColor, lighting, fogFactor);
	}
    color = vec4(lighting, 1.0);
}