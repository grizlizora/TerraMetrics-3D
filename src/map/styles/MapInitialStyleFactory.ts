import type { StyleSpecification } from 'maplibre-gl';
import { getWorldBoundaryGeoJson, getGraticuleGeoJson } from '../worldFraming';

export class MapInitialStyleFactory {
  public static create(
    projection: 'globe' | 'mercator',
    theme: 'dark' | 'light'
  ): StyleSpecification {
    const isDark = theme === 'dark';
    const initialBg = isDark ? '#060a12' : '#f0f4f8';

    return {
      version: 8,
      projection: { type: projection },
      sources: {
        'world-base': {
          type: 'geojson',
          data: getWorldBoundaryGeoJson() as any,
        },
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 12,
          bounds: [-180, -85.051129, 180, 85.051129],
        },
        'world-graticule-source': {
          type: 'geojson',
          data: getGraticuleGeoJson() as any,
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': initialBg,
          },
        },
        {
          id: 'world-base-layer',
          type: 'fill',
          source: 'world-base',
          layout: {
            visibility: projection === 'mercator' ? 'visible' : 'none',
          },
          paint: {
            'fill-color': isDark ? '#060a12' : '#081a26',
            'fill-opacity': 1.0,
          },
        },
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 22,
        },
        {
          id: 'world-graticule-lines',
          type: 'line',
          source: 'world-graticule-source',
          layout: {
            visibility: 'none',
          },
          paint: {
            'line-color': isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            'line-width': 0.8,
            'line-dasharray': [2, 3],
          },
        },
      ],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    };
  }
}
