import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { AtmosphereShader } from '../../SpaceShaders.ts';
import { SpaceProceduralTextures } from '../../SpaceProceduralTextures.ts';
import { PLANET_DEFINITIONS } from './SolarSystemDefinitions.ts';
import type { PlanetaryBody } from './SolarSystemDefinitions.ts';
import { PlanetaryRingsBuilder } from './PlanetaryRingsBuilder.ts';
import type { MarkerRegistrationCallback } from '../../SpaceTypes.ts';
import type { EphemerisEngine } from '../../physics/EphemerisEngine.ts';

export class PlanetarySystem {
  public planetaryBodies: PlanetaryBody[] = [];
  public atmosphereMaterials: THREE.ShaderMaterial[] = [];

  public jupiterBody?: PlanetaryBody;
  public saturnBody?: PlanetaryBody;
  public plutoBody?: PlanetaryBody;

  private _planetPosScratch = new THREE.Vector3();

  public init(
    parentGroup: THREE.Group,
    registerMarker: MarkerRegistrationCallback,
    textureLoader: THREE.TextureLoader
  ) {
    for (let i = 0; i < PLANET_DEFINITIONS.length; i++) {
      const def = PLANET_DEFINITIONS[i];
      const geom = new THREE.SphereGeometry(def.radius, 32, 32);
      let mat: THREE.Material;

      if (def.procedural) {
        // Fix: Case-insensitive procedural texture key
        const procTex = SpaceProceduralTextures.createProceduralTexture(def.name.toLowerCase());
        procTex.colorSpace = THREE.SRGBColorSpace;
        mat = new THREE.MeshStandardMaterial({
          map: procTex,
          roughness: 0.88,
          metalness: 0.05,
        });
      } else {
        const tex = textureLoader.load(def.tex!);
        tex.colorSpace = THREE.SRGBColorSpace;
        mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.75,
          metalness: 0.05,
        });
      }

      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.order = 'ZYX';
      mesh.rotation.z = (def.tilt * Math.PI) / 180;
      mesh.renderOrder = -10;
      mesh.frustumCulled = false;
      parentGroup.add(mesh);

      if (def.atmosphere) {
        const atmosGeom = new THREE.SphereGeometry(def.radius * 1.04, 32, 32);
        const atmosMat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(def.atmosphere) },
            glowIntensity: { value: 1.6 },
            fresnelPower: { value: 2.2 },
            sunPosition: { value: new THREE.Vector3(1, 0, 0) },
          },
          vertexShader: AtmosphereShader.vertexShader,
          fragmentShader: AtmosphereShader.fragmentShader,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        });
        const atmosMesh = new THREE.Mesh(atmosGeom, atmosMat);
        mesh.add(atmosMesh);
        this.atmosphereMaterials.push(atmosMat);
      }

      if (def.hasRings) {
        PlanetaryRingsBuilder.createRings(mesh, def.name, def.radius);
      }

      const body: PlanetaryBody = {
        name: def.name,
        radius: def.radius,
        color: def.color,
        tilt: def.tilt,
        rotationSpeed: def.rot,
        mesh,
        material: mat,
        orbitRadius: 0,
        minApparentSize: def.minSize,
      };

      this.planetaryBodies.push(body);
      registerMarker(mesh, def.name, def.color, 1.0, 'advanced');
    }

    this.jupiterBody = this.planetaryBodies.find((b) => b.name === 'Jupiter');
    this.saturnBody = this.planetaryBodies.find((b) => b.name === 'Saturn');
    this.plutoBody = this.planetaryBodies.find((b) => b.name === 'Pluto');
  }

  public update(
    astroTime: Astronomy.AstroTime,
    simDays: number,
    camera: THREE.PerspectiveCamera,
    ephemeris: EphemerisEngine,
    sunPos: THREE.Vector3
  ) {
    const camPos = camera.position;

    // Fast index-based loop for 120 FPS
    const atmosLen = this.atmosphereMaterials.length;
    for (let i = 0; i < atmosLen; i++) {
      this.atmosphereMaterials[i].uniforms.sunPosition.value.copy(sunPos);
    }

    const bodiesLen = this.planetaryBodies.length;
    for (let i = 0; i < bodiesLen; i++) {
      const body = this.planetaryBodies[i];
      ephemeris.getMapboxPos(body.name, astroTime, this._planetPosScratch);
      body.mesh.position.copy(this._planetPosScratch);
      body.mesh.rotation.y = (simDays / body.rotationSpeed) * Math.PI * 2;

      const dist = camPos.distanceTo(body.mesh.position);
      const targetScale = Math.max(1.0, (dist * body.minApparentSize) / (body.radius * 2400));
      body.mesh.scale.set(targetScale, targetScale, targetScale);
    }
  }

  public setVisible(show: boolean) {
    const len = this.planetaryBodies.length;
    for (let i = 0; i < len; i++) {
      this.planetaryBodies[i].mesh.visible = show;
    }
  }

  public clear() {
    this.planetaryBodies = [];
    this.atmosphereMaterials = [];
    this.jupiterBody = undefined;
    this.saturnBody = undefined;
    this.plutoBody = undefined;
  }

  public dispose() {
    for (const body of this.planetaryBodies) {
      body.mesh.geometry?.dispose();
      if (Array.isArray(body.mesh.material)) {
        body.mesh.material.forEach((m) => {
          (m as any).map?.dispose();
          m.dispose();
        });
      } else if (body.mesh.material) {
        ((body.mesh.material as any).map as THREE.Texture | undefined)?.dispose();
        body.mesh.material.dispose();
      }
      body.mesh.traverse((child) => {
        if (child !== body.mesh && (child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
    }
    for (const mat of this.atmosphereMaterials) {
      mat.dispose();
    }
    this.clear();
  }
}
