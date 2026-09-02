import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { StaticDemographicsMap } from '../src/types/index.ts';
import { WORLD_COUNTRY_PROFILES } from './worldCapitalsData.ts';

const rootDir = process.cwd();

const religionsPath = path.join(rootDir, 'public/religions.json');
const indexesPath = path.join(rootDir, 'public/indexes.json');
const demographicsPath = path.join(rootDir, 'public/demographics.json');

const religionsData = JSON.parse(fs.readFileSync(religionsPath, 'utf8'));
const indexesData = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));

// Curated accurate demographics & capitals database for countries
const DEMOGRAPHICS_DB: Record<string, any> = WORLD_COUNTRY_PROFILES;


const LEFT_DRIVE_ISOS = new Set([
  'GBR', 'IRL', 'CYP', 'MLT', 'AUS', 'NZL', 'JPN', 'IND', 'PAK', 'BGD', 'LKA',
  'IDN', 'MYS', 'THA', 'SGP', 'BRN', 'ZAF', 'KEN', 'TZA', 'UGA', 'ZMB', 'ZWE',
  'MOZ', 'NAM', 'BWA', 'MWI', 'LSO', 'SWZ', 'SUR', 'GUY', 'FJI', 'PNG', 'WSM',
  'TON', 'SLB', 'VUT', 'BHS', 'JAM', 'BRB', 'TTO', 'GRD', 'LCA', 'VCT', 'ATG', 'KNA'
]);

const CONTINENT_DEFAULTS: Record<string, any> = {
  Europe: {
    languages_uk: "Офіційна мова", languages_en: "Official language",
    currency_uk: "Євро (€)", currency_en: "Euro (€)",
    drivingSide: "right", gini: 30.5, gdp: 38000, macro_tax: 35.0, military_percent: 1.8, military_active: 120000
  },
  Asia: {
    languages_uk: "Національна мова", languages_en: "National language",
    currency_uk: "Національна валюта", currency_en: "National currency",
    drivingSide: "right", gini: 36.0, gdp: 12500, macro_tax: 18.0, military_percent: 2.1, military_active: 250000
  },
  Africa: {
    languages_uk: "Офіційна та корінні мови", languages_en: "Official and native languages",
    currency_uk: "Франк / Шилінг / Фунт", currency_en: "National currency",
    drivingSide: "right", gini: 42.0, gdp: 2800, macro_tax: 15.0, military_percent: 1.5, military_active: 65000
  },
  'North America': {
    languages_uk: "Англійська / Іспанська", languages_en: "English / Spanish",
    currency_uk: "Долар / Песо", currency_en: "Dollar / Peso",
    drivingSide: "right", gini: 38.0, gdp: 35000, macro_tax: 24.0, military_percent: 2.0, military_active: 200000
  },
  'South America': {
    languages_uk: "Іспанська / Португальська", languages_en: "Spanish / Portuguese",
    currency_uk: "Песо / Реал / Соль", currency_en: "Peso / Real / Sol",
    drivingSide: "right", gini: 45.0, gdp: 8500, macro_tax: 22.0, military_percent: 1.3, military_active: 110000
  },
  Oceania: {
    languages_uk: "Англійська та місцеві мови", languages_en: "English and indigenous languages",
    currency_uk: "Австралійський долар ($)", currency_en: "Dollar",
    drivingSide: "left", gini: 34.0, gdp: 45000, macro_tax: 28.0, military_percent: 1.7, military_active: 30000
  }
};

const fullDemographics: StaticDemographicsMap = {};

for (const [iso, rel] of Object.entries(religionsData.countries || {}) as [string, any][]) {
  const custom = DEMOGRAPHICS_DB[iso] || {};
  const contDef = CONTINENT_DEFAULTS[rel.continent] || CONTINENT_DEFAULTS.Europe;
  const isLeftDrive = LEFT_DRIVE_ISOS.has(iso);

  const idx = indexesData[iso] || {};
  const population = custom.population || rel.population || 5000000;
  const area = custom.area || Math.max(1000, Math.round(population / (idx.col || 45) * 3));

  fullDemographics[iso] = {
    capital_uk: custom.capital_uk || rel.country_uk,
    capital_en: custom.capital_en || rel.country_en,
    languages_uk: custom.languages_uk || contDef.languages_uk,
    languages_en: custom.languages_en || contDef.languages_en,
    gini: custom.gini !== undefined ? custom.gini : contDef.gini,
    currency_uk: custom.currency_uk || contDef.currency_uk,
    currency_en: custom.currency_en || contDef.currency_en,
    drivingSide: custom.drivingSide || (isLeftDrive ? 'left' : 'right'),
    area: area,
    population: population,
    gdp: custom.gdp || (idx.salary ? idx.salary * 32 : contDef.gdp),
    military_percent: custom.military_percent !== undefined ? custom.military_percent : (idx.militarySpending || contDef.military_percent),
    military_active: custom.military_active || Math.round(population * 0.005),
    macro_tax: custom.macro_tax || idx.tax || contDef.macro_tax,
  };
}

fs.writeFileSync(demographicsPath, JSON.stringify(fullDemographics, null, 2), 'utf8');
console.log(`Generated full offline demographics in pure TypeScript for ${Object.keys(fullDemographics).length} countries in ${demographicsPath}`);
