import * as THREE from 'three';
import { MOON_NAMES_SET } from '../core/SpaceConstants.ts';
import type { MarkerHoverParams } from './MarkerTypes.ts';

export class MarkerHoverDetector {
  private static readonly _labelWorldScratch = new THREE.Vector3();
  private static readonly _labelNdcScratch = new THREE.Vector3();

  public static isHovered(
    bodyNdcX: number,
    bodyNdcY: number,
    bodyDist: number,
    name: string,
    labelSprite: THREE.Sprite,
    camera: THREE.PerspectiveCamera,
    params: MarkerHoverParams
  ): boolean {
    const { mouseX, mouseY, halfW, halfH, viewH, tanHalfFov } = params;
    const safeTanHalfFov = Math.max(0.001, tanHalfFov);

    // 1. Check Body Center proximity
    const px = bodyNdcX * halfW + halfW;
    const py = -bodyNdcY * halfH + halfH;
    const dx = Math.abs(px - mouseX);
    const dy = Math.abs(py - mouseY);

    const isGiant = name === 'Sun' || name === 'Moon';
    let hoverRadius = 45;

    if (isGiant) {
      const radius3D = name === 'Sun' ? 163950 * 1.5 : 819 * 1.5;
      const screenRadius = (radius3D / Math.max(1, bodyDist)) * (viewH / (2 * safeTanHalfFov));
      hoverRadius = Math.max(120, screenRadius);
    } else if (MOON_NAMES_SET.has(name)) {
      hoverRadius = 22;
    }

    if (dx * dx + dy * dy <= hoverRadius * hoverRadius) {
      return true;
    }

    // 2. True Dual-Point Detection: Check Label Badge AABB
    if (labelSprite.visible && labelSprite.material.opacity > 0.1) {
      labelSprite.getWorldPosition(this._labelWorldScratch);
      this._labelNdcScratch.copy(this._labelWorldScratch).project(camera);

      // Label is within viewing frustum
      if (this._labelNdcScratch.z >= -1.0 && this._labelNdcScratch.z <= 1.0) {
        const lx = this._labelNdcScratch.x * halfW + halfW;
        const ly = -this._labelNdcScratch.y * halfH + halfH;
        const ldx = Math.abs(lx - mouseX);
        const ldy = Math.abs(ly - mouseY);

        // Label box bounds: ~65px half-width, ~18px half-height
        if (ldx <= 65 && ldy <= 18) {
          return true;
        }
      }
    }

    return false;
  }
}
