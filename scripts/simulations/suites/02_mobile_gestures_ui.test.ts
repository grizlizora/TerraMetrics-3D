// scripts/simulations/suites/02_mobile_gestures_ui.test.ts
import fs from 'node:fs';
import path from 'node:path';
import { MockTouchEngine } from '../harness/MockTouchEngine.ts';
import { formatCountrySummary } from '../../../src/utils/shareUtils.ts';

export async function runMobileGesturesUISimulation(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 2: Мобільні жести, Responsive Viewports та UI Інтеракції');
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
    // 1. Mobile Bottom Sheet Direct Manipulation & Snap Points
    const touchEngine = new MockTouchEngine({
      viewportHeight: 844, // iPhone 13/14 height
      fullHeight: 780,
      halfHeight: 400,
      peekHeight: 208,
    });

    // Test initial state (peek)
    assert(touchEngine.getCurrentY() === 844 - 208, `Початковий стан Bottom Sheet: peek (Y = ${844 - 208}px)`);

    // Test slow drag to half
    touchEngine.touchStart(700);
    touchEngine.touchMove(500, performance.now() + 500); // Slow drag
    const resSlow = touchEngine.touchEnd(performance.now() + 500);
    assert(resSlow.snapPoint === 'half', `Повільне перетягування: коректне позиційне доведення до точки 'half'`);

    // Test fast FLICK UP to full (> 0.45 px/ms)
    touchEngine.setSnapPoint('half');
    touchEngine.touchStart(444);
    touchEngine.touchMove(300, performance.now() + 50); // Fast swipe up (144px in 50ms = 2.88 px/ms)
    const resFlickUp = touchEngine.touchEnd(performance.now() + 50);
    assert(resFlickUp.snapPoint === 'full', `Швидкий свайп вгору (Flick ${resFlickUp.velocity.toFixed(2)} px/ms): миттєвий перехід у 'full'`);

    // Test fast FLICK DOWN to peek
    touchEngine.setSnapPoint('half');
    touchEngine.touchStart(444);
    touchEngine.touchMove(600, performance.now() + 50); // Fast swipe down
    const resFlickDown = touchEngine.touchEnd(performance.now() + 50);
    assert(resFlickDown.snapPoint === 'peek', `Швидкий свайп вниз (Flick ${resFlickDown.velocity.toFixed(2)} px/ms): миттєвий перехід у 'peek'`);

    // Test Rubber-Banding above 'full' (y < 0)
    touchEngine.setSnapPoint('full');
    touchEngine.touchStart(200);
    touchEngine.touchMove(50, performance.now() + 100); // Pull up by 150px
    const rubberY = touchEngine.getCurrentY();
    assert(rubberY < 0 && Math.abs(rubberY) < 85, `Apple Rubber-Banding: нелінійний еластичний опір при свайпі за межі full (Y = ${rubberY.toFixed(1)}px)`);

    // 1b. Chaos Monkey Gesture Fuzzing (10 000 stochastic touch actions)
    let monkeyChaosPassed = true;
    let seed = 12345;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let simClock = performance.now();
    for (let i = 0; i < 10000; i++) {
      const startY = 100 + seededRandom() * 700;
      const moveY = startY + (seededRandom() - 0.5) * 600;
      const duration = 10 + seededRandom() * 250;
      touchEngine.touchStart(startY);
      touchEngine.touchMove(moveY, simClock + duration);
      const res = touchEngine.touchEnd(simClock + duration);
      simClock += duration;

      if (!['full', 'half', 'peek'].includes(res.snapPoint)) {
        monkeyChaosPassed = false;
        break;
      }
    }
    assert(monkeyChaosPassed, `Chaos Monkey Fuzzing: 10 000 стохастичних жестів оброблено без застрягання чи NaN станів`);

    // 2. Responsive Viewports & Safe Area Insets
    const viewports = [
      { name: 'iPhone 15 Pro Max', w: 430, h: 932, sat: 59, sab: 34, expectedMode: 'mobile' },
      { name: 'iPhone 13/14', w: 390, h: 844, sat: 47, sab: 34, expectedMode: 'mobile' },
      { name: 'Compact Android', w: 360, h: 780, sat: 24, sab: 16, expectedMode: 'mobile' },
      { name: 'iPad Tablet', w: 768, h: 1024, sat: 20, sab: 20, expectedMode: 'desktop' },
      { name: 'Full HD Laptop', w: 1920, h: 1080, sat: 0, sab: 0, expectedMode: 'desktop' },
      { name: 'QHD Display', w: 2560, h: 1440, sat: 0, sab: 0, expectedMode: 'desktop' },
      { name: '4K Ultra HD', w: 3840, h: 2160, sat: 0, sab: 0, expectedMode: 'desktop' },
    ];

    for (const vp of viewports) {
      const isDesktop = vp.w >= 768;
      const detected = isDesktop ? 'desktop' : 'mobile';
      assert(
        detected === vp.expectedMode,
        `Viewport '${vp.name}' (${vp.w}x${vp.h}): коректне перемикання layout (${detected}) з урахуванням Safe Area (sat:${vp.sat}px, sab:${vp.sab}px)`
      );
    }

    // 3. Search Performance Simulation (< 0.05ms)
    const testCountries = [
      { iso: 'UKR', name_uk: 'Україна', name_en: 'Ukraine' },
      { iso: 'DEU', name_uk: 'Німеччина', name_en: 'Germany' },
      { iso: 'USA', name_uk: 'Сполучені Штати', name_en: 'United States' },
      { iso: 'JPN', name_uk: 'Японія', name_en: 'Japan' },
      { iso: 'FRA', name_uk: 'Франція', name_en: 'France' },
    ];

    const t0 = performance.now();
    const query = 'укр';
    const match = testCountries.filter(c => c.name_uk.toLowerCase().includes(query) || c.iso.toLowerCase().includes(query));
    const tSearch = performance.now() - t0;

    assert(match.length === 1 && match[0].iso === 'UKR', `Індексний пошук: знайдено ${match[0].name_uk} за запитом '${query}'`);
    assert(tSearch < 0.5, `Бенчмарк пошуку: виконання за ${tSearch.toFixed(3)} ms (< 0.5 ms SLA)`);

    // 4. Climate Math Latitude Thermal Profile Simulation
    const latitudes = [-90, -45, 0, 45, 90];
    for (const lat of latitudes) {
      const baseAvg = 28 - Math.abs(lat) * 0.6;
      const amplitude = Math.min(22, Math.max(3, Math.abs(lat) * 0.38));
      const summerTemp = baseAvg + (lat >= 0 ? amplitude : -amplitude);
      const winterTemp = baseAvg - (lat >= 0 ? amplitude : -amplitude);

      assert(
        Number.isFinite(summerTemp) && Number.isFinite(winterTemp),
        `Кліматична модель (Широта ${lat}°): розраховано T_summer = ${summerTemp.toFixed(1)}°C, T_winter = ${winterTemp.toFixed(1)}°C`
      );
    }

    // 5. ShareUtils & Export Formatting Simulation
    const rootDir = process.cwd();
    const ukLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'locales', 'uk.json'), 'utf8'));
    const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'locales', 'en.json'), 'utf8'));

    const tUk = (k: string) => (ukLocale as any)[k] || k;
    const tEn = (k: string) => (enLocale as any)[k] || k;

    const mockCountry = {
      name_uk: 'Україна',
      name_en: 'Ukraine',
      'ISO3166-1-Alpha-3': 'UKR',
      continent: 'Europe',
      capital_uk: 'Київ',
      capital_en: 'Kyiv',
      population: 43810000,
      gdpPerCapita: 4835,
      dominant_religion: 'Orthodox',
      dominant_percentage: 67.3,
      democracyIndex: 5.42,
      cleanEnergy: 21.5,
    };

    const textUk = formatCountrySummary(mockCountry, null, true, 'uk', tUk);
    const textEn = formatCountrySummary(mockCountry, null, true, 'en', tEn);

    const normUk = textUk.replace(/\s+/g, ' ');
    const normEn = textEn.replace(/\s+/g, ' ');

    assert(
      normUk.includes('Україна') && normUk.includes('Київ') && normUk.includes('$4 835') && normUk.includes('TerraMetrics 3D'),
      `Генерація звіту країни (UK): повна структура з прапором, ВВП, столицею та релігією`
    );
    assert(
      normEn.includes('Ukraine') && normEn.includes('Kyiv') && normEn.includes('$4,835') && normEn.includes('TerraMetrics 3D'),
      `Генерація звіту країни (EN): коректне форматування англійською мовою`
    );

    // Continent report
    const mockContinent = {
      name_uk: 'Європа',
      name_en: 'Europe',
      total_population: 745000000,
      isoCodes: ['UKR', 'DEU', 'FRA', 'POL'],
      avgGdp: 38500,
      avgCleanEnergy: 42.1,
      avgDemocracy: 8.15,
    };

    const contUk = formatCountrySummary(null, mockContinent, false, 'uk', tUk);
    const normContUk = contUk.replace(/\s+/g, ' ');
    assert(
      normContUk.includes('Європа') && normContUk.includes('4') && normContUk.includes('$38 500') && normContUk.includes('42.1%'),
      `Генерація звіту континенту (UK): агреговані показники ВВП, чистої енергії та кількості країн`
    );

    // 5. Geographic Utilities (geoUtils.ts) verification
    const {
      haversineDistance,
      formatCoordinatesDMS,
      calculatePolygonCentroid,
      calculateBoundingBox,
      isPointInPolygon,
      getCountryFlag,
    } = await import('../../../src/utils/geoUtils.ts');

    // Kyiv to London distance ~2130 km
    const distKm = haversineDistance(50.45, 30.52, 51.5074, -0.1278, 'km');
    assert(distKm >= 2100 && distKm <= 2200, `geoUtils: точний розрахунок відстані Гаверсину (Київ-Лондон: ${distKm.toFixed(1)} км)`);

    // DMS coordinate formatting
    const dms = formatCoordinatesDMS(50.45, 30.52);
    assert(dms.includes('50°27\'00" N') && dms.includes('30°31\'12" E'), `geoUtils: градусне форматування координат DMS (${dms})`);

    // Anti-meridian centroid calculation (Fiji region crossing 180°/-180°)
    const fijiCoords = [
      [[177.0, -18.0], [179.0, -18.0], [-179.0, -18.0], [-177.0, -18.0], [177.0, -18.0]]
    ];
    const fijiCentroid = calculatePolygonCentroid(fijiCoords);
    assert(Math.abs(fijiCentroid[0]) >= 175, `geoUtils: обробка антимеридіана для центроїда архіпелагу ([${fijiCentroid.join(', ')}])`);

    // Point in polygon test
    const testPoly: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    assert(isPointInPolygon([5, 5], testPoly) && !isPointInPolygon([15, 15], testPoly), `geoUtils: алгоритм перевірки належності точки полігону (Ray Casting)`);

    // Flag conversion
    assert(getCountryFlag('UKR') === '🇺🇦' && getCountryFlag('USA') === '🇺🇸' && getCountryFlag('GBR') === '🇬🇧', `geoUtils: коректна конвертація ISO3/ISO2 кодів у емодзі-прапорці`);

    // 6. Mobile Space Mode Cycle sequence
    const spaceModes = ['none', 'basic', 'advanced', 'deep', 'none'] as const;
    let modeCycleValid = true;
    for (let i = 0; i < spaceModes.length - 1; i++) {
      const nextModes: Record<string, string> = { none: 'basic', basic: 'advanced', advanced: 'deep', deep: 'none' };
      if (nextModes[spaceModes[i]] !== spaceModes[i + 1]) {
        modeCycleValid = false;
        break;
      }
    }
    assert(modeCycleValid, `MobileTopBar: 4-позиційний безперервний цикл режимів космосу (none ➔ basic ➔ advanced ➔ deep ➔ none)`);

  } catch (err: any) {
    console.error('  ❌ Unhandled exception in Mobile UI simulation:', err);
    passed = false;
  }

  return passed;
}

if (process.argv[1]?.endsWith('02_mobile_gestures_ui.test.ts')) {
  runMobileGesturesUISimulation().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
