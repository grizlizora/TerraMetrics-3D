import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DataValidator } from '../../src/data/sync/DataValidator.ts';

describe('DataValidator Unit Tests', () => {
  it('returns valid: false for null, undefined, or non-object inputs without throwing', () => {
    assert.strictEqual(DataValidator.validateBundle(null).valid, false);
    assert.strictEqual(DataValidator.validateBundle(undefined).valid, false);
    assert.strictEqual(DataValidator.validateBundle('string' as any).valid, false);
  });

  it('rejects GeoJSON with fewer than 150 features', () => {
    const invalidGeoJson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { 'ISO3166-1-Alpha-3': 'UKR' }, geometry: { type: 'Point', coordinates: [0, 0] } }
      ]
    };
    const res = DataValidator.validateGeoJson(invalidGeoJson);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('feature count too low')));
  });

  it('validates a well-formed bundle successfully', () => {
    const mockIsoList = Array.from({ length: 160 }, (_, i) =>
      `A${String(Math.floor(i / 10)).padStart(1, '0')}${String(i % 10)}`
    );

    const mockFeatures = mockIsoList.map((iso, i) => ({
      type: 'Feature' as const,
      properties: {
        'ISO3166-1-Alpha-3': iso,
        name: `Country ${i}`,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      }
    }));

    const mockReligionsCountries: Record<string, any> = {};
    const mockIndexes: Record<string, any> = {};
    const mockDemographics: Record<string, any> = {};

    mockIsoList.forEach((iso) => {
      mockReligionsCountries[iso] = { religionShare: { Christianity: 80 } };
      mockIndexes[iso] = { hdi: 0.85, gdp: 50000 };
      mockDemographics[iso] = { population: 1000000 };
    });

    const validBundle = {
      geoJson: {
        type: 'FeatureCollection' as const,
        features: mockFeatures
      },
      religions: {
        datasetRelease: '2025-01',
        countries: mockReligionsCountries
      },
      indexes: mockIndexes,
      demographics: mockDemographics
    };

    const res = DataValidator.validateBundle(validBundle as any);
    assert.strictEqual(res.valid, true, `Expected valid bundle but got errors: ${res.errors.join(', ')}`);
    assert.strictEqual(res.errors.length, 0);
  });
});
