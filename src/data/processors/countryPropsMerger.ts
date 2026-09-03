import type {
  CountryFeature,
  CountryProperties,
  ISO3Code,
  LabelFeature,
  ReligionDataset,
  StaticDemographicsMap,
  StaticIndexesMap,
} from '../../types/index.ts';
import { GeoCentroidCalculator } from './geoCentroidCalculator.ts';
import { getContinentForIso } from '../constants/continents.ts';
import { getCountryNameUk } from '../i18n/countryNamesUk.ts';

export interface ProcessFeaturesResult {
  validFeatures: CountryFeature[];
  labelsFeatures: LabelFeature[];
  countryPropsMap: Record<ISO3Code, CountryProperties>;
}

/**
 * Safe numeric extractor: searches through multiple candidate fields in priority order,
 * ensures valid finite number, and never returns NaN.
 */
function getNum(candidates: any[], fallback = 0): number {
  for (let i = 0; i < candidates.length; i++) {
    const val = candidates[i];
    if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
      return val;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      const parsed = Number(val);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

/**
 * Safe string extractor
 */
function getStr(candidates: any[], fallback = ''): string {
  for (let i = 0; i < candidates.length; i++) {
    const val = candidates[i];
    if (typeof val === 'string' && val.trim() !== '') {
      return val.trim();
    }
  }
  return fallback;
}

export class CountryPropsMerger {
  /**
   * Merges raw GeoJSON properties with demographics, indexes, and religions datasets.
   * Generates both snake_case and camelCase aliases for MapLibre styles and UI components.
   */
  public static mergeSingle(
    rawProps: any,
    iso: ISO3Code,
    demo: any,
    idx: any,
    rel: any,
    bboxData: {
      bbox: [number, number, number, number];
      primaryBbox: [number, number, number, number];
      center: [number, number];
      borderLength?: number;
    }
  ): CountryProperties {
    const nameEn = getStr([rel?.country_en, demo?.name_en, rawProps.name_en, rawProps.name], iso);
    const nameUk = getCountryNameUk(iso, rawProps.name) || getStr([rel?.country_uk, demo?.name_uk, rawProps.name_uk, rawProps.name_en, rawProps.name], iso);
    const continent = (getContinentForIso(iso) || getStr([rel?.continent, demo?.continent, rawProps.continent], 'World')) as any;

    const population = getNum([demo?.population, rawProps.population, rel?.population], 0);
    const area = getNum([demo?.area, demo?.area_sq_km, rawProps.area, rawProps.area_sq_km], 0);
    const gdpPerCapita = getNum([demo?.gdp, demo?.gdp_per_capita, rawProps.gdp, rawProps.gdp_per_capita], 0);
    const militarySize = getNum([demo?.military_active, demo?.military_personnel, rawProps.military_active, rawProps.military_personnel], 0);
    const militaryPercent = getNum([demo?.military_percent, demo?.militarySpending, rawProps.military_percent], 0);

    const cleanEnergy = getNum([idx?.energy, idx?.cleanEnergy, idx?.clean_energy_pct, rawProps.clean_energy_pct], 0);
    const democracyIndex = getNum([idx?.democracy, idx?.democracyIndex, idx?.democracy_index, rawProps.democracy_index], 0);
    const safetyIndex = getNum([idx?.safety, idx?.safetyIndex, idx?.safety_index, rawProps.safety_index], 0);
    const healthcareIndex = getNum([idx?.healthcare, idx?.healthcareIndex, idx?.healthcare_index, rawProps.healthcare_index], 0);
    const internetSpeed = getNum([idx?.internet, idx?.internetSpeed, idx?.internet_speed_mbps, rawProps.internet_speed_mbps], 0);
    const evIndex = getNum([idx?.ev, idx?.evIndex, idx?.ev_readiness_score, rawProps.ev_readiness_score], 0);
    const highestPeak = getNum([idx?.peak, idx?.highestPeak, demo?.highest_elevation_m, rawProps.highest_elevation_m], 0);
    const incomeTax = getNum([idx?.tax, idx?.incomeTax, idx?.income_tax_top_pct, rawProps.income_tax_top_pct], 0);
    const avgSalary = getNum([idx?.salary, idx?.avgSalary, rawProps.avgSalary], 0);
    const colIndex = getNum([idx?.col, idx?.colIndex, rawProps.colIndex], 0);
    const politicalSystem = getStr([idx?.system, idx?.politicalSystem, rawProps.politicalSystem], '');

    const giniVal = demo?.gini !== undefined && demo?.gini !== null ? Number(demo.gini) : (idx?.gini_index !== undefined ? Number(idx.gini_index) : null);
    const gini = giniVal !== null && !Number.isNaN(giniVal) ? giniVal : null;

    const domReligion = getStr([rel?.dominant_religion, rawProps.dom_religion, rawProps.dominant_religion], 'Unknown');
    const dominantPercentage = getNum([rel?.dominant_percentage, rawProps.dominant_percentage], 0);
    const religionStats = Array.isArray(rel?.stats) ? rel.stats : [];
    const adherents = rel?.adherents || rawProps.religions || null;

    const drivingSide = getStr([demo?.drivingSide, demo?.driving_side, rawProps.drivingSide, rawProps.driving_side], 'right');
    const capitalUk = getStr([demo?.capital_uk, rawProps.capital_uk, demo?.capital, rawProps.capital], '');
    const capitalEn = getStr([demo?.capital_en, rawProps.capital_en, demo?.capital, rawProps.capital], '');
    const languagesUk = getStr([demo?.languages_uk, rawProps.languages_uk, demo?.languages, rawProps.languages], '');
    const languagesEn = getStr([demo?.languages_en, rawProps.languages_en, demo?.languages, rawProps.languages], '');
    const currencyUk = getStr([demo?.currency_uk, rawProps.currency_uk, demo?.currency, rawProps.currency], '');
    const currencyEn = getStr([demo?.currency_en, rawProps.currency_en, demo?.currency, rawProps.currency], '');

    const urbanPop = getNum([demo?.urban_population_pct, rawProps.urban_population_pct], 0);
    const medianAge = getNum([demo?.median_age, rawProps.median_age], 0);
    const plugType = getStr([demo?.plug_type, rawProps.plug_type], 'C/F');
    const plugVolt = getNum([demo?.plug_voltage, rawProps.plug_voltage], 230);
    const plugFreq = getNum([demo?.plug_frequency, rawProps.plug_frequency], 50);
    const taxSys = getStr([demo?.tax_system, rawProps.tax_system], 'progressive');
    const coastline = getNum([demo?.coastline_km, rawProps.coastline_km], 0);
    const lowestElevation = getNum([demo?.lowest_elevation_m, rawProps.lowest_elevation_m], 0);

    return {
      name: nameUk || nameEn || iso,
      name_en: nameEn,
      name_uk: nameUk,
      'ISO3166-1-Alpha-3': iso,
      continent,
      subregion: rawProps.subregion || continent,

      // Population & Demographics
      population,
      area_sq_km: area,
      areaKm2: area,
      area,
      urban_population_pct: urbanPop,
      median_age: medianAge,

      // Economy
      gdp_per_capita: gdpPerCapita,
      gdpPerCapita,
      avgSalary,
      colIndex,
      income_tax_top_pct: incomeTax,
      incomeTax,
      macroTaxRevenue: getNum([demo?.macro_tax, rawProps.macro_tax], 0),

      // Politics & Governance
      democracy_index: democracyIndex,
      democracyIndex,
      politicalSystem,
      safety_index: safetyIndex,
      safetyIndex,
      healthcare_index: healthcareIndex,
      healthcareIndex,

      // Infrastructure & Technology
      clean_energy_pct: cleanEnergy,
      cleanEnergy,
      ev_readiness_score: evIndex,
      evIndex,
      internet_speed_mbps: internetSpeed,
      internetSpeed,

      // Military
      military_personnel: militarySize,
      militarySize,
      militarySpending: militaryPercent,

      // Religion
      dom_religion: domReligion,
      dominant_religion: domReligion,
      dominant_percentage: dominantPercentage,
      stats: religionStats,
      religions: adherents,

      // Geography & Physical
      highest_elevation_m: highestPeak,
      highestPeak,
      lowest_elevation_m: lowestElevation,
      coastline_km: coastline,
      borderLength: getNum([demo?.border_length, rawProps.border_length, bboxData.borderLength], 0),
      border_length: getNum([demo?.border_length, rawProps.border_length, bboxData.borderLength], 0),
      climate_zones: rawProps.climate_zones || [],

      // Social & Cultural
      gini_index: gini,
      gini,
      driving_side: drivingSide,
      drivingSide,
      plug_type: plugType,
      plug_voltage: plugVolt,
      plug_frequency: plugFreq,
      tax_system: taxSys,

      // Localized Strings
      capital: capitalUk || capitalEn,
      capital_uk: capitalUk,
      capital_en: capitalEn,
      languages: languagesUk || languagesEn,
      languages_uk: languagesUk,
      languages_en: languagesEn,
      currency: currencyUk || currencyEn,
      currency_uk: currencyUk,
      currency_en: currencyEn,

      // Spatial & Bounds
      bbox: bboxData.bbox,
      primaryBbox: bboxData.primaryBbox,
      center: bboxData.center,
    };
  }

  public static processAll(
    rawGeoJson: any,
    demographicsMap: StaticDemographicsMap | null,
    indexMap: StaticIndexesMap | null,
    religionData: ReligionDataset | null
  ): ProcessFeaturesResult {
    const validFeatures: CountryFeature[] = [];
    const labelsFeatures: LabelFeature[] = [];
    const countryPropsMap: Record<ISO3Code, CountryProperties> = {} as any;

    const features = rawGeoJson?.features || [];

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const rawProps = feature.properties || {};
      const iso = (rawProps['ISO3166-1-Alpha-3'] || '') as ISO3Code;

      if (!iso || iso === '-99') continue;

      const demo = demographicsMap?.[iso];
      const idx = indexMap?.[iso];
      const rel = religionData?.countries?.[iso];

      const bboxData = GeoCentroidCalculator.computeBboxAndCenter(feature.geometry, rawProps.center);
      const mergedProps = this.mergeSingle(rawProps, iso, demo, idx, rel, bboxData);

      feature.properties = mergedProps;
      validFeatures.push(feature);
      countryPropsMap[iso] = mergedProps;

      const labelFeat = GeoCentroidCalculator.createLabelFeature(
        iso,
        mergedProps.name_uk || mergedProps.name || iso,
        mergedProps.name_en || mergedProps.name || iso,
        mergedProps.population || 0,
        bboxData.center
      );
      labelsFeatures.push(labelFeat);
    }

    return { validFeatures, labelsFeatures, countryPropsMap };
  }
}
