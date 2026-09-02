uniform vec3 color;
varying vec2 vUv;

void main() {
  float dist = distance(vUv, vec2(0.5));
  float glow = exp(-dist * 3.5);
  float softEdge = smoothstep(0.5, 0.0, dist);
  gl_FragColor = vec4(color, glow * softEdge * 0.50);
}
