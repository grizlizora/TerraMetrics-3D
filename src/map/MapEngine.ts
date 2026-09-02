import maplibregl, { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl';
import {
  AppLanguage,
  ContinentName,
  CountryFeatureCollection,
  ISO3Code,
  LabelFeatureCollection,
  SheetSnap,
  SpaceMode,
  SubMode,
  ThemeMode,
} from '../types';
import { DataLoader, dataLoader } from '../data/DataLoader';
import { AudioManager } from '../audio/AudioManager';
import { MapStyleExpressions } from './styles/MapStyleExpressions';
import { MapThemeManager } from './styles/MapThemeManager';
import { MapLayerManager } from './layers/MapLayerManager';
import { MapInteractionManager } from './interactions/MapInteractionManager';
import { MapCameraAnimator } from './camera/MapCameraAnimator';
import { MapSpaceController } from './space/MapSpaceController';
import { getWorldBoundaryGeoJson, getGraticuleGeoJson } from './worldFraming';

export class MapEngine {
  private containerId: string;
  public map: MapLibreMap | null = null;
  public hoveredCountryId: string | number | null = null;
  public selectedCountryId: ISO3Code | null = null;
  public selectedContinent: ContinentName = 'World';
  public currentTheme: ThemeMode = 'dark';
  public currentSubMode: SubMode = 'religion';
  public currentLang: AppLanguage = 'uk';
  public currentProjection: 'globe' | 'mercator' = 'globe';

  public onCountrySelect: ((iso: ISO3Code, name: string) => void) | null = null;
  public onContinentSelect: ((continent: ContinentName) => void) | null = null;
  public audioManager: AudioManager | null = null;

  // Submodules
  public readonly layers: MapLayerManager;
  public readonly interactions: MapInteractionManager;
  public readonly spaceController: MapSpaceController;

  public get spaceEngine() {
    return this.spaceController.spaceEngine;
  }
  public set spaceEngine(engine) {
    this.spaceController.spaceEngine = engine;
  }
  public get spaceBridge() {
    return this.spaceController.spaceBridge;
  }
  public set spaceBridge(bridge) {
    this.spaceController.spaceBridge = bridge;
  }
  public get currentSpaceMode(): SpaceMode {
    return this.spaceController.currentSpaceMode;
  }
  public set currentSpaceMode(mode: SpaceMode) {
    this.spaceController.currentSpaceMode = mode;
  }

  private onContextLostHandler: ((e: Event) => void) | null = null;
  private onContextRestoredHandler: (() => void) | null = null;

  constructor(containerId: string) {
    this.containerId = containerId;
    this.layers = new MapLayerManager();
    this.interactions = new MapInteractionManager();
    this.spaceController = new MapSpaceController();
  }

  public calculateMercatorMinZoom(): number {
    return MapCameraAnimator.calculateMercatorMinZoom(this.map);
  }

  public getViewportPadding(
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false
  ): PaddingOptions {
    return MapCameraAnimator.getViewportPadding(snap, isSidebarCollapsed);
  }

  public getOptimalZoom(isSidebarCollapsed = false): number {
    return MapCameraAnimator.getOptimalZoom(isSidebarCollapsed);
  }

  public async init(
    dataLoader: DataLoader,
    initialLang: AppLanguage = 'uk',
    initialTheme: ThemeMode = 'dark',
    initialSubMode: SubMode = 'religion',
    initialProjection: 'globe' | 'mercator' = 'globe'
  ): Promise<void> {
    this.currentLang = initialLang;
    this.currentTheme = initialTheme;
    this.currentSubMode = initialSubMode;
    this.currentProjection = initialProjection;

    return new Promise((resolve) => {
      const isDark = this.currentTheme === 'dark';
      const initialBg = isDark ? '#060a12' : '#f0f4f8';

      const dpr =
        typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.0) : 1;

      const initialStyle: any = {
        version: 8,
        projection: { type: this.currentProjection },
        sources: {
          'world-base': {
            type: 'geojson',
            data: getWorldBoundaryGeoJson(),
          },
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            bounds: [-180, -85.051129, 180, 85.051129],
          },
          'world-graticule-source': {
            type: 'geojson',
            data: getGraticuleGeoJson(),
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

      this.map = new maplibregl.Map({
        container: this.containerId,
        pixelRatio: dpr,
        style: initialStyle,
        center: [15, 0],
        zoom: this.getOptimalZoom(false),
        attributionControl: false,
        maxPitch: this.currentProjection === 'mercator' ? 0 : 65,
        minPitch: 0,
        pitch: 0,
        bearing: 0,
        trackResize: true,
        fadeDuration: 300,
        localIdeographFontFamily: 'sans-serif',
      });

      const canvas = this.map.getCanvas();
      if (canvas) {
        this.onContextLostHandler = (e: Event) => {
          e.preventDefault();
          console.warn('[MapEngine] WebGL Context Lost.');
        };
        this.onContextRestoredHandler = () => {
          console.info('[MapEngine] WebGL Context Restored. Re-initializing data layers.');
          if (this.layers.pendingGeoJson) {
            this.setData(this.layers.pendingGeoJson, this.layers.pendingLabelsGeoJson);
          }
        };
        canvas.addEventListener('webglcontextlost', this.onContextLostHandler, false);
        canvas.addEventListener('webglcontextrestored', this.onContextRestoredHandler, false);
      }

      this.map.on('load', () => {
        if (!this.map) return;

        this.map.setPadding(this.getViewportPadding('peek', false));

        this.layers.setupWorldFramingLayers(
          this.map,
          this.currentProjection,
          this.currentTheme === 'dark'
        );

        this.interactions.bindEvents(this.map, {
          onCountrySelect: (iso, name) => {
            this.selectCountry(iso);
            this.onCountrySelect?.(iso, name);
          },
          onHoverChange: (newId, oldId) => {
            this.hoveredCountryId = newId;
            this.layers.setHoveredCountry(this.map, newId, oldId);
          },
          getLanguage: () => this.currentLang,
        });

        if (this.layers.pendingGeoJson) {
          this.setData(this.layers.pendingGeoJson, this.layers.pendingLabelsGeoJson);
        }

        this.setTheme(this.currentTheme);
        this.spaceController.warmUpIdle(this.map, this.currentLang);

        resolve();
      });
    });
  }

  public setData(
    geoJsonData: CountryFeatureCollection,
    labelsGeoJson: LabelFeatureCollection | null = null
  ) {
    this.layers.setData(
      this.map,
      geoJsonData,
      labelsGeoJson,
      this.currentSubMode,
      this.currentTheme,
      this.currentLang,
      this.selectedCountryId
    );
  }

  public setProjection(mode: 'globe' | 'mercator') {
    this.currentProjection = mode;
    if (!this.map) return;

    this.map.stop();
    this.map.setMaxBounds(null);

    if (this.map.getLayer('world-base-layer')) {
      this.map.setLayoutProperty(
        'world-base-layer',
        'visibility',
        mode === 'mercator' ? 'visible' : 'none'
      );
    }

    if (mode === 'mercator') {
      const minZ = this.calculateMercatorMinZoom();
      this.map.setMinZoom(minZ);
      this.map.setMaxPitch(0);
      this.map.setMinPitch(0);
      this.map.setRenderWorldCopies(false);
      this.map.setProjection({ type: 'mercator' });

      this.interactions.configureGesturesForProjection(this.map, 'mercator');

      if (this.map.getLayer('world-graticule-lines')) {
        this.map.setLayoutProperty('world-graticule-lines', 'visibility', 'none');
      }

      (this.map.transform as any)?.setConstrainOverride?.(
        MapCameraAnimator.createMercatorConstrainFunction(this.map)
      );
      this.map.setMaxBounds([[-180, -85.051128], [180, 85.051128]]);

      const currentCenter = this.map.getCenter();
      const targetLat = Math.max(-60, Math.min(60, currentCenter?.lat ?? 20));
      const targetLng = currentCenter?.lng ?? 15;

      this.map.easeTo({
        center: [targetLng, targetLat],
        zoom: Math.max(minZ, this.getOptimalZoom()),
        pitch: 0,
        bearing: 0,
        duration: 350,
        essential: true,
      });
    } else {
      (this.map.transform as any)?.setConstrainOverride?.(null);
      this.map.setMaxBounds(null);

      this.map.setMinZoom(0.5);
      this.map.setProjection({ type: 'globe' });

      this.map.setMaxPitch(65);
      this.map.setMinPitch(0);

      this.interactions.configureGesturesForProjection(this.map, 'globe');

      if (this.map.getLayer('world-graticule-lines')) {
        this.map.setLayoutProperty('world-graticule-lines', 'visibility', 'none');
      }

      this.map.easeTo({ pitch: 0, duration: 350, essential: true });
    }

    this.setTheme(this.currentTheme);
    this.map.triggerRepaint();

    // Reframe current selection in the new projection
    const geoJson = dataLoader.getGeoJson();
    if (this.selectedCountryId && geoJson) {
      this.flyToCountry(this.selectedCountryId, geoJson);
    } else if (this.selectedContinent && this.selectedContinent !== 'World') {
      this.flyToContinent(this.selectedContinent);
    }
  }

  public onResize() {
    if (!this.map) return;
    if (this.currentProjection === 'mercator') {
      const minZ = this.calculateMercatorMinZoom();
      this.map.setMinZoom(minZ);
      if (this.map.getZoom() < minZ) {
        this.map.setZoom(minZ);
      }
    }
  }

  public updateViewportPadding(snap: SheetSnap = 'peek', isSidebarCollapsed = false) {
    if (!this.map || MapCameraAnimator.isFlying) return;
    const geoJson = dataLoader.getGeoJson();
    if (this.selectedCountryId && geoJson) {
      this.flyToCountry(this.selectedCountryId, geoJson, snap, isSidebarCollapsed);
      return;
    }
    if (this.selectedContinent && this.selectedContinent !== 'World') {
      this.flyToContinent(this.selectedContinent, snap, isSidebarCollapsed);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.flyToContinent('World', snap, isSidebarCollapsed);
      return;
    }
    const padding = this.getViewportPadding(snap, isSidebarCollapsed);
    this.map.easeTo({
      padding,
      duration: 350,
      essential: true,
    });
  }

  public setSpaceMode(mode: SpaceMode) {
    this.spaceController.setSpaceMode(mode, this.map, this.currentLang);
  }

  public setSpaceLabelsVisible(visible: boolean) {
    this.spaceController.setSpaceLabelsVisible(visible, this.map);
  }

  public setTimeScale(scale: number) {
    this.spaceController.setTimeScale(scale, this.map);
  }

  public getFillColorExpression(subMode: SubMode): any {
    return MapStyleExpressions.getFillColorExpression(subMode);
  }

  public setSubMode(subMode: SubMode) {
    this.currentSubMode = subMode;
    if (this.map && this.map.getLayer('country-fills')) {
      this.map.setPaintProperty(
        'country-fills',
        'fill-color',
        MapStyleExpressions.getFillColorExpression(subMode)
      );
    }
  }

  public setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    MapThemeManager.applyTheme(this.map, theme, this.currentProjection);
    if (theme === 'light') {
      this.spaceController.setSpaceMode('none', this.map, this.currentLang);
    }
  }

  public updateLanguage(lang: AppLanguage) {
    this.currentLang = lang;
    this.layers.updateLanguage(this.map, lang);
    if (this.spaceEngine) {
      this.spaceEngine.setLanguage(lang);
    }
  }

  public selectCountry(isoA3: ISO3Code | null) {
    const oldIso = this.selectedCountryId;
    this.selectedCountryId = isoA3;
    this.layers.setSelectedCountry(this.map, isoA3, oldIso);
  }

  public flyToCountry(
    isoA3: ISO3Code,
    geoJsonData?: CountryFeatureCollection | null,
    snap: SheetSnap = 'half',
    isSidebarCollapsed = false
  ) {
    this.selectedContinent = 'World';
    this.selectCountry(isoA3);
    MapCameraAnimator.flyToCountry(
      this.map,
      isoA3,
      geoJsonData,
      snap,
      isSidebarCollapsed,
      this.currentProjection,
      this.audioManager
    );
  }

  public flyToContinent(
    continent: ContinentName,
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false
  ) {
    this.selectedContinent = continent;
    this.selectCountry(null);
    MapCameraAnimator.flyToContinent(
      this.map,
      continent,
      snap,
      isSidebarCollapsed,
      this.currentProjection,
      this.audioManager
    );
  }

  public resetToWorld(isSidebarCollapsed = false) {
    this.selectedContinent = 'World';
    this.selectCountry(null);
    MapCameraAnimator.flyToWorld(
      this.map,
      isSidebarCollapsed,
      this.currentProjection,
      this.audioManager
    );
  }

  public waitForFirstFrame(sourceId = 'countries', timeoutMs = 3000): Promise<void> {
    return this.layers.waitForFirstFrame(this.map, sourceId, timeoutMs);
  }

  public destroy() {
    this.interactions.unbindEvents(this.map!);
    this.spaceController.destroy(this.map);

    const canvas = this.map?.getCanvas();
    if (canvas) {
      if (this.onContextLostHandler) {
        canvas.removeEventListener('webglcontextlost', this.onContextLostHandler);
      }
      if (this.onContextRestoredHandler) {
        canvas.removeEventListener('webglcontextrestored', this.onContextRestoredHandler);
      }
    }

    this.onCountrySelect = null;
    this.onContinentSelect = null;
    this.selectedCountryId = null;
    this.hoveredCountryId = null;
    this.layers.pendingGeoJson = null;
    this.layers.pendingLabelsGeoJson = null;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
