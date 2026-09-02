import * as THREE from 'three';

/**
 * Planet Atmosphere Fresnel Glow Shader with Directional Solar Terminator
 * Source: src/space/shaders/atmosphere.vert.glsl, atmosphere.frag.glsl
 */
export const AtmosphereShader = {
  uniforms: {
    color: { value: new THREE.Color(0x66aaff) },
    glowIntensity: { value: 1.6 },
    fresnelPower: { value: 2.2 },
    sunPosition: { value: new THREE.Vector3(0, 0, 0) },
  },
  vertexShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vViewPosition = cameraPosition - worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */ `
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
  `,
};

/**
 * Sun Surface Plasma Shader with Photorealistic Granulation & Realistic Limb Darkening
 * Source: src/space/shaders/sun_surface.vert.glsl, sun_surface.frag.glsl
 */
export const SunSurfaceShader = {
  uniforms: {
    map: { value: null as THREE.Texture | null },
    time: { value: 0.0 },
    sunCore: { value: new THREE.Color(1.0, 0.98, 0.82) }, // Luminous light golden-yellow radiance
    sunMid: { value: new THREE.Color(1.0, 0.88, 0.38) }, // Rich solar golden-yellow photosphere
    sunLimb: { value: new THREE.Color(1.0, 0.78, 0.25) }, // Warm golden limb (never crimson/red)
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPos.xyz);
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */ `
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
  `,
};

/**
 * Sun Inner Corona Glow Shader (Luminous Golden Atmosphere Flare)
 * Source: src/space/shaders/sun_glow.vert.glsl, sun_glow.frag.glsl
 */
export const SunGlowShader = {
  uniforms: {
    color: { value: new THREE.Color(1.0, 0.88, 0.40) },
    intensity: { value: 1.6 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
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
  `,
};

/**
 * Sun Outer Diffuse Corona Shader (Wide Soft Lens Flare & Atmospheric Halo)
 * Source: src/space/shaders/sun_outer_glow.vert.glsl, sun_outer_glow.frag.glsl
 */
export const SunOuterGlowShader = {
  uniforms: {
    color: { value: new THREE.Color(1.0, 0.80, 0.35) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      float dist = distance(vUv, vec2(0.5));
      float glow = exp(-dist * 3.5);
      float softEdge = smoothstep(0.5, 0.0, dist);
      gl_FragColor = vec4(color, glow * softEdge * 0.50);
    }
  `,
};

/**
 * Starfield Shader with Dynamic Twinkling & Atmospheric Scintillation
 * Source: src/space/shaders/starfield.vert.glsl, starfield.frag.glsl
 */
export const StarfieldShader = {
  uniforms: {
    time: { value: 0.0 },
    atmosphere: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
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
  `,
  fragmentShader: /* glsl */ `
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
  `,
};
