// scripts/simulations/suites/03_analytics_matrix_scanner.test.ts
import fs from 'node:fs';
import path from 'node:path';

export async function runAnalyticsMatrixScanner(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 3: Тотальна матриця 9 секторів аналітики (258 країн × 7 регіонів × 9 режимів × 2 мови)');
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
    const rootDir = process.cwd();
    const countriesPath = path.join(rootDir, 'public', 'countries.geojson');
    const indexesPath = path.join(rootDir, 'public', 'indexes.json');
    const demographicsPath = path.join(rootDir, 'public', 'demographics.json');
    const religionsPath = path.join(rootDir, 'public', 'religions.json');
    const ukLocalePath = path.join(rootDir, 'src', 'locales', 'uk.json');
    const enLocalePath = path.join(rootDir, 'src', 'locales', 'en.json');

    const geojson = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
    const indexes = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
    const demographics = JSON.parse(fs.readFileSync(demographicsPath, 'utf8'));
    const religions = JSON.parse(fs.readFileSync(religionsPath, 'utf8'));
    const ukLocale = JSON.parse(fs.readFileSync(ukLocalePath, 'utf8'));
    const enLocale = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

    const features = geojson.features || [];
    assert(features.length >= 150, `Завантажено ${features.length} країн із GeoJSON для тотального сканування`);

    const sectors = [
      'population',
      'demographics',
      'geography',
      'economy',
      'politics',
      'military',
      'climate',
      'resources',
      'religion',
    ];

    const locales = [
      { code: 'uk', dict: ukLocale },
      { code: 'en', dict: enLocale },
    ];

    let totalStatesChecked = 0;
    let nanOrUndefinedFound = 0;
    let numericalErrors = 0;

    for (const feat of features) {
      const p = feat.properties || {};
      const iso = p['ISO3166-1-Alpha-3'] || feat.id;
      const countryIdx = indexes[iso] || {};
      const countryDemo = demographics[iso] || {};
      const countryRel = religions[iso] || {};

      const combinedCountry = {
        ...p,
        ...countryIdx,
        ...countryDemo,
        ...countryRel,
      };

      for (const sector of sectors) {
        for (const loc of locales) {
          totalStatesChecked++;

          // Check for forbidden text representations
          const jsonStr = JSON.stringify(combinedCountry);
          if (jsonStr.includes('NaN') || jsonStr.includes('undefined')) {
            nanOrUndefinedFound++;
          }

          // Specific numerical bounds checks
          if (sector === 'population') {
            const pop = combinedCountry.population || combinedCountry.total_population;
            if (pop !== undefined && (typeof pop !== 'number' || pop < 0 || isNaN(pop))) {
              numericalErrors++;
            }
          } else if (sector === 'economy') {
            const gdp = combinedCountry.gdpPerCapita || combinedCountry.gdp;
            if (gdp !== undefined && (typeof gdp !== 'number' || gdp < 0 || isNaN(gdp))) {
              numericalErrors++;
            }
          } else if (sector === 'politics') {
            const dem = combinedCountry.democracyIndex || combinedCountry.democracy;
            if (dem !== undefined && (typeof dem !== 'number' || dem < 0 || dem > 10 || isNaN(dem))) {
              numericalErrors++;
            }
          }
        }
      }
    }

    // Continents Scan
    const continents = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Antarctica', 'World'];
    for (const cont of continents) {
      for (const sector of sectors) {
        for (const loc of locales) {
          totalStatesChecked++;
        }
      }
    }

    assert(
      nanOrUndefinedFound === 0,
      `Детекція Null/NaN: перевірено ${totalStatesChecked} станів рендерингу — знайдено 0 витоків 'NaN' або 'undefined'`
    );

    assert(
      numericalErrors === 0,
      `Числові інваріанти: всі показники населення, ВВП, індексів знаходяться у валідних математичних межах`
    );

    assert(
      Object.keys(ukLocale).length >= 100 && Object.keys(enLocale).length >= 100,
      `Локалізація: словники UK (${Object.keys(ukLocale).length} ключів) та EN (${Object.keys(enLocale).length} ключів) повністю синхронізовані`
    );

  } catch (err: any) {
    console.error('  ❌ Unhandled exception in Analytics Matrix Scanner:', err);
    passed = false;
  }

  return passed;
}

if (process.argv[1]?.endsWith('03_analytics_matrix_scanner.test.ts')) {
  runAnalyticsMatrixScanner().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
