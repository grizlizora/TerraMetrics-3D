import * as THREE from 'three';
import { EARTH_RADIUS } from './SpaceConstants.ts';

export class SpaceCameraManager {
  public camera: THREE.PerspectiveCamera;
  public mouseX = 0;
  public mouseY = 0;
  public mouseMoved = false;
  public screenWidth = 0;
  public screenHeight = 0;
  public halfW = 0;
  public halfH = 0;
  public cameraDirty = true;
  public onRequestRepaint?: () => void;

  public isPointerTrackingEnabled = false;
  private _pointerMoveRaf: number | null = null;
  private onPointerMoveHandler: (e: PointerEvent) => void;
  private onPointerDownHandler: (e: PointerEvent) => void;
  private onPointerLeaveHandler: () => void;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(45, 1, 1000.0, 5e7);
    this.camera.matrixAutoUpdate = true;

    let lastX = -999;
    let lastY = -999;

    this.onPointerMoveHandler = (e: PointerEvent) => {
      if (!this.isPointerTrackingEnabled) return;
      const dx = Math.abs(e.clientX - lastX);
      const dy = Math.abs(e.clientY - lastY);
      if (dx < 2 && dy < 2) return;

      lastX = e.clientX;
      lastY = e.clientY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.mouseMoved = true;

      if (this._pointerMoveRaf === null) {
        this._pointerMoveRaf = requestAnimationFrame(() => {
          this._pointerMoveRaf = null;
          this.onRequestRepaint?.();
        });
      }
    };

    this.onPointerDownHandler = (e: PointerEvent) => {
      if (!this.isPointerTrackingEnabled) return;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.mouseMoved = true;
      this.onRequestRepaint?.();
    };

    this.onPointerLeaveHandler = () => {
      if (!this.isPointerTrackingEnabled) return;
      this.mouseX = -9999;
      this.mouseY = -9999;
      this.mouseMoved = true;
      this.onRequestRepaint?.();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.onPointerMoveHandler, { passive: true });
      window.addEventListener('pointerdown', this.onPointerDownHandler, { passive: true });
      window.addEventListener('pointerleave', this.onPointerLeaveHandler, { passive: true });
      window.addEventListener('mouseout', this.onPointerLeaveHandler, { passive: true });
    }
  }

  private _lastCx = 0;
  private _lastCy = 0;

  public syncCameraOnly(
    lng: number,
    lat: number,
    pitch: number,
    bearing: number,
    zoom = 1,
    _fov = 45,
    padding = { left: 0, right: 0, top: 0, bottom: 0 },
    viewWidth?: number,
    viewHeight?: number
  ) {
    if (!this.camera) return;

    const width = viewWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    const height = viewHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080);

    if (this.screenWidth !== width || this.screenHeight !== height) {
      this.screenWidth = width;
      this.screenHeight = height;
      this.halfW = width * 0.5;
      this.halfH = height * 0.5;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    const cx = (padding.left - padding.right) * 0.5;
    const cy = (padding.top - padding.bottom) * 0.5;

    if (Math.abs(cx - this._lastCx) > 0.5 || Math.abs(cy - this._lastCy) > 0.5) {
      this._lastCx = cx;
      this._lastCy = cy;
      if (Math.abs(cx) > 0.5 || Math.abs(cy) > 0.5) {
        this.camera.setViewOffset(width, height, -cx, -cy, width, height);
      } else {
        this.camera.clearViewOffset();
      }
    }

    this.cameraDirty = true;

    const deg2rad = Math.PI / 180;
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(
      (-lat + pitch) * deg2rad,
      -lng * deg2rad,
      -bearing * deg2rad,
      'YXZ'
    );

    const distance = EARTH_RADIUS + 400 / Math.pow(2, Math.max(0, zoom - 1));
    this.camera.translateZ(distance);
    this.camera.updateMatrixWorld(true);
  }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.onPointerMoveHandler);
      window.removeEventListener('pointerdown', this.onPointerDownHandler);
      window.removeEventListener('pointerleave', this.onPointerLeaveHandler);
      window.removeEventListener('mouseout', this.onPointerLeaveHandler);
    }
    if (this._pointerMoveRaf !== null) {
      cancelAnimationFrame(this._pointerMoveRaf);
      this._pointerMoveRaf = null;
    }
  }
}
