import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import type { AppLanguage, ISO3Code } from '../../types';

export interface InteractionCallbacks {
  onCountrySelect?: (iso: ISO3Code, name: string) => void;
  onHoverChange?: (newId: string | number | null, oldId: string | number | null) => void;
  getLanguage: () => AppLanguage;
}

export class MapInteractionManager {
  private hoveredCountryId: string | number | null = null;
  private isThrottled = false;
  private latestPoint: { x: number; y: number } | null = null;
  private _rafId: number | null = null;

  private onMouseMoveHandler?: (e: MapMouseEvent) => void;
  private onMouseLeaveHandler?: () => void;
  private onClickHandler?: (e: MapMouseEvent) => void;

  public bindEvents(map: MapLibreMap, callbacks: InteractionCallbacks) {
    const handlePointerMove = (point: { x: number; y: number }) => {
      if (!map || map.isMoving()) return;
      if (!map.getLayer('country-fills')) return;

      const features = map.queryRenderedFeatures([point.x, point.y], {
        layers: ['country-fills'],
      });
      const newHoverId = features.length > 0 ? (features[0].id as string | number) : null;

      if (this.hoveredCountryId === newHoverId) return;

      const oldId = this.hoveredCountryId;
      this.hoveredCountryId = newHoverId;

      callbacks.onHoverChange?.(newHoverId, oldId);

      const canvas = map.getCanvas();
      if (canvas) {
        canvas.style.cursor = newHoverId !== null ? 'pointer' : '';
      }
    };

    let lastHandledPoint: { x: number; y: number } | null = null;
    this.onMouseMoveHandler = (e: MapMouseEvent) => {
      const p = e.point;
      if (lastHandledPoint) {
        const dx = p.x - lastHandledPoint.x;
        const dy = p.y - lastHandledPoint.y;
        if (dx * dx + dy * dy < 6.25) return; // 2.5px deadzone
      }
      this.latestPoint = p;
      if (!this.isThrottled) {
        this.isThrottled = true;
        this._rafId = requestAnimationFrame(() => {
          this._rafId = null;
          if (this.latestPoint) {
            lastHandledPoint = this.latestPoint;
            handlePointerMove(this.latestPoint);
          }
          this.isThrottled = false;
        });
      }
    };

    this.onMouseLeaveHandler = () => {
      if (this.hoveredCountryId !== null) {
        const oldId = this.hoveredCountryId;
        this.hoveredCountryId = null;
        callbacks.onHoverChange?.(null, oldId);
        const canvas = map.getCanvas();
        if (canvas) canvas.style.cursor = '';
      }
    };

    this.onClickHandler = (e: MapMouseEvent) => {
      if (!map || !map.getLayer('country-fills')) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['country-fills'],
      });
      if (!features || features.length === 0) {
        if (callbacks.onCountrySelect) {
          callbacks.onCountrySelect(null as any, '');
        }
        return;
      }

      const feature = features[0];
      const iso =
        (feature.properties as any)?.['ISO3166-1-Alpha-3'] || (feature.id as string);
      const currentLang = callbacks.getLanguage();
      const name =
        currentLang === 'uk'
          ? (feature.properties as any)?.name_uk
          : (feature.properties as any)?.name_en;

      if (callbacks.onCountrySelect && iso) {
        callbacks.onCountrySelect(iso, name || iso);
      }
    };

    map.on('mousemove', this.onMouseMoveHandler);
    map.on('mouseleave', this.onMouseLeaveHandler);
    map.on('click', this.onClickHandler);
  }

  public unbindEvents(map: MapLibreMap) {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.isThrottled = false;
    if (this.onMouseMoveHandler) map.off('mousemove', this.onMouseMoveHandler);
    if (this.onMouseLeaveHandler) map.off('mouseleave', this.onMouseLeaveHandler);
    if (this.onClickHandler) map.off('click', this.onClickHandler);
  }

  public configureGesturesForProjection(
    map: MapLibreMap,
    projection: 'globe' | 'mercator'
  ) {
    if (projection === 'mercator') {
      if (map.dragPan) map.dragPan.enable();
      if (map.touchZoomRotate) {
        map.touchZoomRotate.enable();
        map.touchZoomRotate.disableRotation();
      }
      if (map.touchPitch) map.touchPitch.disable();
      if (map.dragRotate) map.dragRotate.disable();
    } else {
      if (map.dragPan) map.dragPan.enable();
      if (map.touchZoomRotate) {
        map.touchZoomRotate.enable();
        map.touchZoomRotate.enableRotation();
      }
      if (map.touchPitch) map.touchPitch.enable();
      if (map.dragRotate) map.dragRotate.enable();
    }
  }

  public getHoveredId(): string | number | null {
    return this.hoveredCountryId;
  }
}
