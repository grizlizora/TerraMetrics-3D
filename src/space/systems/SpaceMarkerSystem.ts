import * as THREE from 'three';
import { BODY_NAMES } from '../core/SpaceConstants.ts';
import type { AppLanguage } from '../../types/index.ts';
import type { MarkerItem, MarkerTier, ReticleCacheItem, SpaceModeType } from '../SpaceTypes.ts';
import type { SpaceCameraManager } from '../core/SpaceCameraManager.ts';
import type { MarkerHoverParams } from '../markers/MarkerTypes.ts';
import { MarkerTextureFactory } from '../markers/MarkerTextureFactory.ts';
import { MarkerOcclusionEngine } from '../markers/MarkerOcclusionEngine.ts';
import { MarkerHoverDetector } from '../markers/MarkerHoverDetector.ts';
import { MarkerAnimator } from '../markers/MarkerAnimator.ts';

export class SpaceMarkerSystem {
  public static _scaleScratch = new THREE.Vector3();
  public group: THREE.Group;
  public markers: THREE.Sprite[] = [];
  public markerData: MarkerItem[] = [];
  public sharedReticles: Record<string, ReticleCacheItem> = {};
  public currentLang: AppLanguage = 'uk';
  public onRequestRepaint?: () => void;

  private isFirstActiveFrame = true;
  private lastUpdateTime = 0;

  // Zero-GC scratch object for hover test parameters
  private static readonly _hoverParamsScratch: MarkerHoverParams = {
    mouseX: 0,
    mouseY: 0,
    halfW: 960,
    halfH: 540,
    viewH: 1080,
    tanHalfFov: 0.414,
  };

  constructor(initialLang: AppLanguage = 'uk') {
    // Preserve this.group as a proxy node to guarantee scene.children.length invariant
    this.group = new THREE.Group();
    this.currentLang = initialLang;
  }

  public resetTransition(): void {
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
    _labelsVisible = true
  ): void {
    const displayName = BODY_NAMES[name]?.[this.currentLang] || name;
    const isGiant = name === 'Sun' || name === 'Moon';
    const isConstellation = name.startsWith('CONST_');

    // 1. Text Label Sprite
    const { sprite: labelSprite, canvas: labelCanvas } =
      MarkerTextureFactory.createLabelSprite(displayName, name);

    const meshGeom = (parentMesh as THREE.Mesh).geometry as any;
    const radius = meshGeom?.parameters?.radius || (name === 'Sun' ? 163950 : name === 'Moon' ? 819 : 1000);
    const visualOffset = isConstellation ? 0 : (radius || 1000) * (name === 'Sun' ? 1.38 : 1.35);

    labelSprite.position.set(0, visualOffset, 0);
    parentMesh.add(labelSprite);
    this.markers.push(labelSprite);

    // 2. Reticle Sprite (Circle Dot + Halo Ring)
    let reticleSprite: THREE.Sprite | null = null;
    if (!isGiant && !isConstellation) {
      reticleSprite = MarkerTextureFactory.getOrCreateReticleSprite(colorStr, this.sharedReticles);
      parentMesh.add(reticleSprite);
      this.markers.push(reticleSprite);
    }

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
        const item = this.markerData[i];
        item.labelSprite.visible = false;
        item.labelSprite.material.opacity = 0.0;
        if (item.reticleSprite) {
          item.reticleSprite.visible = false;
          item.reticleSprite.material.opacity = 0.0;
        }
      }
      return false;
    }

    const dt = this.lastUpdateTime > 0
      ? Math.min(0.064, Math.max(0.001, (now - this.lastUpdateTime) / 1000))
      : 0.016;
    this.lastUpdateTime = now;
    const alphaRate = 1.0 - Math.exp(-20.0 * dt);

    const shouldCheckHover = cameraManager.mouseMoved || cameraManager.cameraDirty || !isMoving;
    const halfW = cameraManager.halfW || (typeof window !== 'undefined' ? window.innerWidth / 2 : 960);
    const halfH = cameraManager.halfH || (typeof window !== 'undefined' ? window.innerHeight / 2 : 540);
    const viewH = Math.max(300, cameraManager.screenHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080));
    const tanHalfFov = Math.tan(((camera.fov || 45) * Math.PI) / 360);

    // Prepare scratch hover params
    SpaceMarkerSystem._hoverParamsScratch.mouseX = cameraManager.mouseX;
    SpaceMarkerSystem._hoverParamsScratch.mouseY = cameraManager.mouseY;
    SpaceMarkerSystem._hoverParamsScratch.halfW = halfW;
    SpaceMarkerSystem._hoverParamsScratch.halfH = halfH;
    SpaceMarkerSystem._hoverParamsScratch.viewH = viewH;
    SpaceMarkerSystem._hoverParamsScratch.tanHalfFov = tanHalfFov;

    // Update Sun position & visual angle
    MarkerOcclusionEngine.updateSunState(sunMesh, camera);

    let anyTransitioning = false;

    for (let i = 0; i < this.markerData.length; i++) {
      const data = this.markerData[i];
      const { parentMesh, name, tier, labelSprite } = data;

      // 1. Tier filtering
      const isActive = SpaceMarkerSystem.isMarkerActive(tier, mode);
      if (!isActive) {
        if (MarkerAnimator.fadeOutCulled(data, alphaRate)) {
          anyTransitioning = true;
        }
        continue;
      }

      // 2. Compute Occlusion & Frustum Culling
      const occ = MarkerOcclusionEngine.computeOcclusion(
        parentMesh,
        camera,
        tier,
        name,
        sunMesh
      );

      if (occ.isCulled) {
        if (MarkerAnimator.fadeOutCulled(data, alphaRate)) {
          anyTransitioning = true;
        }
        continue;
      }

      // 3. Dual-Point Proximity Hover Detection
      if (shouldCheckHover && occ.transFactor > 0.05) {
        data.isHovered = MarkerHoverDetector.isHovered(
          occ.ndcX,
          occ.ndcY,
          occ.bodyDist,
          name,
          labelSprite,
          camera,
          SpaceMarkerSystem._hoverParamsScratch
        );
      }

      // 4. Animate Scale and Opacity Relaxation
      const isTransitioning = MarkerAnimator.animateMarker(
        data,
        occ.transFactor,
        labelsVisible,
        alphaRate,
        this.isFirstActiveFrame
      );

      if (isTransitioning) {
        anyTransitioning = true;
      }
    }

    this.isFirstActiveFrame = false;
    cameraManager.mouseMoved = false;
    cameraManager.cameraDirty = false;
    return anyTransitioning;
  }

  public setLabelsVisible(_visible: boolean, mode: SpaceModeType): boolean {
    this.group.visible = mode !== 'none';
    this.onRequestRepaint?.();
    return true;
  }

  public setLanguage(lang: AppLanguage): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;

    for (let i = 0; i < this.markerData.length; i++) {
      const data = this.markerData[i];
      const displayName = BODY_NAMES[data.name]?.[lang] || data.name;
      MarkerTextureFactory.updateLabelCanvas(
        data.labelCanvas,
        displayName,
        data.name,
        data.labelSprite.material.map!
      );
    }

    // Wake up demand renderer so text updates immediately even if camera is stationary
    this.onRequestRepaint?.();
  }

  public dispose(): void {
    for (let i = 0; i < this.markerData.length; i++) {
      const data = this.markerData[i];
      MarkerTextureFactory.disposeLabel(data.labelSprite, data.labelCanvas);
      if (data.reticleSprite) {
        MarkerTextureFactory.disposeReticleSprite(data.reticleSprite);
      }
    }

    for (let i = 0; i < this.markers.length; i++) {
      this.markers[i].removeFromParent();
    }

    MarkerTextureFactory.disposeSharedReticles(this.sharedReticles);

    this.markers = [];
    this.markerData = [];
    this.sharedReticles = {};
    this.group.clear();
  }
}
