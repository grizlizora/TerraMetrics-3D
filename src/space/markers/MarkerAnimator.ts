import * as THREE from 'three';
import { MOON_NAMES_SET } from '../core/SpaceConstants.ts';
import type { MarkerItem } from './MarkerTypes.ts';

export class MarkerAnimator {
  private static readonly _scaleScratch = new THREE.Vector3();

  public static animateMarker(
    data: MarkerItem,
    transFactor: number,
    labelsVisible: boolean,
    alphaRate: number,
    isFirstActiveFrame: boolean
  ): boolean {
    const { labelSprite, reticleSprite, parentMesh, scaleMult, name, tier } = data;
    let anyTransitioning = false;

    // 1. World Scale Extraction (Consistent across all hierarchy levels)
    parentMesh.getWorldScale(this._scaleScratch);
    const worldScaleX = Math.max(1e-6, this._scaleScratch.x);

    // 2. Scale Tweening (Fix for Sun freeze: track scale transitions)
    const targetScale = data.isHovered && transFactor > 0.1 ? 1.18 : 1.0;
    const currentScale = data.currentScale || 1.0;
    const scaleDiff = targetScale - currentScale;

    if (Math.abs(scaleDiff) < 0.005) {
      data.currentScale = targetScale;
    } else {
      data.currentScale = currentScale + scaleDiff * alphaRate;
      anyTransitioning = true;
    }

    const isGiant = name === 'Sun' || name === 'Moon';
    const scaleMultiplier = (isGiant ? 2.0 : 1.0) * scaleMult * data.currentScale;

    // 3. Label Sprite Scale
    let parentScale = parentMesh.scale?.x || 1.0;
    if (parentMesh.parent && parentMesh.parent.scale?.x) {
      parentScale *= parentMesh.parent.scale.x;
    }
    const safeParentScale = Math.max(1e-6, parentScale);
    const labelW = (0.28 * scaleMultiplier) / safeParentScale;
    const labelH = (0.07 * scaleMultiplier) / safeParentScale;
    labelSprite.scale.set(labelW, labelH, 1.0);

    // 4. Reticle Sprite Scale
    if (reticleSprite) {
      let baseReticleNdc = 0.046;
      if (name === 'Moon') {
        baseReticleNdc = 0.042;
      } else if (MOON_NAMES_SET.has(name)) {
        baseReticleNdc = 0.024;
      } else if (tier === 'deep') {
        baseReticleNdc = 0.038 * scaleMult;
      }

      const finalReticleScale = (baseReticleNdc * data.currentScale) / worldScaleX;
      reticleSprite.scale.set(finalReticleScale, finalReticleScale, 1.0);
    }

    // 5. Opacity Relaxation & Settling
    const baseTarget = labelsVisible
      ? (data.isHovered ? 1.0 : (name === 'Sun' ? 1.0 : 0.9))
      : (data.isHovered ? (name === 'Sun' ? 1.0 : 0.9) : 0.0);

    const effectiveTargetOpacity = baseTarget * transFactor;

    if (isFirstActiveFrame) {
      labelSprite.material.opacity = effectiveTargetOpacity;
      labelSprite.visible = effectiveTargetOpacity > 0.002;
      if (reticleSprite) {
        const reticleTarget = effectiveTargetOpacity * (labelsVisible ? 0.75 : 0.85);
        reticleSprite.material.opacity = reticleTarget;
        reticleSprite.visible = reticleTarget > 0.002;
      }
    } else {
      const diff = effectiveTargetOpacity - labelSprite.material.opacity;
      if (Math.abs(diff) < 0.015) {
        labelSprite.material.opacity = effectiveTargetOpacity;
        if (reticleSprite) {
          reticleSprite.material.opacity = effectiveTargetOpacity * (labelsVisible ? 0.75 : 0.85);
          reticleSprite.visible = reticleSprite.material.opacity > 0.002;
        }
        labelSprite.visible = labelSprite.material.opacity > 0.002;
      } else {
        labelSprite.material.opacity += diff * alphaRate;
        if (reticleSprite) {
          const reticleTarget = effectiveTargetOpacity * (labelsVisible ? 0.75 : 0.85);
          reticleSprite.material.opacity += (reticleTarget - reticleSprite.material.opacity) * alphaRate;
          reticleSprite.visible = reticleSprite.material.opacity > 0.002;
        }
        labelSprite.visible = labelSprite.material.opacity > 0.002;
        anyTransitioning = true;
      }
    }

    return anyTransitioning;
  }

  public static fadeOutCulled(
    data: MarkerItem,
    alphaRate: number
  ): boolean {
    const { labelSprite, reticleSprite } = data;
    data.isHovered = false;

    if (labelSprite.material.opacity <= 0.002 && (!reticleSprite || reticleSprite.material.opacity <= 0.002)) {
      labelSprite.visible = false;
      if (reticleSprite) reticleSprite.visible = false;
      return false;
    }

    labelSprite.material.opacity += (0.0 - labelSprite.material.opacity) * alphaRate;
    if (reticleSprite) {
      reticleSprite.material.opacity += (0.0 - reticleSprite.material.opacity) * alphaRate;
      reticleSprite.visible = reticleSprite.material.opacity > 0.002;
    }
    labelSprite.visible = labelSprite.material.opacity > 0.002;
    return true;
  }
}
