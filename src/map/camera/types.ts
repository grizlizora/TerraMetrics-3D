import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl';
import type { ContinentName, ISO3Code, SheetSnap } from '../../types';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface AvailableViewportRect {
  width: number;
  height: number;
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
  padding: PaddingOptions;
}

export interface CameraContext {
  isMobile: boolean;
  windowWidth: number;
  windowHeight: number;
  safeArea: SafeAreaInsets;
  sheetSnap: SheetSnap;
  isSidebarCollapsed: boolean;
  projection: 'globe' | 'mercator';
}

export interface CameraTarget {
  iso?: ISO3Code;
  name?: string;
  center: [number, number];
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface CameraFlightConfig {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  padding: PaddingOptions;
  duration: number;
  curve: number;
}

export interface ICameraStrategy {
  readonly platformType: 'desktop' | 'mobile';
  getViewportPadding(context: CameraContext): PaddingOptions;
  getOptimalZoom(context: CameraContext): number;
  calculateCountryFlight(
    target: CameraTarget,
    context: CameraContext,
    map: MapLibreMap
  ): CameraFlightConfig;
  calculateContinentFlight(
    continent: ContinentName,
    bounds: [number, number, number, number],
    defaultCenter: [number, number],
    context: CameraContext,
    map: MapLibreMap
  ): CameraFlightConfig;
  calculateWorldFlight(context: CameraContext): CameraFlightConfig;
}
