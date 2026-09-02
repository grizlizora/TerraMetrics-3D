attribute float size;
attribute float phase;
attribute vec3 customColor;
varying vec3 vColor;
varying float vAlpha;
uniform float time;
uniform float atmosphere;

void main() {
  vColor = customColor;
  
  // Dynamic twinkle scintillation
  float twinkle = sin(time * 2.2 + phase) * 0.35 + 0.65;
  float atmos = atmosphere > 0.001 ? atmosphere : 1.0;
  vAlpha = twinkle * atmos;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (1.0 + 0.25 * sin(time * 1.8 + phase));
  gl_Position = projectionMatrix * mvPosition;
}
