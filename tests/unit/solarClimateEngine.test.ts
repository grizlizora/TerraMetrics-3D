import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicSolarClimateEngine } from '../../src/data/DeterministicSolarClimateEngine.ts';

describe('DeterministicSolarClimateEngine Unit Tests', () => {
  it('calculates physical solar and weather properties for summer noon in Kyiv', () => {
    // 21 June at 12:00 UTC for Kyiv (50.45° N, 30.52° E)
    const summerNoon = new Date('2025-06-21T10:00:00Z'); // Local noon ~12:00 UTC+2
    const report = DeterministicSolarClimateEngine.calculate(50.45, 30.52, 100, summerNoon);

    assert.strictEqual(report.isDaylight, true);
    assert.strictEqual(report.seasonName, 'summer');
    assert.ok(report.solarElevationAngleDeg > 50, `Elevation angle should be high at summer noon: ${report.solarElevationAngleDeg}°`);
    assert.ok(report.solarZenithAngleDeg < 40, `Zenith angle should be low at summer noon: ${report.solarZenithAngleDeg}°`);
    assert.ok(report.ghiWm2 > 400, `GHI should be strong at summer noon: ${report.ghiWm2} W/m²`);
    assert.ok(report.uvIndex > 3, `UV index should be moderate to high: ${report.uvIndex}`);
    assert.ok(report.estimatedTemperatureC >= 15 && report.estimatedTemperatureC <= 35, `Temp should be realistic: ${report.estimatedTemperatureC}°C`);
    assert.ok(report.estimatedHumidityPct >= 20 && report.estimatedHumidityPct <= 90, `Humidity should be in bounds: ${report.estimatedHumidityPct}%`);
  });

  it('calculates midnight properties (zero GHI/DNI and no daylight)', () => {
    // 21 June at midnight UTC for London (51.5° N, 0° E)
    const midnight = new Date('2025-06-21T00:00:00Z');
    const report = DeterministicSolarClimateEngine.calculate(51.5, 0.0, 50, midnight);

    assert.strictEqual(report.isDaylight, false);
    assert.strictEqual(report.ghiWm2, 0);
    assert.strictEqual(report.dniWm2, 0);
    assert.strictEqual(report.uvIndex, 0);
    assert.ok(report.solarElevationAngleDeg < 0, `Elevation angle should be below horizon: ${report.solarElevationAngleDeg}°`);
  });

  it('maintains Southern Hemisphere seasonal inversion (summer in January, winter in July)', () => {
    // Sydney: -33.86° S, 151.2° E
    const janDate = new Date('2025-01-15T02:00:00Z'); // Summer day in Sydney
    const julDate = new Date('2025-07-15T02:00:00Z'); // Winter day in Sydney

    const janReport = DeterministicSolarClimateEngine.calculate(-33.86, 151.2, 20, janDate);
    const julReport = DeterministicSolarClimateEngine.calculate(-33.86, 151.2, 20, julDate);

    assert.strictEqual(janReport.seasonName, 'summer');
    assert.strictEqual(julReport.seasonName, 'winter');
    assert.ok(janReport.estimatedTemperatureC > julReport.estimatedTemperatureC + 8,
      `January temp (${janReport.estimatedTemperatureC}°C) should exceed July temp (${julReport.estimatedTemperatureC}°C)`
    );
  });

  it('ensures 100% determinism with identical inputs', () => {
    const fixedDate = new Date('2025-04-10T14:30:00Z');
    const r1 = DeterministicSolarClimateEngine.calculate(48.8566, 2.3522, 35, fixedDate);
    const r2 = DeterministicSolarClimateEngine.calculate(48.8566, 2.3522, 35, fixedDate);

    assert.deepStrictEqual(r1, r2);
  });
});
