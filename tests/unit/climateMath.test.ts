import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClimateMath } from '../../src/utils/climateMath.ts';

describe('ClimateMath Unit Tests', () => {
  it('should generate 12 monthly data points for Ukrainian locale', () => {
    const points = ClimateMath.generateMonthlyTemperatures(50.45, 'uk');
    assert.strictEqual(points.length, 12);
    assert.strictEqual(points[0].month, 'Січ');
    assert.strictEqual(points[6].month, 'Лип');
  });

  it('should generate 12 monthly data points for English locale', () => {
    const points = ClimateMath.generateMonthlyTemperatures(51.5, 'en');
    assert.strictEqual(points.length, 12);
    assert.strictEqual(points[0].month, 'Jan');
    assert.strictEqual(points[6].month, 'Jul');
  });

  it('should reflect Northern Hemisphere seasonality (July warmer than January)', () => {
    // Kyiv / Paris (lat ~ 50)
    const points = ClimateMath.generateMonthlyTemperatures(50.0, 'en');
    const janTemp = points[0].temp;
    const julTemp = points[6].temp;
    assert.ok(julTemp > janTemp + 10, `Expected July (${julTemp}°C) to be significantly warmer than January (${janTemp}°C)`);
  });

  it('should reflect Southern Hemisphere seasonality (January warmer than July)', () => {
    // Buenos Aires / Sydney (lat ~ -35)
    const points = ClimateMath.generateMonthlyTemperatures(-35.0, 'en');
    const janTemp = points[0].temp;
    const julTemp = points[6].temp;
    assert.ok(janTemp > julTemp + 5, `Expected January (${janTemp}°C) to be warmer than July (${julTemp}°C) in southern hemisphere`);
  });

  it('should maintain equator thermal stability with low seasonal amplitude', () => {
    // Equator: lat = 0
    const points = ClimateMath.generateMonthlyTemperatures(0, 'en');
    const temps = points.map((p) => p.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const amplitude = maxTemp - minTemp;
    assert.ok(amplitude <= 5, `Equatorial seasonal amplitude should be <= 5°C, got ${amplitude}°C`);
    assert.ok(minTemp > 24 && maxTemp < 32, `Equatorial temperature range should be around ~28°C`);
  });

  it('should have continuous values across the equator without jump discontinuity', () => {
    const northPoints = ClimateMath.generateMonthlyTemperatures(0.5, 'en');
    const southPoints = ClimateMath.generateMonthlyTemperatures(-0.5, 'en');
    for (let i = 0; i < 12; i++) {
      const diff = Math.abs(northPoints[i].temp - southPoints[i].temp);
      assert.ok(diff <= 4.0, `Discontinuity at month ${i}: diff = ${diff}°C`);
    }
  });
});
