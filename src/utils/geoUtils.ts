import { getCountryFlag } from './flagUtils.ts';

export { getCountryFlag };

/**
 * Earth radius constants in various units
 */
export const EARTH_RADIUS_KM = 6371.0;
export const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculates the great-circle Haversine distance between two points on the Earth.
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @param unit Unit of measurement ('km' | 'miles' | 'meters')
 * @returns Distance in specified units
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'miles' | 'meters' = 'km'
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const rLat1 = (lat1 * Math.PI) / 180.0;
  const rLat2 = (lat2 * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  let distanceKm = EARTH_RADIUS_KM * c;

  if (unit === 'miles') return distanceKm * 0.621371;
  if (unit === 'meters') return distanceKm * 1000.0;
  return distanceKm;
}

/**
 * Formats decimal latitude and longitude into human-readable DMS (Degrees, Minutes, Seconds) format.
 * Example: 50.45, 30.52 -> `50°27'00" N, 30°31'12" E`
 */
export function formatCoordinatesDMS(lat: number, lng: number): string {
  const formatDMS = (val: number, isLat: boolean): string => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
    const absVal = Math.abs(val);
    const deg = Math.floor(absVal);
    const minFloat = (absVal - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60);

    return `${deg}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}" ${dir}`;
  };

  return `${formatDMS(lat, true)}, ${formatDMS(lng, false)}`;
}

/**
 * Calculates the bounding box [minLng, minLat, maxLng, maxLat] from GeoJSON coordinates.
 */
export function calculateBoundingBox(coords: any): [number, number, number, number] {
  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;

  const scan = (c: any) => {
    if (typeof c[0] === 'number') {
      const lng = c[0];
      const lat = c[1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(c)) {
      for (let i = 0; i < c.length; i++) scan(c[i]);
    }
  };

  scan(coords);

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Calculates the bounding box of the primary (largest landmass) polygon for a Feature geometry,
 * avoiding distortion from distant overseas territories or tiny remote islands.
 */
export function calculatePrimaryBoundingBox(geometry: any): [number, number, number, number] {
  if (!geometry || !geometry.coordinates) {
    return [-180, -90, 180, 90];
  }

  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    let maxArea = -1;
    let bestBbox: [number, number, number, number] = [-180, -90, 180, 90];

    for (let p = 0; p < geometry.coordinates.length; p++) {
      const poly = geometry.coordinates[p];
      const bbox = calculateBoundingBox(poly);
      const [minLng, minLat, maxLng, maxLat] = bbox;
      const dLng = Math.abs(maxLng - minLng);
      const dLat = Math.abs(maxLat - minLat);
      const approxArea = dLng * dLat;

      if (approxArea > maxArea && dLng < 300) {
        maxArea = approxArea;
        bestBbox = bbox;
      }
    }
    return bestBbox;
  }

  return calculateBoundingBox(geometry.coordinates);
}

/**
 * Computes a weighted or bounding centroid for GeoJSON Polygons / MultiPolygons,
 * accounting for anti-meridian crossing and island archipelagos.
 */
export function calculatePolygonCentroid(coordinates: any): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = calculateBoundingBox(coordinates);
  
  // If polygon wraps around anti-meridian
  if (maxLng - minLng > 180) {
    let altMinLng = 180;
    let altMaxLng = -180;
    const scanNormalized = (c: any) => {
      if (typeof c[0] === 'number') {
        const normLng = c[0] < 0 ? c[0] + 360 : c[0];
        if (normLng < altMinLng) altMinLng = normLng;
        if (normLng > altMaxLng) altMaxLng = normLng;
      } else if (Array.isArray(c)) {
        for (let i = 0; i < c.length; i++) scanNormalized(c[i]);
      }
    };
    scanNormalized(coordinates);
    let avgLng = (altMinLng + altMaxLng) / 2;
    if (avgLng > 180) avgLng -= 360;
    return [parseFloat(avgLng.toFixed(4)), parseFloat(((minLat + maxLat) / 2).toFixed(4))];
  }

  return [
    parseFloat(((minLng + maxLng) / 2).toFixed(4)),
    parseFloat(((minLat + maxLat) / 2).toFixed(4)),
  ];
}

/**
 * Point-in-polygon ray casting algorithm for 2D geographic coordinates.
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}
