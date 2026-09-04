import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl';
import type { ContinentName, CountryFeatureCollection, ISO3Code, SheetSnap } from '../../types';
import type { AudioManager } from '../../audio/AudioManager';
import { CameraStrategyResolver } from './strategies/CameraStrategyResolver';
import { ViewportBoundsCalculator } from './ViewportBoundsCalculator';
import { CURATED_METROPOLITAN_BOUNDS, CONTINENT_BOUNDING_BOXES, CONTINENT_CENTERS } from './framingConstants';
import { calculatePolygonCentroid, calculateBoundingBox } from '../../utils/geoUtils';
import type { CameraTarget } from './types';

export class MapCameraAnimator {
  public static isFlying = false;
  private static activeFlightId = 0;
  private static flyTimer: any = null;
  private static activeOnEnd: (() => void) | null = null;

  public static calculateMercatorMinZoom(map: MapLibreMap | null): number {
    return ViewportBoundsCalculator.calculateMercatorMinZoom(map);
  }

  public static createMercatorConstrainFunction(map: MapLibreMap | null) {
    return ViewportBoundsCalculator.createMercatorConstrainFunction(map);
  }

  public static getViewportPadding(
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false
  ): PaddingOptions {
    const context = CameraStrategyResolver.buildContext(snap, isSidebarCollapsed);
    const strategy = CameraStrategyResolver.resolve(context);
    return strategy.getViewportPadding(context);
  }

  public static getOptimalZoom(isSidebarCollapsed = false): number {
    const context = CameraStrategyResolver.buildContext('peek', isSidebarCollapsed);
    const strategy = CameraStrategyResolver.resolve(context);
    return strategy.getOptimalZoom(context);
  }

  public static flyToCountry(
    map: MapLibreMap | null,
    isoA3: ISO3Code,
    geoJsonData?: CountryFeatureCollection | null,
    snap: SheetSnap = 'half',
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe',
    audioManager?: AudioManager | null
  ) {
    if (!map) return;

    const feature = geoJsonData?.features.find(
      (f) => f.properties['ISO3166-1-Alpha-3'] === isoA3
    );
    if (!feature) return;

    // 1. Resolve Center
    let center: [number, number] | undefined = feature.properties.center;
    if (!center && feature.geometry) {
      center = calculatePolygonCentroid(feature.geometry.coordinates);
    }
    if (!center) return;

    // 2. Resolve Bounds (Curated Metropolitan Override -> Geometry Primary BBox -> Bounding Centroid)
    let bounds: [number, number, number, number] =
      CURATED_METROPOLITAN_BOUNDS[isoA3] ||
      (feature.properties as any)?.primaryBbox ||
      (feature.properties as any)?.bbox;

    if (!bounds && feature.geometry && feature.geometry.coordinates) {
      bounds = calculateBoundingBox(feature.geometry.coordinates);
    }

    if (!bounds) {
      bounds = [center[0] - 3, center[1] - 3, center[0] + 3, center[1] + 3];
    }

    const target: CameraTarget = {
      iso: isoA3,
      name: feature.properties.name_en || feature.properties.name,
      center,
      bounds,
    };

    const context = CameraStrategyResolver.buildContext(snap, isSidebarCollapsed, projection);
    const strategy = CameraStrategyResolver.resolve(context);
    const flight = strategy.calculateCountryFlight(target, context, map);

    this.executeFlight(map, flight, audioManager);
  }

  public static flyToContinent(
    map: MapLibreMap | null,
    continent: ContinentName,
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe',
    audioManager?: AudioManager | null
  ) {
    if (!map) return;

    const context = CameraStrategyResolver.buildContext(snap, isSidebarCollapsed, projection);
    const strategy = CameraStrategyResolver.resolve(context);

    const bounds = CONTINENT_BOUNDING_BOXES[continent] || CONTINENT_BOUNDING_BOXES.World;
    const defaultCenter = CONTINENT_CENTERS[continent] || CONTINENT_CENTERS.World;

    const flight = strategy.calculateContinentFlight(continent, bounds, defaultCenter, context, map);

    this.executeFlight(map, flight, audioManager);
  }

  public static flyToWorld(
    map: MapLibreMap | null,
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe',
    audioManager?: AudioManager | null
  ) {
    if (!map) return;

    const context = CameraStrategyResolver.buildContext('peek', isSidebarCollapsed, projection);
    const strategy = CameraStrategyResolver.resolve(context);
    const flight = strategy.calculateWorldFlight(context);

    this.executeFlight(map, flight, audioManager);
  }

  private static executeFlight(
    map: MapLibreMap,
    flight: any,
    audioManager?: AudioManager | null
  ) {
    if (!map) return;

    this.cancelActiveFlight(map, audioManager);
    this.activeFlightId++;
    const flightId = this.activeFlightId;
    this.isFlying = true;

    if (audioManager) {
      audioManager.startFlySound();
    }

    let flightDuration = flight.duration;
    try {
      const currentCenter = map.getCenter();
      if (currentCenter && Array.isArray(flight.center)) {
        const dLat = ((flight.center[1] - currentCenter.lat) * Math.PI) / 180;
        const dLon = ((flight.center[0] - currentCenter.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((currentCenter.lat * Math.PI) / 180) *
            Math.cos((flight.center[1] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const clampedA = Math.min(1.0, Math.max(0.0, a));
        const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
        const distKm = 6371 * c;
        flightDuration = Math.min(2100, Math.max(950, Math.round(900 + (distKm / 15000) * 1000)));
        if (Number.isNaN(flightDuration)) {
          flightDuration = flight.duration;
        }
      }
    } catch {
      flightDuration = flight.duration;
    }

    map.flyTo({
      center: flight.center,
      zoom: flight.zoom,
      pitch: flight.pitch,
      bearing: flight.bearing,
      padding: flight.padding,
      essential: true,
      duration: flightDuration,
      curve: flight.curve || 1.42,
    });

    const flightStartTime = Date.now();

    const onEnd = () => {
      // Guard against false positive moveend emitted immediately by map.stop() from previous motion
      if (Date.now() - flightStartTime < 150) {
        map.once('moveend', onEnd);
        return;
      }
      if (this.flyTimer) {
        clearTimeout(this.flyTimer);
        this.flyTimer = null;
      }
      map.off('moveend', onEnd);
      this.activeOnEnd = null;
      if (this.activeFlightId === flightId) {
        this.isFlying = false;
        if (audioManager) audioManager.stopFlySound();
      }
    };

    this.activeOnEnd = onEnd;
    map.once('moveend', onEnd);
    this.flyTimer = setTimeout(onEnd, flightDuration + 150);
  }

  public static cancelActiveFlight(map: MapLibreMap | null, audioManager?: AudioManager | null): void {
    if (this.flyTimer) {
      clearTimeout(this.flyTimer);
      this.flyTimer = null;
    }
    if (this.activeOnEnd && map) {
      try {
        map.off('moveend', this.activeOnEnd);
      } catch {}
      this.activeOnEnd = null;
    }
    this.activeFlightId++;
    this.isFlying = false;
    if (audioManager) {
      audioManager.stopFlySound();
    }
    if (map) {
      try {
        map.stop();
      } catch {}
    }
  }
}
