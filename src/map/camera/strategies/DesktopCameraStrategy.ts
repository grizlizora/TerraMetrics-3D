import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl';
import type { ContinentName } from '../../../types';
import type {
  AvailableViewportRect,
  CameraContext,
  CameraFlightConfig,
  CameraTarget,
  ICameraStrategy,
} from '../types';
import { ViewportBoundsCalculator } from '../ViewportBoundsCalculator';
import {
  CONTINENT_BOUNDING_BOXES,
  CONTINENT_CENTERS,
} from '../framingConstants';

export class DesktopCameraStrategy implements ICameraStrategy {
  public readonly platformType = 'desktop';

  public getViewportPadding(context: CameraContext): PaddingOptions {
    const { windowWidth, isSidebarCollapsed } = context;
    const sidebarWidth = windowWidth >= 1536 ? 460 : windowWidth >= 1280 ? 440 : 410;
    const leftPad = isSidebarCollapsed ? 24 : sidebarWidth + 32;

    return {
      top: 80,
      bottom: 32,
      left: leftPad,
      right: 32,
    };
  }

  public getAvailableViewportRect(context: CameraContext): AvailableViewportRect {
    const { windowWidth, windowHeight } = context;
    const padding = this.getViewportPadding(context);

    const padLeft = padding.left ?? 0;
    const padRight = padding.right ?? 0;
    const padTop = padding.top ?? 0;
    const padBottom = padding.bottom ?? 0;

    const x = padLeft;
    const y = padTop;
    const width = Math.max(200, windowWidth - padLeft - padRight);
    const height = Math.max(200, windowHeight - padTop - padBottom);

    return {
      x,
      y,
      width,
      height,
      screenWidth: windowWidth,
      screenHeight: windowHeight,
      padding,
    };
  }

  public getOptimalZoom(context: CameraContext): number {
    const { windowWidth, windowHeight, isSidebarCollapsed } = context;
    const sidebarWidth = windowWidth >= 1536 ? 460 : windowWidth >= 1280 ? 440 : 410;
    const availableW = isSidebarCollapsed ? windowWidth - 48 : windowWidth - sidebarWidth - 64;
    const availableH = windowHeight - 48;
    const minDim = Math.min(availableW, availableH);

    return Math.max(1.6, Math.min(2.8, Math.log2((minDim * 0.74) / 163)));
  }

  public calculateCountryFlight(
    target: CameraTarget,
    context: CameraContext,
    _map: MapLibreMap
  ): CameraFlightConfig {
    const padding = this.getViewportPadding(context);
    const viewport = this.getAvailableViewportRect(context);

    const fit = ViewportBoundsCalculator.calculateCountryFit(target.bounds, viewport, {
      minZoom: 1.6,
      maxZoom: 6.0,
      marginFactor: 0.78,
    });

    const lat = fit.center[1];
    const pitch =
      context.projection === 'mercator'
        ? 0
        : Math.max(0, 24 - Math.max(0, Math.abs(lat) - 45) * 0.7);

    return {
      center: fit.center,
      zoom: fit.zoom,
      pitch,
      bearing: 0,
      padding,
      duration: 1500,
      curve: 1.32,
    };
  }

  public calculateContinentFlight(
    continent: ContinentName,
    bounds: [number, number, number, number],
    defaultCenter: [number, number],
    context: CameraContext,
    _map: MapLibreMap
  ): CameraFlightConfig {
    if (continent === 'World') {
      return this.calculateWorldFlight(context);
    }

    const padding = this.getViewportPadding(context);
    const targetBounds = bounds || CONTINENT_BOUNDING_BOXES[continent] || CONTINENT_BOUNDING_BOXES.World;
    const viewport = this.getAvailableViewportRect(context);

    const fit = ViewportBoundsCalculator.calculateCountryFit(targetBounds, viewport, {
      minZoom: 1.2,
      maxZoom: 3.5,
      marginFactor: 0.80,
    });

    const anchorCenter = defaultCenter || CONTINENT_CENTERS[continent] || fit.center;

    return {
      center: [anchorCenter[0], anchorCenter[1]],
      zoom: fit.zoom,
      pitch: 0,
      bearing: 0,
      padding,
      duration: 1500,
      curve: 1.32,
    };
  }

  public calculateWorldFlight(context: CameraContext): CameraFlightConfig {
    const padding = this.getViewportPadding(context);

    return {
      center: [15, 0],
      zoom: 1.45,
      pitch: 0,
      bearing: 0,
      padding,
      duration: 1400,
      curve: 1.3,
    };
  }
}

export const desktopCameraStrategy = new DesktopCameraStrategy();
