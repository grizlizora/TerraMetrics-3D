import type { ContinentName, ISO3Code } from '../../types';

/**
 * Curated bounding boxes for the primary/mainland territories of nations with distant overseas territories or fragmented archipelagos.
 * Format: [minLng, minLat, maxLng, maxLat]
 */
export const CURATED_METROPOLITAN_BOUNDS: Partial<Record<ISO3Code, [number, number, number, number]>> = {
  // France + Corsica (excluding French Guiana, Reunion, Guadeloupe, Martinique, Mayotte)
  FRA: [-5.2, 41.3, 9.6, 51.1],
  // Contiguous 48 US States (excluding Alaska, Hawaii, Puerto Rico, Guam)
  USA: [-125.0, 24.5, -66.9, 49.4],
  // United Kingdom & Northern Ireland (excluding Falklands, Gibraltar, Bermuda)
  GBR: [-8.2, 49.8, 1.8, 60.9],
  // Continental Norway (excluding Svalbard, Jan Mayen)
  NOR: [4.5, 57.9, 31.1, 71.2],
  // Mainland Spain + Balearic & Canary Islands
  ESP: [-18.2, 27.6, 4.4, 43.8],
  // Portugal mainland + Azores & Madeira
  PRT: [-31.3, 30.0, -6.1, 42.2],
  // Denmark mainland + islands (excluding Greenland & Faroe)
  DNK: [8.0, 54.5, 15.2, 57.8],
  // Netherlands mainland (excluding Caribbean islands)
  NLD: [3.3, 50.7, 7.3, 53.6],
  // Mainland China
  CHN: [73.5, 18.2, 134.8, 53.6],
  // Ukraine
  UKR: [22.1, 44.3, 40.2, 52.4],
  // Russian Federation Eurasian landmass
  RUS: [19.5, 41.2, 180.0, 77.8],
  // Australia mainland + Tasmania
  AUS: [112.9, -43.7, 153.7, -10.0],
  // Canada mainland
  CAN: [-141.0, 41.7, -52.6, 70.0],
  // Brazil
  BRA: [-73.9, -33.7, -34.8, 5.3],
  // India
  IND: [68.1, 8.0, 97.4, 35.5],
  // Indonesia Archipelago
  IDN: [95.0, -11.0, 141.0, 6.0],
  // Japan Archipelago
  JPN: [129.5, 30.5, 146.0, 45.6],
  // New Zealand (North & South islands)
  NZL: [166.0, -47.5, 178.8, -34.0],
  // Fiji
  FJI: [177.0, -19.2, 182.0, -15.7],
  // Chile continental landmass (excluding Easter Island & Juan Fernandez)
  CHL: [-75.7, -56.0, -66.9, -17.5],
  // Ecuador continental mainland (excluding Galapagos Islands)
  ECU: [-81.2, -5.1, -75.1, 1.5],
};

/**
 * Geographic bounding boxes for all 7 continents and the World.
 * Format: [minLng, minLat, maxLng, maxLat]
 */
export const CONTINENT_BOUNDING_BOXES: Record<ContinentName, [number, number, number, number]> = {
  World: [-170, -58, 175, 75],
  Europe: [-25, 34.5, 45, 71.5],
  Asia: [26, -11, 148, 76],
  Africa: [-18, -35, 52, 38],
  'North America': [-168, 7, -52, 72],
  'South America': [-82, -56, -34, 13],
  Oceania: [112, -48, 179, 0],
};

/**
 * Default geographic center anchor points for continents.
 */
export const CONTINENT_CENTERS: Record<ContinentName, [number, number]> = {
  World: [15, 0],
  Europe: [15, 52],
  Asia: [87, 35],
  Africa: [18, 2],
  'North America': [-100, 42],
  'South America': [-58, -22],
  Oceania: [145, -24],
};

/**
 * Calibrated 3D Globe Zoom Presets for all 7 continents and the World.
 * Ensures the selected continent comfortably occupies 75-80% of the visible viewport above the sheet.
 */
export const GLOBE_CONTINENT_ZOOM_PRESETS: Record<ContinentName, { baseZoom: number; minZoom: number; maxZoom: number }> = {
  World: { baseZoom: 1.10, minZoom: 0.95, maxZoom: 1.35 },
  Asia: { baseZoom: 1.70, minZoom: 1.40, maxZoom: 2.10 },
  Europe: { baseZoom: 2.50, minZoom: 2.10, maxZoom: 3.10 },
  Africa: { baseZoom: 1.95, minZoom: 1.65, maxZoom: 2.50 },
  'North America': { baseZoom: 1.85, minZoom: 1.55, maxZoom: 2.40 },
  'South America': { baseZoom: 2.10, minZoom: 1.75, maxZoom: 2.70 },
  Oceania: { baseZoom: 2.20, minZoom: 1.80, maxZoom: 2.80 },
};
