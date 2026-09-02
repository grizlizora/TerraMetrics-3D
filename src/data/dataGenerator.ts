// Pure TypeScript Data Generator & Validator for TerraMetrics-3D
import { ReligionDataset, StaticDemographicsMap, StaticIndexesMap } from '../types';

export const CONTINENT_PROFILES: Record<string, Record<string, number>> = {
  Europe: { 'Християнство': 70, 'Атеїзм/Нерелігійні': 20, 'Іслам': 7, 'Інші': 3 },
  Asia: { 'Іслам': 25, 'Індуїзм': 25, 'Буддизм': 15, 'Атеїзм/Нерелігійні': 20, 'Християнство': 7, 'Народні вірування': 5, 'Інші': 3 },
  Africa: { 'Християнство': 50, 'Іслам': 40, 'Народні вірування': 9, 'Інші': 1 },
  'North America': { 'Християнство': 75, 'Атеїзм/Нерелігійні': 15, 'Інші': 10 },
  'South America': { 'Християнство': 85, 'Атеїзм/Нерелігійні': 10, 'Інші': 5 },
  Oceania: { 'Християнство': 60, 'Атеїзм/Нерелігійні': 25, 'Інші': 15 },
};

export const CONTINENT_TRANSLATIONS: Record<string, { uk: string; en: string }> = {
  World: { uk: 'Глобально (Світ)', en: 'Global (World)' },
  Europe: { uk: 'Європа', en: 'Europe' },
  Asia: { uk: 'Азія', en: 'Asia' },
  Africa: { uk: 'Африка', en: 'Africa' },
  'North America': { uk: 'Північна Америка', en: 'North America' },
  'South America': { uk: 'Південна Америка', en: 'South America' },
  Oceania: { uk: 'Океанія', en: 'Oceania' },
};

/**
 * Validates dataset completeness
 */
export function validateDatasets(
  religions: ReligionDataset,
  indexes: StaticIndexesMap,
  demographics: StaticDemographicsMap
): { totalCountries: number; validDemographics: number; validIndexes: number } {
  const isos = Object.keys(religions.countries || {});
  let validDemo = 0;
  let validIdx = 0;

  for (const iso of isos) {
    if (demographics && demographics[iso]) validDemo++;
    if (indexes && indexes[iso]) validIdx++;
  }

  return {
    totalCountries: isos.length,
    validDemographics: validDemo,
    validIndexes: validIdx,
  };
}
