varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // High-intensity central stellar core + soft radial halo (branchless for mobile TBDR GPUs)
  float edgeFade = smoothstep(0.5, 0.42, dist);
  float core = exp(-dist * 18.0);
  float halo = smoothstep(0.5, 0.02, dist);
  float alpha = (core * 0.7 + halo * 0.3) * vAlpha * edgeFade;

  gl_FragColor = vec4(vColor * (1.2 + core * 1.5), alpha);
}
