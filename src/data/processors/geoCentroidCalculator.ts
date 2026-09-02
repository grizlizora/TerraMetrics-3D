import type { ISO3Code, LabelFeature } from '../../types/index.ts';

export interface BboxAndCenterResult {
  bbox: [number, number, number, number];
  primaryBbox: [number, number, number, number];
  center: [number, number];
  borderLength: number;
}

export class GeoCentroidCalculator {
  /**
   * Computes the geodesic perimeter of a single coordinate ring in kilometers using Haversine formula.
   */
  public static computeRingLength(ring: number[][]): number {
    if (!ring || ring.length < 2) return 0;
    let lengthKm = 0;
    const toRad = Math.PI / 180;
    const R = 6371.0; // Earth mean radius in km
    const count = ring.length;

    for (let i = 0; i < count - 1; i++) {
      const lon1 = ring[i][0];
      const lat1 = ring[i][1];
      const lon2 = ring[i + 1][0];
      const lat2 = ring[i + 1][1];

      const dLat = (lat2 - lat1) * toRad;
      let dLonDeg = (lon2 - lon1) % 360;
      if (dLonDeg > 180) dLonDeg -= 360;
      if (dLonDeg < -180) dLonDeg += 360;
      const dLon = dLonDeg * toRad;

      const phi1 = lat1 * toRad;
      const phi2 = lat2 * toRad;

      const sinDLat2 = Math.sin(dLat * 0.5);
      const sinDLon2 = Math.sin(dLon * 0.5);
      const a = sinDLat2 * sinDLat2 + Math.cos(phi1) * Math.cos(phi2) * sinDLon2 * sinDLon2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
      lengthKm += R * c;
    }
    return lengthKm;
  }

  /**
   * Computes accurate Bbox, primaryBbox (weighted by cosine latitude), center, and total perimeter (border length).
   * Gracefully handles antimeridian crossing (Fiji, Russia, Kiribati).
   */
  public static computeBboxAndCenter(
    geometry: any,
    existingCenter?: [number, number]
  ): BboxAndCenterResult {
    let fullMinLng = 180,
      fullMinLat = 90,
      fullMaxLng = -180,
      fullMaxLat = -90;
    let maxWeightedArea = -1;
    let bestPolyBbox: [number, number, number, number] | null = null;
    let bestPolyCenter: [number, number] | null = null;
    let totalBorderLength = 0;

    const scanRing = (ring: number[][]) => {
      let rMinLng = 180,
        rMinLat = 90,
        rMaxLng = -180,
        rMaxLat = -90;
      let sumLng = 0,
        sumLat = 0;
      const count = ring.length;

      for (let i = 0; i < count; i++) {
        const [lng, lat] = ring[i];
        if (lng < rMinLng) rMinLng = lng;
        if (lat < rMinLat) rMinLat = lat;
        if (lng > rMaxLng) rMaxLng = lng;
        if (lat > rMaxLat) rMaxLat = lat;
        sumLng += lng;
        sumLat += lat;
      }

      if (rMinLng < fullMinLng) fullMinLng = rMinLng;
      if (rMinLat < fullMinLat) fullMinLat = rMinLat;
      if (rMaxLng > fullMaxLng) fullMaxLng = rMaxLng;
      if (rMaxLat > fullMaxLat) fullMaxLat = rMaxLat;

      const dLng = rMaxLng - rMinLng;
      const dLat = rMaxLat - rMinLat;
      const midLatRad = (((rMinLat + rMaxLat) / 2) * Math.PI) / 180;
      const weightedArea = dLng * Math.cos(midLatRad) * dLat;

      // Ignore antimeridian wrap spans (> 300 deg) for primary box selection
      if (weightedArea > maxWeightedArea && dLng < 300) {
        maxWeightedArea = weightedArea;
        bestPolyBbox = [rMinLng, rMinLat, rMaxLng, rMaxLat];
        bestPolyCenter = count > 0 ? [sumLng / count, sumLat / count] : [(rMinLng + rMaxLng) / 2, (rMinLat + rMaxLat) / 2];
      }

      // Accumulate geodesic perimeter for this ring
      totalBorderLength += GeoCentroidCalculator.computeRingLength(ring);
    };

    if (geometry) {
      if (geometry.type === 'Polygon') {
        const rings = geometry.coordinates;
        if (rings && rings.length > 0) {
          for (let r = 0; r < rings.length; r++) {
            if (rings[r] && rings[r].length > 0) scanRing(rings[r]);
          }
        }
      } else if (geometry.type === 'MultiPolygon') {
        const polys = geometry.coordinates;
        if (polys) {
          for (let p = 0; p < polys.length; p++) {
            const rings = polys[p];
            if (rings) {
              for (let r = 0; r < rings.length; r++) {
                if (rings[r] && rings[r].length > 0) scanRing(rings[r]);
              }
            }
          }
        }
      }
    }

    if (fullMinLng > fullMaxLng) {
      fullMinLng = -180;
      fullMaxLng = 180;
      fullMinLat = -90;
      fullMaxLat = 90;
    }

    const bbox: [number, number, number, number] = [fullMinLng, fullMinLat, fullMaxLng, fullMaxLat];
    const primaryBbox: [number, number, number, number] = bestPolyBbox || bbox;

    let center: [number, number];
    if (existingCenter && existingCenter.length === 2 && !Number.isNaN(existingCenter[0]) && !Number.isNaN(existingCenter[1])) {
      center = existingCenter;
    } else if (bestPolyCenter) {
      center = bestPolyCenter;
    } else {
      center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    }

    return {
      bbox,
      primaryBbox,
      center,
      borderLength: Math.round(totalBorderLength),
    };
  }

  public static createLabelFeature(
    iso: ISO3Code,
    nameUk: string,
    nameEn: string,
    population: number,
    center: [number, number]
  ): LabelFeature {
    return {
      type: 'Feature',
      properties: {
        'ISO3166-1-Alpha-3': iso,
        name_uk: nameUk,
        name_en: nameEn,
        population,
      },
      geometry: {
        type: 'Point',
        coordinates: center,
      },
    };
  }
}
