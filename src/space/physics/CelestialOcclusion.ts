import * as THREE from 'three';

export class CelestialOcclusion {
  // Static Vector Pool for Zero-GC in 120 FPS animation loops
  public static readonly _posScratch = new THREE.Vector3();
  public static readonly _sunPosScratch = new THREE.Vector3();
  public static readonly _bodyPosScratch = new THREE.Vector3();
  public static readonly _rayScratch = new THREE.Vector3();
  public static readonly _vecScratch = new THREE.Vector3();
  public static readonly _camUpScratch = new THREE.Vector3();
  public static readonly _camRightScratch = new THREE.Vector3();

  public static isSolarOccluded(
    bodyPos: THREE.Vector3,
    bodyDist: number,
    sunPos: THREE.Vector3,
    sunDist: number,
    sunVisualRadiusRad: number,
    camPos: THREE.Vector3,
    precomputedDir?: THREE.Vector3
  ): boolean {
    if (bodyDist <= sunDist) return false;

    const dir = precomputedDir || this._bodyPosScratch.copy(bodyPos).sub(camPos).normalize();
    this._rayScratch.copy(sunPos).sub(camPos).normalize();

    const angle = Math.acos(
      Math.min(1.0, Math.max(-1.0, dir.dot(this._rayScratch)))
    );
    return angle < sunVisualRadiusRad;
  }

  public static getEarthTransmission(
    bodyPos: THREE.Vector3,
    bodyDist: number,
    camPos: THREE.Vector3,
    precomputedDir?: THREE.Vector3
  ): number {
    const dir = precomputedDir || this._bodyPosScratch.copy(bodyPos).sub(camPos).normalize();
    const tClosest = -camPos.dot(dir);

    if (tClosest > 0 && tClosest < bodyDist) {
      const perpDistSq = camPos.lengthSq() - tClosest * tClosest;
      const perpDist = Math.sqrt(Math.max(0, perpDistSq));
      if (perpDist <= 98.0) return 0.0;
      if (perpDist >= 103.5) return 1.0;
      // Smooth Hermite penumbra fade between 98.0 and 103.5
      const t = (perpDist - 98.0) / (103.5 - 98.0);
      return t * t * (3.0 - 2.0 * t);
    }
    return 1.0;
  }

  public static isEarthOccluded(
    bodyPos: THREE.Vector3,
    bodyDist: number,
    camPos: THREE.Vector3
  ): boolean {
    return this.getEarthTransmission(bodyPos, bodyDist, camPos) < 0.05;
  }

  public static isFrustumCulled(
    pos: THREE.Vector3,
    camera: THREE.PerspectiveCamera,
    outNdc?: THREE.Vector3
  ): boolean {
    const ndc = outNdc || this._vecScratch;
    ndc.copy(pos).project(camera);
    // Behind camera (ndc.z > 1.0 in Three.js perspective projection) or clipped by near plane (ndc.z < -1.0)
    // Expanded screen envelope [-1.6, 1.6] to prevent wide badge clipping during fast pan
    return (
      ndc.z > 1.0 ||
      ndc.z < -1.0 ||
      ndc.x < -1.6 ||
      ndc.x > 1.6 ||
      ndc.y < -1.4 ||
      ndc.y > 1.4
    );
  }
}
