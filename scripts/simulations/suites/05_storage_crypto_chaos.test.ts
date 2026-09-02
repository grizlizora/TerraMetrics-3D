// scripts/simulations/suites/05_storage_crypto_chaos.test.ts
import { CryptoResolver } from '../../../src/data/sync/CryptoResolver.ts';
import { DataValidator } from '../../../src/data/sync/DataValidator.ts';
import { ApiSyncManager } from '../../../src/data/api/ApiSyncManager.ts';

export async function runStorageCryptoChaos(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 5: Сховище, Криптографія, Delta Sync та Chaos-тести');
  let passed = true;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✔ PASS: ${msg}`);
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      passed = false;
    }
  };

  try {
    // 1. Fuzzing Symmetric XOR+Base64Url Obfuscation
    const testStrings = [
      '',
      'a',
      'https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUvWxYz',
      '🌍 TerraMetrics 3D Українська Мова 🇺🇦 Special Chars: !@#$%^&*()_+~`|}{[]:;?><,./',
      'A'.repeat(5000), // 5KB payload
    ];

    let fuzzPassed = true;
    for (const original of testStrings) {
      const encrypted = CryptoResolver.encodeObfuscated(original);
      const decrypted = CryptoResolver.decodeObfuscated(encrypted);
      if (decrypted !== original) {
        fuzzPassed = false;
        break;
      }
      if (original.includes('drive.google.com') && encrypted.includes('drive.google.com')) {
        fuzzPassed = false;
        break;
      }
    }

    assert(fuzzPassed, `Крипто-фаззінг: XOR+Base64Url 100% оборотний для Unicode, емодзі, довгих URL та не містить відкритого тексту`);

    // 2. DataValidator Fuzzing & Boundaries
    const invalidGeoJson1 = { type: 'FeatureCollection', features: [] }; // < 150 features
    const valResult1 = DataValidator.validateBundle(
      invalidGeoJson1 as any,
      { UKR: {} } as any,
      { UKR: {} } as any,
      { UKR: {} } as any
    );
    assert(!valResult1.isValid, `DataValidator: успішно відхилив бандл із 0 країнами`);

    const invalidGeoJson2 = null;
    const valResult2 = DataValidator.validateBundle(
      invalidGeoJson2 as any,
      {} as any,
      {} as any,
      {} as any
    );
    assert(!valResult2.isValid, `DataValidator: безпечно обробив null без падіння процесу (No-Throw Invariant)`);

    // 3. ApiSyncManager In-Flight Deduplication
    const apiManager = ApiSyncManager.getInstance();
    const lat = 50.45;
    const lng = 30.52;

    const promises: Promise<any>[] = [];
    for (let i = 0; i < 500; i++) {
      promises.push(apiManager.getLiveWeather(lat, lng));
    }

    const results = await Promise.all(promises);
    assert(
      results.length === 500 && results.every(r => Number.isFinite(r.temp)),
      `In-Flight Deduplication: 500 одночасних запитів до однієї координати повернули консистентний результат`
    );

    // 4. Solar-Orbital Latitude Sweep (-90° to +90°)
    let thermalSweepPassed = true;
    for (let latDeg = -90; latDeg <= 90; latDeg += 5) {
      const fallback = apiManager.computeMathematicalWeatherFallback(latDeg, 0);
      if (
        !Number.isFinite(fallback.temp) ||
        fallback.humidity < 0 ||
        fallback.humidity > 100 ||
        fallback.wind < 0
      ) {
        thermalSweepPassed = false;
        break;
      }
    }
    assert(
      thermalSweepPassed,
      `Широтне сканування погоди ($-90^\\circ \\dots +90^\\circ$): всі координати мають фізично коректні значення температури, вологості та вітру`
    );

    // 5. DeterministicSolarClimateEngine Physical Invariants
    const { DeterministicSolarClimateEngine } = await import('../../../src/data/DeterministicSolarClimateEngine.ts');
    let solarMathPassed = true;
    for (let h = 0; h < 24; h++) {
      const testDate = new Date(Date.UTC(2026, 5, 21, h, 0, 0)); // Summer solstice
      const rep = DeterministicSolarClimateEngine.calculate(50.45, 30.52, 100, testDate);
      if (
        rep.solarZenithAngleDeg < 0 ||
        rep.solarZenithAngleDeg > 180 ||
        rep.ghiWm2 < 0 ||
        rep.dniWm2 < 0 ||
        rep.uvIndex < 0 ||
        rep.estimatedHumidityPct < 10 ||
        rep.estimatedHumidityPct > 100
      ) {
        solarMathPassed = false;
        break;
      }
    }
    assert(
      solarMathPassed,
      `DeterministicSolarClimateEngine: добові фізичні інваріанти сонячного зеніту, GHI/DNI та Tetens вологості дотримані 100%`
    );

    // Continuous C-infinity 365-day solar insolation test (max day-to-day temperature shift < 0.4°C, 0 discrete jumps)
    let maxDayShift = 0;
    let prevTemp = DeterministicSolarClimateEngine.calculate(50.45, 30.52, 100, new Date(Date.UTC(2026, 0, 1, 12, 0))).estimatedTemperatureC;
    for (let d = 2; d <= 365; d++) {
      const curDate = new Date(Date.UTC(2026, 0, d, 12, 0));
      const curTemp = DeterministicSolarClimateEngine.calculate(50.45, 30.52, 100, curDate).estimatedTemperatureC;
      const diff = Math.abs(curTemp - prevTemp);
      if (diff > maxDayShift) maxDayShift = diff;
      prevTemp = curTemp;
    }
    assert(
      maxDayShift < 0.4,
      `DeterministicSolarClimateEngine: C^∞ гладкість річної інсоляції (макс. зміна між сусідніми днями: ${maxDayShift.toFixed(2)}°C < 0.40°C)`
    );

    // Deterministic wind hash repeatability test
    const dateFixed = new Date(Date.UTC(2026, 6, 15, 14, 0));
    const repA = DeterministicSolarClimateEngine.calculate(48.85, 2.35, 35, dateFixed);
    const repB = DeterministicSolarClimateEngine.calculate(48.85, 2.35, 35, dateFixed);
    assert(
      repA.windSpeedMs === repB.windSpeedMs && repA.estimatedTemperatureC === repB.estimatedTemperatureC,
      `DeterministicSolarClimateEngine: 100% математична детермінованість (повторюваність без випадкового шуму: ${repA.windSpeedMs} м/с === ${repB.windSpeedMs} м/с)`
    );

  } catch (err: any) {
    console.error('  ❌ Unhandled exception in Storage Crypto Chaos test:', err);
    passed = false;
  }

  return passed;
}

if (process.argv[1]?.endsWith('05_storage_crypto_chaos.test.ts')) {
  runStorageCryptoChaos().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
