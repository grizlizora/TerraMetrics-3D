import type { Map as MapLibreMap } from 'maplibre-gl';
import type {
  ContinentName,
  CountryFeatureCollection,
  ISO3Code,
  SheetSnap,
} from '../../types';
import type { AudioManager } from '../../audio/AudioManager';
import type { MapLayerManager } from '../layers/MapLayerManager';
import { MapCameraAnimator } from '../camera/MapCameraAnimator';
import { dataLoader } from '../../data/DataLoader';

export class MapFramingCoordinator {
  public selectedCountryId: ISO3Code | null = null;
  public selectedContinent: ContinentName = 'World';

  public selectCountry(
    isoA3: ISO3Code | null,
    map: MapLibreMap | null,
    layers: MapLayerManager
  ): void {
    const oldIso = this.selectedCountryId;
    this.selectedCountryId = isoA3;
    layers.setSelectedCountry(map, isoA3, oldIso);
  }

  public flyToCountry(
    map: MapLibreMap | null,
    isoA3: ISO3Code,
    geoJsonData?: CountryFeatureCollection | null,
    snap: SheetSnap = 'half',
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe',
    audioManager?: AudioManager | null,
    layers?: MapLayerManager
  ): void {
    this.selectedContinent = 'World';
    if (layers) {
      this.selectCountry(isoA3, map, layers);
    } else {
      this.selectedCountryId = isoA3;
    }
    MapCameraAnimator.flyToCountry(
      map,
      isoA3,
      geoJsonData,
      snap,
      isSidebarCollapsed,
      projection,
      audioManager
    );
  }

  public flyToContinent(
    map: MapLibreMap | null,
    continent: ContinentName,
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe',
    audioManager?: AudioManager | null,
    layers?: MapLayerManager
  ): void {
    this.selectedContinent = continent;
    if (layers) {
      this.selectCountry(null, map, layers);
    } else {
      this.selectedCountryId = null;
    }
    MapCameraAnimator.flyToContinent(
      map,
      continent,
      snap,
      isSidebarCollapsed,
      projection,
      audioManager
    );
  }

  public resetToWorld(
    map: MapLibreMap | null,
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe',
    audioManager?: AudioManager | null,
    layers?: MapLayerManager
  ): void {
    this.selectedContinent = 'World';
    if (layers) {
      this.selectCountry(null, map, layers);
    } else {
      this.selectedCountryId = null;
    }
    MapCameraAnimator.flyToWorld(
      map,
      isSidebarCollapsed,
      projection,
      audioManager
    );
  }

  public updateViewportPadding(
    map: MapLibreMap | null,
    projection: 'globe' | 'mercator',
    snap: SheetSnap = 'peek',
    isSidebarCollapsed = false,
    geoJsonData?: CountryFeatureCollection | null,
    audioManager?: AudioManager | null
  ): void {
    if (!map || MapCameraAnimator.isFlying) return;
    const geoJson = geoJsonData || dataLoader.getGeoJson();
    if (this.selectedCountryId && geoJson) {
      this.flyToCountry(map, this.selectedCountryId, geoJson, snap, isSidebarCollapsed, projection, audioManager);
      return;
    }
    if (this.selectedContinent && this.selectedContinent !== 'World') {
      this.flyToContinent(map, this.selectedContinent, snap, isSidebarCollapsed, projection, audioManager);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.flyToContinent(map, 'World', snap, isSidebarCollapsed, projection, audioManager);
      return;
    }
    const padding = MapCameraAnimator.getViewportPadding(snap, isSidebarCollapsed);
    map.easeTo({
      padding,
      duration: 350,
      essential: true,
    });
  }

  public reframeSelection(
    map: MapLibreMap | null,
    projection: 'globe' | 'mercator',
    geoJsonData?: CountryFeatureCollection | null,
    audioManager?: AudioManager | null
  ): void {
    const geoJson = geoJsonData || dataLoader.getGeoJson();
    if (this.selectedCountryId && geoJson) {
      this.flyToCountry(map, this.selectedCountryId, geoJson, 'half', false, projection, audioManager);
    } else if (this.selectedContinent && this.selectedContinent !== 'World') {
      this.flyToContinent(map, this.selectedContinent, 'peek', false, projection, audioManager);
    }
  }
}
