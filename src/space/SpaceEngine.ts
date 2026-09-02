import * as THREE from 'three';
import type * as Astronomy from 'astronomy-engine';
import type { AppLanguage } from '../types/index.ts';
import type { MarkerTier, SpaceModeType } from './SpaceTypes.ts';
import { BODY_NAMES } from './core/SpaceConstants.ts';
import { SpaceCameraManager } from './core/SpaceCameraManager.ts';
import { EphemerisEngine } from './physics/EphemerisEngine.ts';
import { StarfieldSystem } from './systems/StarfieldSystem.ts';
import { SolarSystemModule } from './systems/SolarSystemModule.ts';
import { DeepSpaceModule } from './systems/DeepSpaceModule.ts';
import { SpaceMarkerSystem } from './systems/SpaceMarkerSystem.ts';
import { SpaceProceduralTextures } from './SpaceProceduralTextures.ts';
import type { LagrangePointInfo } from './physics/LagrangePoints.ts';

export interface SpaceSubsystems {
  cameraManager: SpaceCameraManager;
  ephemeris: EphemerisEngine;
  starfield: StarfieldSystem;
  solarSystem: SolarSystemModule;
  deepSpace: DeepSpaceModule;
  markers: SpaceMarkerSystem;
}

export class SpaceEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public isActive = true;
  public mode: SpaceModeType = 'none';
  public currentLang: AppLanguage = 'uk';
  public labelsVisible = true;
  public bridged = false;
  public hasActiveAnimations = false;
  public lastTime = 0;

  // Subsystems
  public cameraManager: SpaceCameraManager;
  public ephemeris: EphemerisEngine;
  public starfield: StarfieldSystem;
  public solarSystem: SolarSystemModule;
  public deepSpace: DeepSpaceModule;
  public markers: SpaceMarkerSystem;

  public textureLoader: THREE.TextureLoader;

  // Static API compatibility
  public static isMarkerActive = SpaceMarkerSystem.isMarkerActive;
  public static BODY_NAMES = BODY_NAMES;

  // Direct unified access to all subsystems
  public get subsystems(): SpaceSubsystems {
    return {
      cameraManager: this.cameraManager,
      ephemeris: this.ephemeris,
      starfield: this.starfield,
      solarSystem: this.solarSystem,
      deepSpace: this.deepSpace,
      markers: this.markers,
    };
  }

  // Property proxies for backward compatibility
  public get simTimeDays() {
    return this.ephemeris.simTimeDays;
  }
  public set simTimeDays(val: number) {
    this.ephemeris.simTimeDays = val;
  }

  public get timeScale() {
    return this.ephemeris.timeScale;
  }
  public set timeScale(val: number) {
    this.ephemeris.timeScale = val;
  }

  public get ambientLight() {
    return this.solarSystem.ambientLight;
  }
  public set ambientLight(light: THREE.AmbientLight | null) {
    this.solarSystem.ambientLight = light;
  }

  public get onRequestRepaint(): (() => void) | undefined {
    return this.cameraManager.onRequestRepaint;
  }
  public set onRequestRepaint(fn: (() => void) | undefined) {
    this.cameraManager.onRequestRepaint = fn;
    if (this.markers) {
      this.markers.onRequestRepaint = fn;
    }
  }

  public get mouseX() {
    return this.cameraManager.mouseX;
  }
  public get mouseY() {
    return this.cameraManager.mouseY;
  }
  public get mouseMoved() {
    return this.cameraManager.mouseMoved;
  }
  public set mouseMoved(val: boolean) {
    this.cameraManager.mouseMoved = val;
  }

  public get screenWidth() {
    return this.cameraManager.screenWidth;
  }
  public get screenHeight() {
    return this.cameraManager.screenHeight;
  }
  public get halfW() {
    return this.cameraManager.halfW;
  }
  public get halfH() {
    return this.cameraManager.halfH;
  }
  public get cameraDirty() {
    return this.cameraManager.cameraDirty;
  }
  public set cameraDirty(val: boolean) {
    this.cameraManager.cameraDirty = val;
  }

  constructor(initialLang: AppLanguage = 'uk') {
    this.currentLang = initialLang;
    this.scene = new THREE.Scene();
    this.textureLoader = new THREE.TextureLoader();

    // Initialize subsystems
    this.cameraManager = new SpaceCameraManager();
    this.camera = this.cameraManager.camera;
    this.ephemeris = new EphemerisEngine();
    this.starfield = new StarfieldSystem();
    this.solarSystem = new SolarSystemModule();
    this.deepSpace = new DeepSpaceModule();
    this.markers = new SpaceMarkerSystem(initialLang);

    // Build Scene Graph
    this.scene.add(this.starfield.group);
    this.scene.add(this.deepSpace.group);
    this.scene.add(this.solarSystem.group);
    this.scene.add(this.markers.group);

    // Register callback for marker creation
    const registerMarker = (
      parentMesh: THREE.Object3D,
      name: string,
      colorStr: string,
      scaleMult = 1,
      tier: MarkerTier = 'advanced'
    ) => {
      this.markers.registerMarker(
        parentMesh,
        name,
        colorStr,
        scaleMult,
        tier,
        this.labelsVisible
      );
    };

    // Instantiate visual content
    this.starfield.create(registerMarker, this.ephemeris);
    this.deepSpace.create(registerMarker, this.ephemeris);
    this.solarSystem.create(registerMarker, this.textureLoader);

    this.setMode('none');
  }

  public syncCameraOnly(
    lng: number,
    lat: number,
    pitch: number,
    bearing: number,
    zoom = 1,
    fov = 45,
    padding = { left: 0, right: 0, top: 0, bottom: 0 },
    viewWidth?: number,
    viewHeight?: number
  ) {
    this.cameraManager.syncCameraOnly(
      lng,
      lat,
      pitch,
      bearing,
      zoom,
      fov,
      padding,
      viewWidth,
      viewHeight
    );
  }

  public setMode(mode: SpaceModeType) {
    this.mode = mode;
    this.isActive = mode !== 'none';
    this.scene.visible = this.isActive;
    this.cameraManager.isPointerTrackingEnabled = this.isActive;

    if (!this.isActive) {
      this.hasActiveAnimations = false;
    }

    this.starfield.setVisible(mode === 'basic' || mode === 'advanced' || mode === 'deep');
    this.deepSpace.setVisible(mode === 'deep');
    this.solarSystem.setMode(mode);
    this.markers.resetTransition();
    this.applyLabelsVisibility(this.labelsVisible);
  }

  public updatePhysics(time: number, isMoving = false) {
    if (!this.isActive || this.mode === 'none') {
      this.hasActiveAnimations = false;
      return;
    }

    if (this.lastTime === 0) {
      this.lastTime = time;
    }
    const dt = Math.max(0, Math.min(time - this.lastTime, 250));
    this.lastTime = time;

    const { astroTime, stRad, now } = this.ephemeris.updateSimulationTime(dt);

    // 1. Sidereal Rotation for Starfield & Deep Space
    this.starfield.setSiderealRotation(stRad);
    this.starfield.update(time, this.mode === 'deep');
    this.deepSpace.setSiderealRotation(stRad);
    if (this.mode === 'deep') {
      this.deepSpace.update(time);
    }

    // 2. Solar System Orbital Mechanics (Sun, Moon, Planets, Asteroid Belt)
    this.solarSystem.update(
      astroTime,
      now,
      dt,
      this.camera,
      this.mode,
      this.ephemeris
    );

    // 3. Markers Proximity & Labels Hover (UI Transition Clock)
    const markersTransitioning = this.markers.update(
      time,
      this.camera,
      this.cameraManager,
      this.solarSystem.sunMesh,
      this.mode,
      this.labelsVisible,
      isMoving
    );
    this.hasActiveAnimations = markersTransitioning || (this.mode === 'deep' && this.starfield.flashes.length > 0);
  }

  public setTimeScale(scale: number) {
    this.ephemeris.timeScale = scale;
  }

  public getLagrangePoints(): LagrangePointInfo[] {
    return this.ephemeris.getLagrangePoints();
  }

  public createMarker(
    parentMesh: THREE.Object3D,
    name: string,
    colorStr: string,
    scaleMult = 1,
    tier: MarkerTier = 'advanced'
  ) {
    this.markers.registerMarker(
      parentMesh,
      name,
      colorStr,
      scaleMult,
      tier,
      this.labelsVisible
    );
  }

  public warmUpGPU(renderer: THREE.WebGLRenderer) {
    if (!renderer) return;
    try {
      this.scene.visible = true;
      this.starfield.group.visible = true;
      this.deepSpace.group.visible = true;
      this.solarSystem.group.visible = true;
      this.solarSystem.planetaryBodies.forEach((b) => {
        b.mesh.visible = true;
        const mat = b.material as THREE.MeshStandardMaterial;
        if (mat?.map) renderer.initTexture(mat.map);
      });
      if (this.solarSystem.sunMesh) this.solarSystem.sunMesh.visible = true;
      if (this.solarSystem.sunGlow) this.solarSystem.sunGlow.visible = true;
      if (this.solarSystem.outerGlow) this.solarSystem.outerGlow.visible = true;
      if (this.solarSystem.moonMesh) this.solarSystem.moonMesh.visible = true;

      this.markers.group.visible = true;
      this.markers.markerData.forEach((m) => {
        m.labelSprite.visible = true;
        if (m.reticleSprite) m.reticleSprite.visible = true;
        const map = m.labelSprite.material.map;
        if (map) renderer.initTexture(map);
      });

      renderer.compile(this.scene, this.camera);
      this.setMode(this.mode);
    } catch (e) {
      console.warn('[SpaceEngine] warmUpGPU fallback:', e);
    }
  }

  public setLabelsVisible(visible: boolean) {
    this.labelsVisible = visible;
    this.hasActiveAnimations = this.markers.setLabelsVisible(visible, this.mode);
    this.onRequestRepaint?.();
  }

  public applyLabelsVisibility(visible: boolean = this.labelsVisible) {
    this.setLabelsVisible(visible);
  }

  public toggleLabels() {
    this.setLabelsVisible(!this.labelsVisible);
  }

  public setLanguage(lang: AppLanguage) {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.markers.setLanguage(lang);
    this.onRequestRepaint?.();
  }

  public updateAstronomicalPositions(date?: Date) {
    if (date) {
      this.ephemeris.setDate(date);
    }
    this.updatePhysics(performance.now());
  }

  public triggerSupernova(candidateName?: string) {
    this.starfield.triggerSupernova(candidateName);
    this.hasActiveAnimations = true;
    this.onRequestRepaint?.();
  }

  public getMapboxPos(
    bodyName: string,
    astroTime: Astronomy.AstroTime,
    out: THREE.Vector3
  ): THREE.Vector3 {
    return this.ephemeris.getMapboxPos(bodyName, astroTime, out);
  }

  public setVectorFromRaDec(
    target: THREE.Vector3,
    raHours: number,
    decDeg: number,
    distance?: number
  ) {
    this.ephemeris.setVectorFromRaDec(target, raHours, decDeg, distance);
  }

  private isDisposed = false;

  public dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.cameraManager.dispose();
    this.starfield.dispose();
    this.deepSpace.dispose();
    this.solarSystem.dispose();
    this.markers.dispose();
    SpaceProceduralTextures.disposeAll();
    this.scene.clear();
    this.onRequestRepaint = undefined;
  }
}
