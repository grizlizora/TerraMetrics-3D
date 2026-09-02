import type { DatasetBundle, ValidationResult } from './types.ts';

export class DataValidator {
  /**
   * Validates full data bundle
   */
  public static validateBundle(bundle: DatasetBundle | null | undefined): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bundle || typeof bundle !== 'object') {
      return { valid: false, errors: ['Bundle is empty or not an object'], warnings: [] };
    }

    const { geoJson, religions, indexes, demographics } = bundle;

    // 1. GeoJSON validation
    const geoRes = this.validateGeoJson(geoJson);
    errors.push(...geoRes.errors);
    warnings.push(...geoRes.warnings);

    // 2. Religions validation
    const relRes = this.validateReligions(religions);
    errors.push(...relRes.errors);
    warnings.push(...relRes.warnings);

    // 3. Indexes validation
    const idxRes = this.validateIndexes(indexes);
    errors.push(...idxRes.errors);
    warnings.push(...idxRes.warnings);

    // 4. Demographics validation
    const demoRes = this.validateDemographics(demographics);
    errors.push(...demoRes.errors);
    warnings.push(...demoRes.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public static validateGeoJson(geoJson: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!geoJson || geoJson.type !== 'FeatureCollection' || !Array.isArray(geoJson.features)) {
      errors.push('GeoJSON must be a valid FeatureCollection with a features array');
      return { valid: false, errors, warnings };
    }

    if (geoJson.features.length < 150) {
      errors.push(`GeoJSON feature count too low (${geoJson.features.length} < 150)`);
    }

    let validIsoCount = 0;
    for (let i = 0; i < Math.min(geoJson.features.length, 50); i++) {
      const f = geoJson.features[i];
      const iso = f.properties?.['ISO3166-1-Alpha-3'];
      if (iso && iso.length === 3 && iso !== '-99') {
        validIsoCount++;
      }
    }

    if (validIsoCount === 0) {
      errors.push('No valid ISO 3166-1 Alpha-3 codes found in sample features');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  public static validateReligions(religions: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!religions || typeof religions.countries !== 'object') {
      errors.push('Religions dataset must contain a countries dictionary');
      return { valid: false, errors, warnings };
    }

    const count = Object.keys(religions.countries).length;
    if (count < 150) {
      errors.push(`Religions dataset has too few countries: ${count} < 150`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  public static validateIndexes(indexes: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!indexes || typeof indexes !== 'object') {
      errors.push('Indexes dataset must be an object');
      return { valid: false, errors, warnings };
    }

    const count = Object.keys(indexes).length;
    if (count < 150) {
      errors.push(`Indexes dataset contains too few entries: ${count} < 150`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  public static validateDemographics(demographics: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!demographics || typeof demographics !== 'object') {
      errors.push('Demographics dataset must be an object');
      return { valid: false, errors, warnings };
    }

    const count = Object.keys(demographics).length;
    if (count < 150) {
      errors.push(`Demographics dataset contains too few entries: ${count} < 150`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
