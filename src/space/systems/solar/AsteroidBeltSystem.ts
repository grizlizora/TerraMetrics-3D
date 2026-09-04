import * as THREE from 'three';
import { AU } from '../../core/SpaceConstants.ts';
import { CoordinateTransforms } from '../../core/CoordinateTransforms.ts';

interface AsteroidData {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  ascendingNode: number;
  initialMeanAnomaly: number;
  orbitalPeriodDays: number;
  rotationSpeed: number;
  scale: number;
}

export class AsteroidBeltSystem {
  public group: THREE.Group;
  public instancedMesh: THREE.InstancedMesh | null = null;
  private asteroidsData: AsteroidData[] = [];
  private count = 350;

  private static readonly SIN_EPS = 0.397777156;
  private static readonly COS_EPS = 0.917482062;
  private _eclScratch = { x: 0, y: 0, z: 0 };
  private _offsetScratch = new THREE.Vector3();

  // Zero-GC preallocated transform scratchpad
  private _matrixScratch = new THREE.Matrix4();
  private _posScratch = new THREE.Vector3();
  private _rotScratch = new THREE.Euler();
  private _quatScratch = new THREE.Quaternion();
  private _scaleScratch = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();
  }

  public init(parentGroup: THREE.Group) {
    // 1. Create perturbed irregular asteroid geometry
    const baseGeom = new THREE.DodecahedronGeometry(1.0, 1);
    const posAttr = baseGeom.attributes.position;
    const v = new THREE.Vector3();

    // Deterministic procedural vertex perturbation for craggy asteroid shape
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const noise =
        Math.sin(v.x * 5.0) * Math.cos(v.y * 5.0) * Math.sin(v.z * 5.0) * 0.22 +
        Math.sin(v.x * 11.0 + v.y * 7.0) * 0.12;
      v.multiplyScalar(1.0 + noise);
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    baseGeom.computeVertexNormals();

    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x8c827a,
      roughness: 0.92,
      metalness: 0.1,
      flatShading: true,
    });

    this.instancedMesh = new THREE.InstancedMesh(baseGeom, asteroidMat, this.count);
    this.instancedMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4.0 * AU);
    this.instancedMesh.renderOrder = -8;

    // 2. Distribute asteroids along Main Belt (2.1 AU to 3.3 AU)
    this.asteroidsData = [];
    const dummyColor = new THREE.Color();

    for (let i = 0; i < this.count; i++) {
      // Semi-major axis between 2.15 and 3.25 AU
      const a = (2.15 + Math.random() * 1.1) * AU;
      const e = 0.03 + Math.random() * 0.15; // Low to moderate eccentricity
      const inc = (Math.random() - 0.5) * 0.25; // Slight orbital inclination (rad)
      const node = Math.random() * Math.PI * 2;
      const m0 = Math.random() * Math.PI * 2;
      // Kepler's 3rd law: Period T ~ a^(1.5)
      const periodDays = Math.pow(a / AU, 1.5) * 365.25;
      const rotSpeed = 0.5 + Math.random() * 2.0;
      const scale = 0.45 + Math.random() * 0.75;

      this.asteroidsData.push({
        semiMajorAxis: a,
        eccentricity: e,
        inclination: inc,
        ascendingNode: node,
        initialMeanAnomaly: m0,
        orbitalPeriodDays: periodDays,
        rotationSpeed: rotSpeed,
        scale,
      });

      // Subtle color variations (carbonaceous, silicate, metallic)
      const tone = 0.65 + Math.random() * 0.35;
      dummyColor.setRGB(0.55 * tone, 0.52 * tone, 0.48 * tone);
      this.instancedMesh.setColorAt(i, dummyColor);
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.group.add(this.instancedMesh);
    parentGroup.add(this.group);
  }

  public update(simDays: number, sunPos: THREE.Vector3, stRad = 0) {
    if (!this.instancedMesh || !this.group.visible) return;

    for (let i = 0; i < this.count; i++) {
      const data = this.asteroidsData[i];
      // Mean anomaly at current sim time
      const meanAnomaly = data.initialMeanAnomaly + (simDays / data.orbitalPeriodDays) * Math.PI * 2;

      // Approximate eccentric anomaly
      const r = data.semiMajorAxis * (1 - data.eccentricity * Math.cos(meanAnomaly));
      const trueAnomaly = meanAnomaly + 2 * data.eccentricity * Math.sin(meanAnomaly);

      // Orbital position relative to Sun in ecliptic plane
      const orbX = r * Math.cos(trueAnomaly);
      const orbY = r * Math.sin(trueAnomaly);

      // Apply inclination and ascending node
      const cosNode = Math.cos(data.ascendingNode);
      const sinNode = Math.sin(data.ascendingNode);
      const cosInc = Math.cos(data.inclination);
      const sinInc = Math.sin(data.inclination);

      const xEcl = orbX * cosNode - orbY * sinNode * cosInc;
      const yEcl = orbX * sinNode + orbY * cosNode * cosInc;
      const zEcl = orbY * sinInc;

      // Convert heliocentric ecliptic to J2000 equatorial
      this._eclScratch.x = xEcl;
      this._eclScratch.y = yEcl * AsteroidBeltSystem.COS_EPS - zEcl * AsteroidBeltSystem.SIN_EPS;
      this._eclScratch.z = yEcl * AsteroidBeltSystem.SIN_EPS + zEcl * AsteroidBeltSystem.COS_EPS;

      // Transform J2000 Equatorial into MapLibre coordinates (inertially stable)
      CoordinateTransforms.j2000EquatorialToMapLibre(this._eclScratch, stRad, this._offsetScratch);

      this._posScratch.set(
        sunPos.x + this._offsetScratch.x,
        sunPos.y + this._offsetScratch.y,
        sunPos.z + this._offsetScratch.z
      );

      // Rotation around asteroid's own axis
      this._rotScratch.set(
        (simDays * data.rotationSpeed * 0.1) % (Math.PI * 2),
        (simDays * data.rotationSpeed * 0.2) % (Math.PI * 2),
        data.ascendingNode
      );
      this._quatScratch.setFromEuler(this._rotScratch);

      const s = data.scale;
      this._scaleScratch.set(s, s, s);

      this._matrixScratch.compose(this._posScratch, this._quatScratch, this._scaleScratch);
      this.instancedMesh.setMatrixAt(i, this._matrixScratch);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public clear() {
    if (this.instancedMesh) {
      if (this.instancedMesh.geometry) this.instancedMesh.geometry.dispose();
      if (this.instancedMesh.material) {
        if (Array.isArray(this.instancedMesh.material)) {
          this.instancedMesh.material.forEach((m) => m.dispose());
        } else {
          this.instancedMesh.material.dispose();
        }
      }
    }
    this.group.clear();
    this.instancedMesh = null;
    this.asteroidsData = [];
  }
}
