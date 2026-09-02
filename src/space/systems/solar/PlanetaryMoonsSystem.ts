import * as THREE from 'three';
import { JUPITER_MOONS_DEF } from './SolarSystemDefinitions.ts';
import type { MoonBody, PlanetaryBody } from './SolarSystemDefinitions.ts';
import type { MarkerRegistrationCallback } from '../../SpaceTypes.ts';

export class PlanetaryMoonsSystem {
  public jupiterMoonsGroup: THREE.Group = new THREE.Group();
  public saturnMoonsGroup: THREE.Group = new THREE.Group();
  public plutoMoonsGroup: THREE.Group = new THREE.Group();

  public jupiterMoons: MoonBody[] = [];
  public saturnMoons: MoonBody[] = [];
  public plutoMoons: MoonBody[] = [];

  public init(parentGroup: THREE.Group, registerMarker: MarkerRegistrationCallback) {
    this.jupiterMoonsGroup.rotation.z = (3.1 * Math.PI) / 180;
    this.saturnMoonsGroup.rotation.z = (26.7 * Math.PI) / 180;
    this.plutoMoonsGroup.rotation.z = (122.5 * Math.PI) / 180;

    parentGroup.add(this.jupiterMoonsGroup);
    parentGroup.add(this.saturnMoonsGroup);
    parentGroup.add(this.plutoMoonsGroup);

    this.createJupiterMoons(registerMarker);
    this.createSaturnMoons(registerMarker);
    this.createPlutoMoons(registerMarker);
  }

  private createJupiterMoons(registerMarker: MarkerRegistrationCallback) {
    for (let i = 0; i < JUPITER_MOONS_DEF.length; i++) {
      const m = JUPITER_MOONS_DEF[i];
      const geom = new THREE.SphereGeometry(m.radius, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(m.color),
        roughness: 0.9,
      });
      const moonMesh = new THREE.Mesh(geom, mat);
      this.jupiterMoonsGroup.add(moonMesh);

      this.jupiterMoons.push({
        name: m.name,
        radius: m.radius,
        dist: m.dist,
        period: m.period,
        mesh: moonMesh,
        startingPhase: m.phase,
      });

      registerMarker(moonMesh, m.name, m.color, 0.6, 'advanced');
    }
  }

  private createSaturnMoons(registerMarker: MarkerRegistrationCallback) {
    const geom = new THREE.SphereGeometry(605, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d4a359'),
      roughness: 0.95,
    });
    const titanMesh = new THREE.Mesh(geom, mat);
    this.saturnMoonsGroup.add(titanMesh);

    this.saturnMoons.push({
      name: 'Titan',
      radius: 605,
      dist: 48000,
      period: 15.95,
      mesh: titanMesh,
      startingPhase: Math.PI * 0.33,
    });

    registerMarker(titanMesh, 'Titan', '#d4a359', 0.65, 'advanced');
  }

  private createPlutoMoons(registerMarker: MarkerRegistrationCallback) {
    const geom = new THREE.SphereGeometry(280, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#888888'),
      roughness: 0.9,
    });
    const charonMesh = new THREE.Mesh(geom, mat);
    this.plutoMoonsGroup.add(charonMesh);

    this.plutoMoons.push({
      name: 'Charon',
      radius: 280,
      dist: 5000,
      period: 6.387,
      mesh: charonMesh,
      startingPhase: 0.0,
    });

    registerMarker(charonMesh, 'Charon', '#888888', 0.55, 'advanced');
  }

  public update(simDays: number, jupiterBody?: PlanetaryBody, saturnBody?: PlanetaryBody, plutoBody?: PlanetaryBody) {
    if (jupiterBody) this.jupiterMoonsGroup.position.copy(jupiterBody.mesh.position);
    if (saturnBody) this.saturnMoonsGroup.position.copy(saturnBody.mesh.position);
    if (plutoBody) this.plutoMoonsGroup.position.copy(plutoBody.mesh.position);

    // Fast index-based loop for 120 FPS Zero-GC
    const jLen = this.jupiterMoons.length;
    for (let i = 0; i < jLen; i++) {
      const moon = this.jupiterMoons[i];
      const moonPhase = (simDays / moon.period) * Math.PI * 2 + moon.startingPhase;
      moon.mesh.position.set(
        Math.cos(moonPhase) * moon.dist,
        0,
        Math.sin(moonPhase) * moon.dist
      );
    }

    const sLen = this.saturnMoons.length;
    for (let i = 0; i < sLen; i++) {
      const moon = this.saturnMoons[i];
      const moonPhase = (simDays / moon.period) * Math.PI * 2 + moon.startingPhase;
      moon.mesh.position.set(
        Math.cos(moonPhase) * moon.dist,
        0,
        Math.sin(moonPhase) * moon.dist
      );
    }

    const pLen = this.plutoMoons.length;
    for (let i = 0; i < pLen; i++) {
      const moon = this.plutoMoons[i];
      const moonPhase = (simDays / moon.period) * Math.PI * 2 + moon.startingPhase;
      moon.mesh.position.set(
        Math.cos(moonPhase) * moon.dist,
        0,
        Math.sin(moonPhase) * moon.dist
      );
    }
  }

  public setVisible(show: boolean) {
    this.jupiterMoonsGroup.visible = show;
    this.saturnMoonsGroup.visible = show;
    this.plutoMoonsGroup.visible = show;
  }

  public clear() {
    this.jupiterMoonsGroup.clear();
    this.saturnMoonsGroup.clear();
    this.plutoMoonsGroup.clear();
    this.jupiterMoons = [];
    this.saturnMoons = [];
    this.plutoMoons = [];
  }

  public dispose() {
    const allMoons = [...this.jupiterMoons, ...this.saturnMoons, ...this.plutoMoons];
    for (const moon of allMoons) {
      moon.mesh.geometry?.dispose();
      if (Array.isArray(moon.mesh.material)) {
        moon.mesh.material.forEach((m) => {
          (m as any).map?.dispose();
          m.dispose();
        });
      } else if (moon.mesh.material) {
        ((moon.mesh.material as any).map as THREE.Texture | undefined)?.dispose();
        moon.mesh.material.dispose();
      }
    }
    this.clear();
  }
}
