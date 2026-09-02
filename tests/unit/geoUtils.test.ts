import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistance,
  calculateBoundingBox,
  calculatePolygonCentroid,
  calculateGeodesicPolygonAreaKm2,
  isPointInPolygon,
  getCountryFlag,
} from '../../src/utils/geoUtils.ts';

describe('geoUtils Unit Tests', () => {
  describe('haversineDistance', () => {
    it('should calculate correct distance between Kyiv and London in km', () => {
      // Kyiv: 50.4501° N, 30.5234° E
      // London: 51.5074° N, -0.1278° W
      const distKm = haversineDistance(50.4501, 30.5234, 51.5074, -0.1278, 'km');
      assert.ok(Math.abs(distKm - 2133) < 15, `Expected ~2133 km, got ${distKm}`);
    });

    it('should return 0 when comparing the exact same coordinate', () => {
      const dist = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
      assert.strictEqual(dist, 0);
    });

    it('should calculate antipode distance roughly equal to half Earth circumference', () => {
      // (0, 0) and (0, 180) -> pi * R ~= 20015 km
      const dist = haversineDistance(0, 0, 0, 180, 'km');
      assert.ok(Math.abs(dist - 20015) < 30, `Expected ~20015 km, got ${dist}`);
    });
  });

  describe('calculateBoundingBox', () => {
    it('should correctly compute min/max boundaries for polygon rings', () => {
      const ring = [
        [10, 20],
        [30, 20],
        [30, 40],
        [10, 40],
        [10, 20],
      ];
      const [minLng, minLat, maxLng, maxLat] = calculateBoundingBox(ring);
      assert.strictEqual(minLng, 10);
      assert.strictEqual(minLat, 20);
      assert.strictEqual(maxLng, 30);
      assert.strictEqual(maxLat, 40);
    });
  });

  describe('calculatePolygonCentroid', () => {
    it('should calculate standard rectangular centroid', () => {
      const ring = [
        [10, 20],
        [30, 20],
        [30, 40],
        [10, 40],
        [10, 20],
      ];
      const [cLng, cLat] = calculatePolygonCentroid(ring);
      assert.strictEqual(cLng, 20);
      assert.strictEqual(cLat, 30);
    });

    it('should handle anti-meridian wrapping', () => {
      // Archipelago spanning across anti-meridian: 170 to -170 (spanning 20 degrees)
      const ring = [
        [170, -20],
        [-170, -20],
        [-170, -10],
        [170, -10],
        [170, -20],
      ];
      const [cLng, cLat] = calculatePolygonCentroid(ring);
      assert.ok(Math.abs(Math.abs(cLng) - 180) <= 0.1 || cLng === 180 || cLng === -180, `Got centroid lng: ${cLng}`);
      assert.strictEqual(cLat, -15);
    });
  });

  describe('calculateGeodesicPolygonAreaKm2', () => {
    it('should calculate approximate area for spherical polygon', () => {
      // 1x1 degree square at the equator: ~111km x ~111km ~ 12300 km^2
      const ring = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ];
      const area = calculateGeodesicPolygonAreaKm2([ring]);
      assert.ok(area > 12000 && area < 12500, `Expected ~12320 km^2, got ${area}`);
    });

    it('should return 0 for empty or invalid coords', () => {
      assert.strictEqual(calculateGeodesicPolygonAreaKm2([]), 0);
      assert.strictEqual(calculateGeodesicPolygonAreaKm2(null as any), 0);
    });
  });

  describe('isPointInPolygon', () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];

    it('should return true for a point strictly inside', () => {
      assert.strictEqual(isPointInPolygon([5, 5], square), true);
    });

    it('should return false for a point strictly outside', () => {
      assert.strictEqual(isPointInPolygon([15, 5], square), false);
      assert.strictEqual(isPointInPolygon([-1, 5], square), false);
    });
  });

  describe('getCountryFlag', () => {
    it('should convert ISO3 alpha code to emoji flag', () => {
      assert.strictEqual(getCountryFlag('UKR'), '🇺🇦');
      assert.strictEqual(getCountryFlag('USA'), '🇺🇸');
      assert.strictEqual(getCountryFlag('GBR'), '🇬🇧');
      assert.strictEqual(getCountryFlag('DEU'), '🇩🇪');
      assert.strictEqual(getCountryFlag('FRA'), '🇫🇷');
      assert.strictEqual(getCountryFlag('JPN'), '🇯🇵');
    });

    it('should return fallback globe for unknown ISO', () => {
      assert.strictEqual(getCountryFlag('XYZ'), '🌐');
      assert.strictEqual(getCountryFlag(''), '🌐');
    });
  });
});
