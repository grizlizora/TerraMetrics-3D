import type {
  AggregatedContinentStats,
  AggregatedCountryItem,
  ContinentName,
  ISO3Code,
  ReligionDataset,
  StaticDemographicsMap,
} from '../../types/index.ts';
import { getContinentForIso } from '../constants/continents.ts';

export const CONTINENT_NAMES: ContinentName[] = [
  'World',
  'Europe',
  'Asia',
  'Africa',
  'North America',
  'South America',
  'Oceania',
];

export const CONTINENT_TRANSLATIONS: Record<ContinentName, { uk: string; en: string }> = {
  World: { uk: 'Глобально (Світ)', en: 'Global (World)' },
  Asia: { uk: 'Азія', en: 'Asia' },
  Europe: { uk: 'Європа', en: 'Europe' },
  Africa: { uk: 'Африка', en: 'Africa' },
  'North America': { uk: 'Північна Америка', en: 'North America' },
  'South America': { uk: 'Південна Америка', en: 'South America' },
  Oceania: { uk: 'Океанія', en: 'Oceania' },
};

export const CONTINENT_CLIMATE_COORDS: Record<ContinentName, [number, number][]> = {
  Europe: [[15, 50], [2, 48], [30, 50]],
  Asia: [[85, 38], [116, 40], [77, 28]],
  Africa: [[20, 5], [31, 30], [18, -34]],
  'North America': [[-100, 42], [-74, 40], [-122, 37]],
  'South America': [[-58, -20], [-43, -22], [-70, -33]],
  Oceania: [[135, -25], [151, -33], [174, -41]],
  World: [[15, 20], [0, 51], [-74, 40]],
};

export class ContinentStatsAggregator {
  public static aggregateContinent(
    continentName: ContinentName,
    features: any,
    religionData: ReligionDataset | null,
    demographicsMap: StaticDemographicsMap | null
  ): AggregatedContinentStats {
    let rawList: any[] = [];
    if (features instanceof Map) {
      rawList = Array.from(features.values());
    } else if (Array.isArray(features)) {
      rawList = features;
    } else if (features && typeof features === 'object') {
      rawList = Object.values(features);
    }

    const isGlobal = continentName === 'World';
    const matchingFeatures = isGlobal
      ? rawList
      : rawList.filter((f) => {
          const props = f.properties || f;
          const iso = (props['ISO3166-1-Alpha-3'] || props.iso || '') as string;
          const cont = props?.continent || getContinentForIso(iso);
          return cont === continentName;
        });

    const countryItems: AggregatedCountryItem[] = [];
    const relCounts: Record<string, number> = {};
    const currencyCounts: Record<string, { count: number; name_uk: string; name_en: string }> = {};
    const driveSideCounts = { right: 0, left: 0 };
    const powerGridCounts: Record<string, number> = { '230V': 0, '120V': 0, other: 0 };
    const taxSystemCounts: Record<string, number> = { progressive: 0, flat: 0, territorial: 0, none: 0 };

    let totalArea = 0;
    let totalMilitary = 0;
    let totalCoastline = 0;
    let totalBorders = 0;
    let validGdpPopSum = 0;
    let gdpSum = 0;
    let highestElevation = -Infinity;
    let lowestElevation = Infinity;

    // Separate accumulators and valid counters to prevent index dilution
    let democracySum = 0, democracyCount = 0;
    let cleanEnergySum = 0, cleanEnergyCount = 0;
    let evIndexSum = 0, evIndexCount = 0;
    let safetyIndexSum = 0, safetyIndexCount = 0;
    let healthcareIndexSum = 0, healthcareIndexCount = 0;
    let internetSpeedSum = 0, internetSpeedCount = 0;
    let giniSum = 0, giniCount = 0;
    let incomeTaxSum = 0, incomeTaxCount = 0;

    for (let i = 0; i < matchingFeatures.length; i++) {
      const p = matchingFeatures[i].properties || matchingFeatures[i] || {};
      const iso = (p['ISO3166-1-Alpha-3'] || p.iso || '') as ISO3Code;
      const pop = Number(p.population) || 0;
      const area = Number(p.area_sq_km || p.area || p.areaKm2) || 0;
      const gdpCap = Number(p.gdp_per_capita || p.gdpPerCapita) || 0;
      const mil = Number(p.military_personnel || p.militarySize) || 0;
      const coast = Number(p.coastline_km) || 0;
      const borders = Number(p.borderLength) || 0;
      const highEle = Number(p.highest_elevation_m || p.highestPeak);
      const lowEle = Number(p.lowest_elevation_m);

      totalArea += area;
      totalMilitary += mil;
      totalCoastline += coast;
      totalBorders += borders;

      if (gdpCap > 0 && pop > 0) {
        gdpSum += gdpCap * pop;
        validGdpPopSum += pop;
      }

      if (!Number.isNaN(highEle) && highEle > highestElevation) highestElevation = highEle;
      if (!Number.isNaN(lowEle) && lowEle < lowestElevation) lowestElevation = lowEle;

      const driveSide = (p.driving_side || p.drivingSide) === 'left' ? 'left' : 'right';
      driveSideCounts[driveSide]++;

      const plugVolt = Number(p.plug_voltage) || 230;
      if (plugVolt >= 200) powerGridCounts['230V']++;
      else if (plugVolt >= 100) powerGridCounts['120V']++;
      else powerGridCounts.other++;

      const taxSys = p.tax_system || 'progressive';
      if (taxSystemCounts[taxSys] !== undefined) taxSystemCounts[taxSys]++;
      else taxSystemCounts.progressive++;

      const demVal = Number(p.democracy_index ?? p.democracyIndex);
      if (demVal > 0) { democracySum += demVal; democracyCount++; }

      const cleanVal = Number(p.clean_energy_pct ?? p.cleanEnergy);
      if (cleanVal > 0) { cleanEnergySum += cleanVal; cleanEnergyCount++; }

      const evVal = Number(p.ev_readiness_score ?? p.evIndex);
      if (evVal > 0) { evIndexSum += evVal; evIndexCount++; }

      const safeVal = Number(p.safety_index ?? p.safetyIndex);
      if (safeVal > 0) { safetyIndexSum += safeVal; safetyIndexCount++; }

      const healthVal = Number(p.healthcare_index ?? p.healthcareIndex);
      if (healthVal > 0) { healthcareIndexSum += healthVal; healthcareIndexCount++; }

      const netVal = Number(p.internet_speed_mbps ?? p.internetSpeed);
      if (netVal > 0) { internetSpeedSum += netVal; internetSpeedCount++; }

      const giniVal = Number(p.gini_index ?? p.gini);
      if (giniVal > 0) { giniSum += giniVal; giniCount++; }

      const taxVal = Number(p.income_tax_top_pct ?? p.incomeTax);
      if (!Number.isNaN(taxVal) && taxVal > 0) {
        incomeTaxSum += taxVal;
        incomeTaxCount++;
      }

      // Currencies aggregation (filter placeholders)
      const cur = p.currency || p.currency_en || p.currency_uk;
      if (
        cur &&
        cur !== 'N/A' &&
        cur !== 'None' &&
        !cur.toLowerCase().includes('national currency') &&
        !cur.toLowerCase().includes('національна валюта') &&
        !cur.toLowerCase().includes('unknown')
      ) {
        const curKey = cur.split(' ')[0] || cur;
        if (!currencyCounts[curKey]) {
          currencyCounts[curKey] = {
            count: 0,
            name_uk: p.currency_uk || cur,
            name_en: p.currency_en || cur,
          };
        }
        currencyCounts[curKey].count++;
      }

      const item: AggregatedCountryItem = {
        iso,
        name_uk: p.name_uk || p.name || iso,
        name_en: p.name_en || p.name || iso,
        population: pop,
        area_sq_km: area,
        area,
        gdp_per_capita: gdpCap,
        gdp: gdpCap,
        military_personnel: mil,
        military: mil,
        clean_energy_pct: cleanVal || 0,
        cleanEnergy: cleanVal || 0,
        democracy_index: demVal || 0,
        democracy: demVal || 0,
        safety_index: safeVal || 0,
        safetyIndex: safeVal || 0,
        healthcare_index: healthVal || 0,
        healthcareIndex: healthVal || 0,
        internet_speed_mbps: netVal || 0,
        internetSpeed: netVal || 0,
        ev_readiness_score: evVal || 0,
        ev: evVal || 0,
        gini_index: giniVal || null,
        gini: giniVal || null,
        income_tax_top_pct: taxVal || 0,
        incomeTax: taxVal || 0,
        coastline_km: coast,
        dom_religion: p.dom_religion || p.dominant_religion || 'Unknown',
        urban_population_pct: Number(p.urban_population_pct) || 0,
        median_age: Number(p.median_age) || 0,
        drivingSide: driveSide,
        driving_side: driveSide,
        currency: cur || null,
        center: p.center || null,
        borders,
      };
      countryItems.push(item);
    }

    // Population & religion data calculation
    let totalPopulation = 0;
    const isoCodes: ISO3Code[] = [];

    for (let i = 0; i < countryItems.length; i++) {
      const iso = countryItems[i].iso;
      isoCodes.push(iso);
      const relCountry = religionData?.countries?.[iso];
      const pop = relCountry?.population || demographicsMap?.[iso]?.population || countryItems[i].population || 0;
      totalPopulation += pop;

      if (relCountry?.stats && Array.isArray(relCountry.stats) && relCountry.stats.length > 0) {
        for (const stat of relCountry.stats) {
          if (stat.name && typeof stat.percentage === 'number') {
            const adherentsCount = (stat.percentage / 100) * pop;
            relCounts[stat.name] = (relCounts[stat.name] || 0) + adherentsCount;
          }
        }
      } else if (relCountry?.adherents) {
        for (const [rKey, count] of Object.entries(relCountry.adherents)) {
          relCounts[rKey] = (relCounts[rKey] || 0) + (count as number);
        }
      } else if (relCountry?.dominant_religion) {
        const pct = Number(relCountry.dominant_percentage || 100);
        const adherentsCount = (pct / 100) * pop;
        relCounts[relCountry.dominant_religion] = (relCounts[relCountry.dominant_religion] || 0) + adherentsCount;
      }
    }

    // Dominant religion calculation & stats array
    const religionBreakdown: Record<string, number> = {};
    const statsArray: Array<{ name: string; percentage: number }> = [];

    for (const [rKey, count] of Object.entries(relCounts)) {
      if (totalPopulation > 0) {
        const pct = Math.round((count / totalPopulation) * 1000) / 10;
        religionBreakdown[rKey] = pct;
        statsArray.push({ name: rKey, percentage: pct });
      }
    }
    statsArray.sort((a, b) => b.percentage - a.percentage);

    const dominantReligion = statsArray.length > 0 ? statsArray[0].name : 'Християнство';
    const dominantPercentage = statsArray.length > 0 ? statsArray[0].percentage : 0;

    const countItems = countryItems.length || 1;
    const totalDrives = driveSideCounts.right + driveSideCounts.left || 1;
    const rightDrivePct = Math.round((driveSideCounts.right / totalDrives) * 100);
    const leftDrivePct = Math.round((driveSideCounts.left / totalDrives) * 100);

    const totalPlugs = (powerGridCounts['230V'] + powerGridCounts['120V'] + powerGridCounts.other) || 1;
    const powerGridPct = {
      '230V': Math.round((powerGridCounts['230V'] / totalPlugs) * 100),
      '120V': Math.round((powerGridCounts['120V'] / totalPlugs) * 100),
      other: Math.round((powerGridCounts.other / totalPlugs) * 100),
    };

    const avgGdp = validGdpPopSum > 0 ? Math.round(gdpSum / validGdpPopSum) : 0;
    const avgDemocracy = democracyCount > 0 ? Math.round((democracySum / democracyCount) * 100) / 100 : 0;
    const avgCleanEnergy = cleanEnergyCount > 0 ? Math.round((cleanEnergySum / cleanEnergyCount) * 10) / 10 : 0;
    const avgEvIndex = evIndexCount > 0 ? Math.round((evIndexSum / evIndexCount) * 10) / 10 : 0;
    const avgSafety = safetyIndexCount > 0 ? Math.round((safetyIndexSum / safetyIndexCount) * 10) / 10 : 0;
    const avgHealthcare = healthcareIndexCount > 0 ? Math.round((healthcareIndexSum / healthcareIndexCount) * 10) / 10 : 0;
    const avgInternet = internetSpeedCount > 0 ? Math.round((internetSpeedSum / internetSpeedCount) * 10) / 10 : 0;
    const avgGini = giniCount > 0 ? Math.round((giniSum / giniCount) * 10) / 10 : 0;
    const avgIncomeTax = incomeTaxCount > 0 ? Math.round((incomeTaxSum / incomeTaxCount) * 10) / 10 : 0;

    const topPopulated = [...countryItems].sort((a, b) => b.population - a.population).slice(0, 5);
    const topArea = [...countryItems].sort((a, b) => b.area_sq_km! - a.area_sq_km!).slice(0, 5);
    const topGdp = [...countryItems].sort((a, b) => b.gdp_per_capita! - a.gdp_per_capita!).slice(0, 5);
    const topMilitary = [...countryItems].sort((a, b) => b.military_personnel! - a.military_personnel!).slice(0, 5);
    const topCleanEnergy = [...countryItems].sort((a, b) => b.clean_energy_pct! - a.clean_energy_pct!).slice(0, 5);
    const topDemocracy = [...countryItems].sort((a, b) => b.democracy_index! - a.democracy_index!).slice(0, 5);
    const topSafety = [...countryItems].sort((a, b) => b.safety_index! - a.safety_index!).slice(0, 5);
    const topHealthcare = [...countryItems].sort((a, b) => b.healthcare_index! - a.healthcare_index!).slice(0, 5);
    const topInternet = [...countryItems].sort((a, b) => b.internet_speed_mbps! - a.internet_speed_mbps!).slice(0, 5);
    const topEv = [...countryItems].sort((a, b) => b.ev_readiness_score! - a.ev_readiness_score!).slice(0, 5);
    const topTax = [...countryItems].sort((a, b) => a.income_tax_top_pct! - b.income_tax_top_pct!).slice(0, 5);

    const topCurrencies = Object.entries(currencyCounts)
      .map(([name, c]) => ({ name, name_uk: c.name_uk, name_en: c.name_en, count: c.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const trans = CONTINENT_TRANSLATIONS[continentName] || { uk: continentName, en: continentName };

    return {
      continent: continentName,
      name_uk: trans.uk,
      name_en: trans.en,
      countryCount: countItems,

      // Totals
      total_population: totalPopulation,
      total_area_sq_km: totalArea,
      totalArea,
      total_military_personnel: totalMilitary,
      totalMilitary,
      total_coastline_km: totalCoastline,
      totalBorders,

      // Averages (snake_case + camelCase aliases)
      avg_gdp_per_capita: avgGdp,
      avgGdp,
      avg_democracy_index: avgDemocracy,
      avgDemocracy,
      avg_clean_energy_pct: avgCleanEnergy,
      avgCleanEnergy,
      avg_safety_index: avgSafety,
      avgSafety,
      avg_healthcare_index: avgHealthcare,
      avgHealth: avgHealthcare,
      avg_internet_speed_mbps: avgInternet,
      avgInternet,
      avg_ev_readiness_score: avgEvIndex,
      avgEv: avgEvIndex,
      avg_gini_index: avgGini,
      avgGini,
      avg_income_tax_top_pct: avgIncomeTax,
      avgTax: avgIncomeTax,

      // Religion
      dominant_religion: dominantReligion,
      dominant_percentage: dominantPercentage,
      religion_breakdown: religionBreakdown,
      stats: statsArray,

      // Driving & Infrastructure
      driving_side_pct: { right: rightDrivePct, left: leftDrivePct },
      rightDrivePct,
      leftDrivePct,
      power_grid_pct: powerGridPct,
      tax_systems: taxSystemCounts,

      // Physical
      highest_elevation_m: highestElevation === -Infinity ? 0 : highestElevation,
      lowest_elevation_m: lowestElevation === Infinity ? 0 : lowestElevation,
      isoCodes,

      // Top Lists (with dual aliases)
      top_populated: topPopulated,
      top_area: topArea,
      topArea,
      top_gdp: topGdp,
      topEconomy: topGdp,
      top_military: topMilitary,
      topMilitary,
      top_clean_energy: topCleanEnergy,
      top_democracy: topDemocracy,
      topDemocracy,
      top_safety: topSafety,
      topSafety,
      top_healthcare: topHealthcare,
      topHealth: topHealthcare,
      top_internet: topInternet,
      topInternet,
      top_ev: topEv,
      topEv,
      top_tax: topTax,
      topTax,
      topCurrencies,

      // Coordinates
      climateCoords: CONTINENT_CLIMATE_COORDS[continentName] || [[0, 0]],
    };
  }

  public static aggregateAll(
    features: any[],
    religionData: ReligionDataset | null,
    demographicsMap: StaticDemographicsMap | null
  ): Record<ContinentName, AggregatedContinentStats> {
    const cache: Partial<Record<ContinentName, AggregatedContinentStats>> = {};
    for (let i = 0; i < CONTINENT_NAMES.length; i++) {
      const cont = CONTINENT_NAMES[i];
      cache[cont] = this.aggregateContinent(cont, features, religionData, demographicsMap);
    }
    return cache as Record<ContinentName, AggregatedContinentStats>;
  }
}
