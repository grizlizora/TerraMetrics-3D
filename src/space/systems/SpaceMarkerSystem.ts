import * as THREE from 'three';
import { SpaceProceduralTextures } from '../SpaceProceduralTextures.ts';
import { BODY_NAMES, MOON_NAMES_SET } from '../core/SpaceConstants.ts';
import { CelestialOcclusion } from '../physics/CelestialOcclusion.ts';
import type { AppLanguage } from '../../types/index.ts';
import type { MarkerItem, MarkerTier, ReticleCacheItem, SpaceModeType } from '../SpaceTypes.ts';
import type { SpaceCameraManager } from '../core/SpaceCameraManager.ts';

export class SpaceMarkerSystem {
  public static _scaleScratch = new THREE.Vector3();
  public group: THREE.Group;
  public markers: THREE.Sprite[] = [];
  public markerData: MarkerItem[] = [];
  public sharedReticles: Record<string, ReticleCacheItem> = {};
  public currentLang: AppLanguage = 'uk';
  private isFirstActiveFrame = true;

  constructor(initialLang: AppLanguage = 'uk') {
    this.group = new THREE.Group();
    this.currentLang = initialLang;
  }

  public resetTransition() {
    this.isFirstActiveFrame = true;
  }

  public static isMarkerActive(tier: MarkerTier, mode: SpaceModeType): boolean {
    if (mode === 'none') return false;
    if (mode === 'basic') return tier === 'basic';
    if (mode === 'advanced') return tier === 'basic' || tier === 'advanced';
    if (mode === 'deep') return true;
    return false;
  }

  public registerMarker(
    parentMesh: THREE.Object3D,
    name: string,
    colorStr: string,
    scaleMult = 1,
    tier: MarkerTier = 'advanced',
    labelsVisible = true
  ) {
    const displayName = BODY_NAMES[name]?.[this.currentLang] || name;
    const isGiant = name === 'Sun' || name === 'Moon';

    // 1. Text Label Sprite (Start with 0.0 opacity & visible=false to prevent 1-frame popping)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    SpaceProceduralTextures.drawLabelCanvas(labelCanvas, displayName, name);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.SpriteMaterial({
      map: labelTex,
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.0,
      rotation: 0,
    });

    const labelSprite = new THREE.Sprite(labelMat);
    labelSprite.renderOrder = 9999;
    labelSprite.visible = false;

    const meshGeom = (parentMesh as THREE.Mesh).geometry as any;
    const radius = meshGeom?.parameters?.radius || (name === 'Sun' ? 163950 : name === 'Moon' ? 819 : 1000);
    const isConstellation = name.startsWith('CONST_');
    const visualOffset = isConstellation ? 0 : (radius || 1000) * (name === 'Sun' ? 1.38 : 1.35);

    labelSprite.position.set(0, visualOffset, 0);
    parentMesh.add(labelSprite);

    // 2. Reticle Sprite (Circle Dot + Halo Ring) - ONLY for non-giant, non-constellation bodies
    let reticleSprite: THREE.Sprite | null = null;
    if (!isGiant && !isConstellation) {
      let cached = this.sharedReticles[colorStr];
      if (!cached) {
        const reticleCanvas = document.createElement('canvas');
        reticleCanvas.width = 128;
        reticleCanvas.height = 128;
        SpaceProceduralTextures.drawReticleCanvas(reticleCanvas, colorStr, true);

        const reticleTex = new THREE.CanvasTexture(reticleCanvas);
        cached = { canvas: reticleCanvas, tex: reticleTex };
        this.sharedReticles[colorStr] = cached;
      }

      const reticleMat = new THREE.SpriteMaterial({
        map: cached.tex,
        color: 0xffffff,
        depthTest: false,
        depthWrite: false,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.0,
      });

      reticleSprite = new THREE.Sprite(reticleMat);
      reticleSprite.renderOrder = 9998;
      reticleSprite.visible = false;
      reticleSprite.position.set(0, 0, 0);
      parentMesh.add(reticleSprite);
      this.markers.push(reticleSprite);
    }

    this.markers.push(labelSprite);

    this.markerData.push({
      labelSprite,
      reticleSprite,
      labelCanvas,
      colorStr,
      name,
      tier,
      parentMesh,
      scaleMult,
      visualOffset,
      radius,
      isHovered: false,
      isTransitioning: false,
      hoverStartTime: 0,
      startOpacity: 0.0,
      targetOpacity: 0.0,
      startScale: 1.0,
      targetScale: 1.0,
      currentScale: 1.0,
    });
  }

  private lastUpdateTime = 0;

  public update(
    now: number,
    camera: THREE.PerspectiveCamera,
    cameraManager: SpaceCameraManager,
    sunMesh: THREE.Mesh | null,
    mode: SpaceModeType,
    labelsVisible: boolean,
    isMoving = false
  ): boolean {
    if (mode === 'none') {
      this.isFirstActiveFrame = true;
      for (let i = 0; i < this.markerData.length; i++) {
        this.markerData[i].labelSprite.visible = false;
        this.markerData[i].labelSprite.material.opacity = 0.0;
        if (this.markerData[i].reticleSprite) {
          this.markerData[i].reticleSprite.visible = false;
          this.markerData[i].reticleSprite.material.opacity = 0.0;
        }
      }
      return false;
    }

    const dt = this.lastUpdateTime > 0 ? Math.min(0.064, Math.max(0.001, (now - this.lastUpdateTime) / 1000)) : 0.016;
    this.lastUpdateTime = now;
    const alphaRate = 1.0 - Math.exp(-20.0 * dt);

    const mouseX = cameraManager.mouseX;
    const mouseY = cameraManager.mouseY;
    const shouldCheckHover = cameraManager.mouseMoved || cameraManager.cameraDirty || !isMoving;
    const halfW = cameraManager.halfW || (typeof window !== 'undefined' ? window.innerWidth / 2 : 960);
    const halfH = cameraManager.halfH || (typeof window !== 'undefined' ? window.innerHeight / 2 : 540);
    let anyTransitioning = false;

    // Calculate Sun's visual radius in radians from camera perspective
    let sunDist = 2348100;
    if (sunMesh) {
      sunMesh.getWorldPosition(CelestialOcclusion._sunPosScratch);
      sunDist = CelestialOcclusion._sunPosScratch.distanceTo(camera.position);
    }
    const sunVisualRadiusRad = Math.asin(Math.min(1.0, (163950 * 1.15) / Math.max(1, sunDist)));

    const tanHalfFov = Math.tan(((camera.fov || 45) * Math.PI) / 360);
    const viewH = Math.max(300, cameraManager.screenHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080));

    for (let i = 0; i < this.markerData.length; i++) {
      const data = this.markerData[i];
      const { labelSprite, reticleSprite, parentMesh, scaleMult, name, tier } = data;

      // 1. Tier filtering
      const isActive = SpaceMarkerSystem.isMarkerActive(tier, mode);
      if (!isActive) {
        if (labelSprite.material.opacity <= 0.002 && (!reticleSprite || reticleSprite.material.opacity <= 0.002)) {
          labelSprite.visible = false;
          if (reticleSprite) reticleSprite.visible = false;
          data.isHovered = false;
          continue;
        }
        labelSprite.material.opacity += (0.0 - labelSprite.material.opacity) * alphaRate;
        if (reticleSprite) {
          reticleSprite.material.opacity += (0.0 - reticleSprite.material.opacity) * alphaRate;
          reticleSprite.visible = reticleSprite.material.opacity > 0.002;
        }
        labelSprite.visible = labelSprite.material.opacity > 0.002;
        data.isHovered = false;
        anyTransitioning = true;
        continue;
      }

      // Extract world position
      parentMesh.getWorldPosition(CelestialOcclusion._posScratch);

      // 2. Early Frustum Envelope Culling (Saves 70% CPU before heavy occlusion math)
      const isCulled = CelestialOcclusion.isFrustumCulled(CelestialOcclusion._posScratch, camera);
      if (isCulled) {
        if (labelSprite.material.opacity <= 0.002 && (!reticleSprite || reticleSprite.material.opacity <= 0.002)) {
          labelSprite.visible = false;
          if (reticleSprite) reticleSprite.visible = false;
          data.isHovered = false;
          continue;
        }
        labelSprite.material.opacity += (0.0 - labelSprite.material.opacity) * alphaRate;
        if (reticleSprite) {
          reticleSprite.material.opacity += (0.0 - reticleSprite.material.opacity) * alphaRate;
          reticleSprite.visible = reticleSprite.material.opacity > 0.002;
        }
        labelSprite.visible = labelSprite.material.opacity > 0.002;
        data.isHovered = false;
        anyTransitioning = true;
        continue;
      }

      const bodyDist = CelestialOcclusion._posScratch.distanceTo(camera.position);

      // 3. Soft Earth penumbra transmission
      const earthTrans = CelestialOcclusion.getEarthTransmission(
        CelestialOcclusion._posScratch,
        bodyDist,
        camera.position
      );

      // 4. Solar Occlusion
      let solarTrans = 1.0;
      const isSolarSystemBody = tier === 'basic' || tier === 'advanced';
      if (name !== 'Sun' && sunMesh && isSolarSystemBody) {
        if (
          CelestialOcclusion.isSolarOccluded(
            CelestialOcclusion._posScratch,
            bodyDist,
            CelestialOcclusion._sunPosScratch,
            sunDist,
            sunVisualRadiusRad,
            camera.position
          )
        ) {
          solarTrans = 0.0;
        }
      }

      // Composite transmission factor
      const transFactor = earthTrans * solarTrans;

      // 5. Dual-Point Proximity Hover Detection
      if (shouldCheckHover && transFactor > 0.05) {
        const px = CelestialOcclusion._vecScratch.x * halfW + halfW;
        const py = -CelestialOcclusion._vecScratch.y * halfH + halfH;
        const dx = Math.abs(px - mouseX);
        const dy = Math.abs(py - mouseY);

        const isGiant = name === 'Sun' || name === 'Moon';
        let hoverRadius = 45;
        if (isGiant) {
          const radius3D = name === 'Sun' ? 163950 * 1.5 : 819 * 1.5;
          const screenRadius = (radius3D / Math.max(1, bodyDist)) * (viewH / (2 * tanHalfFov));
          hoverRadius = Math.max(120, screenRadius);
        } else if (MOON_NAMES_SET.has(name)) {
          hoverRadius = 22;
        }

        data.isHovered = dx * dx + dy * dy <= hoverRadius * hoverRadius;
      }

      // 6. Scale computation (with hierarchical world scale compensation)
      parentMesh.getWorldScale(SpaceMarkerSystem._scaleScratch);
      const worldScaleX = SpaceMarkerSystem._scaleScratch.x || 1.0;

      const targetScale = data.isHovered && transFactor > 0.1 ? 1.18 : 1.0;
      data.currentScale = (data.currentScale || 1.0) + (targetScale - (data.currentScale || 1.0)) * alphaRate;

      const isGiant = name === 'Sun' || name === 'Moon';
      const scaleMultiplier = (isGiant ? 2.0 : 1.0) * scaleMult * (data.currentScale || 1.0);

      // Text label quad size (stays above the body at visualOffset)
      let parentScale = parentMesh.scale?.x || 1.0;
      if (parentMesh.parent && parentMesh.parent.scale?.x && parentMesh.parent.type === 'Mesh') {
        parentScale *= parentMesh.parent.scale.x;
      }
      const labelW = (0.28 * scaleMultiplier) / parentScale;
      const labelH = (0.07 * scaleMultiplier) / parentScale;
      labelSprite.scale.set(labelW, labelH, 1.0);

      if (reticleSprite) {
        // Concentric enclosing reticle halo ring directly centered around body sphere (0, 0, 0)
        let baseReticleNdc = 0.046;
        if (name === 'Moon') {
          baseReticleNdc = 0.042;
        } else if (MOON_NAMES_SET.has(name)) {
          baseReticleNdc = 0.024;
        } else if (tier === 'deep') {
          baseReticleNdc = 0.038 * scaleMult;
        }

        const finalReticleScale = (baseReticleNdc * (data.currentScale || 1.0)) / worldScaleX;
        reticleSprite.scale.set(finalReticleScale, finalReticleScale, 1.0);
      }

      // 7. Continuous Frame-Rate Independent Exponential Opacity Relaxation
      const baseTarget = labelsVisible
        ? (data.isHovered ? 1.0 : (name === 'Sun' ? 1.0 : 0.9))
        : (data.isHovered ? (name === 'Sun' ? 1.0 : 0.9) : 0.0);

      const effectiveTargetOpacity = baseTarget * transFactor;

      if (this.isFirstActiveFrame) {
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
    }

    this.isFirstActiveFrame = false;
    cameraManager.mouseMoved = false;
    cameraManager.cameraDirty = false;
    return anyTransitioning;
  }

  public setLabelsVisible(visible: boolean, mode: SpaceModeType): boolean {
    this.group.visible = mode !== 'none';
    return true;
  }

  public setLanguage(lang: AppLanguage) {
    if (this.currentLang === lang) return;
    this.currentLang = lang;

    this.markerData.forEach((data) => {
      const displayName = BODY_NAMES[data.name]?.[lang] || data.name;
      SpaceProceduralTextures.drawLabelCanvas(data.labelCanvas, displayName, data.name);
      data.labelSprite.material.map!.needsUpdate = true;
    });
  }

  public dispose() {
    this.markerData.forEach((data) => {
      data.labelSprite.removeFromParent();
      if (data.labelSprite.material.map) {
        data.labelSprite.material.map.dispose();
      }
      data.labelSprite.material.dispose();

      if (data.labelCanvas) {
        data.labelCanvas.width = 0;
        data.labelCanvas.height = 0;
      }

      if (data.reticleSprite) {
        data.reticleSprite.removeFromParent();
        data.reticleSprite.material.dispose();
      }
    });

    this.markers.forEach((s) => {
      s.removeFromParent();
    });

    Object.keys(this.sharedReticles).forEach((k) => {
      this.sharedReticles[k].tex.dispose();
    });

    this.markers = [];
    this.markerData = [];
    this.sharedReticles = {};
    this.group.clear();
  }
}
