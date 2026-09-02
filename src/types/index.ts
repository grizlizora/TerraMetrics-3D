export type AppLanguage = 'uk' | 'en';
export type ThemeMode = 'dark' | 'light';
export type MacroCategory = 'society' | 'state' | 'nature';

// Compatibility Aliases
export type MainCategory = MacroCategory;
export type CategoryKey = MacroCategory;
export type ProjectionMode = 'globe' | 'mercator';
export type SheetSnap = 'closed' | 'peek' | 'half' | 'full';
export type SheetSnapPoint = SheetSnap;

export type SubMode =
  | 'religion'
  | 'population'
  | 'demographics'
  | 'economy'
  | 'politics'
  | 'military'
  | 'climate'
  | 'geography'
  | 'resources';

export type SpaceMode = 'none' | 'basic' | 'advanced' | 'deep';

export type ContinentName =
  | 'World'
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'North America'
  | 'South America'
  | 'Oceania';

export type ISO3Code = string;

export interface ReligionStat {
  name: string;
  percentage: number;
}

export interface CountryReligionData {
  country_uk?: string;
  country_en?: string;
  dominant_religion?: string;
  dominant_percentage?: number;
  population?: number;
  continent?: ContinentName;
  stats?: ReligionStat[];
  adherents?: Record<string, number>;
}

export interface ReligionDataset {
  countries: Record<ISO3Code, CountryReligionData>;
}

export interface CountryProperties {
  'ISO3166-1-Alpha-3': ISO3Code;
  name?: string;
  name_uk?: string;
  name_en?: string;
  continent: ContinentName;
  subregion?: string;
  dominant_religion?: string;
  dominant_percentage?: number;
  dom_religion?: string;
  stats?: Array<{ name: string; percentage: number }>;
  religions?: Record<string, number> | null;
  population?: number;
  area_sq_km?: number;
  gdp_per_capita?: number;
  military_personnel?: number;
  clean_energy_pct?: number;
  democracy_index?: number;
  safety_index?: number;
  healthcare_index?: number;
  internet_speed_mbps?: number;
  ev_readiness_score?: number;
  gini_index?: number | null;
  income_tax_top_pct?: number;
  urban_population_pct?: number;
  median_age?: number;
  driving_side?: string;
  plug_type?: string;
  plug_voltage?: number;
  plug_frequency?: number;
  tax_system?: string;
  coastline_km?: number;
  highest_elevation_m?: number;
  lowest_elevation_m?: number;
  gdpPerCapita?: number;
  democracyIndex?: number;
  militarySpending?: number;
  militarySize?: number;
  area?: number;
  areaKm2?: number;
  borderLength?: number;
  border_length?: number;
  highestPeak?: number;
  cleanEnergy?: number;
  evIndex?: number;
  gini?: number | null;
  currency?: string | null;
  currency_uk?: string | null;
  currency_en?: string | null;
  drivingSide?: string | null;
  incomeTax?: number;
  macroTaxRevenue?: number;
  safetyIndex?: number;
  healthcareIndex?: number;
  internetSpeed?: number;
  capital?: string;
  capital_uk?: string;
  capital_en?: string;
  languages?: string | string[];
  languages_uk?: string;
  languages_en?: string;
  politicalSystem?: string;
  avgSalary?: number;
  colIndex?: number;
  climate_zones?: string[];
  center?: [number, number];
  bbox?: [number, number, number, number];
  primaryBbox?: [number, number, number, number];
}

export interface CountryFeature {
  type: 'Feature';
  properties: CountryProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

export interface LabelFeature {
  type: 'Feature';
  properties: {
    'ISO3166-1-Alpha-3': ISO3Code;
    name_uk: string;
    name_en: string;
    population?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface LabelFeatureCollection {
  type: 'FeatureCollection';
  features: LabelFeature[];
}

export interface CountryDemographicsEntry {
  capital_uk?: string;
  capital_en?: string;
  capital?: string;
  languages_uk?: string;
  languages_en?: string;
  languages?: string;
  gini?: number | null;
  currency_uk?: string;
  currency_en?: string;
  currency?: string | null;
  drivingSide?: 'right' | 'left' | string | null;
  driving_side?: string;
  area?: number;
  area_sq_km?: number;
  population?: number;
  gdp?: number;
  gdp_per_capita?: number;
  military_personnel?: number;
  military_percent?: number;
  military_active?: number;
  macro_tax?: number;
  plug_type?: string;
  plug_voltage?: number;
  plug_frequency?: number;
  tax_system?: string;
  coastline_km?: number;
  highest_elevation_m?: number;
  lowest_elevation_m?: number;
  urban_population_pct?: number;
  median_age?: number;
}

export type StaticDemographicsMap = Record<ISO3Code, CountryDemographicsEntry>;

export interface StaticIndexesMap {
  [iso3: string]: {
    democracy?: number;
    safety?: number;
    healthcare?: number;
    ev?: number;
    internet?: number;
    peak?: number;
    tax?: number;
    energy?: number;
    salary?: number;
    col?: number;
    system?: string;
    clean_energy_pct?: number;
    democracy_index?: number;
    safety_index?: number;
    healthcare_index?: number;
    internet_speed_mbps?: number;
    ev_readiness_score?: number;
    gini_index?: number;
    income_tax_top_pct?: number;
    democracyIndex?: number;
    militarySpending?: number;
    militarySize?: number;
    highestPeak?: number;
    borderLength?: number;
    cleanEnergy?: number;
    evIndex?: number;
    safetyIndex?: number;
    healthcareIndex?: number;
    internetSpeed?: number;
  };
}

export interface RestCountryApiItem {
  cca3: string;
  population: number;
  area: number;
  languages?: Record<string, string>;
  capital?: string[];
  gini?: Record<string, number>;
  currencies?: Record<string, { name: string; symbol: string }>;
  car?: { side: string };
}

export interface WorldBankIndicatorItem {
  countryiso3code: string;
  value: number | null;
}

export interface AggregatedCountryItem {
  iso: ISO3Code;
  name_uk: string;
  name_en: string;
  population: number;
  area_sq_km?: number;
  gdp_per_capita?: number;
  military_personnel?: number;
  clean_energy_pct?: number;
  democracy_index?: number;
  safety_index?: number;
  healthcare_index?: number;
  internet_speed_mbps?: number;
  ev_readiness_score?: number;
  gini_index?: number;
  income_tax_top_pct?: number;
  coastline_km?: number;
  dom_religion?: string;
  urban_population_pct?: number;
  median_age?: number;
  // Compatibility aliases
  gdp?: number;
  democracy?: number;
  military?: number;
  area?: number;
  borders?: number;
  cleanEnergy?: number;
  ev?: number;
  center?: [number, number] | null;
  gini?: number | null;
  currency?: string | null;
  drivingSide?: string | null;
  driving_side?: string | null;
  incomeTax?: number;
  safetyIndex?: number;
  healthcareIndex?: number;
  internetSpeed?: number;
}

export interface AggregatedContinentStats {
  continent?: ContinentName;
  name_uk: string;
  name_en: string;
  countryCount?: number;
  dominant_religion: string;
  dominant_percentage?: number;
  total_population: number;
  total_area_sq_km?: number;
  avg_gdp_per_capita?: number;
  total_military_personnel?: number;
  avg_clean_energy_pct?: number;
  avg_democracy_index?: number;
  avg_safety_index?: number;
  avg_healthcare_index?: number;
  avg_internet_speed_mbps?: number;
  avg_ev_readiness_score?: number;
  avg_gini_index?: number;
  avg_income_tax_top_pct?: number;
  religion_breakdown?: Record<string, number>;
  driving_side_pct?: { right: number; left: number };
  power_grid_pct?: { '230V': number; '120V': number; other: number };
  tax_systems?: Record<string, number>;
  total_coastline_km?: number;
  highest_elevation_m?: number;
  lowest_elevation_m?: number;
  stats?: Array<{ name: string; percentage: number }>;
  top_populated: AggregatedCountryItem[];
  top_area?: AggregatedCountryItem[];
  top_gdp?: AggregatedCountryItem[];
  top_military?: AggregatedCountryItem[];
  top_clean_energy?: AggregatedCountryItem[];
  top_democracy?: AggregatedCountryItem[];
  top_safety?: AggregatedCountryItem[];
  top_healthcare?: AggregatedCountryItem[];
  top_internet?: AggregatedCountryItem[];
  top_ev?: AggregatedCountryItem[];
  top_tax?: AggregatedCountryItem[];
  isoCodes: ISO3Code[];
  avgGdp?: number;
  avgDemocracy?: number;
  totalMilitary?: number;
  totalArea?: number;
  totalBorders?: number;
  avgCleanEnergy?: number;
  avgEv?: number;
  avgGini?: number;
  avgTax?: number;
  avgSafety?: number;
  avgHealth?: number;
  avgInternet?: number;
  rightDrivePct?: number;
  leftDrivePct?: number;
  topEconomy?: AggregatedCountryItem[];
  topArea?: AggregatedCountryItem[];
  topMilitary?: AggregatedCountryItem[];
  topDemocracy?: AggregatedCountryItem[];
  topSafety?: AggregatedCountryItem[];
  topInternet?: AggregatedCountryItem[];
  topEv?: AggregatedCountryItem[];
  topTax?: AggregatedCountryItem[];
  topBorders?: AggregatedCountryItem[];
  topGini?: AggregatedCountryItem[];
  topHealth?: AggregatedCountryItem[];
  topCurrencies?: Array<{ name: string; name_uk?: string; name_en?: string; count: number }>;
  climateCoords: Array<[number, number]>;
}

// Search Index Structure (<0.05ms Instant Search)
export interface SearchIndexEntry {
  iso: ISO3Code;
  isoLower: string;
  nameUk: string;
  nameEn: string;
  nameUkLower: string;
  nameEnLower: string;
  continent: ContinentName;
  population: number;
}

// Multi-stage Loading
export type LoadingStageKey = 'init' | 'geo' | 'analytics' | 'engine' | 'ready' | 'error';

export interface LoadingProgressCallback {
  (stage: LoadingStageKey, progress: number): void;
}
