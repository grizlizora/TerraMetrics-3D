import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCountrySummary } from '../../src/utils/shareUtils.ts';
import type { CountryProperties, AggregatedContinentStats } from '../../src/types/index.ts';

describe('shareUtils Unit Tests', () => {
  const mockTranslate = (key: string) => {
    const dict: Record<string, string> = {
      mode_religion: 'Релігія',
      mode_population: 'Населення',
      mode_economy: 'Економіка',
      mode_military: 'Армія',
      dominant_religion: 'Домінантна релігія',
      capital: 'Столиця',
      top_countries: 'Топ країн',
      gdp_per_capita: 'ВВП на душу населення',
      Europe: 'Європа',
    };
    return dict[key] || key;
  };

  const sampleCountry: CountryProperties = {
    'ISO3166-1-Alpha-3': 'UKR',
    name_uk: 'Україна',
    name_en: 'Ukraine',
    continent: 'Europe',
    capital_uk: 'Київ',
    capital_en: 'Kyiv',
    population: 43000000,
    dominant_religion: 'Християнство',
    dominant_percentage: 82.5,
  };

  const sampleContinent: AggregatedContinentStats = {
    name_uk: 'Європа',
    name_en: 'Europe',
    total_population: 745000000,
    dominant_religion: 'Християнство',
    dominant_percentage: 75.0,
    top_populated: [
      {
        iso: 'DEU',
        name_uk: 'Німеччина',
        name_en: 'Germany',
        population: 83000000,
      },
      {
        iso: 'GBR',
        name_uk: 'Велика Британія',
        name_en: 'United Kingdom',
        population: 67000000,
      },
    ],
  };

  it('should format country summary with Ukrainian locale and flag', () => {
    const summary = formatCountrySummary(
      sampleCountry,
      null,
      true,
      'uk',
      mockTranslate,
      'religion'
    );
    assert.ok(summary.includes('🇺🇦 Україна (UKR)'));
    assert.ok(summary.includes('Київ'));
    assert.ok(summary.includes('Християнство'));
    assert.ok(summary.includes('82.5%'));
  });

  it('should format country summary with English locale', () => {
    const summary = formatCountrySummary(
      sampleCountry,
      null,
      true,
      'en',
      mockTranslate,
      'religion'
    );
    assert.ok(summary.includes('🇺🇦 Ukraine (UKR)'));
    assert.ok(summary.includes('Kyiv'));
  });

  it('should format continent population summary with ranking', () => {
    const summary = formatCountrySummary(
      null,
      sampleContinent,
      false,
      'uk',
      mockTranslate,
      'population'
    );
    assert.ok(summary.includes('Європа'));
    assert.ok(summary.includes('Німеччина'));
    assert.ok(summary.includes('83'));
  });

  it('should safely return empty string or fallback on null data without throwing', () => {
    assert.doesNotThrow(() => {
      const res = formatCountrySummary(null, null, false, 'uk', mockTranslate);
      assert.strictEqual(typeof res, 'string');
    });
  });
});
