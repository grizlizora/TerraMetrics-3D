import * as THREE from 'three';
import { CelestialOcclusion } from '../physics/CelestialOcclusion.ts';
import type { MarkerOcclusionResult, MarkerTier } from './MarkerTypes.ts';

export class MarkerOcclusionEngine {
  private static readonly _posScratch = new THREE.Vector3();
  private static readonly _sunPosScratch = new THREE.Vector3();
  private static readonly _camToBodyDir = new THREE.Vector3();
  private static readonly _ndcScratch = new THREE.Vector3();

  // Pre-allocated static result struct to guarantee 0 allocations per frame (Zero-GC SLA)
  private static readonly _resultScratch: MarkerOcclusionResult = {
    isCulled: false,
    transFactor: 1.0,
    bodyDist: 1000,
    ndcX: 0,
    ndcY: 0,
    ndcZ: 0,
  };

  public static sunDist = 2348100;
  public static sunVisualRadiusRad = 0.07;

  public static updateSunState(sunMesh: THREE.Mesh | null, camera: THREE.PerspectiveCamera): void {
    this.sunDist = 2348100;
    if (sunMesh) {
      sunMesh.getWorldPosition(this._sunPosScratch);
      this.sunDist = this._sunPosScratch.distanceTo(camera.position);
    }
    this.sunVisualRadiusRad = Math.asin(Math.min(1.0, (163950 * 1.15) / Math.max(1, this.sunDist)));
  }

  public static computeOcclusion(
    parentMesh: THREE.Object3D,
    camera: THREE.PerspectiveCamera,
    tier: MarkerTier,
    name: string,
    sunMesh: THREE.Mesh | null
  ): MarkerOcclusionResult {
    parentMesh.getWorldPosition(this._posScratch);

    // 1. Early Frustum Envelope Culling
    const isCulled = CelestialOcclusion.isFrustumCulled(
      this._posScratch,
      camera,
      this._ndcScratch
    );

    const bodyDist = this._posScratch.distanceTo(camera.position);

    if (isCulled) {
      this._resultScratch.isCulled = true;
      this._resultScratch.transFactor = 0.0;
      this._resultScratch.bodyDist = bodyDist;
      this._resultScratch.ndcX = this._ndcScratch.x;
      this._resultScratch.ndcY = this._ndcScratch.y;
      this._resultScratch.ndcZ = this._ndcScratch.z;
      return this._resultScratch;
    }

    // 2. Precompute single normalized direction from camera to body
    this._camToBodyDir.copy(this._posScratch).sub(camera.position).normalize();

    // 3. Soft Earth penumbra transmission
    const earthTrans = CelestialOcclusion.getEarthTransmission(
      this._posScratch,
      bodyDist,
      camera.position,
      this._camToBodyDir
    );

    // 4. Solar Occlusion
    let solarTrans = 1.0;
    const isSolarSystemBody = tier === 'basic' || tier === 'advanced';
    if (name !== 'Sun' && sunMesh && isSolarSystemBody) {
      if (
        CelestialOcclusion.isSolarOccluded(
          this._posScratch,
          bodyDist,
          this._sunPosScratch,
          this.sunDist,
          this.sunVisualRadiusRad,
          camera.position,
          this._camToBodyDir
        )
      ) {
        solarTrans = 0.0;
      }
    }

    this._resultScratch.isCulled = false;
    this._resultScratch.transFactor = earthTrans * solarTrans;
    this._resultScratch.bodyDist = bodyDist;
    this._resultScratch.ndcX = this._ndcScratch.x;
    this._resultScratch.ndcY = this._ndcScratch.y;
    this._resultScratch.ndcZ = this._ndcScratch.z;

    return this._resultScratch;
  }
}
