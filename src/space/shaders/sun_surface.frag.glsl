uniform sampler2D map;
uniform float time;
uniform vec3 sunCore;
uniform vec3 sunMid;
uniform vec3 sunLimb;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // 1. Slow, subtle plasma convection drift
  vec2 uvDrift = vUv + vec2(time * 0.0018, time * 0.0006);
  vec4 rawTex = texture2D(map, uvDrift);

  // Rebalance baked green channel to convert reddish texture into true solar golden-yellow
  rawTex.g = pow(rawTex.g, 0.88) * 1.22;
  rawTex.r = min(1.0, rawTex.r * 1.05);

  // 2. Physical Eddington Limb Darkening
  float mu = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
  float eddington = 0.62 + 0.38 * pow(mu, 0.60);

  // 3. Smooth cubic Hermite color gradient: warm golden limb -> golden photosphere -> luminous center
  float limbToMid = smoothstep(0.0, 0.85, mu);
  float midToCore = smoothstep(0.40, 1.0, mu);

  vec3 baseGradient = mix(sunLimb, sunMid, limbToMid);
  baseGradient = mix(baseGradient, sunCore, midToCore * 0.75);

  // 4. Modulate texture details (sunspots & filaments) directly over the golden gradient
  vec3 finalPhotosphere = rawTex.rgb * baseGradient * eddington * 1.35;

  gl_FragColor = vec4(finalPhotosphere, 1.0);
}
