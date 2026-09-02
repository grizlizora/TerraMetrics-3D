import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type {
  AppLanguage,
  CountryFeatureCollection,
  ISO3Code,
  LabelFeatureCollection,
  SubMode,
  ThemeMode,
} from '../../types';
import { getWorldBoundaryGeoJson, getGraticuleGeoJson } from '../worldFraming';
import { MapStyleExpressions } from '../styles/MapStyleExpressions';
import { MapThemeManager } from '../styles/MapThemeManager';

export class MapLayerManager {
  public isDataLayersSetup = false;
  public pendingGeoJson: CountryFeatureCollection | null = null;
  public pendingLabelsGeoJson: LabelFeatureCollection | null = null;

  public setupWorldFramingLayers(
    map: MapLibreMap,
    projection: 'globe' | 'mercator',
    isDark: boolean
  ) {
    if (!map.getSource('world-base')) {
      map.addSource('world-base', {
        type: 'geojson',
        data: getWorldBoundaryGeoJson(),
      });
    }

    if (!map.getLayer('world-base-layer')) {
      map.addLayer({
        id: 'world-base-layer',
        type: 'fill',
        source: 'world-base',
        layout: {
          visibility: projection === 'mercator' ? 'visible' : 'none',
        },
        paint: {
          'fill-color': isDark ? '#060a12' : '#f0f4f8',
          'fill-opacity': 1.0,
        },
      });
    }

    if (!map.getSource('satellite')) {
      map.addSource('satellite', {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 12,
        bounds: [-180, -85.051129, 180, 85.051129],
      });
    }

    if (!map.getLayer('satellite-layer')) {
      map.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        paint: {
          'raster-opacity': 1.0,
          'raster-fade-duration': 0,
        },
      });
    }

    if (!map.getSource('world-graticule-source')) {
      map.addSource('world-graticule-source', {
        type: 'geojson',
        data: getGraticuleGeoJson(),
      });
    }

    if (!map.getLayer('world-graticule-lines')) {
      map.addLayer({
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
      });
    }
  }

  public setData(
    map: MapLibreMap | null,
    geoJsonData: CountryFeatureCollection,
    labelsGeoJson: LabelFeatureCollection | null,
    currentSubMode: SubMode,
    currentTheme: ThemeMode,
    currentLang: AppLanguage,
    selectedCountryId: ISO3Code | null
  ) {
    if (!geoJsonData) return;

    this.pendingGeoJson = geoJsonData;
    this.pendingLabelsGeoJson = labelsGeoJson;

    if (!map) return;

    const countriesSource = map.getSource('countries') as GeoJSONSource | undefined;
    const labelsSource = map.getSource('country-labels-source') as GeoJSONSource | undefined;

    if (countriesSource) {
      countriesSource.setData(geoJsonData as any);
      if (labelsGeoJson) {
        if (labelsSource) {
          labelsSource.setData(labelsGeoJson as any);
        } else if (map.isStyleLoaded()) {
          map.addSource('country-labels-source', {
            type: 'geojson',
            data: labelsGeoJson as any,
            tolerance: 0.375,
          });
        }
      }
    } else {
      this.setupDataLayers(map, geoJsonData, labelsGeoJson, currentSubMode, currentTheme, currentLang);
    }

    if (labelsGeoJson && map.getSource('country-labels-source') && !map.getLayer('country-labels')) {
      this.addCountryLabelsLayer(map, currentLang);
    }

    if (map.getLayer('country-fills')) {
      map.setPaintProperty(
        'country-fills',
        'fill-color',
        MapStyleExpressions.getFillColorExpression(currentSubMode)
      );
    }
    MapThemeManager.applyTheme(map, currentTheme, 'globe');
    this.updateLanguage(map, currentLang);

    if (selectedCountryId) {
      this.setSelectedCountry(map, selectedCountryId, null);
    }

    map.triggerRepaint();
  }

  public setupDataLayers(
    map: MapLibreMap,
    geoJsonData: CountryFeatureCollection,
    labelsGeoJson: LabelFeatureCollection | null,
    currentSubMode: SubMode,
    currentTheme: ThemeMode,
    currentLang: AppLanguage
  ) {
    if (!geoJsonData || this.isDataLayersSetup) return;

    if (!map.getSource('countries')) {
      map.addSource('countries', {
        type: 'geojson',
        data: geoJsonData as any,
        promoteId: 'ISO3166-1-Alpha-3',
        tolerance: 0.375,
      });
    }

    if (labelsGeoJson && !map.getSource('country-labels-source')) {
      map.addSource('country-labels-source', {
        type: 'geojson',
        data: labelsGeoJson as any,
        tolerance: 0.375,
      });
    }

    if (!map.getLayer('country-fills')) {
      map.addLayer({
        id: 'country-fills',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': MapStyleExpressions.getFillColorExpression(currentSubMode),
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.88,
            ['boolean', ['feature-state', 'hover'], false],
            0.72,
            0.45,
          ],
          'fill-color-transition': { duration: 300 },
          'fill-opacity-transition': { duration: 200 },
        },
      });
    }

    if (!map.getLayer('country-borders')) {
      map.addLayer({
        id: 'country-borders',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color':
            currentTheme === 'dark'
              ? 'rgba(255, 255, 255, 0.45)'
              : 'rgba(255, 255, 255, 0.65)',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.5,
            ['boolean', ['feature-state', 'hover'], false],
            1.8,
            0.8,
          ],
        },
      });
    }

    if (!map.getLayer('country-borders-inner-glow')) {
      map.addLayer({
        id: 'country-borders-inner-glow',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 4.0,
          'line-blur': 3.0,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.8,
            0.0,
          ],
        },
      });
    }

    if (labelsGeoJson && map.getSource('country-labels-source') && !map.getLayer('country-labels')) {
      this.addCountryLabelsLayer(map, currentLang);
    }

    this.isDataLayersSetup = true;
  }

  public addCountryLabelsLayer(map: MapLibreMap, currentLang: AppLanguage) {
    if (map.getLayer('country-labels') || !map.getSource('country-labels-source')) return;

    map.addLayer({
      id: 'country-labels',
      type: 'symbol',
      source: 'country-labels-source',
      minzoom: 0,
      maxzoom: 22,
      layout: {
        'text-field': currentLang === 'uk' ? ['get', 'name_uk'] : ['get', 'name_en'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 8,
          0.8, 9,
          1.5, 10,
          3, 11,
          6, 14,
          10, 18,
        ],
        'text-font': ['Open Sans Regular'],
        'symbol-sort-key': ['-', 0, ['coalesce', ['get', 'population'], 0]],
        'symbol-placement': 'point',
        'symbol-z-order': 'auto',
        'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.2,
        'text-justify': 'auto',
        'text-max-width': 7,
        'text-padding': 1.0,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0, 0, 0, 0.88)',
        'text-halo-width': 1.8,
        'text-halo-blur': 0.5,
        'text-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0.3, 0.0,
          0.6, 0.85,
          1.0, 1.0,
        ],
      },
    });
  }

  public setHoveredCountry(
    map: MapLibreMap | null,
    newId: string | number | null,
    oldId: string | number | null
  ) {
    if (!map) return;
    if (oldId !== null) {
      try {
        map.setFeatureState({ source: 'countries', id: oldId }, { hover: false });
      } catch {}
    }
    if (newId !== null) {
      try {
        map.setFeatureState({ source: 'countries', id: newId }, { hover: true });
      } catch {}
    }
  }

  public setSelectedCountry(
    map: MapLibreMap | null,
    newIso: ISO3Code | null,
    oldIso: ISO3Code | null
  ) {
    if (!map) return;
    if (oldIso) {
      try {
        map.setFeatureState({ source: 'countries', id: oldIso }, { selected: false });
      } catch {}
    }
    if (newIso) {
      try {
        map.setFeatureState({ source: 'countries', id: newIso }, { selected: true });
      } catch {}
    }
  }

  public updateLanguage(map: MapLibreMap | null, lang: AppLanguage) {
    if (!map || !map.getLayer('country-labels')) return;
    map.setLayoutProperty(
      'country-labels',
      'text-field',
      lang === 'uk' ? ['get', 'name_uk'] : ['get', 'name_en']
    );
  }

  public waitForFirstFrame(
    map: MapLibreMap | null,
    sourceId = 'countries',
    timeoutMs = 3000
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!map) {
        resolve();
        return;
      }

      let resolved = false;
      let checkState: (() => void) | null = null;

      const finish = () => {
        if (!resolved) {
          resolved = true;
          if (map && checkState) {
            map.off('idle', checkState);
            map.off('sourcedata', checkState);
            map.off('render', checkState);
          }
          resolve();
        }
      };

      const timer = setTimeout(finish, timeoutMs);

      checkState = () => {
        if (!map) {
          finish();
          return;
        }

        const sourceLoaded = map.getSource(sourceId) && map.isSourceLoaded(sourceId);
        const styleLoaded = map.isStyleLoaded();
        const hasLayers = !!map.getLayer('country-fills');

        if (sourceLoaded && styleLoaded && hasLayers) {
          clearTimeout(timer);
          finish();
        }
      };

      if (map.isStyleLoaded() && map.getSource(sourceId) && map.isSourceLoaded(sourceId)) {
        finish();
        return;
      }

      map.on('idle', checkState);
      map.on('sourcedata', checkState);
      map.on('render', checkState);
    });
  }
}
