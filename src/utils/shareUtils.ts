import type { AppLanguage, SubMode, CountryProperties, AggregatedContinentStats, AggregatedCountryItem } from '../types/index.ts';
import { getCountryFlag } from './geoUtils.ts';
import { pluralize, PLURAL_COUNTRIES } from './pluralUtils.ts';
import { DeterministicSolarClimateEngine } from '../data/DeterministicSolarClimateEngine.ts';

/**
 * Formats structured, contextual metrics for clipboard copying or native sharing.
 * Dynamically adapts according to the active SubMode (Religion, Population, Economy, Military, etc.)
 * as well as the entity level (Specific Country, Continent, or Global World).
 */
export function formatCountrySummary(
  countryProps: CountryProperties | null | undefined,
  continentStats: (AggregatedContinentStats & Record<string, any>) | null | undefined,
  isCountry: boolean,
  lang: AppLanguage,
  t: (key: string) => string,
  subMode?: SubMode | 'full'
): string {
  const isUk = lang === 'uk';
  const numLocale = isUk ? 'uk-UA' : 'en-US';

  // 1. SPECIFIC COUNTRY CONTEXT
  if (isCountry && countryProps) {
    const name = isUk ? countryProps.name_uk || countryProps.name_en : countryProps.name_en || countryProps.name_uk;
    const iso = countryProps['ISO3166-1-Alpha-3'] || countryProps.iso || '';
    const flag = getCountryFlag(iso) || '🌐';
    const continent = t(countryProps.continent || 'World');
    const capital = isUk
      ? countryProps.capital_uk || countryProps.capital
      : countryProps.capital_en || countryProps.capital;

    const header = `${flag} ${name} (${iso}) • ${continent}`;
    const capitalRow = capital ? `🏛 ${t('capital')}: ${capital}` : '';

    const lines: string[] = [header];
    if (capitalRow) lines.push(capitalRow);

    // Sub-mode Specific Metrics
    switch (subMode) {
      case 'religion': {
        lines.push(`─── 🕊 ${t('mode_religion')} ───`);
        const dominantRel = countryProps.dominant_religion
          ? (t(countryProps.dominant_religion) || countryProps.dominant_religion)
          : '—';
        const relPct = countryProps.dominant_percentage
          ? `${Number(countryProps.dominant_percentage).toFixed(1)}%`
          : '';
        lines.push(`🕊 ${t('dominant_religion')}: ${dominantRel} ${relPct}`.trim());

        if (Array.isArray(countryProps.stats) && countryProps.stats.length > 0) {
          countryProps.stats.slice(0, 5).forEach((r: { name: string; percentage?: number; percent?: number }) => {
            const rName = t(r.name) || r.name;
            const rPct = Number(r.percentage || r.percent || 0).toFixed(1);
            lines.push(` • ${rName}: ${rPct}%`);
          });
        }
        break;
      }

      case 'population': {
        lines.push(`─── 👥 ${t('mode_population')} ───`);
        const rawPop = countryProps.population || countryProps.total_population;
        const population = rawPop ? Number(rawPop).toLocaleString(numLocale) : '—';
        lines.push(`👥 ${t('population')}: ${population}`);
        const area = countryProps.areaKm2 || countryProps.area;
        if (rawPop && area) {
          const density = (rawPop / area).toFixed(1);
          lines.push(`📍 ${t('density') || 'Щільність'}: ${density} / ${t('unit_sqkm')}`);
        }
        break;
      }

      case 'demographics': {
        lines.push(`─── 🏛 ${t('mode_demographics')} ───`);
        const langs = isUk
          ? countryProps.languages_uk || countryProps.languages
          : countryProps.languages_en || countryProps.languages;
        if (langs) {
          lines.push(`🗣 ${t('languages')}: ${langs}`);
        }
        const cur = isUk
          ? countryProps.currency_uk || countryProps.currency
          : countryProps.currency_en || countryProps.currency;
        if (cur) {
          lines.push(`💱 ${t('currency')}: ${cur}`);
        }
        if (countryProps.gini !== null && countryProps.gini !== undefined) {
          lines.push(`⚖️ ${t('gini')}: ${countryProps.gini}`);
        }
        if (countryProps.drivingSide) {
          const side = countryProps.drivingSide === 'right' ? t('right') : t('left');
          lines.push(`🚗 ${t('driving_side')}: ${side}`);
        }
        const area = countryProps.areaKm2 || countryProps.area;
        if (area) {
          lines.push(`📐 ${t('area')}: ${Number(Math.round(area)).toLocaleString(numLocale)} ${t('unit_sqkm')}`);
        }
        break;
      }

      case 'economy': {
        lines.push(`─── 💰 ${t('mode_economy')} ───`);
        const gdp = countryProps.gdpPerCapita || countryProps.gdp;
        if (gdp) {
          lines.push(`💰 ${t('gdp_per_capita')}: $${Number(gdp).toLocaleString(numLocale)}`);
        }
        if (countryProps.avgSalary || countryProps.salary) {
          lines.push(`💵 ${t('avg_salary')}: $${Number(countryProps.avgSalary || countryProps.salary).toLocaleString(numLocale)}`);
        }
        if (countryProps.colIndex || countryProps.col) {
          lines.push(`🏷 ${t('col_index')}: ${countryProps.colIndex || countryProps.col} / 100`);
        }
        if (countryProps.incomeTax !== undefined) {
          lines.push(`📑 ${t('tax_rate')}: ${countryProps.incomeTax}%`);
        }
        if (countryProps.macroTaxRevenue || countryProps.macro_tax) {
          lines.push(`🏛 ${t('tax_macro')}: ${countryProps.macroTaxRevenue || countryProps.macro_tax}%`);
        }
        break;
      }

      case 'politics': {
        lines.push(`─── 🗳 ${t('mode_politics')} ───`);
        if (countryProps.democracyIndex || countryProps.democracy) {
          lines.push(`🗳 ${t('democracy_index')}: ${countryProps.democracyIndex || countryProps.democracy} / 10`);
        }
        if (countryProps.politicalSystem || countryProps.system) {
          lines.push(`🏛 ${t('political_system') || 'Політичний устрій'}: ${countryProps.politicalSystem || countryProps.system}`);
        }
        if (countryProps.safetyIndex || countryProps.safety) {
          lines.push(`🛡 ${t('safety_index')}: ${countryProps.safetyIndex || countryProps.safety} / 100`);
        }
        if (countryProps.healthcareIndex || countryProps.healthcare) {
          lines.push(`🏥 ${t('healthcare_index')}: ${countryProps.healthcareIndex || countryProps.healthcare} / 100`);
        }
        break;
      }

      case 'military': {
        lines.push(`─── ⚔️ ${t('mode_military')} ───`);
        if (countryProps.militarySize || countryProps.military_active) {
          lines.push(`⚔️ ${t('military_size')}: ${Number(countryProps.militarySize || countryProps.military_active).toLocaleString(numLocale)}`);
        }
        if (countryProps.militarySpending !== null && countryProps.militarySpending !== undefined) {
          lines.push(`🛡 ${t('military_spending')}: ${countryProps.militarySpending}%`);
        }
        break;
      }

      case 'climate': {
        lines.push(`─── 🌦 ${t('mode_climate')} ───`);
        let temp = countryProps.temperature ?? countryProps.currentTemp;
        let humidity = countryProps.humidity;
        let windSpeed = countryProps.windSpeed;
        let uv = (countryProps as any).uvIndex;

        if (temp === undefined && countryProps.center) {
          const [lng, lat] = countryProps.center;
          const report = DeterministicSolarClimateEngine.calculate(lat, lng);
          temp = report.estimatedTemperatureC;
          humidity = report.estimatedHumidityPct;
          windSpeed = Math.round(report.windSpeedMs * 3.6);
          uv = report.uvIndex;
        }

        if (temp !== undefined) {
          lines.push(`🌡 ${t('temperature') || 'Температура'}: ${temp > 0 ? '+' : ''}${temp}°C`);
        }
        if (humidity !== undefined) {
          lines.push(`💧 ${t('humidity') || 'Вологість'}: ${humidity}%`);
        }
        if (windSpeed !== undefined) {
          lines.push(`💨 ${t('wind_speed') || 'Вітер'}: ${windSpeed} ${t('unit_kmh') || 'км/г'}`);
        }
        if (uv !== undefined) {
          lines.push(`☀️ UV: ${uv}`);
        }
        break;
      }

      case 'geography': {
        lines.push(`─── 🏔 ${t('mode_geography')} ───`);
        const area = countryProps.areaKm2 || countryProps.area;
        if (area) {
          lines.push(`📐 ${t('area')}: ${Number(Math.round(area)).toLocaleString(numLocale)} ${t('unit_sqkm')}`);
        }
        if (countryProps.highestPeak || countryProps.peak) {
          lines.push(`🏔 ${t('highest_peak')}: ${Number(countryProps.highestPeak || countryProps.peak).toLocaleString(numLocale)} ${t('unit_m') || 'м'}`);
        }
        if (countryProps.borderLength !== undefined) {
          lines.push(`🗺 ${t('border_length')}: ${Number(countryProps.borderLength).toLocaleString(numLocale)} ${t('unit_km') || 'км'}`);
        }
        break;
      }

      case 'resources': {
        lines.push(`─── ⚡ ${t('mode_resources')} ───`);
        if (countryProps.cleanEnergy || countryProps.energy) {
          lines.push(`⚡ ${t('clean_energy')}: ${countryProps.cleanEnergy || countryProps.energy}%`);
        }
        if (countryProps.evIndex || countryProps.ev) {
          lines.push(`🚗 ${t('ev_index')}: ${countryProps.evIndex || countryProps.ev} / 100`);
        }
        if (countryProps.internetSpeed || countryProps.internet) {
          lines.push(`📶 ${t('internet_speed')}: ${countryProps.internetSpeed || countryProps.internet} ${t('unit_mbps') || 'Мбіт/с'}`);
        }
        break;
      }

      default: {
        // Full Overview Summary
        const rawPop = countryProps.population || countryProps.total_population;
        const population = rawPop ? Number(rawPop).toLocaleString(numLocale) : '—';
        const gdp = countryProps.gdpPerCapita || countryProps.gdp;
        const gdpStr = gdp ? `$${Number(gdp).toLocaleString(numLocale)}` : '—';
        const dominantRel = countryProps.dominant_religion
          ? (t(countryProps.dominant_religion) || countryProps.dominant_religion)
          : '—';
        const democracy = countryProps.democracyIndex || countryProps.democracy;
        const cleanEnergy = countryProps.cleanEnergy || countryProps.energy;

        lines.push(`👥 ${t('population')}: ${population}`);
        lines.push(`💰 ${t('gdp_per_capita')}: ${gdpStr}`);
        if (dominantRel !== '—') lines.push(`🕊 ${t('dominant_religion')}: ${dominantRel}`);
        if (democracy) lines.push(`🗳 ${t('democracy_index')}: ${democracy} / 10`);
        if (cleanEnergy) lines.push(`⚡ ${t('clean_energy')}: ${cleanEnergy}%`);
        break;
      }
    }

    lines.push(`\n📊 TerraMetrics 3D`);
    return lines.filter(Boolean).join('\n');
  }

  // 2. REGIONAL / GLOBAL CONTINENT / WORLD CONTEXT
  const regionName = (isUk ? continentStats?.name_uk : continentStats?.name_en) || t('World');
  const isGlobal = !continentStats || continentStats.name_en === 'World' || continentStats.name_en === 'Global (World)' || !continentStats.name_en;
  const rawTotalPop = continentStats?.total_population || continentStats?.population;
  const totalPop = rawTotalPop ? Number(rawTotalPop).toLocaleString(numLocale) : '—';
  const countriesCount = continentStats?.isoCodes?.length || continentStats?.countriesCount || (isGlobal ? 258 : 0);

  const header = isGlobal ? `🌐 ${t('World')} • ${t('global_stats') || 'Глобально'}` : `🌍 ${regionName} • ${t('continent_stats') || 'Континент'}`;
  const lines: string[] = [
    header,
    `👥 ${t('total_pop')}: ${totalPop}`,
    `📍 ${t('countries_count')}: ${countriesCount}`,
  ];

  switch (subMode) {
    case 'religion': {
      lines.push(`─── 🕊 ${t('mode_religion')} ───`);
      if (continentStats?.dominant_religion) {
        const domRel = t(continentStats.dominant_religion) || continentStats.dominant_religion;
        lines.push(`🕊 ${t('dominant_religion')}: ${domRel} (${continentStats.dominant_percentage || 0}%)`);
      }
      if (Array.isArray(continentStats?.stats) && continentStats.stats.length > 0) {
        continentStats.stats.slice(0, 4).forEach((r: { name: string; percentage?: number }) => {
          lines.push(` • ${t(r.name) || r.name}: ${r.percentage}%`);
        });
      }
      break;
    }

    case 'population': {
      lines.push(`─── 👥 ${t('mode_population')} ───`);
      if (Array.isArray(continentStats?.top_populated) && continentStats.top_populated.length > 0) {
        lines.push(`🏆 ${t('top_countries')}:`);
        continentStats.top_populated.slice(0, 5).forEach((c: AggregatedCountryItem, idx: number) => {
          const cName = isUk ? c.name_uk || (c as any).name : c.name_en || (c as any).name;
          const flag = getCountryFlag(c.iso) || '🏳️';
          lines.push(` ${idx + 1}. ${flag} ${cName}: ${Number(c.population).toLocaleString(numLocale)}`);
        });
      }
      break;
    }

    case 'demographics': {
      lines.push(`─── 🏛 ${t('mode_demographics')} ───`);
      if (continentStats?.avgGini) {
        lines.push(`⚖️ ${t('gini')} ${t('avg_suffix')}: ${continentStats.avgGini}`);
      }
      if (continentStats?.totalArea) {
        lines.push(`📐 ${t('area')} ${t('total_suffix')}: ${Number(Math.round(continentStats.totalArea)).toLocaleString(numLocale)} ${t('unit_sqkm')}`);
      }
      if (continentStats?.rightDrivePct !== undefined) {
        lines.push(`🚗 ${t('driving_side')}: ${t('right')} ${continentStats.rightDrivePct}% • ${t('left')} ${continentStats.leftDrivePct}%`);
      }
      if (Array.isArray(continentStats?.topCurrencies) && continentStats.topCurrencies.length > 0) {
        lines.push(`💱 ${t('top_currencies')}:`);
        continentStats.topCurrencies.slice(0, 4).forEach((c: { name_uk?: string; name_en?: string; name?: string; currency?: string; count: number }) => {
          const cName = (isUk ? c.name_uk || c.name : c.name_en || c.name || c.name_uk) || c.currency;
          lines.push(` • ${cName}: ${pluralize(c.count, lang, PLURAL_COUNTRIES)}`);
        });
      }
      break;
    }

    case 'economy': {
      lines.push(`─── 💰 ${t('mode_economy')} ───`);
      if (continentStats?.avgGdp) {
        lines.push(`💰 ${t('gdp_per_capita')} ${t('avg_suffix')}: $${Number(Math.round(continentStats.avgGdp)).toLocaleString(numLocale)}`);
      }
      if (Array.isArray(continentStats?.topEconomy) && continentStats.topEconomy.length > 0) {
        lines.push(`🏆 ${t('top_economy') || t('top_economy_title') || 'Топ економік'}:`);
        continentStats.topEconomy.slice(0, 5).forEach((c: AggregatedCountryItem, idx: number) => {
          const cName = isUk ? c.name_uk || (c as any).name : c.name_en || (c as any).name;
          const flag = getCountryFlag(c.iso) || '🏳️';
          lines.push(` ${idx + 1}. ${flag} ${cName}: $${Number(c.gdp).toLocaleString(numLocale)}`);
        });
      }
      break;
    }

    case 'politics': {
      lines.push(`─── 🗳 ${t('mode_politics')} ───`);
      if (continentStats?.avgDemocracy) {
        lines.push(`🗳 ${t('democracy_index')} ${t('avg_suffix')}: ${continentStats.avgDemocracy} / 10`);
      }
      if (continentStats?.avgSafety) {
        lines.push(`🛡 ${t('safety_index')} ${t('avg_suffix')}: ${continentStats.avgSafety} / 100`);
      }
      if (continentStats?.avgHealth) {
        lines.push(`🏥 ${t('healthcare_index')} ${t('avg_suffix')}: ${continentStats.avgHealth} / 100`);
      }
      break;
    }

    case 'military': {
      lines.push(`─── ⚔️ ${t('mode_military')} ───`);
      if (continentStats?.totalMilitary) {
        lines.push(`⚔️ ${t('military_size')} ${t('total_suffix')}: ${Number(continentStats.totalMilitary).toLocaleString(numLocale)}`);
      }
      if (Array.isArray(continentStats?.topMilitary) && continentStats.topMilitary.length > 0) {
        lines.push(`🏆 ${t('top_military') || t('top_military_title') || 'Топ армій'}:`);
        continentStats.topMilitary.slice(0, 5).forEach((c: AggregatedCountryItem, idx: number) => {
          const cName = isUk ? c.name_uk || (c as any).name : c.name_en || (c as any).name;
          const flag = getCountryFlag(c.iso) || '🏳️';
          lines.push(` ${idx + 1}. ${flag} ${cName}: ${Number(c.military).toLocaleString(numLocale)}`);
        });
      }
      break;
    }

    case 'climate': {
      lines.push(`─── 🌦 ${t('mode_climate')} ───`);
      if (continentStats?.climateCoords?.[0]) {
        const [lng, lat] = continentStats.climateCoords[0];
        const report = DeterministicSolarClimateEngine.calculate(lat, lng);
        lines.push(`🌡 ${t('temperature') || 'Температура'}: ${report.estimatedTemperatureC > 0 ? '+' : ''}${report.estimatedTemperatureC}°C`);
        lines.push(`💧 ${t('humidity') || 'Вологість'}: ${report.estimatedHumidityPct}%`);
        lines.push(`💨 ${t('wind_speed') || 'Вітер'}: ${Math.round(report.windSpeedMs * 3.6)} ${t('unit_kmh') || 'км/г'}`);
      } else {
        lines.push(`🌦 ${t('climate_zones') || 'Кліматичний профіль'}: ${isGlobal ? (isUk ? 'Глобальне покриття 258 країн' : 'Global 258 Countries Coverage') : regionName}`);
      }
      break;
    }

    case 'geography': {
      lines.push(`─── 🏔 ${t('mode_geography')} ───`);
      if (continentStats?.totalArea) {
        lines.push(`📐 ${t('area')} ${t('total_suffix')}: ${Number(Math.round(continentStats.totalArea)).toLocaleString(numLocale)} ${t('unit_sqkm')}`);
      }
      if (continentStats?.totalBorders) {
        lines.push(`🗺 ${t('border_length')} ${t('total_suffix')}: ${Number(continentStats.totalBorders).toLocaleString(numLocale)} ${t('unit_km') || 'км'}`);
      }
      break;
    }

    case 'resources': {
      lines.push(`─── ⚡ ${t('mode_resources')} ───`);
      if (continentStats?.avgCleanEnergy) {
        lines.push(`⚡ ${t('clean_energy')} ${t('avg_suffix')}: ${continentStats.avgCleanEnergy}%`);
      }
      if (continentStats?.avgEv) {
        lines.push(`🚗 ${t('ev_index')} ${t('avg_suffix')}: ${continentStats.avgEv} / 100`);
      }
      if (continentStats?.avgInternet) {
        lines.push(`📶 ${t('internet_speed')} ${t('avg_suffix')}: ${continentStats.avgInternet} ${t('unit_mbps') || 'Мбіт/с'}`);
      }
      break;
    }

    default: {
      if (continentStats?.avgGdp) {
        lines.push(`💰 ${t('gdp_per_capita')}: $${Number(Math.round(continentStats.avgGdp)).toLocaleString(numLocale)}`);
      }
      if (continentStats?.avgCleanEnergy) {
        lines.push(`⚡ ${t('clean_energy')}: ${continentStats.avgCleanEnergy}%`);
      }
      if (continentStats?.avgDemocracy) {
        lines.push(`🗳 ${t('democracy_index')}: ${continentStats.avgDemocracy} / 10`);
      }
      break;
    }
  }

  lines.push(`\n📊 TerraMetrics 3D`);
  return lines.filter(Boolean).join('\n');
}
