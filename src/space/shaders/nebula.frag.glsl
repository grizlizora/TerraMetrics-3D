uniform float time;
uniform vec3 coreColor;
uniform vec3 midColor;
uniform vec3 haloColor;
uniform float density;
uniform float opacity;

varying vec2 vUv;
varying vec3 vWorldPosition;

// 2D Hash function
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D Simplex-like Perlin noise
float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 4-octave Fractional Brownian Motion (fBm)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise2d(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  float dist = length(uv);

  if (dist > 1.0) {
    discard;
  }

  // Soft spherical falloff
  float radialFalloff = smoothstep(1.0, 0.0, dist);
  radialFalloff = pow(radialFalloff, 1.6);

  // Slow, cosmic convective turbulence
  vec2 coord = uv * 2.2;
  float t = time * 0.035;

  float q = fbm(coord + vec2(t * 0.2, t * 0.15));
  float r = fbm(coord + 1.2 * q + vec2(t * -0.12, t * 0.18));
  float f = fbm(coord + 1.6 * r);

  // Map turbulence to plasma density
  float plasma = clamp((f + 0.45) * 1.3, 0.0, 1.0);

  // Multi-tier chromatic composition
  vec3 col = mix(haloColor, midColor, smoothstep(0.15, 0.65, plasma));
  col = mix(col, coreColor, smoothstep(0.55, 0.95, plasma));

  // Volumetric core luminescence
  col += coreColor * pow(radialFalloff, 3.0) * 0.6;

  float alpha = plasma * radialFalloff * density * opacity;

  gl_FragColor = vec4(col, alpha);
}
