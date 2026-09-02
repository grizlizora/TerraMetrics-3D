import type { Map as MapLibreMap } from 'maplibre-gl';
import { MapCameraAnimator } from '../camera/MapCameraAnimator';
import type { ProjectionTransitionContext } from './types';

export type { ProjectionTransitionContext };

export class MapProjectionManager {
  private currentProjection: 'globe' | 'mercator' = 'globe';

  constructor(initialProjection: 'globe' | 'mercator' = 'globe') {
    this.currentProjection = initialProjection;
  }

  public get projection(): 'globe' | 'mercator' {
    return this.currentProjection;
  }

  public calculateMercatorMinZoom(map: MapLibreMap | null): number {
    return MapCameraAnimator.calculateMercatorMinZoom(map);
  }

  public setProjection(
    mode: 'globe' | 'mercator',
    ctx?: ProjectionTransitionContext | null
  ): void {
    this.currentProjection = mode;
    if (!ctx || !ctx.map) return;
    const { map, interactions, onThemeRefresh, onReframeSelection } = ctx;

    map.stop();
    map.setMaxBounds(null);

    if (map.getLayer('world-base-layer')) {
      map.setLayoutProperty(
        'world-base-layer',
        'visibility',
        mode === 'mercator' ? 'visible' : 'none'
      );
    }

    if (mode === 'mercator') {
      const minZ = this.calculateMercatorMinZoom(map);
      map.setMinZoom(minZ);
      map.setMaxPitch(0);
      map.setMinPitch(0);
      map.setRenderWorldCopies(false);
      map.setProjection({ type: 'mercator' });

      interactions.configureGesturesForProjection(map, 'mercator');

      if (map.getLayer('world-graticule-lines')) {
        map.setLayoutProperty('world-graticule-lines', 'visibility', 'none');
      }

      map.transform?.setConstrainOverride?.(
        MapCameraAnimator.createMercatorConstrainFunction(map)
      );
      map.setMaxBounds([[-180, -85.051128], [180, 85.051128]]);

      const currentCenter = map.getCenter();
      const targetLat = Math.max(-60, Math.min(60, currentCenter?.lat ?? 20));
      const targetLng = currentCenter?.lng ?? 15;

      map.easeTo({
        center: [targetLng, targetLat],
        zoom: Math.max(minZ, MapCameraAnimator.getOptimalZoom()),
        pitch: 0,
        bearing: 0,
        duration: 350,
        essential: true,
      });
    } else {
      map.transform?.setConstrainOverride?.(null);
      map.setMaxBounds(null);

      map.setMinZoom(0.5);
      map.setProjection({ type: 'globe' });

      // Fix for Bug 16: Restore world copies on Globe switch
      map.setRenderWorldCopies(true);

      map.setMaxPitch(65);
      map.setMinPitch(0);

      interactions.configureGesturesForProjection(map, 'globe');

      if (map.getLayer('world-graticule-lines')) {
        map.setLayoutProperty('world-graticule-lines', 'visibility', 'none');
      }

      map.easeTo({ pitch: 0, duration: 350, essential: true });
    }

    onThemeRefresh();
    map.triggerRepaint();

    // Reframe selection in new projection without conflicting with easeTo
    onReframeSelection();
  }

  public onResize(map: MapLibreMap | null): void {
    if (!map) return;
    if (this.currentProjection === 'mercator') {
      const minZ = this.calculateMercatorMinZoom(map);
      map.setMinZoom(minZ);
      if (map.getZoom() < minZ) {
        map.setZoom(minZ);
      }
    }
  }

  public cleanup(map: MapLibreMap | null): void {
    if (map) {
      map.transform?.setConstrainOverride?.(null);
      map.setMaxBounds(null);
    }
  }
}
