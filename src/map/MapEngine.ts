import maplibregl, { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl';
import type {
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
import type { DataLoader } from '../data/DataLoader';
import type { AudioManager } from '../audio/AudioManager';
import { MapStyleExpressions } from './styles/MapStyleExpressions';
import { MapThemeManager } from './styles/MapThemeManager';
import { MapInitialStyleFactory } from './styles/MapInitialStyleFactory';
import { MapLayerManager } from './layers/MapLayerManager';
import { MapInteractionManager } from './interactions/MapInteractionManager';
import { MapCameraAnimator } from './camera/MapCameraAnimator';
import { MapSpaceController } from './space/MapSpaceController';
import { MapProjectionManager } from './projection/MapProjectionManager';
import { MapFramingCoordinator } from './framing/MapFramingCoordinator';
import { MapContextCoordinator } from './context/MapContextCoordinator';

export class MapEngine {
  private containerId: string;
  public map: MapLibreMap | null = null;
  public hoveredCountryId: string | number | null = null;
  public currentTheme: ThemeMode = 'dark';
  public currentSubMode: SubMode = 'religion';
  public currentLang: AppLanguage = 'uk';

  public onCountrySelect: ((iso: ISO3Code, name: string) => void) | null = null;
  public onContinentSelect: ((continent: ContinentName) => void) | null = null;
  public audioManager: AudioManager | null = null;

  // Submodules & Coordinators
  public readonly layers: MapLayerManager;
  public readonly interactions: MapInteractionManager;
  public readonly spaceController: MapSpaceController;
  public readonly projectionManager: MapProjectionManager;
  public readonly framing: MapFramingCoordinator;
  public readonly contextCoordinator: MapContextCoordinator;

  // Backward-compatible getters and setters
  public get selectedCountryId(): ISO3Code | null {
    return this.framing.selectedCountryId;
  }
  public set selectedCountryId(iso: ISO3Code | null) {
    this.framing.selectedCountryId = iso;
  }

  public get selectedContinent(): ContinentName {
    return this.framing.selectedContinent;
  }
  public set selectedContinent(continent: ContinentName) {
    this.framing.selectedContinent = continent;
  }

  public get currentProjection(): 'globe' | 'mercator' {
    return this.projectionManager.projection;
  }
  public set currentProjection(mode: 'globe' | 'mercator') {
    this.setProjection(mode);
  }

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

  constructor(containerId: string) {
    this.containerId = containerId;
    this.layers = new MapLayerManager();
    this.interactions = new MapInteractionManager();
    this.spaceController = new MapSpaceController();
    this.projectionManager = new MapProjectionManager('globe');
    this.framing = new MapFramingCoordinator();
    this.contextCoordinator = new MapContextCoordinator();
  }

  public calculateMercatorMinZoom(): number {
    return this.projectionManager.calculateMercatorMinZoom(this.map);
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
    _dataLoader: DataLoader,
    initialLang: AppLanguage = 'uk',
    initialTheme: ThemeMode = 'dark',
    initialSubMode: SubMode = 'religion',
    initialProjection: 'globe' | 'mercator' = 'globe'
  ): Promise<void> {
    this.currentLang = initialLang;
    this.currentTheme = initialTheme;
    this.currentSubMode = initialSubMode;

    const effectiveProjection = this.projectionManager.projection || initialProjection;
    this.projectionManager.setProjection(effectiveProjection);

    return new Promise((resolve) => {
      const dpr =
        typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.0) : 1;

      const initialStyle = MapInitialStyleFactory.create(
        effectiveProjection,
        initialTheme
      );

      this.map = new maplibregl.Map({
        container: this.containerId,
        pixelRatio: dpr,
        style: initialStyle,
        center: [15, 0],
        zoom: this.getOptimalZoom(false),
        attributionControl: false,
        maxPitch: effectiveProjection === 'mercator' ? 0 : 65,
        minPitch: 0,
        pitch: 0,
        bearing: 0,
        trackResize: true,
        fadeDuration: 300,
        localIdeographFontFamily: 'sans-serif',
      });

      const canvas = this.map.getCanvas();
      if (canvas) {
        this.contextCoordinator.attach(canvas, {
          onRestoreStyleAndLayers: () => {
            this.layers.reset();
            if (this.layers.pendingGeoJson) {
              this.setData(this.layers.pendingGeoJson, this.layers.pendingLabelsGeoJson);
            }
          },
          onRestoreSpaceBridge: () => {
            if (this.map && this.spaceController.spaceBridge) {
              this.spaceController.warmUpIdle(this.map, this.currentLang);
            }
          },
          onRefreshTheme: () => {
            this.setTheme(this.currentTheme);
          },
        });
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
  ): void {
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

  public setProjection(mode: 'globe' | 'mercator'): void {
    if (!this.map) {
      this.projectionManager.setProjection(mode);
      return;
    }

    this.projectionManager.setProjection(mode, {
      map: this.map,
      interactions: this.interactions,
      onThemeRefresh: () => this.setTheme(this.currentTheme),
      onReframeSelection: () => {
        this.framing.reframeSelection(
          this.map,
          mode,
          this.layers.pendingGeoJson,
          this.audioManager
        );
      },
    });
  }

  public onResize(): void {
    this.projectionManager.onResize(this.map);
  }

  public updateViewportPadding(snap: SheetSnap = 'peek', isSidebarCollapsed = false): void {
    this.framing.updateViewportPadding(
      this.map,
      this.currentProjection,
      snap,
      isSidebarCollapsed,
      this.layers.pendingGeoJson,
      this.audioManager
    );
  }

  public setSpaceMode(mode: SpaceMode): void {
    this.spaceController.setSpaceMode(mode, this.map, this.currentLang);
  }

  public setSpaceLabelsVisible(visible: boolean): void {
    this.spaceController.setSpaceLabelsVisible(visible, this.map);
  }

  public setTimeScale(scale: number): void {
    this.spaceController.setTimeScale(scale, this.map);
  }

  public getFillColorExpression(subMode: SubMode): any {
    return MapStyleExpressions.getFillColorExpression(subMode);
  }

  public setSubMode(subMode: SubMode): void {
    this.currentSubMode = subMode;
    if (this.map && this.map.getLayer('country-fills')) {
      this.map.setPaintProperty(
        'country-fills',
        'fill-color',
        MapStyleExpressions.getFillColorExpression(subMode)
      );
    }
  }

  public setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    MapThemeManager.applyTheme(this.map, theme, this.currentProjection);
    if (theme === 'light') {
      this.spaceController.setSpaceMode('none', this.map, this.currentLang);
    }
  }

  public updateLanguage(lang: AppLanguage): void {
    this.currentLang = lang;
    this.layers.updateLanguage(this.map, lang);
    if (this.spaceEngine) {
      this.spaceEngine.setLanguage(lang);
    }
  }

  public selectCountry(isoA3: ISO3Code | null): void {
    this.framing.selectCountry(isoA3, this.map, this.layers);
  }

  public flyToCountry(
    isoA3: ISO3Code,
    geoJsonData?: CountryFeatureCollection | null,
    snap: SheetSnap = 'half',
    isSidebarCollapsed = false
  ): void {
    this.framing.flyToCountry(
      this.map,
      isoA3,
      geoJsonData,
      snap,
      isSidebarCollapsed,
      this.currentProjection,
      this.audioManager,
      this.layers
    );
  }

  public flyToContinent(
    continent: ContinentName,
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false
  ): void {
    this.framing.flyToContinent(
      this.map,
      continent,
      snap,
      isSidebarCollapsed,
      this.currentProjection,
      this.audioManager,
      this.layers
    );
  }

  public resetToWorld(isSidebarCollapsed = false): void {
    this.framing.resetToWorld(
      this.map,
      isSidebarCollapsed,
      this.currentProjection,
      this.audioManager,
      this.layers
    );
  }

  public waitForFirstFrame(sourceId = 'countries', timeoutMs = 3000): Promise<void> {
    return this.layers.waitForFirstFrame(this.map, sourceId, timeoutMs);
  }

  public destroy(): void {
    MapCameraAnimator.cancelActiveFlight(this.map, this.audioManager);
    this.contextCoordinator.detach();
    this.interactions.unbindEvents(this.map);
    this.projectionManager.cleanup(this.map);
    this.spaceController.destroy(this.map);

    this.onCountrySelect = null;
    this.onContinentSelect = null;
    this.framing.selectedCountryId = null;
    this.framing.selectedContinent = 'World';
    this.hoveredCountryId = null;
    this.layers.pendingGeoJson = null;
    this.layers.pendingLabelsGeoJson = null;

    if (this.map) {
      try {
        this.map.remove();
      } catch {}
      this.map = null;
    }
  }
}
