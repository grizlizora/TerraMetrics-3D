import * as THREE from 'three';
import { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl';
import { SpaceEngine } from './SpaceEngine';

const DEFAULT_PADDING = { left: 0, right: 0, top: 0, bottom: 0 };

export class SpaceBridge implements CustomLayerInterface {
  public id = 'space-engine-layer';
  public type: 'custom' = 'custom';
  public renderingMode: '3d' = '3d';

  public spaceEngine: SpaceEngine;
  public renderer: THREE.WebGLRenderer | null = null;
  public map: MapLibreMap | null = null;

  // Cached camera state for dirty flagging
  private lastLng = 0;
  private lastLat = 0;
  private lastPitch = -1;
  private lastBearing = -1;
  private lastZoom = -1;
  private lastPadLeft = -1;
  private lastPadRight = -1;
  private cachedViewW = 0;
  private cachedViewH = 0;
  private onResizeHandler = () => this.updateDimensions();

  constructor(spaceEngine: SpaceEngine) {
    this.spaceEngine = spaceEngine;
  }

  private updateDimensions() {
    if (this.map) {
      const canvas = this.map.getCanvas();
      this.cachedViewW = canvas?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 960);
      this.cachedViewH = canvas?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 540);
    }
  }

  private maxVertexAttribs = 16;

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;
    this.updateDimensions();
    try {
      this.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 16;
    } catch {
      this.maxVertexAttribs = 16;
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResizeHandler, { passive: true });
    }

    try {
      if (this.renderer) {
        this.renderer.dispose();
      }
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl as any,
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      });

      this.renderer.autoClear = false;
      this.renderer.autoClearColor = false;
      this.renderer.autoClearDepth = false; // Protect MapLibre globe depth buffer
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.shadowMap.enabled = false;

      // Pre-warm / compile shaders in GPU to eliminate any micro-stutters during mode switching
      try {
        this.spaceEngine.warmUpGPU(this.renderer);
      } catch {
        // Safe fallback
      }

      this.spaceEngine.onRequestRepaint = () => {
        if (this.map && this.spaceEngine.isActive && this.spaceEngine.mode !== 'none') {
          this.map.triggerRepaint();
        }
      };
    } catch (err) {
      console.warn('[SpaceBridge] Failed to create shared Three.js renderer:', err);
    }
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    if (!this.renderer || !this.spaceEngine || !this.spaceEngine.isActive || !this.map) return;
    if (gl.isContextLost()) return;

    // Only render in 3D globe projection
    const isGlobe = this.map.getProjection?.()?.type === 'globe';
    if (!isGlobe) return;

    let isMoving = false;
    try {
      const center = this.map.getCenter();
      const pitch = this.map.getPitch();
      const bearing = this.map.getBearing();
      const zoom = this.map.getZoom();
      const padding = this.map.getPadding?.() || DEFAULT_PADDING;
      const fov = this.map.transform?.fov ? (((this.map.transform.fov * 180) / Math.PI)) : 45;

      const viewW = this.cachedViewW || 960;
      const viewH = this.cachedViewH || 540;

      const isMoving = this.map.isMoving();

      // 1. Camera Sync Dirty-Checking (including active trackpad inertia)
      const cameraChanged =
        Math.abs(this.lastLng - center.lng) > 1e-5 ||
        Math.abs(this.lastLat - center.lat) > 1e-5 ||
        Math.abs(this.lastPitch - pitch) > 1e-4 ||
        Math.abs(this.lastBearing - bearing) > 1e-4 ||
        Math.abs(this.lastZoom - zoom) > 1e-4 ||
        this.lastPadLeft !== padding.left ||
        this.lastPadRight !== padding.right;

      if (cameraChanged || isMoving) {
        this.lastLng = center.lng;
        this.lastLat = center.lat;
        this.lastPitch = pitch;
        this.lastBearing = bearing;
        this.lastZoom = zoom;
        this.lastPadLeft = padding.left;
        this.lastPadRight = padding.right;

        this.spaceEngine.syncCameraOnly(center.lng, center.lat, pitch, bearing, zoom, fov, padding, viewW, viewH);
      }

      // 2. Physics & Real-Time Ephemeris Update
      const now = performance.now();
      this.spaceEngine.updatePhysics(now, isMoving);

      // 3. Render Three.js celestial background directly into shared WebGL context
      this.renderer.resetState();
      this.renderer.render(this.spaceEngine.scene, this.spaceEngine.camera);
      this.renderer.resetState();
    } catch (err) {
      console.warn('[SpaceBridge] Render skipped due to WebGL exception:', err);
      return;
    }

    // 4. Total WebGL State Isolation & Restoration for MapLibre GL
    for (let i = 0; i < this.maxVertexAttribs; i++) {
      gl.disableVertexAttribArray(i);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    if ('bindVertexArray' in gl) {
      (gl as WebGL2RenderingContext).bindVertexArray(null);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    if ('bindSampler' in gl) {
      (gl as WebGL2RenderingContext).bindSampler(0, null);
    }

    gl.useProgram(null);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.STENCIL_TEST);
    gl.stencilMask(0xff);
    gl.disable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    gl.colorMask(true, true, true, true);
    gl.disable(gl.SCISSOR_TEST);

    const painterContext = this.map.painter?.context;
    if (painterContext) {
      if (typeof painterContext.setDirty === 'function') {
        painterContext.setDirty();
      } else {
        if ('currentProgram' in painterContext) (painterContext as any).currentProgram = null;
        if ('currentVAO' in painterContext) (painterContext as any).currentVAO = null;
        if ('activeTexture' in painterContext) (painterContext as any).activeTexture = null;
        if ('boundBuffers' in painterContext) (painterContext as any).boundBuffers = {};
      }
    }

    // 5. Demand Rendering: MapLibre automatically renders every frame while moving.
    // We ONLY request additional frames when stationary AND an animation is active (e.g. 120ms hover tween or timeScale != 1).
    if (!isMoving && this.spaceEngine.isActive && this.spaceEngine.mode !== 'none') {
      if (this.spaceEngine.hasActiveAnimations || Math.abs(this.spaceEngine.timeScale - 1.0) > 0.001) {
        this.map.triggerRepaint();
      }
    }
  }

  private isDisposed = false;

  onRemove() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResizeHandler);
    }
    if (this.spaceEngine) {
      this.spaceEngine.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.map = null;
  }
}
