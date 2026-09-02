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

export class MobileCameraStrategy implements ICameraStrategy {
  public readonly platformType = 'mobile';

  public getViewportPadding(context: CameraContext): PaddingOptions {
    const { windowHeight, safeArea, sheetSnap } = context;
    const topBarOccupied = Math.max(88, safeArea.top + 56);

    let bottomPadding = (windowHeight < 700 ? 140 : 174) + safeArea.bottom;

    switch (sheetSnap) {
      case 'half':
        bottomPadding = Math.round(windowHeight * 0.48);
        break;
      case 'full':
        bottomPadding = Math.round(windowHeight * 0.50);
        break;
      case 'closed':
        bottomPadding = 50 + safeArea.bottom;
        break;
      case 'peek':
      default:
        bottomPadding = (windowHeight < 700 ? 140 : 174) + safeArea.bottom;
        break;
    }

    return {
      top: topBarOccupied,
      bottom: bottomPadding,
      left: 14,
      right: 14,
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
    const width = Math.max(160, windowWidth - padLeft - padRight);
    const height = Math.max(160, windowHeight - padTop - padBottom);

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
    const { windowWidth } = context;
    if (windowWidth <= 375) return 1.15;
    if (windowWidth <= 480) return 1.25;
    return 1.45;
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
      maxZoom: 5.8,
      marginFactor: 0.74,
    });

    return {
      center: fit.center,
      zoom: fit.zoom,
      pitch: 0,
      bearing: 0,
      padding,
      duration: 1250,
      curve: 1.38,
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
      maxZoom: 3.2,
      marginFactor: 0.76,
    });

    const anchorCenter = defaultCenter || CONTINENT_CENTERS[continent] || fit.center;

    return {
      center: [anchorCenter[0], anchorCenter[1]],
      zoom: fit.zoom,
      pitch: 0,
      bearing: 0,
      padding,
      duration: 1250,
      curve: 1.35,
    };
  }

  public calculateWorldFlight(context: CameraContext): CameraFlightConfig {
    const padding = this.getViewportPadding(context);
    const targetZoom = parseFloat(
      Math.max(1.10, Math.min(1.40, 1.25 + Math.log2(Math.max(320, context.windowWidth) / 390) * 0.35)).toFixed(2)
    );

    return {
      center: [15, 0],
      zoom: targetZoom,
      pitch: 0,
      bearing: 0,
      padding,
      duration: 1200,
      curve: 1.3,
    };
  }
}

export const mobileCameraStrategy = new MobileCameraStrategy();
