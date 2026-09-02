// Vector Geometry Generator & Viewport Framing Calculations
import { Feature, FeatureCollection, LineString, Polygon } from 'geojson';
import { ContinentName, SheetSnap } from '../types';
import { PaddingOptions } from 'maplibre-gl';
import { MapCameraAnimator } from './camera/MapCameraAnimator';

/**
 * Continent Bounding Boxes for precise camera framing and fitBounds
 */
export const CONTINENT_BOUNDS: Record<ContinentName, [[number, number], [number, number]]> = {
  World: [
    [-170, -60],
    [175, 75],
  ],
  Europe: [
    [-25, 34],
    [45, 71],
  ],
  Asia: [
    [25, -10],
    [150, 75],
  ],
  Africa: [
    [-20, -36],
    [55, 38],
  ],
  'North America': [
    [-170, 15],
    [-50, 72],
  ],
  'South America': [
    [-90, -56],
    [-30, 15],
  ],
  Oceania: [
    [110, -50],
    [180, 0],
  ],
};

/**
 * Continent Centers & Zoom Levels for 3D/2D projection
 */
export const CONTINENT_CENTERS: Record<ContinentName, { center: [number, number]; zoom: number }> = {
  World: { center: [20, 20], zoom: 1.5 },
  Europe: { center: [15, 50], zoom: 3.2 },
  Asia: { center: [85, 38], zoom: 2.3 },
  Africa: { center: [20, 5], zoom: 2.5 },
  'North America': { center: [-100, 45], zoom: 2.5 },
  'South America': { center: [-60, -15], zoom: 2.5 },
  Oceania: { center: [135, -25], zoom: 2.9 },
};

/**
 * Calculates responsive viewport padding for Desktop and Mobile
 */
export function calculateResponsivePadding(options?: {
  isDesktop?: boolean;
  isSidebarCollapsed?: boolean;
  snap?: SheetSnap;
}): PaddingOptions {
  return MapCameraAnimator.getViewportPadding(
    options?.snap || 'peek',
    options?.isSidebarCollapsed || false
  );
}

/**
 * Computes bounding box for a GeoJSON feature
 */
export function getFeatureBoundingBox(feature: Feature): [[number, number], [number, number]] | null {
  if (!feature.geometry) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const processCoords = (coords: any) => {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        processCoords(item);
      }
    }
  };

  processCoords((feature.geometry as any).coordinates);

  if (minLng === Infinity || maxLng === -Infinity) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Generates graticule grid lines (meridians and parallels) without ugly antimeridian seam
 */
export function getGraticuleGeoJson(): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  const minLat = -80;
  const maxLat = 80;

  // Parallels (every 20 degrees, from -60 to +80)
  for (let lat = -60; lat <= maxLat; lat += 20) {
    const coords: [number, number][] = [];
    for (let lng = -179; lng <= 179; lng += 2) {
      coords.push([lng, lat]);
    }
    features.push({
      type: 'Feature',
      properties: { type: lat === 0 ? 'equator' : 'parallel', lat },
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    });
  }

  // Meridians (every 30 degrees, excluding +-180 to avoid line in the Pacific)
  for (let lng = -150; lng <= 150; lng += 30) {
    const coords: [number, number][] = [];
    for (let lat = minLat; lat <= maxLat; lat += 2) {
      coords.push([lng, lat]);
    }
    features.push({
      type: 'Feature',
      properties: { type: lng === 0 ? 'prime-meridian' : 'meridian', lng },
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function getWorldBoundaryGeoJson(): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-180, -85.0511],
              [5, -85.0511],
              [5, 85.0511],
              [-180, 85.0511],
              [-180, -85.0511],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5, -85.0511],
              [180, -85.0511],
              [180, 85.0511],
              [-5, 85.0511],
              [-5, -85.0511],
            ],
          ],
        },
      },
    ],
  };
}
