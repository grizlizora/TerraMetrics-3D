import * as THREE from 'three';
import { SunSurfaceShader, SunGlowShader, SunOuterGlowShader } from '../../SpaceShaders.ts';
import { SUN_RADIUS } from './SolarSystemDefinitions.ts';
import type { MarkerRegistrationCallback } from '../../SpaceTypes.ts';

export class SunCoronaSystem {
  public sunMesh: THREE.Mesh | null = null;
  public sunGlow: THREE.Mesh | null = null;
  public outerGlow: THREE.Mesh | null = null;
  public sunMat: THREE.ShaderMaterial | null = null;
  public sunLight: THREE.PointLight | null = null;
  public ambientLight: THREE.AmbientLight | null = null;

  public init(
    parentGroup: THREE.Group,
    registerMarker: MarkerRegistrationCallback,
    textureLoader: THREE.TextureLoader
  ) {
    // 1. Lighting
    this.ambientLight = new THREE.AmbientLight(0x4466aa, 0.05);
    parentGroup.add(this.ambientLight);

    this.sunLight = new THREE.PointLight(0xfff5e6, 1.8, 0, 0);
    this.sunLight.castShadow = false;
    parentGroup.add(this.sunLight);

    // 2. Sun Photosphere
    const sunGeom = new THREE.SphereGeometry(SUN_RADIUS, 32, 32);
    const tex = textureLoader.load('/assets/textures/sun.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    this.sunMat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: tex },
        time: { value: 0.0 },
        sunCore: { value: new THREE.Color(1.0, 0.98, 0.82) },
        sunMid: { value: new THREE.Color(1.0, 0.88, 0.38) },
        sunLimb: { value: new THREE.Color(1.0, 0.78, 0.25) },
      },
      vertexShader: SunSurfaceShader.vertexShader,
      fragmentShader: SunSurfaceShader.fragmentShader,
      depthWrite: true,
      depthTest: true,
    });

    this.sunMesh = new THREE.Mesh(sunGeom, this.sunMat);
    this.sunMesh.renderOrder = -10;
    this.sunMesh.frustumCulled = false;
    parentGroup.add(this.sunMesh);

    const planeGeom = new THREE.PlaneGeometry(1, 1);

    // 3. Inner Corona Billboard
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(1.0, 0.85, 0.42) },
        intensity: { value: 1.3 },
      },
      vertexShader: SunGlowShader.vertexShader,
      fragmentShader: SunGlowShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.sunGlow = new THREE.Mesh(planeGeom, glowMat);
    this.sunGlow.scale.set(SUN_RADIUS * 4.0, SUN_RADIUS * 4.0, 1);
    this.sunGlow.renderOrder = -20;
    this.sunGlow.frustumCulled = false;
    parentGroup.add(this.sunGlow);

    // 4. Outer Corona Soft Halo Billboard (independent plane geometry to prevent double dispose)
    const outerPlaneGeom = new THREE.PlaneGeometry(1, 1);
    const outerGlowMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(1.0, 0.80, 0.35) },
      },
      vertexShader: SunOuterGlowShader.vertexShader,
      fragmentShader: SunOuterGlowShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.outerGlow = new THREE.Mesh(outerPlaneGeom, outerGlowMat);
    this.outerGlow.scale.set(SUN_RADIUS * 12.0, SUN_RADIUS * 12.0, 1);
    this.outerGlow.renderOrder = -30;
    this.outerGlow.frustumCulled = false;
    parentGroup.add(this.outerGlow);

    registerMarker(this.sunMesh, 'Sun', '#ffaa00', 1.0, 'basic');
  }

  public update(sunPos: THREE.Vector3, simDays: number, now: number, camera: THREE.PerspectiveCamera) {
    if (this.sunMesh) {
      this.sunMesh.position.copy(sunPos);
      this.sunMesh.rotation.y = (simDays / 25.05) * Math.PI * 2;
      if (this.sunMat && this.sunMat.uniforms?.time) {
        this.sunMat.uniforms.time.value = (now * 0.001) % 10000;
      }
    }
    if (this.sunLight) {
      this.sunLight.position.copy(sunPos);
    }
    if (this.sunGlow) {
      this.sunGlow.position.copy(sunPos);
      this.sunGlow.quaternion.copy(camera.quaternion);
      this.sunGlow.rotateZ((now * 0.0001) % (Math.PI * 2));
    }
    if (this.outerGlow) {
      this.outerGlow.position.copy(sunPos);
      this.outerGlow.quaternion.copy(camera.quaternion);
      this.outerGlow.rotateZ((-now * 0.00007) % (Math.PI * 2));
    }
  }

  public setVisible(show: boolean) {
    if (this.sunMesh) this.sunMesh.visible = show;
    if (this.sunGlow) this.sunGlow.visible = show;
    if (this.outerGlow) this.outerGlow.visible = show;
  }

  public clear() {
    this.sunMesh = null;
    this.sunGlow = null;
    this.outerGlow = null;
    this.sunMat = null;
    this.sunLight = null;
    this.ambientLight = null;
  }

  public dispose() {
    if (this.sunMesh) {
      this.sunMesh.geometry.dispose();
      if (this.sunMat) {
        if (this.sunMat.uniforms?.map?.value) {
          this.sunMat.uniforms.map.value.dispose();
        }
        this.sunMat.dispose();
      }
    }
    if (this.sunGlow) {
      this.sunGlow.geometry.dispose();
      (this.sunGlow.material as THREE.Material)?.dispose();
    }
    if (this.outerGlow) {
      this.outerGlow.geometry.dispose();
      (this.outerGlow.material as THREE.Material)?.dispose();
    }
    this.clear();
  }
}
