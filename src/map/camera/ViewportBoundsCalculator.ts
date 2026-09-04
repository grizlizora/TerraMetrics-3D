import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import type { AvailableViewportRect, SafeAreaInsets } from './types';

export class ViewportBoundsCalculator {
  /**
   * Safely resolves system Safe Area Insets (--sat, --sab, --sal, --sar) using live DOM probe
   */
  public static resolveSafeAreaInsets(isMobile: boolean): SafeAreaInsets {
    if (typeof document === 'undefined') {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    let probe = document.getElementById('safe-area-probe');
    if (!probe) {
      probe = document.createElement('div');
      probe.id = 'safe-area-probe';
      probe.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);pointer-events:none;visibility:hidden;z-index:-9999;';
      document.body.appendChild(probe);
    }

    const cs = getComputedStyle(probe);
    let sat = parseFloat(cs.paddingTop) || 0;
    let sab = parseFloat(cs.paddingBottom) || 0;
    let sal = parseFloat(cs.paddingLeft) || 0;
    let sar = parseFloat(cs.paddingRight) || 0;

    if (isMobile) {
      if (sat === 0) sat = typeof window !== 'undefined' && window.innerHeight > 700 ? 32 : 16;
      if (sab === 0) sab = typeof window !== 'undefined' && window.innerHeight > 700 ? 20 : 12;
    }

    return { top: sat, bottom: sab, left: sal, right: sar };
  }

  /**
   * Projects geographical coordinates [lng, lat] into Web Mercator world pixels at zoom level z.
   * (Base world size at zoom 0 is 512px).
   */
  public static latLngToWorldPx(lng: number, lat: number, zoom: number): { x: number; y: number } {
    const worldSize = 512 * Math.pow(2, zoom);
    const clampedLat = Math.max(-85.051128, Math.min(85.051128, lat));

    const x = ((lng + 180) / 360) * worldSize;
    const sinLat = Math.sin((clampedLat * Math.PI) / 180);
    const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
    const y =
      (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * worldSize;

    return { x, y };
  }

  /**
   * Unprojects Web Mercator world pixels back into geographical coordinates [lng, lat] at zoom level z.
   */
  public static worldPxToLatLng(x: number, y: number, zoom: number): [number, number] {
    const worldSize = 512 * Math.pow(2, zoom);
    const lng = (x / worldSize) * 360 - 180;
    const yNorm = 0.5 - y / worldSize;
    const lat = (360 / Math.PI) * Math.atan(Math.exp(2 * Math.PI * yNorm)) - 90;

    return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))];
  }

  /**
   * Normalizes Bounding Boxes crossing the 180° Anti-meridian (e.g. Russia, Fiji, New Zealand).
   */
  public static normalizeAntimeridianBounds(
    bounds: [number, number, number, number]
  ): [number, number, number, number] {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    if (minLng > maxLng || maxLng - minLng > 180) {
      const altMinLng = minLng < 0 ? minLng + 360 : minLng;
      const altMaxLng = maxLng < 0 ? maxLng + 360 : maxLng;
      const normalizedMin = Math.min(altMinLng, altMaxLng);
      const normalizedMax = Math.max(altMinLng, altMaxLng);
      return [normalizedMin, minLat, normalizedMax, maxLat];
    }
    return bounds;
  }

  /**
   * Mathematically computes the optimal Zoom level and Shifted Geographic Center
   * to fit any Bounding Box completely inside the Available Viewport Rectangle.
   */
  public static computeCameraFit(
    bounds: [number, number, number, number],
    viewport: AvailableViewportRect,
    options: {
      minZoom?: number;
      maxZoom?: number;
      marginFactor?: number; // 0.82 = 18% breathing margin
      sphericalPerspectiveFactor?: number;
      opticalCenterRatioY?: number;
    } = {}
  ): { center: [number, number]; zoom: number } {
    const {
      minZoom = 1.2,
      maxZoom = 6.2,
      marginFactor = 0.84,
      sphericalPerspectiveFactor = 1.06,
      opticalCenterRatioY = 0.54,
    } = options;

    const [minLng, minLat, maxLng, maxLat] = this.normalizeAntimeridianBounds(bounds);

    // 1. Calculate projected pixel dimensions at zoom 0
    const pMin = this.latLngToWorldPx(minLng, maxLat, 0);
    const pMax = this.latLngToWorldPx(maxLng, minLat, 0);

    const deltaX0 = Math.max(1, Math.abs(pMax.x - pMin.x));
    const deltaY0 = Math.max(1, Math.abs(pMax.y - pMin.y));

    // 2. Available viewport dimensions
    const availW = Math.max(120, viewport.width * marginFactor);
    const availH = Math.max(120, viewport.height * marginFactor);

    // 3. Compute scale factors
    const scaleX = availW / (deltaX0 * sphericalPerspectiveFactor);
    const scaleY = availH / (deltaY0 * sphericalPerspectiveFactor);
    const scale = Math.min(scaleX, scaleY);

    const calculatedZoom = Math.log2(Math.max(0.001, scale));
    const targetZoom = Math.max(minZoom, Math.min(maxZoom, calculatedZoom));

    // 4. Center of the bounding box at target zoom in world pixels
    const pMinTarget = this.latLngToWorldPx(minLng, maxLat, targetZoom);
    const pMaxTarget = this.latLngToWorldPx(maxLng, minLat, targetZoom);
    const centerWorldX = (pMinTarget.x + pMaxTarget.x) / 2;
    const centerWorldY = (pMinTarget.y + pMaxTarget.y) / 2;

    // 5. Optical center of the available viewport relative to screen top-left
    const targetScreenCenterX = viewport.x + viewport.width / 2;
    const targetScreenCenterY = viewport.y + viewport.height * opticalCenterRatioY;

    // Screen physical center
    const physicalScreenCenterX = viewport.screenWidth / 2;
    const physicalScreenCenterY = viewport.screenHeight / 2;

    // Offset in screen pixels
    const deltaScreenX = targetScreenCenterX - physicalScreenCenterX;
    const deltaScreenY = targetScreenCenterY - physicalScreenCenterY;

    // Shift camera target in world pixels
    const cameraWorldX = centerWorldX - deltaScreenX;
    const cameraWorldY = centerWorldY - deltaScreenY;

    // Unproject to geographical coordinates
    const center = this.worldPxToLatLng(cameraWorldX, cameraWorldY, targetZoom);
    center[0] = ((((center[0] + 180) % 360) + 360) % 360) - 180;

    return { center, zoom: parseFloat(targetZoom.toFixed(2)) };
  }

  /**
   * Computes the Shifted Geographic Center to position any specific [lng, lat] point
   * into the optical center of the Available Viewport Rectangle at a target zoom.
   */
  public static computePointFit(
    lng: number,
    lat: number,
    targetZoom: number,
    viewport: AvailableViewportRect,
    opticalCenterRatioY = 0.54
  ): { center: [number, number]; zoom: number } {
    const pTarget = this.latLngToWorldPx(lng, lat, targetZoom);

    const targetScreenCenterX = viewport.x + viewport.width / 2;
    const targetScreenCenterY = viewport.y + viewport.height * opticalCenterRatioY;

    const physicalScreenCenterX = viewport.screenWidth / 2;
    const physicalScreenCenterY = viewport.screenHeight / 2;

    const deltaScreenX = targetScreenCenterX - physicalScreenCenterX;
    const deltaScreenY = targetScreenCenterY - physicalScreenCenterY;

    const cameraWorldX = pTarget.x - deltaScreenX;
    const cameraWorldY = pTarget.y - deltaScreenY;

    const center = this.worldPxToLatLng(cameraWorldX, cameraWorldY, targetZoom);
    center[0] = ((((center[0] + 180) % 360) + 360) % 360) - 180;

    return { center, zoom: parseFloat(targetZoom.toFixed(2)) };
  }

  /**
   * Mathematically computes the optimal Direct Frontal 3D Globe Zoom level and Center coordinates
   * to fit any country bounding box into the visible viewport rectangle without spherical tilting or curvature distortion.
   *
   * Formula:
   *   z = log2( 0.703125 * marginFactor * min( viewport.width / thetaX, viewport.height / thetaY ) )
   *   where 0.703125 = 360 / 512 is the MapLibre Globe arc constant.
   */
  public static calculateCountryFit(
    bounds: [number, number, number, number],
    viewport: AvailableViewportRect,
    options: {
      minZoom?: number;
      maxZoom?: number;
      marginFactor?: number;
    } = {}
  ): { center: [number, number]; zoom: number } {
    const {
      minZoom = 1.4,
      maxZoom = 5.8,
      marginFactor = 0.76,
    } = options;

    const [minLng, minLat, maxLng, maxLat] = this.normalizeAntimeridianBounds(bounds);

    const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const deltaLatDeg = Math.abs(maxLat - minLat);
    const deltaLngDeg = Math.abs(maxLng - minLng);

    // Spherical great-circle angular span in degrees
    const thetaX = Math.max(0.02, deltaLngDeg * Math.cos(midLat));
    const thetaY = Math.max(0.02, deltaLatDeg);
    const maxTheta = Math.max(thetaX, thetaY);

    // Available free dimension in pixels
    const availW = Math.max(120, viewport.width);
    const availH = Math.max(120, viewport.height);

    const ratioX = availW / thetaX;
    const ratioY = availH / thetaY;
    const minRatio = Math.min(ratioX, ratioY);

    // Exact MapLibre Globe arc scaling constant (360 / 512 = 0.703125)
    // Note: thetaX already includes the cos(midLat) factor.
    const scale = 0.703125 * marginFactor * minRatio;
    const calculatedZoom = Math.log2(Math.max(0.001, scale));

    // Adaptive maxZoom for microstates vs larger territories:
    // Microstates (Monaco, Vatican, San Marino, Singapore) with maxTheta < 0.25 deg
    // receive a comfortable zoom level (up to 8.6) so they are clearly rendered.
    const effectiveMaxZoom =
      maxTheta < 0.25
        ? Math.max(maxZoom, 8.6)
        : maxTheta < 0.90
        ? Math.max(maxZoom, 7.2)
        : maxZoom;

    const targetZoom = parseFloat(
      Math.max(minZoom, Math.min(effectiveMaxZoom, calculatedZoom)).toFixed(2)
    );

    let centerLng = (minLng + maxLng) / 2;
    centerLng = ((((centerLng + 180) % 360) + 360) % 360) - 180;
    const centerLat = (minLat + maxLat) / 2;

    return {
      center: [parseFloat(centerLng.toFixed(4)), parseFloat(centerLat.toFixed(4))],
      zoom: targetZoom,
    };
  }

  /**
   * Calculates minimum zoom for Mercator projection to prevent world duplication.
   */
  public static calculateMercatorMinZoom(map: MapLibreMap | null): number {
    if (typeof window === 'undefined') return 1.0;
    const container = map?.getContainer();
    const w = container?.clientWidth || window.innerWidth || 390;
    const h = container?.clientHeight || window.innerHeight || 844;
    const maxDim = Math.max(w, h);
    return Math.max(0.65, Math.log2(maxDim / 512) + 0.005);
  }

  /**
   * Constrains panning in 2D Mercator mode to prevent grey borders.
   */
  public static createMercatorConstrainFunction(map: MapLibreMap | null) {
    return (
      lngLat: maplibregl.LngLat,
      zoom: number
    ): { center: maplibregl.LngLat; zoom: number } => {
      if (!map) return { center: lngLat, zoom };

      const minZ = this.calculateMercatorMinZoom(map);
      const clampedZoom = Math.max(minZ, Math.min(18, zoom));
      const worldSize = 512 * Math.pow(2, clampedZoom);

      const container = map.getContainer();
      const width = container?.clientWidth || window.innerWidth || 390;
      const height = container?.clientHeight || window.innerHeight || 844;

      const padding = (typeof map.getPadding === 'function' ? map.getPadding() : null) || { top: 0, bottom: 0, left: 0, right: 0 };
      const padLeft = padding.left ?? 0;
      const padRight = padding.right ?? 0;
      const padTop = padding.top ?? 0;
      const padBottom = padding.bottom ?? 0;
      const centerPointX = padLeft + (width - padLeft - padRight) / 2;
      const centerPointY = padTop + (height - padTop - padBottom) / 2;

      const origX = ((lngLat.lng + 180) / 360) * worldSize;
      const lat = Math.max(-85.051128, Math.min(85.051128, lngLat.lat));
      const sinLat = Math.sin((lat * Math.PI) / 180);
      const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
      const origY =
        (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * worldSize;

      let clampedX = origX;
      let clampedY = origY;

      const minX = centerPointX;
      const maxX = worldSize - (width - centerPointX);
      if (maxX >= minX) {
        clampedX = Math.max(minX, Math.min(maxX, origX));
      } else {
        clampedX = worldSize / 2;
      }

      const minY = centerPointY;
      const maxY = worldSize - (height - centerPointY);
      if (maxY >= minY) {
        clampedY = Math.max(minY, Math.min(maxY, origY));
      } else {
        clampedY = worldSize / 2;
      }

      const finalLng = (clampedX / worldSize) * 360 - 180;
      const yNorm = 0.5 - clampedY / worldSize;
      const finalLat = (360 / Math.PI) * Math.atan(Math.exp(2 * Math.PI * yNorm)) - 90;

      return {
        center: new maplibregl.LngLat(finalLng, finalLat),
        zoom: clampedZoom,
      };
    };
  }
}
