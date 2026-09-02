import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import type { MarkerRegistrationCallback, SpaceModeType } from '../SpaceTypes.ts';
import type { EphemerisEngine } from '../physics/EphemerisEngine.ts';
import type { PlanetaryBody, MoonBody } from './solar/SolarSystemDefinitions.ts';
import { SunCoronaSystem } from './solar/SunCoronaSystem.ts';
import { MoonSystem } from './solar/MoonSystem.ts';
import { PlanetarySystem } from './solar/PlanetarySystem.ts';
import { PlanetaryMoonsSystem } from './solar/PlanetaryMoonsSystem.ts';

export type { PlanetaryBody, MoonBody };

export class SolarSystemModule {
  public group: THREE.Group;

  public sunSystem = new SunCoronaSystem();
  public moonSystem = new MoonSystem();
  public planetarySystem = new PlanetarySystem();
  public moonsSystem = new PlanetaryMoonsSystem();

  private _sunPosScratch = new THREE.Vector3();
  private _moonPosScratch = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();
  }

  // Getters and setters for 100% backward-compatibility
  public get sunMesh(): THREE.Mesh | null { return this.sunSystem.sunMesh; }
  public set sunMesh(val: THREE.Mesh | null) { this.sunSystem.sunMesh = val; }

  public get sunGlow(): THREE.Mesh | null { return this.sunSystem.sunGlow; }
  public set sunGlow(val: THREE.Mesh | null) { this.sunSystem.sunGlow = val; }

  public get outerGlow(): THREE.Mesh | null { return this.sunSystem.outerGlow; }
  public set outerGlow(val: THREE.Mesh | null) { this.sunSystem.outerGlow = val; }

  public get sunMat(): THREE.ShaderMaterial | THREE.MeshBasicMaterial | null { return this.sunSystem.sunMat; }
  public set sunMat(val: THREE.ShaderMaterial | THREE.MeshBasicMaterial | null) { this.sunSystem.sunMat = val as any; }

  public get sunLight(): THREE.PointLight | null { return this.sunSystem.sunLight; }
  public set sunLight(val: THREE.PointLight | null) { this.sunSystem.sunLight = val; }

  public get ambientLight(): THREE.AmbientLight | null { return this.sunSystem.ambientLight; }
  public set ambientLight(val: THREE.AmbientLight | null) { this.sunSystem.ambientLight = val; }

  public get moonMesh(): THREE.Mesh | null { return this.moonSystem.moonMesh; }
  public set moonMesh(val: THREE.Mesh | null) { this.moonSystem.moonMesh = val; }

  public get moonMat(): THREE.MeshStandardMaterial | null { return this.moonSystem.moonMat; }
  public set moonMat(val: THREE.MeshStandardMaterial | null) { this.moonSystem.moonMat = val; }

  public get planetaryBodies(): PlanetaryBody[] { return this.planetarySystem.planetaryBodies; }
  public get atmosphereMaterials(): THREE.ShaderMaterial[] { return this.planetarySystem.atmosphereMaterials; }

  public get jupiterMoons(): MoonBody[] { return this.moonsSystem.jupiterMoons; }
  public get saturnMoons(): MoonBody[] { return this.moonsSystem.saturnMoons; }
  public get plutoMoons(): MoonBody[] { return this.moonsSystem.plutoMoons; }

  public get jupiterMoonsGroup(): THREE.Group { return this.moonsSystem.jupiterMoonsGroup; }
  public get saturnMoonsGroup(): THREE.Group { return this.moonsSystem.saturnMoonsGroup; }
  public get plutoMoonsGroup(): THREE.Group { return this.moonsSystem.plutoMoonsGroup; }

  public create(
    registerMarker: MarkerRegistrationCallback,
    textureLoader: THREE.TextureLoader
  ) {
    this.init(registerMarker, textureLoader);
  }

  public init(
    registerMarker: MarkerRegistrationCallback,
    textureLoader: THREE.TextureLoader
  ) {
    this.sunSystem.init(this.group, registerMarker, textureLoader);
    this.moonSystem.init(this.group, registerMarker, textureLoader);
    this.planetarySystem.init(this.group, registerMarker, textureLoader);
    this.moonsSystem.init(this.group, registerMarker);
  }

  public update(
    astroTime: Astronomy.AstroTime,
    now: number,
    _dt: number,
    camera: THREE.PerspectiveCamera,
    mode: SpaceModeType,
    ephemeris: EphemerisEngine
  ) {
    if (this.group.visible === false) return;

    const simDays = ephemeris.simTimeDays;

    ephemeris.getMapboxPos('Sun', astroTime, this._sunPosScratch);
    this.sunSystem.update(this._sunPosScratch, simDays, now, camera);

    ephemeris.getMapboxPos('Moon', astroTime, this._moonPosScratch);
    this.moonSystem.update(this._moonPosScratch, astroTime, ephemeris);

    if (mode === 'advanced' || mode === 'deep') {
      this.planetarySystem.update(astroTime, simDays, camera, ephemeris, this._sunPosScratch);
      this.moonsSystem.update(
        simDays,
        this.planetarySystem.jupiterBody,
        this.planetarySystem.saturnBody,
        this.planetarySystem.plutoBody
      );
    }
  }

  public setMode(mode: SpaceModeType) {
    const isVisible = mode !== 'none';
    this.group.visible = isVisible;

    const isBasicOrHigher = mode === 'basic' || mode === 'advanced' || mode === 'deep';
    this.sunSystem.setVisible(isBasicOrHigher);
    this.moonSystem.setVisible(isBasicOrHigher);

    const showPlanets = mode === 'advanced' || mode === 'deep';
    this.planetarySystem.setVisible(showPlanets);
    this.moonsSystem.setVisible(showPlanets);
  }

  public dispose() {
    const disposeMat = (m: any) => {
      if (!m) return;
      if (m.map) m.map.dispose();
      if (m.bumpMap) m.bumpMap.dispose();
      if (m.uniforms?.map?.value) m.uniforms.map.value.dispose();
      m.dispose();
    };

    this.group.traverse((child) => {
      const mesh = child as any;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => disposeMat(m));
        } else {
          disposeMat(mesh.material);
        }
      }
    });

    this.group.clear();
    this.sunSystem.clear();
    this.moonSystem.clear();
    this.planetarySystem.clear();
    this.moonsSystem.clear();
  }
}
