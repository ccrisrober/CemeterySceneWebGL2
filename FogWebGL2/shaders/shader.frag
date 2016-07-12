#version 300 es
precision mediump float;

in vec3 outPosition;
in vec3 outNormal;
in vec2 outTexCoord;

out vec4 outColor;

uniform vec3 viewPos;
uniform vec2 minMaxDist;
uniform int fogType;
uniform float fogDensity;
uniform vec3 LightPosition;
uniform float ambientStrength;

uniform sampler2D texSampler;

const vec3 LightColor = vec3(0.5, 0.5, 1.0);
const float gamma = 1.0/0.6;

void main()
{
	vec3 color = texture(texSampler, outTexCoord).rgb;//vec3(outTexCoord, 0.0);

	// Ambient factor
	vec3 ambient = ambientStrength * LightColor;
	
    // Diffuse factor
    vec3 norm = normalize(outNormal);
    vec3 lightDir = normalize(LightPosition - outPosition);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * LightColor;
    
    // Specular factor
    float specularStrength = 0.5;
    vec3 viewDir = normalize(viewPos - outPosition);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * LightColor;  

	color = (ambient + diffuse + specular) * color;

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
		color = mix(fogColor, color, fogFactor);
	}
    outColor = vec4(color, 1.0);

	//rim lighting
	float rim = 1.0 - max(dot(viewDir, outNormal), 0.0);
	rim = smoothstep(0.6, 1.0, rim);
	vec3 finalRim = LightColor * vec3(rim, rim, rim);
	outColor.rgb += finalRim;
	
	outColor.rgb = vec3(pow(outColor.r, gamma),
						pow(outColor.g, gamma),
						pow(outColor.b, gamma));
}