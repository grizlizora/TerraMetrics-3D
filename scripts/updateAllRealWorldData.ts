import * as fs from 'fs';
import * as path from 'path';

const rootDir = process.cwd();
const demographicsPath = path.join(rootDir, 'public/demographics.json');
const indexesPath = path.join(rootDir, 'public/indexes.json');
const religionsPath = path.join(rootDir, 'public/religions.json');

const demographics = JSON.parse(fs.readFileSync(demographicsPath, 'utf8'));
const indexes = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
const religions = JSON.parse(fs.readFileSync(religionsPath, 'utf8'));

console.log('🔄 Starting Comprehensive Multi-Vector Real-World Data Synthesis...');

// 1. Curated real-world updates database from research agents
import { REAL_WORLD_DATA_PATCH } from './realWorldDataPatch.ts';

let patchedDemographics = 0;
let patchedIndexes = 0;
let patchedReligions = 0;

for (const [iso, patch] of Object.entries(REAL_WORLD_DATA_PATCH)) {
  // Update demographics
  if (!demographics[iso]) demographics[iso] = {};
  if (patch.demographics) {
    Object.assign(demographics[iso], patch.demographics);
    patchedDemographics++;
  }

  // Update indexes
  if (!indexes[iso]) indexes[iso] = {};
  if (patch.indexes) {
    Object.assign(indexes[iso], patch.indexes);
    patchedIndexes++;
  }

  // Update religions
  if (religions.countries && patch.religions) {
    if (!religions.countries[iso]) {
      religions.countries[iso] = {
        country_en: demographics[iso].capital_en || iso,
        country_uk: demographics[iso].capital_uk || iso,
        continent: patch.continent || 'Europe',
        population: demographics[iso].population || 1000000,
      };
    }
    const rData = religions.countries[iso];
    rData.dominant_religion = patch.religions.dominant_religion;
    rData.dominant_percentage = patch.religions.dominant_percentage;
    rData.stats = patch.religions.stats;
    if (patch.population) rData.population = patch.population;
    patchedReligions++;
  }
}

// Write back updated datasets
fs.writeFileSync(demographicsPath, JSON.stringify(demographics, null, 2), 'utf8');
console.log(`✅ [1/3] Updated demographics.json (${Object.keys(demographics).length} countries)`);

fs.writeFileSync(indexesPath, JSON.stringify(indexes, null, 2), 'utf8');
console.log(`✅ [2/3] Updated indexes.json (${Object.keys(indexes).length} countries)`);

fs.writeFileSync(religionsPath, JSON.stringify(religions, null, 2), 'utf8');
console.log(`✅ [3/3] Updated religions.json (${Object.keys(religions.countries || {}).length} countries)`);

console.log('🎉 Multi-vector real-world data update complete!');
