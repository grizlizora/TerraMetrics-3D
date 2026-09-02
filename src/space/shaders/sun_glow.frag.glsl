uniform vec3 color;
uniform float intensity;
varying vec2 vUv;

void main() {
  float dist = distance(vUv, vec2(0.5));
  float glow = exp(-dist * 5.5) * smoothstep(0.5, 0.10, dist);
  float core = exp(-dist * 18.0);
  vec3 finalColor = color * glow + vec3(1.0) * core;
  gl_FragColor = vec4(finalColor * intensity, glow * 0.80);
}
