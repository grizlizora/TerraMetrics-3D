uniform vec3 color;
uniform float glowIntensity;
uniform float fresnelPower;
uniform vec3 sunPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(vViewPosition);
  vec3 sunDir = normalize(sunPosition - vWorldPosition);

  float fresnel = clamp(1.0 - max(0.0, dot(normal, viewDir)), 0.0, 1.0);
  float NdotL = dot(normal, sunDir);
  float sunTerm = smoothstep(-0.25, 0.25, NdotL);
  float intensity = pow(max(1e-4, fresnel), fresnelPower) * sunTerm * glowIntensity;

  gl_FragColor = vec4(color, intensity);
}
