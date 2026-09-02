import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { MOON_RADIUS } from './SolarSystemDefinitions.ts';
import type { MarkerRegistrationCallback } from '../../SpaceTypes.ts';
import type { EphemerisEngine } from '../../physics/EphemerisEngine.ts';

export class MoonSystem {
  public moonMesh: THREE.Mesh | null = null;
  public moonMat: THREE.MeshStandardMaterial | null = null;

  private static _baseMoonColor = new THREE.Color(0xffffff);
  private static _bloodMoonColor = new THREE.Color(0xff3311);
  private static _finalMoonColor = new THREE.Color();

  public init(
    parentGroup: THREE.Group,
    registerMarker: MarkerRegistrationCallback,
    textureLoader: THREE.TextureLoader
  ) {
    const moonGeom = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const moonTex = textureLoader.load('/assets/planets/moonmap1k.jpg');
    moonTex.colorSpace = THREE.SRGBColorSpace;

    this.moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.92,
      metalness: 0.0,
      emissive: new THREE.Color(0x223247),
      emissiveIntensity: 0.28,
    });

    this.moonMesh = new THREE.Mesh(moonGeom, this.moonMat);
    this.moonMesh.renderOrder = -10;
    this.moonMesh.frustumCulled = false;
    this.moonMesh.castShadow = true;
    this.moonMesh.receiveShadow = true;
    parentGroup.add(this.moonMesh);

    registerMarker(this.moonMesh, 'Moon', '#ffffff', 1.0, 'basic');
  }

  public update(moonPos: THREE.Vector3, astroTime: Astronomy.AstroTime, ephemeris: EphemerisEngine) {
    if (!this.moonMesh) return;
    this.moonMesh.position.copy(moonPos);
    this.moonMesh.lookAt(0, 0, 0);

    const { eclipseRedness, eclipseDarkening } = ephemeris.computeLunarEclipse(astroTime);
    if (this.moonMat) {
      MoonSystem._finalMoonColor
        .copy(MoonSystem._baseMoonColor)
        .lerp(MoonSystem._bloodMoonColor, eclipseRedness)
        .multiplyScalar(eclipseDarkening);
      this.moonMat.color.copy(MoonSystem._finalMoonColor);
    }
  }

  public setVisible(show: boolean) {
    if (this.moonMesh) this.moonMesh.visible = show;
  }

  public clear() {
    this.moonMesh = null;
    this.moonMat = null;
  }

  public dispose() {
    if (this.moonMesh) {
      this.moonMesh.geometry.dispose();
    }
    if (this.moonMat) {
      if (this.moonMat.map) this.moonMat.map.dispose();
      this.moonMat.dispose();
    }
    this.clear();
  }
}
